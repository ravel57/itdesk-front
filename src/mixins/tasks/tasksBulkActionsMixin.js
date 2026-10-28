import axios from 'axios'
import {
  buildBulkCloseTaskPayload,
  buildBulkStatusReasonDialogTexts,
  getBulkStatusReasonAffectedTasks,
  getBulkStatusReasonPayload,
  isBulkReasonRequired,
  isClosedStatusName,
  resolveBulkReasonConfirmLabel,
  resolveBulkReasonDialogMessage,
  resolveBulkReasonDialogTitle
} from 'src/util/tasks/taskBulk'

// Массовые действия на странице заявок: открытие модалки, диалог причины (закрытие/возврат/смена статуса),
// массовое закрытие без второго подтверждения. Историю undo/redo ведёт tasksBulkHistoryMixin.
// Требует на странице: this.store, this.isObserverUser, this.updateTask, this.getStoreTaskById.
export default {
  data: () => ({
    action: 'close',

    pendingBulkAction: null,
    bulkStatusChangeReason: '',
    isBulkReasonDialogShow: false,
    bulkReasonError: false,
    bulkReasonResolve: null,
    bulkReasonDialogTitle: '',
    bulkReasonDialogMessage: '',
    isModalForBulkActions: false,
    isShowBulkActionsMenu: false,
  }),

  computed: {
    showBulkActionsMenu() {
      return !this.isObserverUser && this.store.checkedTasks.length > 0
    }
  },

  watch: {
    showBulkActionsMenu() {
      if (this.isObserverUser) {
        this.isShowBulkActionsMenu = false
        return
      }
      if (this.showBulkActionsMenu) {
        this.isShowBulkActionsMenu = true
      } else {
        const container = document.getElementsByClassName('mass-container')[0]
        if (container) {
          container.style.animationName = 'HideBulkContainer'
          container.style.animationPlayState = 'start'
        }
        setTimeout(() => {
          this.isShowBulkActionsMenu = false
        }, 200)
      }
    }
  },

  methods: {
    showBulkActionModal(action) {
      this.action = action
      this.pendingBulkActionHistory = null

      try {
        this.beginBulkActionHistory(action)
      } catch (e) {
        console.error('Не удалось создать снимок заявок для undo/redo', e)
        this.pendingBulkActionHistory = null
      }

      this.isModalForBulkActions = false
      this.$nextTick(() => {
        this.isModalForBulkActions = true
      })
    },

    openBulkModal(action) {
      if (this.isObserverUser) {
        this.store.checkedTasks = []
        return
      }
      if (action === 'close' && !this.validateBulkCloseExecutors()) {
        return
      }
      this.pendingBulkAction = action
      if (isBulkReasonRequired(action)) {
        this.bulkStatusChangeReason = ''
        this.bulkReasonError = false
        this.isBulkReasonDialogShow = true
        return
      }
      this.showBulkActionModal(action)
    },

    hasExecutorForClose(task) {
      const actualTask = this.getStoreTaskById(task?.id) || task
      return !!actualTask?.executor && !!actualTask.executor.id
    },

    getBulkCloseTasksWithoutExecutor() {
      return (this.store.checkedTasks || [])
        .filter(task => !this.hasExecutorForClose(task))
    },

    validateBulkCloseExecutors() {
      const tasksWithoutExecutor = this.getBulkCloseTasksWithoutExecutor()
      if (tasksWithoutExecutor.length === 0) {
        return true
      }
      const taskNumbers = tasksWithoutExecutor
        .map(task => task?.id ? `№${task.id}` : null)
        .filter(Boolean)
        .join(', ')
      this.$q.notify({
        message: taskNumbers
          ? `Перед закрытием укажите исполнителя у заявок: ${taskNumbers}`
          : 'Перед закрытием заявок укажите исполнителя',
        type: 'negative'
      })
      return false
    },

    getBulkReasonDialogTitle() {
      return resolveBulkReasonDialogTitle(this.pendingBulkAction, this.bulkReasonDialogTitle)
    },

    getBulkReasonDialogMessage() {
      return resolveBulkReasonDialogMessage(
        this.pendingBulkAction,
        this.bulkReasonDialogMessage,
        () => this.store.checkedTasks.length
      )
    },

    requestBulkStatusChangeReason(payload = {}, maybeNewStatus = null) {
      const {oldStatusName, newStatusName, tasks} = getBulkStatusReasonPayload(payload, maybeNewStatus, this.store.checkedTasks)
      const affectedTasks = getBulkStatusReasonAffectedTasks(oldStatusName, newStatusName, tasks)

      if (affectedTasks.length === 0) {
        return Promise.resolve('')
      }

      const {title, message} = buildBulkStatusReasonDialogTexts(affectedTasks, newStatusName)
      this.bulkReasonDialogTitle = title
      this.bulkReasonDialogMessage = message

      this.pendingBulkAction = 'status'
      this.bulkStatusChangeReason = ''
      this.bulkReasonError = false
      this.isBulkReasonDialogShow = true

      return new Promise(resolve => {
        this.bulkReasonResolve = resolve
      })
    },

    confirmBulkReasonDialog() {
      const reason = String(this.bulkStatusChangeReason || '').trim()
      if (!reason) {
        this.bulkReasonError = true
        return
      }
      if (this.pendingBulkAction === 'close' && !this.validateBulkCloseExecutors()) {
        return
      }
      if (this.bulkReasonResolve) {
        const resolve = this.bulkReasonResolve
        this.isBulkReasonDialogShow = false
        this.clearBulkReasonDialogState()
        resolve(reason)
        return
      }
      const action = this.pendingBulkAction
      if (action === 'close') {
        this.executeBulkCloseWithoutSecondConfirm(reason)
        return
      }
      this.bulkStatusChangeReason = reason
      this.pendingBulkAction = null
      this.isBulkReasonDialogShow = false
      this.showBulkActionModal(action)
    },

    getBulkReasonConfirmLabel() {
      return resolveBulkReasonConfirmLabel(this.pendingBulkAction)
    },

    getBulkClosedStatus() {
      return this.store.statuses.find(status => isClosedStatusName(status.name))
    },

    buildBulkCloseTask(sourceTask, reason) {
      const originalTask = this.getStoreTaskById(sourceTask?.id) || sourceTask
      return buildBulkCloseTaskPayload(originalTask, this.getBulkClosedStatus(), reason)
    },

    async executeBulkCloseWithoutSecondConfirm(reason) {
      if (!this.validateBulkCloseExecutors()) {
        return
      }
      const selectedTasks = [...this.store.checkedTasks]
      if (selectedTasks.length === 0) {
        this.clearBulkReasonDialogState()
        this.isBulkReasonDialogShow = false
        return
      }
      this.isBulkReasonDialogShow = false
      this.pendingBulkAction = null
      try {
        this.beginBulkActionHistory('close')
        for (const sourceTask of selectedTasks) {
          const task = this.buildBulkCloseTask(sourceTask, reason)
          const clientId = this.getBulkTaskClientId(sourceTask, task)
          if (!clientId) {
            throw new Error(`Не найден clientId для заявки ${sourceTask?.id || ''}`)
          }
          const response = await axios.patch(`/api/v1/client/${clientId}/task`, task)
          this.updateTask(task, response)
        }
        this.store.checkedTasks = []
        this.$q.notify({
          message: `Закрыто заявок: ${selectedTasks.length}`,
          type: 'positive'
        })
      } catch (e) {
        this.$q.notify({
          message: e.message || 'Не удалось закрыть заявки',
          type: 'negative'
        })
      } finally {
        this.clearBulkReasonDialogState()
        this.scheduleFinishBulkActionHistory(1000)
      }
    },

    cancelBulkReasonDialog() {
      if (this.bulkReasonResolve) {
        const resolve = this.bulkReasonResolve
        this.isBulkReasonDialogShow = false
        this.clearBulkReasonDialogState()
        resolve(null)
        return
      }

      this.clearBulkReasonDialogState()
      this.isBulkReasonDialogShow = false
    },

    clearBulkReasonDialogState() {
      this.pendingBulkAction = null
      this.bulkStatusChangeReason = ''
      this.bulkReasonError = false
      this.bulkReasonResolve = null
      this.bulkReasonDialogTitle = ''
      this.bulkReasonDialogMessage = ''
    },

    closeBulkActionModal() {
      this.isModalForBulkActions = false

      // Даём последним emit/update store попасть в pendingBulkActionHistory,
      // после чего вся пачка сохранится одной записью undo/redo.
      this.scheduleFinishBulkActionHistory(1000)
    },

    clearBulkActionReason() {
      if (this.hasPendingBulkActionHistoryChanges()) {
        this.scheduleFinishBulkActionHistory(0)
      } else {
        this.scheduleFinishBulkActionHistory(1200)
      }

      if (this.bulkReasonResolve) {
        return
      }

      this.clearBulkReasonDialogState()
    }
  }
}
