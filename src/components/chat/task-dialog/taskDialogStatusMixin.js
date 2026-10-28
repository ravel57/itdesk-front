import { getReopenStatus, getStatusChangeReasonTitle, isClosedStatusName, needStatusChangeReason } from 'src/util/taskDialog/taskStatus'
import { isExecutorRequirementSatisfied } from 'src/util/taskDialog/taskValidation'

// Смена статуса заявки: запрос причины (внутренний диалог TaskStatusReasonDialog или
// внешний обработчик из prop requestStatusChangeReason), статус возврата в работу,
// проверка исполнителя при закрытии.
// Требует в компоненте: prop requestStatusChangeReason, this.store, this.$q, dialogTaskStatus/dialogTaskComplete.
export default {
  data: () => ({
    statusReasonDialog: false,
    statusReasonDialogTitle: '',
    statusReasonDialogMessage: '',
    statusReasonText: '',
    statusReasonError: false,
    statusReasonResolve: null
  }),

  methods: {
    getReopenStatus (task) {
      return getReopenStatus(task, this.store.statuses)
    },

    requestStatusChangeReasonIfNeeded (oldStatusName, newStatusName) {
      if (!needStatusChangeReason(oldStatusName, newStatusName)) {
        return Promise.resolve('')
      }
      if (typeof this.requestStatusChangeReason === 'function') {
        return this.requestStatusChangeReason(oldStatusName, newStatusName)
      }

      this.statusReasonDialogTitle = getStatusChangeReasonTitle(oldStatusName, newStatusName)
      this.statusReasonDialogMessage = `Статус: «${oldStatusName}» → «${newStatusName}»`
      this.statusReasonText = ''
      this.statusReasonError = false
      this.statusReasonDialog = true

      return new Promise(resolve => {
        this.statusReasonResolve = resolve
      })
    },

    confirmStatusReasonDialog () {
      const reason = String(this.statusReasonText || '').trim()
      if (!reason) {
        this.statusReasonError = true
        return
      }
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(reason)
      }
      this.clearStatusReasonDialog()
    },

    cancelStatusReasonDialog () {
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(null)
      }
      this.clearStatusReasonDialog()
    },

    clearStatusReasonDialog () {
      this.statusReasonDialogTitle = ''
      this.statusReasonDialogMessage = ''
      this.statusReasonText = ''
      this.statusReasonError = false
      this.statusReasonResolve = null
    },

    // Передаётся в TaskFieldsPanel как функция (prop is-closing-dialog-task)
    isClosingDialogTask () {
      return Boolean(this.dialogTaskComplete) || isClosedStatusName(this.dialogTaskStatus)
    },

    notifyExecutorRequiredForClosingTask () {
      this.$q.notify({
        message: 'Перед закрытием заявки укажите исполнителя',
        type: 'negative'
      })
    },

    validateExecutorRequiredForClosingTask (executor, statusName, completed) {
      if (isExecutorRequirementSatisfied(executor, statusName, completed)) {
        return true
      }
      this.notifyExecutorRequiredForClosingTask()
      return false
    }
  }
}
