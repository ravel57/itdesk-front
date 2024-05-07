import { defineStore } from 'pinia'
import axios from 'axios'

export const useStore = defineStore('store', {
  state: () => ({
    clients: [
      {
        id: 0,
        tasks: [],
        messages: []
      }
    ],

    tags: [],
    organizations: [],
    users: [],
    roles: []
  }),

  getters: {
    getTasks: state => state.clients.map(client => {
      client.tasks.forEach(task => { task.client = client })
      return client.tasks
    }).flat()
  },

  actions: {
    fetchData () {
      const onRejected = e => {
        // this.$q.notify({
        //   message: e,
        //   type: 'negative',
        //   position: 'top-right',
        //   actions: [{
        //     icon: 'close', color: 'white', dense: true, handler: () => undefined
        //   }]
        // })
      }

      axios.get('/api/v1/clients') /* http://localhost:8080 */
        .then(response => {
          console.log(response.data)
          this.clients = response.data
          this.clients.forEach(it => it.messages.forEach(message => {
            message.date = new Date(message.date)
          }))
        })
        .catch(onRejected)

      axios.get('/api/v1/tags') /* http://localhost:8080 */
        .then(response => {
          this.tags = response.data
        })
        .catch(onRejected)

      axios.get('/api/v1/organizations') /* http://localhost:8080 */
        .then(response => {
          this.organizations = response.data
        })
        .catch(onRejected)

      axios.get('/api/v1/users') /* http://localhost:8080 */
        .then(response => {
          this.users = response.data
        })
        .catch(onRejected)

      axios.get('/api/v1/roles') /* http://localhost:8080 */
        .then(response => {
          this.roles = response.data
        })
        .catch(onRejected)
    }
  }
})
