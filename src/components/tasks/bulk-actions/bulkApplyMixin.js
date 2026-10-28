import axios from 'axios'
import moment from 'moment'
import { getBulkActionNotify } from 'src/util/taskBulkActions/actionTexts'
import { cloneChecklistForBulkAction, stripClientOnlyTaskFields } from 'src/util/taskBulkActions/bulkTask'

// Применение действия: сборка заявки под выбранное действие и последовательный PATCH по каждой заявке.
// Требует в компоненте: this.store, this.action, поля формы tasks*/taskFreezeUntil, методы статусов,
// типов и исполнителей, hasRequiredActionValue(), validateExecutorsForCloseAction(),
// getStatusChangeReasonForBulkAction(); эмитит updateTask и close.
export default {
  methods: {
    getOriginalTaskForBulkAction (sourceTask) {
      if (!sourceTask?.id) {
        return sourceTask
      }
      return (this.store.getTasks || []).find(task => task?.id === sourceTask.id) || sourceTask
    },

    cloneChecklistForBulkAction (task) {
      return cloneChecklistForBulkAction(task)
    },

    buildTaskForBulkAction (sourceTask, statusChangeReason) {
      const originalTask = this.getOriginalTaskForBulkAction(sourceTask)
      let task = {
        ...originalTask,
        tags: Array.isArray(originalTask.tags) ? [...originalTask.tags] : [],
        checklist: this.cloneChecklistForBulkAction(originalTask)
      }
      if (this.action === 'close') {
        const closedStatus = this.getClosedStatus()
        task.completed = true
        task.frozen = false
        task.frozenFrom = null
        task.frozenUntil = null
        if (closedStatus) {
          task.status = closedStatus
        }
      } else if (this.action === 'open') {
        const openStatus = this.getOpenStatus(sourceTask)
        task.completed = false
        task.frozen = false
        task.frozenFrom = null
        task.frozenUntil = null
        if (openStatus) {
          task.status = openStatus
        }
      } else if (this.action === 'freeze') {
        const frozenStatus = this.getFrozenStatus()
        task.completed = false
        task.frozen = true
        task.frozenFrom = sourceTask.frozen === true && sourceTask.frozenFrom ? sourceTask.frozenFrom : new Date()
        task.frozenUntil = moment(this.tasksFreezeUntil, 'DD.MM.YYYY HH:mm').format()
        if (originalTask.status && this.isOpenStatusName(originalTask.status.name)) {
          task.previousStatus = originalTask.status
        }
        if (frozenStatus) {
          task.status = frozenStatus
        }
      } else if (this.action === 'supportLine') {
        const selectedSupportLine = (this.store.supportLines || [])
          .find(line => Number(line?.id) === Number(this.tasksSupportLineId))
        task.supportLine = selectedSupportLine || sourceTask.supportLine

        if (selectedSupportLine && task.executor && !this.isExecutorInSupportLine(task.executor, selectedSupportLine)) {
          task.executor = null
        }
      } else if (this.action === 'executor') {
        task.executor = this.findExecutorBySelectedValue(this.tasksExecutor)
      } else if (this.action === 'status') {
        const selectedStatus = this.store.statuses.find(status => status.name === this.tasksStatus)
        task.status = selectedStatus
        if (selectedStatus && this.isClosedStatusName(selectedStatus.name)) {
          task.completed = true
          task.frozen = false
          task.frozenFrom = null
          task.frozenUntil = null
        } else if (selectedStatus && this.isFrozenStatusName(selectedStatus.name)) {
          task.completed = false
          task.frozen = true
          task.frozenFrom = sourceTask.frozen === true && sourceTask.frozenFrom ? sourceTask.frozenFrom : new Date()
          task.frozenUntil = moment(this.taskFreezeUntil || this.tasksFreezeUntil, 'DD.MM.YYYY HH:mm').format()
          if (originalTask.status && this.isOpenStatusName(originalTask.status.name)) {
            task.previousStatus = originalTask.status
          }
        } else {
          task.completed = false
          task.frozen = false
          task.frozenFrom = null
          task.frozenUntil = null
        }
      } else if (this.action === 'priority') {
        task.priority = this.store.priorities.find(priority => priority.name === this.tasksPriority)
      } else if (this.action === 'type') {
        task.type = this.isValidTaskTypeSelection(this.tasksType)
          ? this.tasksType
          : sourceTask.type
      } else if (this.action === 'service') {
        task.service = (this.store.services || []).find(service => Number(service.id) === Number(this.tasksServiceId)) || sourceTask.service
      } else if (this.action === 'tags') {
        const taskTags = []
        this.tasksTags.forEach(tagName => taskTags.push(this.store.tags.find(tag => tag.name === tagName)))
        task.tags = taskTags
      } else if (this.action === 'deadline') {
        task.deadline = moment(this.tasksDeadline, 'DD.MM.YYYY HH:mm').format()
      }
      task = this.withStatusChangeReason(task, statusChangeReason)
      return stripClientOnlyTaskFields(task)
    },

    async doAction () {
      if (!this.hasRequiredActionValue()) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative'
        })
        return
      }
      if (!this.validateExecutorsForCloseAction()) {
        return
      }
      const selectedTasks = [...this.store.checkedTasks]
      const statusChangeReason = await this.getStatusChangeReasonForBulkAction()
      if (statusChangeReason === null) {
        return
      }

      try {
        for (const sourceTask of selectedTasks) {
          const task = this.buildTaskForBulkAction(sourceTask, statusChangeReason)
          const clientId = this.getClient(sourceTask)
          const newTask = await axios.patch(`/api/v1/client/${clientId}/task`, task)
          this.$emit('updateTask', task, newTask)
        }
        this.store.checkedTasks = []
        this.$q.notify({
          message: this.getNotify,
          type: 'positive'
        })
        this.$emit('close')
      } catch (e) {
        this.$q.notify({
          message: e.message,
          type: 'negative'
        })
      }
    },

    getClient (task) {
      const directClientId = task?.client?.id || task?.clientId || task?.client_id || (typeof task?.client === 'number' ? task.client : null)
      if (directClientId) {
        return directClientId
      }
      const client = this.store.clients.find(client => Array.isArray(client.tasks) && client.tasks.find(t => t.id === task.id))
      if (!client?.id) {
        throw new Error(`Не найден clientId для заявки ${task?.id || ''}`)
      }
      return client.id
    }
  },

  computed: {
    getNotify () {
      return getBulkActionNotify(this.action)
    }
  }
}
