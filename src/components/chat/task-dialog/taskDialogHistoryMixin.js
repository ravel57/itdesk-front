import axios from 'axios'

// Вкладка «История» диалога заявки: загрузка истории изменений.
// Требует в компоненте: getCurrentTaskId (taskDialogFormMixin), this.$q.
export default {
  data: () => ({
    taskHistory: [],
    taskHistoryLoading: false
  }),

  methods: {
    loadTaskHistory () {
      const taskId = this.getCurrentTaskId()

      if (!taskId) {
        this.taskHistory = []
        return
      }

      this.taskHistoryLoading = true

      axios.get(`/api/v1/task/${taskId}/history`)
        .then(response => {
          this.taskHistory = response.data || []
        })
        .catch(error => {
          console.error(error)
          this.taskHistory = []
          this.$q.notify({
            type: 'negative',
            message: 'Не удалось загрузить историю заявки'
          })
        })
        .finally(() => {
          this.taskHistoryLoading = false
        })
    }
  }
}
