import { defineStore } from 'pinia'
import axios from 'axios'

export const useStore = defineStore('store', {
  state: () => ({
    selectedClient: {},
    clients: [
      {
        id: 1,
        firstName: '',
        lastName: '',
        organization: '',
        lastMessageTime: '',
        moreInfo: '',
        tasks: [],
        messages: []
      }
    ]
  }),

  getters: {
    getTasks: state => state.clients.map(client => {
      client.tasks.forEach(task => { task.client = client })
      return client.tasks
    }).flat()
  },

  actions: {
    fetchData () {
      axios.get('http://localhost:8080/api/v1/clients')
        .then(response => {
          this.clients = response.data
        })
        .catch(e => console.error(e))
    }
  }
})
