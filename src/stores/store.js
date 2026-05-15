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
        watchingUsers: [],
        unreadPingMessages: []
      }
    ],

    tags: [],
    organizations: [],
    users: [],
    roles: [],
    statuses: [],
    priorities: [],
    taskTypes: [],
    templates: [],
    knowledgeBase: [],
    triggers: [],
    triggerTypes: [ // FIXME
      'MANUAL_MACRO_APPLIED',
      'MESSAGE_INCOMING',
      'MESSAGE_OUTGOING',
      'MESSAGE_EDITED',
      'MESSAGE_MENTIONED_USER',
      'MESSAGE_CONTAINS_KEYWORD',
      'MESSAGE_DELETED',
      'ATTACHMENT_ADDED',
      'SLA_WARNING',
      'SLA_BREACHED',
      'INACTIVITY_TIMEOUT',
      'SCHEDULED_CRON',
      'TASK_CREATED',
      'TASK_UPDATED',
      'TASK_STATUS_CHANGED',
      'TASK_PRIORITY_CHANGED',
      'TASK_ASSIGNEE_CHANGED',
      'TASK_GROUP_CHANGED',
      'TASK_TAG_ADDED',
      'TASK_TAG_REMOVED',
      'TASK_DUE_DATE_CHANGED',
      'TASK_CLOSED',
      'TASK_REOPENED',
      'TASK_COMPLETED',
      'TASK_OVERDUE',
      'CLIENT_CREATED',
      'CLIENT_UPDATED',
      'CLIENT_DELETED',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_OPEN_DIALOG',
      'USER_CLOSED_DIALOG',
      'KNOWLEDGE_BASE_ARTICLE_CREATED',
      'KNOWLEDGE_BASE_ARTICLE_UPDATED',
      'WEBHOOK_RECEIVED',
      'INTEGRATION_EVENT_RECEIVED'
    ],
    usersOnline: [],
    currentClient: {},
    currentChatMessageData: {
      messages: [],
      isEnd: false
    },
    checkedTasks: [],
    supportMessages: [],
    analyticsSummary: {
      from: null,
      to: null,
      groupBy: 'DAY',

      newAppeals: 0,
      openTasks: 0,
      overdueSla: 0,
      overdueDeadlines: 0,
      deadlineWarnings: 0,
      unansweredMessages: 0,
      avgFirstResponseSeconds: 0,
      avgCloseTimeSeconds: 0,
      unassignedTasks: 0,
      closedTasks: 0,
      reopenedTasks: 0,
      closedByPeriod: [],
      reopenedByPeriod: [],
      hourlyLoad: [],
      operatorLoad: [],

      byTypes: [],
      byPriorities: [],
      byExecutors: [],
      byTags: []
    },

    currentSessionId: null,
    currentUser: null,

    miniState: false,
    globalAlertMessage: [],
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

      axios.get('/api/v1/task-types')
        .then(response => {
          this.taskTypes = response.data
        })

      axios.get('/api/v1/templates')
        .then(response => {
          this.templates = response.data
        })

      axios.get('/api/v1/knowledge-base')
        .then(response => {
          this.knowledgeBase = response.data
        })

      axios.get('/api/v1/triggers')
        .then(response => {
          this.triggers = response.data
        })

      axios.get('/api/v1/trigger-types')
        .then(response => {
          this.triggerTypes = response.data
        })
    },

    fetchAnalyticsDictionaries () {
      const requests = []

      requests.push(
        axios.get('/api/v1/task-types')
          .then(response => {
            this.taskTypes = Array.isArray(response.data) ? response.data : []
          })
      )

      requests.push(
        axios.get('/api/v1/priorities')
          .then(response => {
            this.priorities = Array.isArray(response.data) ? response.data : []
          })
      )

      requests.push(
        axios.get('/api/v1/users')
          .then(response => {
            this.users = Array.isArray(response.data) ? response.data : []

            this.users.forEach(user => {
              if (user.lastname === null) {
                user.lastname = ''
              }
            })
          })
      )

      requests.push(
        axios.get('/api/v1/tags')
          .then(response => {
            this.tags = Array.isArray(response.data) ? response.data : []
          })
      )

      return Promise.all(requests)
    },

    fetchClientMessages (clientId) {
      return axios.get(`/api/v1/client/${clientId}/messages-page?page=1`)
        .then(response => {
          const messages = response.data.messages
          const isEnd = response.data.isEnd

          messages.forEach(message => {
            message.date = new Date(message.date)
          })

          this.currentChatMessageData.messages = messages
          this.currentChatMessageData.isEnd = isEnd
          return { messages, isEnd }
        })
        .catch(error => {
          console.error(error)
          throw error
        })
    },

    fetchAnalyticsSummary (params = {}) {
      const query = new URLSearchParams()

      const setParam = (name, value) => {
        if (value === undefined || value === null || value === '') {
          return
        }

        query.set(name, value)
      }

      const normalizeIds = value => {
        if (!Array.isArray(value)) {
          return []
        }

        return value
          .map(item => {
            if (item === null || item === undefined) {
              return null
            }

            if (typeof item === 'object') {
              return item.id ?? item.value ?? null
            }

            return item
          })
          .filter(item => item !== null && item !== undefined && item !== '')
      }

      const setIdListParam = (name, value) => {
        const ids = normalizeIds(value)

        if (!ids.length) {
          return
        }

        query.set(name, ids.join(','))
      }

      setParam('from', params.from)
      setParam('to', params.to)
      setParam('groupBy', params.groupBy)

      setIdListParam('typeIds', params.typeIds)
      setIdListParam('priorityIds', params.priorityIds)
      setIdListParam('executorIds', params.executorIds)
      setIdListParam('tagIds', params.tagIds)

      const queryString = query.toString()
      const url = queryString
        ? `/api/v1/analytics/summary?${queryString}`
        : '/api/v1/analytics/summary'

      return axios.get(url)
        .then(response => {
          this.analyticsSummary = {
            from: response.data?.from ?? null,
            to: response.data?.to ?? null,
            groupBy: response.data?.groupBy ?? 'DAY',

            newAppeals: response.data?.newAppeals ?? 0,
            openTasks: response.data?.openTasks ?? 0,
            overdueSla: response.data?.overdueSla ?? 0,
            overdueDeadlines: response.data?.overdueDeadlines ?? 0,
            deadlineWarnings: response.data?.deadlineWarnings ?? 0,
            unansweredMessages: response.data?.unansweredMessages ?? 0,
            avgFirstResponseSeconds: response.data?.avgFirstResponseSeconds ?? 0,
            avgCloseTimeSeconds: response.data?.avgCloseTimeSeconds ?? 0,
            unassignedTasks: response.data?.unassignedTasks ?? 0,
            closedTasks: response.data?.closedTasks ?? 0,
            reopenedTasks: response.data?.reopenedTasks ?? 0,

            closedByPeriod: Array.isArray(response.data?.closedByPeriod) ? response.data.closedByPeriod : [],
            reopenedByPeriod: Array.isArray(response.data?.reopenedByPeriod) ? response.data.reopenedByPeriod : [],
            hourlyLoad: Array.isArray(response.data?.hourlyLoad) ? response.data.hourlyLoad : [],
            operatorLoad: Array.isArray(response.data?.operatorLoad) ? response.data.operatorLoad : [],

            byTypes: Array.isArray(response.data?.byTypes) ? response.data.byTypes : [],
            byPriorities: Array.isArray(response.data?.byPriorities) ? response.data.byPriorities : [],
            byExecutors: Array.isArray(response.data?.byExecutors) ? response.data.byExecutors : [],
            byTags: Array.isArray(response.data?.byTags) ? response.data.byTags : []
          }

          return this.analyticsSummary
        })
    },

    loadCurrentSession () {
      return axios.get('/api/v1/session/current')
        .then(response => {
          this.currentSessionId = response.data.sessionId
          localStorage.setItem('currentSessionId', response.data.sessionId)
        })
    },

    logoutByForce () {
      this.currentUser = null
      this.currentSessionId = null
      this.clients = []
      this.currentClient = null
      localStorage.removeItem('currentSessionId')
      window.location.replace('/login')
    },
  }
})
