import { isClosedStatusName } from 'src/util/taskDialog/taskStatus'

// Подтверждение при закрытии диалога с несохранёнными изменениями (TaskSubmitConfirmDialog)
// и отложенные действия «закрыть заявку» / «вернуть в работу», ждущие решения пользователя.
// Требует в компоненте: closeDialog, hasUnsavedTaskChanges, getReopenStatus,
// saveNewOrUpdateTask, setTaskCompleted, setTaskNotCompleted (taskDialogSaveMixin).
export default {
  data: () => ({
    isSubmitModal: false,

    pendingSubmitAction: null,
    pendingSubmitSourceTask: null
  }),

  methods: {
    openSubmitModal (pendingAction = null, sourceTask = null) {
      this.pendingSubmitAction = pendingAction
      this.pendingSubmitSourceTask = sourceTask
      if (this.isNewTask) {
        if (!this.dialogTaskName) {
          this.clearPendingSubmitAction()
          this.closeDialog()
          return
        }
        this.isSubmitModal = true
        return
      }
      if (this.hasUnsavedTaskChanges()) {
        this.isSubmitModal = true
        return
      }
      const action = this.pendingSubmitAction
      const task = this.pendingSubmitSourceTask || this.task
      this.clearPendingSubmitAction()
      if (action === 'closeTask') {
        this.setTaskCompleted(task, { skipUnsavedCheck: true })
        return
      }
      if (action === 'reopenTask') {
        this.setTaskNotCompleted(task, { skipUnsavedCheck: true })
        return
      }
      this.closeDialog()
    },

    getSubmitModalTitle () {
      if (this.pendingSubmitAction === 'closeTask') {
        return `Сохранить изменения перед закрытием заявки №${this.task.id}?`
      }

      if (this.pendingSubmitAction === 'reopenTask') {
        return `Сохранить изменения перед возвратом заявки №${this.task.id} в работу?`
      }

      return this.isNewTask
        ? 'Сохранить заявку?'
        : 'Сохранить изменение в заявке №' + this.task.id + '?'
    },

    getSubmitModalMessage () {
      if (this.pendingSubmitAction === 'closeTask') {
        return 'В заявке есть несохранённые изменения. Сохранить их перед закрытием заявки?'
      }

      if (this.pendingSubmitAction === 'reopenTask') {
        return 'В заявке есть несохранённые изменения. Сохранить их перед возвратом заявки в работу?'
      }

      return this.isNewTask
        ? 'Закрыть не сохраняя заявку?'
        : 'Сохранить изменения в заявке №' + this.task.id + '?'
    },

    cancelSubmitModal () {
      this.isSubmitModal = false
      this.clearPendingSubmitAction()
    },

    clearPendingSubmitAction () {
      this.pendingSubmitAction = null
      this.pendingSubmitSourceTask = null
    },

    applyPendingSubmitActionToDialogFields () {
      if (this.pendingSubmitAction === 'closeTask') {
        const closedStatus = this.store.statuses.find(status => isClosedStatusName(status.name))
        if (!closedStatus) {
          this.$q.notify({
            message: 'Не найден статус закрытия заявки',
            type: 'negative'
          })
          return false
        }
        this.dialogTaskStatus = closedStatus.name
        this.dialogTaskComplete = true
        return true
      }

      if (this.pendingSubmitAction === 'reopenTask') {
        const reopenStatus = this.getReopenStatus(this.pendingSubmitSourceTask || this.task)
        if (!reopenStatus) {
          this.$q.notify({
            message: 'Не найден открытый статус для возврата заявки в работу',
            type: 'negative'
          })
          return false
        }
        this.dialogTaskStatus = reopenStatus.name
        this.dialogTaskComplete = false
        return true
      }
      return true
    },

    async confirmSubmitModalWithSave () {
      const hasPendingAction = !!this.pendingSubmitAction
      if (hasPendingAction && !this.applyPendingSubmitActionToDialogFields()) {
        return
      }
      this.isSubmitModal = false
      this.clearPendingSubmitAction()
      await this.saveNewOrUpdateTask()
    },

    async confirmSubmitModalWithoutSave () {
      const action = this.pendingSubmitAction
      const task = this.pendingSubmitSourceTask || this.task
      this.isSubmitModal = false
      this.clearPendingSubmitAction()
      if (action === 'closeTask') {
        await this.setTaskCompleted(task, { skipUnsavedCheck: true })
        return
      }
      if (action === 'reopenTask') {
        await this.setTaskNotCompleted(task, { skipUnsavedCheck: true })
        return
      }
      this.closeDialog()
    }
  }
}
