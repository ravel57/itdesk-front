import {getErrorMessage} from 'src/util/settingsClients/clientErrors'

// Уведомления об ошибках для страницы клиентов и её диалогов
export default {
  methods: {
    notifyError(message) {
      this.$q.notify({
        message,
        type: 'negative'
      })
    },

    getErrorMessage(error) {
      return getErrorMessage(error)
    }
  }
}
