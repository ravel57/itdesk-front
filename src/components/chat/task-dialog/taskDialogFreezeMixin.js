import axios from 'axios'
import { buildFreezePayload, resolveTagsByName } from 'src/util/taskDialog/taskPayload'
import { isFrozenStatusName, isFrozenWithTimer, getStatusName } from 'src/util/taskDialog/taskStatus'
import { validateFreezeForm } from 'src/util/taskDialog/taskValidation'

// Заморозка и разморозка заявки: диалог TaskFreezeDialog, PATCH заморозки,
// реакция на выбор статуса «Заморожена» в форме.
// Требует в компоненте: поля формы dialogTask* (taskDialogFormMixin), this.store, this.client, this.task,
// getCurrentTaskId, getSelectedTaskType, selectedDialogService (taskDialogDirectoriesMixin).
export default {
  data: () => ({
    freezeDialog: false,
    dialogTaskFreezeUntil: '',
    dialogTaskFreezeReason: ''
  }),

  methods: {
    openFreezeDialog () {
      this.dialogTaskFreezeReason = ''
      this.freezeDialog = true
    },

    // Обработчик watcher'а dialogTaskStatus: выбран статус «Заморожена» — запросить срок и причину
    onDialogTaskStatusChanged (newVal, oldVal) {
      if (this.taskFieldsInitializing || this.isNewTask) {
        return
      }
      const oldName = String(oldVal || '').trim()
      const newName = String(newVal || '').trim()
      if (!oldName || !newName || oldName.toLowerCase() === newName.toLowerCase()) {
        return
      }
      if (!isFrozenStatusName(newName)) {
        return
      }

      const sourceStatusName = String(getStatusName(this.task?.status) || '').trim()

      if (isFrozenWithTimer(this.task) && isFrozenStatusName(sourceStatusName)) {
        this.freezeDialog = false
        this.dialogTaskFreezeUntil = ''
        this.dialogTaskFreezeReason = ''
        return
      }

      this.dialogTaskFreezeUntil = ''
      this.dialogTaskFreezeReason = ''
      this.freezeDialog = true
    },

    async changeTaskFrozen () {
      const tags = resolveTagsByName(this.dialogTaskTags, this.store.tags)
      const currentTaskId = this.getCurrentTaskId()
      if (!currentTaskId) {
        this.$q.notify({
          message: 'Не найден id заявки для обновления',
          type: 'negative'
        })
        return
      }
      const freezeStatus = this.store.statuses.find(status => status.name === 'Заморожена')
      const currentStatus = this.store.statuses.find(status => status.name === this.dialogTaskStatus)
      const oldTaskStatus = this.task.status || currentStatus
      const previousStatus = this.task.previousStatus || oldTaskStatus
      let nextStatus = currentStatus
      let frozenUntil = null
      if (!this.task.frozen) {
        const validation = validateFreezeForm(this.dialogTaskFreezeUntil, this.dialogTaskFreezeReason)
        if (validation.error) {
          this.$q.notify({
            message: validation.error,
            type: 'negative'
          })
          return
        }
        nextStatus = freezeStatus || currentStatus
        frozenUntil = validation.frozenUntil
      } else {
        nextStatus = this.task.previousStatus || currentStatus
      }
      const task = buildFreezePayload({
        form: this.getDialogFormSnapshot(),
        task: this.task,
        isNewTask: this.isNewTask,
        currentTaskId,
        taskCreatedAt: this.taskCreatedAt,
        linkedMessageId: this.linkedMessageId,
        selectedType: this.getSelectedTaskType(),
        selectedService: this.selectedDialogService,
        nextStatus,
        previousStatus,
        frozenUntil,
        freezeReason: this.dialogTaskFreezeReason,
        tags,
        store: this.store
      })
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.freezeDialog = false
          this.dialogTaskFreezeReason = ''
          this.closeDialog()
          this.$emit('updateTask', task, newTask.data)
          this.$q.notify({
            message: task.frozen ? 'Заявка заморожена' : 'Заявка разморожена',
            type: 'positive'
          })
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
    }
  }
}
