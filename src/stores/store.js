import { defineStore } from 'pinia'
import axios from 'axios'
import moment from 'moment'

export const useStore = defineStore('store', {
  state: () => ({
    clients: [
      {
        id: 0,
        tasks: [],
        messages: [],
        typingUsers: [],
        typingMessageText: [],
        watchingUsers: []
      }
    ],

    tags: [],
    organizations: [],
    users: [],
    roles: [],
    statuses: [],
    priorities: [],
    templates: [],
    knowledgeBase: [],
    usersOnline: [],
    currentUser: {
      authorities: ['ADMIN']
    },
    currentClient: {},
    currentChatMessageData:
      {
        messages: [],
        isEnd: false
      },
    checkedTasks: [],
    supportMessages: [],

    miniState: false,
    globalAlertMessage: []
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
          this.clients.forEach(client => {
            // client.messages.forEach(message => {
            //   message.date = new Date(message.date)
            // })
            client.tasks.forEach(task => {
              task.createdAt = new Date(task.createdAt)
              if (task.deadline) {
                task.deadline = new Date(task.deadline)
              }
              if (task.sla) {
                task.sla.startDate = moment(new Date(task.sla.startDate), 'DD.MM.YYYY HH:mm')
                task.sla.duration = moment.duration(task.sla.duration * 1000)
              }
              task.messages.forEach(message => {
                message.date = new Date(message.date)
              })
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
          this.users.forEach(user => {
            if (user.lastname === null) {
              user.lastname = ''
            }
          })
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

      axios.get('/api/v1/knowledge-base')
        .then(response => {
          this.knowledgeBase = response.data
        })
    },
    fetchClientMessages (clientId) {
      return axios.get(`/api/v1/client/${clientId}/messages-page?page=1`)
        .then(response => {
          const messages = response.data.messages
          const isEnd = response.data.isEnd
          messages.forEach(message => { message.date = new Date(message.date) })
          this.currentChatMessageData.messages = messages
          this.currentChatMessageData.isEnd = isEnd
          return { messages, isEnd }
        })
        .catch(error => {
          console.error(error)
          throw error
        })
    }
  }
})
