import axios from 'axios'
import { CLOSED_STATUS_NAME, getStatusName, isClosedStatusName, isFrozenStatusName, isFrozenWithTimer } from 'src/util/taskDialog/taskStatus'
import { buildTaskPayload, copyTaskForUpdate, mergeUpdatedTaskRuntimeFields, resolveTagsByName } from 'src/util/taskDialog/taskPayload'
import { hasRequiredTaskFields } from 'src/util/taskDialog/taskValidation'

// Сохранение заявки: создание и обновление из диалога, закрытие и возврат в работу.
// Требует в компоненте: поля формы dialogTask* (taskDialogFormMixin), this.store, this.client, this.task,
// getCurrentTaskId, getSelectedTaskType, selectedDialogService, openFreezeDialog,
// requestStatusChangeReasonIfNeeded, validateExecutorRequiredForClosingTask, getReopenStatus,
// openSubmitModal, hasUnsavedTaskChanges, loadTaskHistory, closeDialog.
export default {
  data: () => ({
    taskOnCreateProcess: false
  }),

  methods: {
    async saveNewOrUpdateTask () {
      if (!hasRequiredTaskFields({
        name: this.dialogTaskName,
        type: this.dialogTaskType,
        priority: this.dialogTaskPriority,
        status: this.dialogTaskStatus
      })) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative'
        })
        return
      }
      const messageId = this.getNewTaskFromMessageId()
      if (!this.linkedMessageId) {
        this.linkedMessageId = messageId
      }
      const tags = resolveTagsByName(this.dialogTaskTags, this.store.tags)
      const currentTaskId = this.getCurrentTaskId()
      if (!this.isNewTask && !currentTaskId) {
        this.$q.notify({
          message: 'Не найден id заявки для обновления',
          type: 'negative'
        })
        return
      }
      const task = buildTaskPayload({
        form: this.getDialogFormSnapshot(),
        task: this.task,
        isNewTask: this.isNewTask,
        currentTaskId,
        taskCreatedAt: this.taskCreatedAt,
        linkedMessageId: this.linkedMessageId,
        selectedType: this.getSelectedTaskType(),
        selectedService: this.selectedDialogService,
        linkedMessages: this.isNewTask ? this.getLinkedMessage : undefined,
        tags,
        store: this.store
      })
      const oldStatusName = this.isNewTask ? '' : getStatusName(this.task.status)
      const newStatusName = getStatusName(task.status)

      if (isClosedStatusName(newStatusName)) {
        task.completed = true
        task.frozen = false
        task.frozenFrom = null
        task.frozenUntil = null
      }

      if (!this.isNewTask && isFrozenStatusName(newStatusName)) {
        const alreadyFrozenWithTimer = isFrozenWithTimer(this.task)
        if (!alreadyFrozenWithTimer) {
          this.dialogTaskStatus = oldStatusName
          this.openFreezeDialog()
          this.$q.notify({
            message: 'Для заморозки укажите срок заморозки',
            type: 'negative'
          })
          return
        }
        task.completed = false
        task.frozen = true
        task.frozenFrom = this.task.frozenFrom
        task.frozenUntil = this.task.frozenUntil
        task.previousStatus = this.task.previousStatus
      }

      if (!this.isNewTask && this.task.frozen === true && !isFrozenStatusName(newStatusName)) {
        task.frozen = false
        task.frozenFrom = null
        task.frozenUntil = null
        task.previousStatus = null
      }
      if (!this.validateExecutorRequiredForClosingTask(task.executor, newStatusName, task.completed)) {
        return
      }
      const statusChangeReason = await this.requestStatusChangeReasonIfNeeded(oldStatusName, newStatusName)
      if (statusChangeReason === null) {
        return
      }
      if (statusChangeReason) {
        task.statusChangeReason = statusChangeReason
      }
      if (this.isNewTask) {
        if (this.taskOnCreateProcess) {
          return
        }
        this.taskOnCreateProcess = true
        axios.post(`/api/v1/client/${this.client.id}/task`, task)
          .then(response => {
            this.$emit('updateTask', task, response.data)
            this.closeDialog()
          })
          .catch(e => {
            this.$q.notify({
              message: e.message,
              type: 'negative'
            })
          })
          .finally(() => {
            this.taskOnCreateProcess = false
          })
      } else {
        axios.patch(`/api/v1/client/${this.client.id}/task`, task)
          .then(newTask => {
            this.taskHistory = []
            this.loadTaskHistory()
            this.closeDialog()
            this.$emit('updateTask', task, newTask.data)
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative'
            }))
      }
    },

    async setTaskCompleted (sourceTask, options = {}) {
      if (!options.skipUnsavedCheck && this.hasUnsavedTaskChanges()) {
        this.openSubmitModal('closeTask', sourceTask)
        return
      }
      const closedStatus = this.store.statuses.find(status => isClosedStatusName(status.name))
      const oldStatusName = getStatusName(sourceTask.status)
      const newStatusName = getStatusName(closedStatus) || CLOSED_STATUS_NAME
      if (!this.validateExecutorRequiredForClosingTask(sourceTask.executor, newStatusName, true)) {
        return
      }
      const statusChangeReason = await this.requestStatusChangeReasonIfNeeded(oldStatusName, newStatusName)
      if (statusChangeReason === null) {
        return
      }
      const task = copyTaskForUpdate(sourceTask)
      task.completed = true
      task.sla = sourceTask.sla
      task.lastActivity = new Date()
      if (closedStatus) {
        task.status = closedStatus
      }
      if (statusChangeReason) {
        task.statusChangeReason = statusChangeReason
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          const updatedTask = mergeUpdatedTaskRuntimeFields(sourceTask, task, newTask.data)
          this.closeDialog()
          this.$emit('updateTask', task, updatedTask)
          this.$q.notify({
            message: 'Заявка закрыта',
            type: 'positive'
          })
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
    },

    async setTaskNotCompleted (sourceTask, options = {}) {
      if (!options.skipUnsavedCheck && this.hasUnsavedTaskChanges()) {
        this.openSubmitModal('reopenTask', sourceTask)
        return
      }
      const reopenStatus = this.getReopenStatus(sourceTask)
      if (!reopenStatus) {
        this.$q.notify({
          message: 'Не найден открытый статус для возврата заявки в работу',
          type: 'negative'
        })
        return
      }
      const oldStatusName = getStatusName(sourceTask.status)
      const newStatusName = getStatusName(reopenStatus)
      const statusChangeReason = await this.requestStatusChangeReasonIfNeeded(oldStatusName, newStatusName)
      if (statusChangeReason === null) {
        return
      }
      const task = copyTaskForUpdate(sourceTask)
      task.completed = false
      task.status = reopenStatus
      task.sla = sourceTask.sla
      task.lastActivity = new Date()
      if (statusChangeReason) {
        task.statusChangeReason = statusChangeReason
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          const updatedTask = mergeUpdatedTaskRuntimeFields(sourceTask, task, newTask.data)
          this.closeDialog()
          this.$emit('updateTask', task, updatedTask)
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
    }
  }
}
