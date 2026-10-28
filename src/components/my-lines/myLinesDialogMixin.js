import {getLineChatLink} from 'src/util/myLines/lineHelpers'

// Диалог заявки на странице «Мои линии»: открытие/закрытие, синхронизация с ?task= в URL, переход в чат клиента.
// Требует на странице: this.$router / this.$route, this.pagedTasks, upsertTask / normalizeTask (myLinesLoaderMixin).
export default {
  data: () => ({
    selectedTask: {},
    isTaskDialogShow: false,
  }),

  methods: {
    onTaskClicked(task) {
      if (!task) return
      this.selectedTask = task
      this.isTaskDialogShow = true
      this.updateUrlWithTask(task.id)
    },

    updateUrlWithTask(taskId) {
      this.$router.push({
        path: this.$route.path,
        query: {...this.$route.query, task: taskId}
      })
    },

    initializeTaskFromUrl() {
      const taskId = this.$route.query.task
      if (!taskId) {
        if (this.isTaskDialogShow) this.isTaskDialogShow = false
        return
      }
      const task = this.pagedTasks.find(item => Number(item.id) === Number(taskId))
      if (task) {
        this.selectedTask = task
        this.isTaskDialogShow = true
      }
    },

    closeDialog() {
      const query = {...this.$route.query}
      delete query.task
      this.$router.push({path: this.$route.path, query})
      this.isTaskDialogShow = false
      this.selectedTask = {}
    },

    updateTask(task, newTask) {
      const updatedTask = newTask?.data || newTask
      if (!updatedTask?.id) return
      this.upsertTask(updatedTask)
      this.selectedTask = this.normalizeTask(updatedTask)
    },

    addMessageToTask(event) {
      if (!Array.isArray(this.selectedTask.messages)) this.selectedTask.messages = []
      this.selectedTask.messages.push(event.message)
    },

    getChatLink(clientId) {
      return getLineChatLink(clientId)
    },

    onChatLinkClicked(task) {
      if (task?.client?.id == null) return
      window.location.href = this.getChatLink(task.client.id)
    }
  }
}
