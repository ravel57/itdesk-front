import axios from 'axios'
import { getUploadErrorMessage, getUploadProgress } from 'src/util/messageFileUpload'
import { mergeTaskMessageById, normalizeTaskMessage, normalizeTaskMessages } from 'src/util/taskDialog/taskMessages'

// Вкладка «Сообщения» диалога заявки: локальный список сообщений, отправка (в т.ч. с файлами),
// редактирование, файлы заявки.
// Требует в компоненте: props task/client, this.$q.
export default {
  data: () => ({
    inputField: '',
    isSending: false,
    uploadProgress: null,

    localTaskMessages: [],
    taskFiles: []
  }),

  computed: {
    normalizedTaskMessages () {
      return this.localTaskMessages
    }
  },

  methods: {
    sendMessage (event) {
      if (event.attachedFiles && event.attachedFiles.length > 0) {
        const formData = new FormData()
        event.attachedFiles.forEach(file => {
          formData.append('files', file)
        })
        this.uploadProgress = 0
        axios.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: progressEvent => {
            this.uploadProgress = getUploadProgress(progressEvent)
          }
        })
          .then(response => {
            this.uploadProgress = 1
            response.data.map((fileUuid, index) => ({
              ...event.message,
              fileUuid,
              fileName: event.attachedFiles[index].name,
              fileType: event.attachedFiles[index].type
            })).forEach(message => {
              this.sendTextMessage({
                ...event,
                message
              })
            })
          })
          .catch(e => {
            this.isSending = false
            this.$q.notify({
              message: getUploadErrorMessage(e),
              type: 'negative'
            })
          })
          .finally(() => {
            this.uploadProgress = null
          })
      } else {
        this.sendTextMessage(event)
      }
    },

    sendTextMessage (event) {
      axios.post(`/api/v1/client/${event.clientId}/task/${this.task.id}/message`, event.message)
        .then(() => {
          this.inputField = ''
          if (event.message?.fileUuid) {
            this.loadTaskFiles()
          }
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
        .finally(() => {
          this.isSending = false
        })
    },

    keyPressed (text) {
      this.inputField = text
    },

    editMessage (event) {
      if (!event.message || !event.message.id) {
        this.isSending = false
        return
      }
      axios.patch(`/api/v1/client/${event.clientId}/task/${this.task.id}/message/${event.message.id}`, {
        text: event.text
      })
        .then(response => {
          const updatedMessage = normalizeTaskMessage(response.data)
          this.localTaskMessages = mergeTaskMessageById(this.localTaskMessages, updatedMessage)
          this.inputField = ''
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
        .finally(() => {
          this.isSending = false
        })
    },

    loadTaskFiles () {
      if (!this.client?.id || !this.task?.id) {
        this.taskFiles = []
        return
      }
      axios.get(`/api/v1/client/${this.client.id}/task/${this.task.id}/files`)
        .then(response => {
          this.taskFiles = Array.isArray(response.data) ? response.data : []
        })
        .catch(() => {
          this.taskFiles = []
        })
    },

    syncLocalTaskMessages () {
      this.localTaskMessages = normalizeTaskMessages(this.task?.messages)
    }
  }
}
