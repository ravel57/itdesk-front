import axios from 'axios'

// Пинги (упоминания) в заявках клиента: список, подгрузка и открытие заявки из списка.
// Требует в компоненте: prop client, this.$can, isDemoClient, normalizeTaskPageTask, openLinkedTask,
// getPossibilityToOpenDialogTask, selectedTask.
export default {
  data: () => ({
    pingedTasks: [],
    taskPingsLoading: false,
    taskPingsRequestSeq: 0,
    taskPingsReloadTimer: null,
  }),

  methods: {
    async loadTaskPings () {
      const canLoadTaskPings = this.$can('TASK_EDIT')
      if (this.isDemoClient || !this.client?.id || !canLoadTaskPings) {
        this.pingedTasks = []
        return
      }

      const requestClientId = Number(this.client.id)
      const requestSeq = ++this.taskPingsRequestSeq
      this.taskPingsLoading = true

      try {
        const response = await axios.get(`/api/v1/client/${requestClientId}/task-pings`)

        if (requestSeq !== this.taskPingsRequestSeq || Number(this.client?.id) !== requestClientId) {
          return
        }

        const tasks = Array.isArray(response.data) ? response.data : []
        this.pingedTasks = tasks
          .map(task => this.normalizeTaskPageTask(task))
          .filter(task => task?.id)
      } catch (e) {
        if (requestSeq === this.taskPingsRequestSeq) {
          console.error('Не удалось загрузить пинги по заявкам', e)
        }
      } finally {
        if (requestSeq === this.taskPingsRequestSeq) {
          this.taskPingsLoading = false
        }
      }
    },

    reloadTaskPingsDebounced () {
      if (this.taskPingsReloadTimer) {
        clearTimeout(this.taskPingsReloadTimer)
      }
      this.taskPingsReloadTimer = setTimeout(() => {
        this.taskPingsReloadTimer = null
        this.loadTaskPings()
      }, 500)
    },

    openPingedTask (task) {
      if (!task?.id) {
        return
      }
      this.pingedTasks = this.pingedTasks.filter(item => {
        return Number(item.id) !== Number(task.id)
      })
      this.openLinkedTask(task)
    },

    onTaskMessageForPingList (payload) {
      if (Number(payload?.clientId) !== Number(this.client?.id)) {
        return
      }
      if (this.getPossibilityToOpenDialogTask && Number(payload?.taskId) === Number(this.selectedTask?.id)) {
        this.pingedTasks = this.pingedTasks.filter(task => {
          return Number(task.id) !== Number(payload.taskId)
        })
        return
      }
      this.reloadTaskPingsDebounced()
    },
  }
}
