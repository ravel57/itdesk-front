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
    taskPage: {
      tasks: [],
      page: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      isEnd: false
    },
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

    generalSettings: {
      timezone: 'Europe/Moscow',
      workingTimeEnabled: true,
      workdayStart: '09:00',
      workdayEnd: '18:00',
      mondayEnabled: true,
      tuesdayEnabled: true,
      wednesdayEnabled: true,
      thursdayEnabled: true,
      fridayEnabled: true,
      saturdayEnabled: false,
      sundayEnabled: false
    },
  }),

  getters: {
    getTasks: state => state.taskPage.tasks,
    getTaskPageTasks: state => state.taskPage.tasks
  },

  actions: {
    normalizeClientForList (client) {
      if (!client) {
        return client
      }

      const normalizedClient = { ...client }

      delete normalizedClient.tasks

      if (normalizedClient.lastMessage && normalizedClient.lastMessage.date) {
        normalizedClient.lastMessage = {
          ...normalizedClient.lastMessage,
          date: new Date(normalizedClient.lastMessage.date)
        }
      }

      if (normalizedClient.firstUnansweredMessageDate) {
        normalizedClient.firstUnansweredMessageDate = new Date(normalizedClient.firstUnansweredMessageDate)
      }

      if (!Array.isArray(normalizedClient.typingUsers)) {
        normalizedClient.typingUsers = []
      }

      if (!Array.isArray(normalizedClient.watchingUsers)) {
        normalizedClient.watchingUsers = []
      }

      if (!normalizedClient.unreadPingMessages) {
        normalizedClient.unreadPingMessages = {}
      }

      return normalizedClient
    },

    normalizeTaskPageTask (task) {
      if (!task) {
        return task
      }
      const normalizedTask = { ...task }
      if (normalizedTask.createdAt) {
        normalizedTask.createdAt = new Date(normalizedTask.createdAt)
      }
      if (normalizedTask.deadline) {
        normalizedTask.deadline = new Date(normalizedTask.deadline)
      }
      if (normalizedTask.frozenFrom) {
        normalizedTask.frozenFrom = new Date(normalizedTask.frozenFrom)
      }
      if (normalizedTask.frozenUntil) {
        normalizedTask.frozenUntil = new Date(normalizedTask.frozenUntil)
      }
      if (normalizedTask.closedAt) {
        normalizedTask.closedAt = new Date(normalizedTask.closedAt)
      }
      if (normalizedTask.lastActivity) {
        normalizedTask.lastActivity = new Date(normalizedTask.lastActivity)
      }
      if (normalizedTask.sla) {
        normalizedTask.sla = { ...normalizedTask.sla }
        if (normalizedTask.sla.startDate) {
          normalizedTask.sla.startDate = moment(new Date(normalizedTask.sla.startDate), 'DD.MM.YYYY HH:mm')
        }
        if (normalizedTask.sla.duration !== undefined && normalizedTask.sla.duration !== null) {
          normalizedTask.sla.duration = moment.duration(normalizedTask.sla.duration * 1000)
        }
      }
      if (!Array.isArray(normalizedTask.messages)) {
        normalizedTask.messages = []
      }
      normalizedTask.messages = this.sortMessagesByDateAndId(
        normalizedTask.messages.map(message => ({
          ...message,
          date: message.date ? new Date(message.date) : message.date,
          editedAt: message.editedAt ? new Date(message.editedAt) : message.editedAt
        }))
      )
      return normalizedTask
    },

    mergeTaskPageTasks (currentTasks = [], newTasks = []) {
      const taskById = new Map()
      currentTasks.forEach(task => {
        if (task?.id !== undefined && task?.id !== null) {
          taskById.set(task.id, task)
        }
      })
      newTasks.forEach(task => {
        if (task?.id !== undefined && task?.id !== null) {
          taskById.set(task.id, task)
        }
      })
      return Array.from(taskById.values())
    },

    updateLoadedTaskPageTaskFromSocket (task) {
      if (!task?.id || !Array.isArray(this.taskPage?.tasks)) {
        return false
      }

      const index = this.taskPage.tasks.findIndex(item => {
        return Number(item?.id) === Number(task.id)
      })

      if (index === -1) {
        return false
      }

      const existingTask = this.taskPage.tasks[index]
      const normalizedTask = this.normalizeTaskPageTask({
        ...task,
        client: task.client?.id ? task.client : existingTask.client
      })

      this.taskPage.tasks.splice(index, 1, {
        ...existingTask,
        ...normalizedTask
      })

      return true
    },

    resetTaskPage () {
      this.taskPage = {
        tasks: [],
        page: 0,
        size: this.taskPage?.size || 10,
        totalElements: 0,
        totalPages: 0,
        isEnd: false
      }
    },

    fetchTasksPage (params = {}, append = false) {
      const request = {
        ...params,
        size: params.size || this.taskPage.size || 10
      }

      console.log('[tasks-page request]', request, 'append:', append)

      return axios.post('/api/v1/tasks-page', request)
        .then(response => {
          console.log(
            '[tasks-page response]',
            'page:', response.data?.page,
            'size:', response.data?.size,
            'tasks:', response.data?.tasks?.length,
            'total:', response.data?.totalElements,
            'isEnd:', response.data?.isEnd
          )

          const tasks = Array.isArray(response.data?.tasks)
            ? response.data.tasks.map(task => this.normalizeTaskPageTask(task))
            : []

          const mergedTasks = append
            ? this.mergeTaskPageTasks(this.taskPage.tasks, tasks)
            : tasks

          this.taskPage = {
            tasks: mergedTasks,
            page: response.data?.page ?? request.page ?? 1,
            size: response.data?.size ?? request.size ?? this.taskPage.size,
            totalElements: response.data?.totalElements ?? tasks.length,
            totalPages: response.data?.totalPages ?? 0,
            isEnd: response.data?.isEnd ?? tasks.length === 0
          }
          console.log(
            '[tasks-page state]',
            this.taskPage.tasks.length,
            'из',
            this.taskPage.totalElements
          )

          return {
            ...this.taskPage,
            loadedTasks: tasks,
            responsePage: response.data?.page ?? request.page ?? 1,
            responseSize: response.data?.size ?? request.size ?? this.taskPage.size,
            responseTotalElements: response.data?.totalElements ?? tasks.length,
            responseTotalPages: response.data?.totalPages ?? 0,
            responseIsEnd: response.data?.isEnd ?? tasks.length === 0
          }
        })
    },

    fetchData () {
      axios.get('/api/v1/clients')
        .then(response => {
          this.clients = Array.isArray(response.data)
            ? response.data.map(client => this.normalizeClientForList(client))
            : []
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
      this.resetTaskPage()
      localStorage.removeItem('currentSessionId')
      window.location.replace('/login')
    },

    fetchGeneralSettings () {
      return axios.get('/api/v1/settings/general')
        .then(response => {
          this.generalSettings = {
            timezone: response.data?.timezone ?? 'Europe/Moscow',
            workingTimeEnabled: response.data?.workingTimeEnabled ?? true,
            workdayStart: response.data?.workdayStart ?? '09:00',
            workdayEnd: response.data?.workdayEnd ?? '18:00',
            mondayEnabled: response.data?.mondayEnabled ?? true,
            tuesdayEnabled: response.data?.tuesdayEnabled ?? true,
            wednesdayEnabled: response.data?.wednesdayEnabled ?? true,
            thursdayEnabled: response.data?.thursdayEnabled ?? true,
            fridayEnabled: response.data?.fridayEnabled ?? true,
            saturdayEnabled: response.data?.saturdayEnabled ?? false,
            sundayEnabled: response.data?.sundayEnabled ?? false
          }

          return this.generalSettings
        })
    },

    saveGeneralSettings (settings) {
      return axios.patch('/api/v1/settings/general', settings)
        .then(response => {
          this.generalSettings = response.data
          return response.data
        })
    },

    getMessageSortTime (message) {
      const rawDate = message?.date
      const time = rawDate instanceof Date
        ? rawDate.getTime()
        : new Date(rawDate || 0).getTime()
      return Number.isFinite(time) ? time : 0
    },

    sortMessagesByDateAndId (messages) {
      if (!Array.isArray(messages)) {
        return []
      }
      return [...messages].sort((a, b) => {
        const dateDiff = this.getMessageSortTime(a) - this.getMessageSortTime(b)
        if (dateDiff !== 0) {
          return dateDiff
        }
        return Number(a?.id || 0) - Number(b?.id || 0)
      })
    },
  }
})
