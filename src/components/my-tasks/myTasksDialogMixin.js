import {getMyTaskChatLink} from 'src/util/myTasks/myTasksPaging'

// Диалог заявки на странице «Мои заявки»: открытие/закрытие, синхронизация с ?task= в URL, переход в чат клиента.
// Требует на странице: this.$router / this.$route, this.getFilteredTasks, upsertMyTask, normalizeMyTask (myTasksLoaderMixin),
// myTasksOnboardingActive (myTasksOnboardingMixin).
export default {
  data: () => ({
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    selectedTask: {},
  }),

  methods: {
    closeDialog() {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.delete('task')
      this.$router.push({path: this.$route.path, query: Object.fromEntries(queryParams.entries())})
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
    },

    onTaskClicked(task) {
      if (!task || task.__demo) {
        return
      }
      this.isTaskDialogShow = true
      this.selectedTask = task
      this.updateUrlWithTask(task.id)
    },

    updateTask(task, newTask) {
      const updatedTask = newTask?.data || newTask
      if (updatedTask?.id) {
        this.upsertMyTask(updatedTask)
        this.selectedTask = this.normalizeMyTask(updatedTask)
        return
      }
      this.selectedTask = updatedTask
    },

    updateUrlWithTask(openedTaskId) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.set('task', openedTaskId)
      this.$router.push({path: this.$route.path, query: Object.fromEntries(queryParams.entries())})
    },

    initializeTaskFromUrl() {
      if (this.myTasksOnboardingActive) {
        return
      }
      const queryParams = new URLSearchParams(window.location.search)
      const taskIdFromUrl = queryParams.get('task')
      if (!taskIdFromUrl && this.isTaskDialogShow) {
        this.closeDialog()
      }
      if (taskIdFromUrl) {
        const taskFromUrl = this.getFilteredTasks.find(task => Number(task.id) === Number(taskIdFromUrl))
        if (taskFromUrl) {
          this.onTaskClicked(taskFromUrl)
        }
      } else {
        this.isNewTaskDialogShow = false
      }
    },

    getChatLink(id, task = null) {
      return getMyTaskChatLink(id, task)
    },

    onChatLinkClicked(task, event) {
      if (task?.__demo) {
        event?.preventDefault()
        return
      }
      window.location.href = this.getChatLink(task.client.id)
    },

    addMessageToTask(event) {
      if (!this.selectedTask.messages) {
        this.selectedTask.messages = []
      }
      this.selectedTask.messages.push(event.message)
    },
  }
}
