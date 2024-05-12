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
    roles: [],
    statuses: [],
    priorities: [],
    templates: []
  }),

  getters: {
    getTasks: state => state.clients.map(client => {
      client.tasks.forEach(task => { task.client = client })
      return client.tasks
    }).flat()
  },

  actions: {
    fetchData () {
      axios.get('/api/v1/clients')
        .then(response => {
          this.clients = response.data
          this.clients.forEach(it => {
            it.messages.forEach(message => {
              message.date = new Date(message.date)
            })
            it.tasks.forEach(task => {
              task.createdAt = new Date(task.createdAt)
            })
          })
        })

      axios.get('/api/v1/tags')
        .then(response => {
          this.tags = response.data
        })

      axios.get('/api/v1/organizations')
        .then(response => {
          this.organizations = response.data
        })

      axios.get('/api/v1/users')
        .then(response => {
          this.users = response.data
        })

      axios.get('/api/v1/roles')
        .then(response => {
          this.roles = response.data
        })

      axios.get('/api/v1/statuses')
        .then(response => {
          this.statuses = response.data
        })

      axios.get('/api/v1/priorities')
        .then(response => {
          this.priorities = response.data
        })

      axios.get('/api/v1/templates')
        .then(response => {
          this.templates = response.data
        })
    }
  }
})
