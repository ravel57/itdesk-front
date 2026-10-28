import axios from 'axios'
import {getClientDisplayName as sharedClientDisplayName} from 'src/util/clientName'

// Доступ к карточкам клиентов в сторе.
// Требует в компоненте: this.store (setup: useStore()).
export default {
  methods: {
    getClientById(clientId) {
      return (this.store.clients || []).find(client => Number(client?.id) === Number(clientId)) || null
    },

    getClientDisplayName(client) {
      return sharedClientDisplayName(client)
    },

    refreshClients() {
      axios.get('/api/v1/clients')
        .then(response => {
          if (Array.isArray(response.data)) {
            this.store.clients = response.data
          }
        })
        .catch(() => undefined)
    }
  }
}
