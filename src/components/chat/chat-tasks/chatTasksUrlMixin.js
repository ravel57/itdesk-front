// Открытие заявки по URL (?task=, ?newTaskFromMessage=): синхронизация диалога заявки с адресной строкой.
// Требует в компоненте: this.$route/$router/$q, isTaskDialogShow, isNewTaskDialogShow, isNewTask, isNewLinkedTask,
// selectedTask, isShowCompletedTasks, dialogNewTask, findLoadedTaskById, loadTaskByIdForUrl.
export default {
  data: () => ({
    openingTaskFromUrl: false,
    lastOpenedTaskIdFromUrl: null,
  }),

  methods: {
    updateUrlWithTask (openedTaskId) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.set('task', openedTaskId)
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
    },

    async initializeTaskFromUrl () {
      const queryParams = new URLSearchParams(window.location.search)
      const taskIdFromUrl = this.getRouteTaskId()
      const messageId = queryParams.get('newTaskFromMessage')
      if (messageId && !taskIdFromUrl && !this.isTaskDialogShow) {
        this.isNewLinkedTask = true
        this.dialogNewTask()
        return
      }
      if (!messageId && this.isNewTask && this.isNewLinkedTask) {
        this.isNewLinkedTask = false
        this.isTaskDialogShow = false
      }
      if (!taskIdFromUrl) {
        this.lastOpenedTaskIdFromUrl = null
        if (!messageId) {
          this.isNewTaskDialogShow = false
        }
        return
      }
      if (
        this.isNewTaskDialogShow &&
        String(this.selectedTask?.id) === String(taskIdFromUrl)
      ) {
        return
      }
      if (this.openingTaskFromUrl) {
        return
      }
      this.openingTaskFromUrl = true
      try {
        let taskFromUrl = this.findLoadedTaskById(taskIdFromUrl)
        if (!taskFromUrl) {
          taskFromUrl = await this.loadTaskByIdForUrl(taskIdFromUrl)
        }
        if (!taskFromUrl) {
          this.$q.notify({
            message: `Заявка #${taskIdFromUrl} не найдена или нет доступа`,
            type: 'negative'
          })
          return
        }
        if (taskFromUrl.completed || taskFromUrl.frozen) {
          this.isShowCompletedTasks = true
        }
        this.openTaskDialogFromUrl(taskFromUrl)
      } finally {
        this.openingTaskFromUrl = false
      }
    },

    getRouteTaskId () {
      const taskId = this.$route.query.task
      return taskId !== undefined && taskId !== null && taskId !== ''
        ? taskId
        : null
    },

    openTaskDialogFromUrl (task) {
      if (!task?.id) {
        return
      }
      this.selectedTask = task
      this.isNewTask = false
      this.isTaskDialogShow = true
      this.isNewTaskDialogShow = true
      this.lastOpenedTaskIdFromUrl = task.id
    },
  }
}
