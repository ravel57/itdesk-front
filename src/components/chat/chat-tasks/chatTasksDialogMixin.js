import axios from 'axios'
import { getStamp, getStatusName, isClosedStatusName } from 'src/util/chatTasks/taskText'

// Диалог заявки и действия над заявкой: открытие/закрытие диалога, обновление и закрытие заявки,
// обновления по WebSocket.
// Требует в компоненте: props client/statuses/requestStatusChangeReason, this.store/$q/$router/$route,
// состояние диалога (isNewTaskDialogShow, isTaskDialogShow, selectedTask, isNewTask, isNewLinkedTask),
// методы paging/sla/pings/url миксинов.
export default {
  methods: {
    updateClient (newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },

    dialogNewTask () {
      this.isNewTask = true
      this.isTaskDialogShow = true
      // setTimeout(() => this.$refs.taskName.focus(), 500)
    },

    onTaskClick (task) {
      if (!this.isNewTaskDialogShow) {
        this.selectedTask = task
        this.isNewTask = false
        this.isNewTaskDialogShow = true
        this.updateUrlWithTask(task.id)
      }
    },

    updateTask (task, newTask) {
      const updatedTask = newTask?.data || newTask
      const taskId = updatedTask?.id || task?.id
      const isCreatedTask = Boolean(updatedTask?.id) && (!task?.id || this.isNewTask)
      const shouldReloadTask = Boolean(taskId) &&
        !isCreatedTask &&
        !updatedTask?.completed &&
        !updatedTask?.frozen &&
        !updatedTask?.sla

      if (taskId) {
        const slaInfoByTaskId = { ...this.slaInfoByTaskId }
        delete slaInfoByTaskId[taskId]
        this.slaInfoByTaskId = slaInfoByTaskId
      }
      if (updatedTask?.id) {
        this.upsertPagedTask(updatedTask)
      }
      this.$emit('updateTask', task, newTask)
      this.$nextTick(() => {
        if (shouldReloadTask) {
          this.reloadTaskAfterUpdate(taskId, updatedTask || task)
          return
        }
        this.loadSlaInfoForTask(updatedTask || task, true)
      })
      if (isCreatedTask) {
        this.isNewTask = false
        this.isNewLinkedTask = false
        this.isNewTaskDialogShow = false
        this.isTaskDialogShow = false
        this.selectedTask = {}
        this.resetTasksPageAndLoad(true)
      }
    },

    async reloadTaskAfterUpdate (taskId, fallbackTask) {
      if (!taskId || this.isDemoClient) {
        await this.loadSlaInfoForTask(fallbackTask, true)
        return
      }

      try {
        const freshTask = await this.loadTaskByIdForUrl(taskId)
        if (!freshTask) {
          await this.loadSlaInfoForTask(fallbackTask, true)
          return
        }

        this.upsertPagedTask(freshTask)
        if (Number(this.selectedTask?.id) === Number(taskId)) {
          this.selectedTask = freshTask
        }
        await this.loadSlaInfoForTask(freshTask, true)
      } catch (e) {
        console.warn('Task reload after update failed', taskId, e)
        await this.loadSlaInfoForTask(fallbackTask, true)
      }
    },

    onNewTaskCreated(response) {
      const createdTask = response?.data || response

      if (!createdTask?.id) {
        this.resetTasksPageAndLoad(true)
        return
      }

      this.updateTask({}, createdTask)
    },

    async setTaskCompleted (task) {
      const closedStatus = this.getClosedStatus()
      const oldStatusName = this.getStatusName(task.status)
      const newStatusName = this.getStatusName(closedStatus) || 'Закрыта'
      if (!task.executor || !task.executor.id) {
        this.$q.notify({
          message: 'Перед закрытием заявки укажите исполнителя',
          type: 'negative'
        })
        return
      }
      const statusChangeReason = typeof this.requestStatusChangeReason === 'function'
        ? await this.requestStatusChangeReason(oldStatusName, newStatusName)
        : ''
      if (statusChangeReason === null) {
        return
      }
      const completedTask = {
        id: task.id,
        name: task.name,
        description: task.description,
        type: task.type,
        checklist: task.checklist,
        status: closedStatus || task.status,
        priority: task.priority,
        executor: task.executor,
        tags: task.tags,
        completed: true,
        createdAt: task.createdAt,
        deadline: task.deadline,
        linkedMessageId: task.linkedMessageId,
        previousStatus: task.previousStatus || task.status
      }
      if (statusChangeReason) {
        completedTask.statusChangeReason = statusChangeReason
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, completedTask)
        .then(newTask => {
          this.closeDialog()
          this.updateTask(task, newTask)
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

    getStamp (date) {
      return getStamp(date)
    },

    getLinkedMessage (task) {
      this.$emit('scrollToElementById', task)
    },

    goToTask (taskId) {
      this.scrollToElementById(`task_${taskId}`)
    },

    closeDialog () {
      const queryParams = new URLSearchParams(window.location.search)
      if (queryParams.get('newTaskFromMessage')) {
        queryParams.delete('newTaskFromMessage')
        this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      }
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
    },

    addMessageToTask (event) {
      if (!this.selectedTask) {
        return
      }
      if (!Array.isArray(this.selectedTask.messages)) {
        this.selectedTask.messages = []
      }
      this.selectedTask.messages = this.sortMessagesByDateAndId(
        this.uniqueMessagesById([
          ...this.selectedTask.messages,
          this.normalizeTaskMessage(event.message)
        ])
      )
    },

    getStatusName (status) {
      return getStatusName(status)
    },

    isClosedStatusName (statusName) {
      return isClosedStatusName(statusName)
    },

    getClosedStatus () {
      return this.statuses?.find(status => this.isClosedStatusName(status.name)) ||
        this.store.statuses?.find(status => this.isClosedStatusName(status.name))
    },

    openLinkedTask (task) {
      if (!task?.id) {
        return
      }
      if (task.completed || task.frozen) {
        this.isShowCompletedTasks = true
      }
      this.$nextTick(() => {
        this.onTaskClick(task)
      })
    },

    onTaskUpdatedFromSocket (payload) {
      const socketTask = payload?.task
      if (!socketTask?.id) {
        return
      }
      if (payload?.clientId && Number(payload.clientId) !== Number(this.client?.id)) {
        return
      }
      this.reloadTaskPingsDebounced()
      const existingTask = this.pagedTasks.find(item => {
        return Number(item?.id) === Number(socketTask.id)
      })
      if (!existingTask) {
        // Новая заявка клиента (например, созданная автоматизацией): показываем сразу и сверяемся с сервером,
        // т.к. параллельный запрос списка мог вернуть состояние до её создания и затереть её
        this.upsertPagedTask({
          ...socketTask,
          client: socketTask.client?.id ? socketTask.client : this.client
        })
        this.refreshTasksPageSoon()
        return
      }
      const normalizedTask = this.normalizeTaskPageTask({
        ...socketTask,
        client: socketTask.client?.id ? socketTask.client : existingTask.client || this.client
      })
      this.upsertPagedTask(normalizedTask)
      if (Number(this.selectedTask?.id) === Number(normalizedTask.id)) {
        this.selectedTask = normalizedTask
      }
      this.$nextTick(() => {
        this.loadSlaInfoForTask(normalizedTask, true)
      })
    },
  }
}
