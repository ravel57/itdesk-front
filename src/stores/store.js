import {defineStore} from 'pinia'
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
    services: [],
    supportLines: [],
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
      'FIRST_RESPONSE_SLA_WARNING',
      'FIRST_RESPONSE_SLA_BREACHED',
      'INACTIVITY_TIMEOUT',
      'SCHEDULED_CRON',
      'TASK_CREATED',
      'TASK_UPDATED',
      'TASK_STATUS_CHANGED',
      'TASK_PRIORITY_CHANGED',
      'TASK_TYPE_CHANGED',
      'TASK_SERVICE_CHANGED',
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
    analyticsAccess: {
      role: null,
      scope: 'NONE',
      organizationIds: [],
      canViewInternalData: false,
      canViewOperators: false,
      canViewSupportLines: false,
      canFilterExecutors: false,
      canFilterSupportLines: false
    },
    analyticsSummary: {
      from: null,
      to: null,
      groupBy: 'DAY',

      newAppeals: 0,
      openTasks: 0,
      overdueSla: 0,
      overdueOla: 0,
      olaWarnings: 0,
      overdueDeadlines: 0,
      deadlineWarnings: 0,
      unansweredMessages: 0,
      avgFirstResponseSeconds: 0,
      firstResponseCount: 0,
      avgCloseTimeSeconds: 0,
      avgLineTimeSeconds: 0,
      unassignedTasks: 0,
      closedTasks: 0,
      reopenedTasks: 0,
      closedByPeriod: [],
      reopenedByPeriod: [],
      hourlyLoad: [],
      operatorLoad: [],
      lineLoad: [],
      lineTransitions: [],

      taskTypeBreakdown: [],
      priorityBreakdown: [],
      executorBreakdown: [],
      tagBreakdown: [],
      serviceBreakdown: [],
      supportLineBreakdown: [],

      byTypes: [],
      byPriorities: [],
      byExecutors: [],
      byTags: []
    },

    currentSessionId: null,
    currentUser: null,

    miniState: false,
    globalAlertMessage: [],

    userNotifications: [],
    userNotificationsUnreadCount: 0,
    userNotificationsPage: 1,
    userNotificationsTotalPages: 0,
    userNotificationsEnd: true,
    userNotificationsLoading: false,

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
      sundayEnabled: false,
      supportLineAccessMode: 'HYBRID',
    },
  }),

  getters: {
    getTasks: state => state.taskPage.tasks,
    getTaskPageTasks: state => state.taskPage.tasks
  },

  actions: {
    normalizeClientForList(client) {
      if (!client) {
        return client
      }

      const normalizedClient = {...client}

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

    normalizeTaskPageTask(task) {
      if (!task) {
        return task
      }
      const normalizedTask = {...task}
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
      ;['enteredCurrentLineAt', 'olaStartedAt', 'olaDeadline', 'olaWarningAt', 'olaBreachedAt', 'firstResponseDeadline', 'firstResponseAt'].forEach(field => {
        if (normalizedTask[field]) {
          normalizedTask[field] = new Date(normalizedTask[field])
        }
      })
      if (normalizedTask.olaInfo && typeof normalizedTask.olaInfo === 'object') {
        normalizedTask.olaInfo = {...normalizedTask.olaInfo}
        ;['startedAt', 'deadline', 'warningAt', 'breachedAt'].forEach(field => {
          if (normalizedTask.olaInfo[field]) {
            normalizedTask.olaInfo[field] = new Date(normalizedTask.olaInfo[field])
          }
        })
      }
      if (normalizedTask.sla) {
        normalizedTask.sla = {...normalizedTask.sla}
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

    mergeTaskPageTasks(currentTasks = [], newTasks = []) {
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

    updateLoadedTaskPageTaskFromSocket(task) {
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

    resetTaskPage() {
      this.taskPage = {
        tasks: [],
        page: 0,
        size: this.taskPage?.size || 10,
        totalElements: 0,
        totalPages: 0,
        isEnd: false
      }
    },

    fetchTasksPage(params = {}, append = false) {
      const request = {
        ...params,
        size: params.size || this.taskPage.size || 10
      }

      return axios.post('/api/v1/tasks-page', request)
        .then(response => {
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

    fetchData() {
      const authorities = Array.isArray(this.currentUser?.authorities)
        ? this.currentUser.authorities
        : []
      const isObserver = authorities.includes('OBSERVER')

      axios.get('/api/v1/clients')
        .then(response => {
          const existingClientsById = new Map(
            this.clients
              .filter(client => client?.id !== undefined && client?.id !== null)
              .map(client => [Number(client.id), client])
          )

          this.clients = Array.isArray(response.data)
            ? response.data.map(client => {
              const normalizedClient = this.normalizeClientForList(client)
              const existingClient = existingClientsById.get(Number(client?.id))
              const existingMessages = Array.isArray(existingClient?.messages)
                ? existingClient.messages
                : null
              const cachedMessages = (
                Number(this.currentChatMessageData?.clientId) === Number(client?.id) &&
                Array.isArray(this.currentChatMessageData?.messages)
              )
                ? this.currentChatMessageData.messages
                : null

              return {
                ...existingClient,
                ...normalizedClient,
                // История может загрузиться раньше списка клиентов. В этом
                // случае existingClient ещё отсутствует, поэтому главным
                // источником для открытого чата является отдельный cache
                // currentChatMessageData, привязанный к clientId.
                messages: cachedMessages ?? existingMessages ?? (
                  Array.isArray(normalizedClient?.messages)
                    ? normalizedClient.messages
                    : []
                )
              }
            })
            : []

          if (this.currentClient?.id !== undefined && this.currentClient?.id !== null) {
            const refreshedCurrentClient = this.clients.find(client =>
              Number(client.id) === Number(this.currentClient.id)
            )
            if (refreshedCurrentClient) {
              this.currentClient = refreshedCurrentClient
            }
          }
        })

      axios.get('/api/v1/tags')
        .then(response => {
          this.tags = response.data
        })

      axios.get('/api/v1/organizations')
        .then(response => {
          this.organizations = response.data
        })

      if (!isObserver) {
        axios.get('/api/v1/users')
          .then(response => {
            this.users = response.data
            this.users.forEach(user => {
              if (user.lastname === null) {
                user.lastname = ''
              }
            })
          })
      } else {
        this.users = []
      }

      if (!isObserver) {
        axios.get('/api/v1/roles')
          .then(response => {
            this.roles = response.data
          })
      } else {
        this.roles = []
      }

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

      axios.get('/api/v1/services')
        .then(response => {
          this.services = Array.isArray(response.data) ? response.data : []
        })

      axios.get('/api/v1/support-lines')
        .then(response => {
          this.supportLines = Array.isArray(response.data) ? response.data : []
        })

      if (!isObserver) {
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
      } else {
        this.templates = []
        this.knowledgeBase = []
        this.triggers = []
        this.triggerTypes = []
      }
    },

    fetchAnalyticsDictionaries() {
      const requests = []
      const authorities = Array.isArray(this.currentUser?.authorities)
        ? this.currentUser.authorities
        : []
      const isObserver = authorities.includes('OBSERVER')

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

      if (!isObserver) {
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
      } else {
        this.users = []
      }

      requests.push(
        axios.get('/api/v1/tags')
          .then(response => {
            this.tags = Array.isArray(response.data) ? response.data : []
          })
      )

      requests.push(
        axios.get('/api/v1/services')
          .then(response => {
            this.services = Array.isArray(response.data) ? response.data : []
          })
      )

      requests.push(
        axios.get('/api/v1/support-lines')
          .then(response => {
            this.supportLines = Array.isArray(response.data) ? response.data : []
          })
      )

      return Promise.all(requests)
    },

    fetchClientMessages(clientId) {
      const numericClientId = Number(clientId)
      return axios.get(`/api/v1/client/${numericClientId}/messages-page?page=1`)
        .then(response => {
          const messages = Array.isArray(response.data?.messages)
            ? response.data.messages.map(message => ({
              ...message,
              date: message.date ? new Date(message.date) : message.date,
              editedAt: message.editedAt ? new Date(message.editedAt) : message.editedAt
            }))
            : []
          const isEnd = Boolean(response.data?.isEnd)

          this.currentChatMessageData = {
            clientId: numericClientId,
            messages,
            isEnd
          }

          // Если список клиентов уже загружен, сразу прикрепляем историю к
          // реальному объекту. Если ещё нет — fetchData сделает это позже по
          // currentChatMessageData.clientId.
          const client = this.clients.find(item => Number(item?.id) === numericClientId)
          if (client) {
            client.messages = messages
            this.currentClient = client
          } else {
            this.currentClient = {
              ...this.currentClient,
              id: numericClientId,
              messages
            }
          }

          return {clientId: numericClientId, messages, isEnd}
        })
        .catch(error => {
          console.error(error)
          throw error
        })
    },

    fetchAnalyticsSummary(params = {}) {
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
      setIdListParam('supportLineIds', params.supportLineIds)

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
            overdueOla: response.data?.overdueOla ?? 0,
            olaWarnings: response.data?.olaWarnings ?? 0,
            overdueDeadlines: response.data?.overdueDeadlines ?? 0,
            deadlineWarnings: response.data?.deadlineWarnings ?? 0,
            unansweredMessages: response.data?.unansweredMessages ?? 0,
            avgFirstResponseSeconds: response.data?.avgFirstResponseSeconds ?? 0,
            firstResponseCount: response.data?.firstResponseCount ?? response.data?.answeredAppealsCount ?? 0,
            avgCloseTimeSeconds: response.data?.avgCloseTimeSeconds ?? 0,
            avgLineTimeSeconds: response.data?.avgLineTimeSeconds ?? 0,
            unassignedTasks: response.data?.unassignedTasks ?? 0,
            closedTasks: response.data?.closedTasks ?? 0,
            reopenedTasks: response.data?.reopenedTasks ?? 0,

            closedByPeriod: Array.isArray(response.data?.closedByPeriod) ? response.data.closedByPeriod : [],
            reopenedByPeriod: Array.isArray(response.data?.reopenedByPeriod) ? response.data.reopenedByPeriod : [],
            hourlyLoad: Array.isArray(response.data?.hourlyLoad) ? response.data.hourlyLoad : [],
            operatorLoad: Array.isArray(response.data?.operatorLoad) ? response.data.operatorLoad : [],
            lineLoad: Array.isArray(response.data?.lineLoad) ? response.data.lineLoad : [],
            lineTransitions: Array.isArray(response.data?.lineTransitions) ? response.data.lineTransitions : [],

            taskTypeBreakdown: Array.isArray(response.data?.taskTypeBreakdown) ? response.data.taskTypeBreakdown : [],
            priorityBreakdown: Array.isArray(response.data?.priorityBreakdown) ? response.data.priorityBreakdown : [],
            executorBreakdown: Array.isArray(response.data?.executorBreakdown) ? response.data.executorBreakdown : [],
            tagBreakdown: Array.isArray(response.data?.tagBreakdown) ? response.data.tagBreakdown : [],
            supportLineBreakdown: Array.isArray(response.data?.supportLineBreakdown) ? response.data.supportLineBreakdown : [],

            byTypes: Array.isArray(response.data?.byTypes) ? response.data.byTypes : [],
            byPriorities: Array.isArray(response.data?.byPriorities) ? response.data.byPriorities : [],
            byExecutors: Array.isArray(response.data?.byExecutors) ? response.data.byExecutors : [],
            byTags: Array.isArray(response.data?.byTags) ? response.data.byTags : []
          }

          return this.analyticsSummary
        })
    },

    loadCurrentSession() {
      return axios.get('/api/v1/session/current')
        .then(response => {
          this.currentSessionId = response.data.sessionId
          localStorage.setItem('currentSessionId', response.data.sessionId)
        })
    },

    logoutByForce() {
      this.currentUser = null
      this.currentSessionId = null
      this.clients = []
      this.currentClient = null
      this.resetTaskPage()
      localStorage.removeItem('currentSessionId')
      window.location.replace('/login')
    },

    normalizeUserNotification(notification) {
      if (!notification || typeof notification !== 'object') {
        return null
      }

      return {
        ...notification,
        read: Boolean(notification.read || notification.readAt),
        createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
        readAt: notification.readAt ? new Date(notification.readAt) : null
      }
    },

    receiveUserNotification(notification) {
      const normalized = this.normalizeUserNotification(notification)
      if (!normalized) {
        return
      }
      if (this.currentUser?.id && Number(normalized.userId) !== Number(this.currentUser.id)) {
        return
      }

      const existingIndex = this.userNotifications.findIndex(item => {
        return normalized.id && Number(item?.id) === Number(normalized.id)
      })
      if (existingIndex >= 0) {
        this.userNotifications.splice(existingIndex, 1, {
          ...this.userNotifications[existingIndex],
          ...normalized
        })
        return
      }

      this.userNotifications.unshift(normalized)
      if (!normalized.read) {
        this.userNotificationsUnreadCount += 1
      }
    },

    fetchUserNotifications({page = 1, size = 20, unreadOnly = false, append = false} = {}) {
      this.userNotificationsLoading = true
      return axios.get('/api/v1/user/notifications', {
        params: {page, size, unreadOnly}
      })
        .then(response => {
          const notifications = Array.isArray(response.data?.notifications)
            ? response.data.notifications
              .map(item => this.normalizeUserNotification(item))
              .filter(Boolean)
            : []

          if (append) {
            const notificationById = new Map(
              this.userNotifications
                .filter(item => item?.id !== null && item?.id !== undefined)
                .map(item => [Number(item.id), item])
            )
            notifications.forEach(item => {
              if (item?.id !== null && item?.id !== undefined) {
                notificationById.set(Number(item.id), item)
              }
            })
            this.userNotifications = Array.from(notificationById.values())
              .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
          } else {
            this.userNotifications = notifications
          }

          this.userNotificationsUnreadCount = Number(response.data?.unreadCount) || 0
          this.userNotificationsPage = Number(response.data?.page) || page
          this.userNotificationsTotalPages = Number(response.data?.totalPages) || 0
          this.userNotificationsEnd = Boolean(response.data?.end)
          return response.data
        })
        .finally(() => {
          this.userNotificationsLoading = false
        })
    },

    markUserNotificationRead(notificationId) {
      const notification = this.userNotifications.find(item => Number(item?.id) === Number(notificationId))
      const wasUnread = notification && !notification.read

      return axios.patch(`/api/v1/user/notifications/${notificationId}/read`)
        .then(response => {
          const normalized = this.normalizeUserNotification(response.data)
          const index = this.userNotifications.findIndex(item => Number(item?.id) === Number(notificationId))
          if (index >= 0 && normalized) {
            this.userNotifications.splice(index, 1, {
              ...this.userNotifications[index],
              ...normalized
            })
          }
          if (wasUnread) {
            this.userNotificationsUnreadCount = Math.max(0, this.userNotificationsUnreadCount - 1)
          }
          return normalized
        })
    },

    markAllUserNotificationsRead() {
      return axios.patch('/api/v1/user/notifications/read-all')
        .then(response => {
          const readAt = new Date()
          this.userNotifications = this.userNotifications.map(notification => ({
            ...notification,
            read: true,
            readAt: notification.readAt || readAt
          }))
          this.userNotificationsUnreadCount = Number(response.data?.unreadCount) || 0
          return response.data
        })
    },

    fetchGeneralSettings() {
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
            sundayEnabled: response.data?.sundayEnabled ?? false,
            supportLineAccessMode: response.data?.supportLineAccessMode ?? 'HYBRID',
          }

          return this.generalSettings
        })
    },

    saveGeneralSettings(settings) {
      return axios.patch('/api/v1/settings/general', settings)
        .then(response => {
          this.generalSettings = {
            ...this.generalSettings,
            ...(response.data || settings),
            supportLineAccessMode: response.data?.supportLineAccessMode
              ?? settings?.supportLineAccessMode
              ?? this.generalSettings.supportLineAccessMode
              ?? 'HYBRID'
          }
          return this.generalSettings
        })
    },

    getMessageSortTime(message) {
      const rawDate = message?.date
      const time = rawDate instanceof Date
        ? rawDate.getTime()
        : new Date(rawDate || 0).getTime()
      return Number.isFinite(time) ? time : 0
    },

    sortMessagesByDateAndId(messages) {
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
