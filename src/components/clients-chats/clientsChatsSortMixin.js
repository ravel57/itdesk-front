import { calcClientPingScore, filterClientsBySearch, isTaskWithoutAssignee } from 'src/util/clientsChats/clientsListQuery'

// Поиск и сортировка списка чатов: поисковая строка, тип сортировки, компараторы.
// Требует в компоненте: this.store, this.isOnboardingVisible/this.onboardingDemoClients (onboarding-миксин),
// методы SLA-, answer-waiting- и row-миксинов.
export default {
  data: () => ({
    searchQuery: '',
    sortType: 'ANSWER_WAIT',
    sortOptions: [
      {
        label: 'По времени ожидания',
        value: 'ANSWER_WAIT'
      },
      {
        label: 'По минимальному SLA среди заявок',
        value: 'MIN_SLA'
      },
      {
        label: 'По времени последнего сообщения',
        value: 'LAST_MESSAGE'
      },
      {
        label: 'Пинги',
        value: 'PINGS'
      },
      {
        label: 'Непрочитанные сообщения',
        value: 'UNREAD_MESSAGES'
      },
      {
        label: 'Заявки без исполнителя',
        value: 'TASKS_WITHOUT_ASSIGNEE'
      }
    ]
  }),

  computed: {
    shouldShowChatsToolbar () {
      return this.clientsForChatsList.length > 0 || this.searchQuery.trim() !== '' || this.isOnboardingVisible
    },

    clientsForChatsList () {
      if (this.isOnboardingVisible) {
        return this.onboardingDemoClients
      }
      return this.store.clients || []
    },

    getSortedAndFilteredClients () {
      let clients = this.clientsForChatsList || []

      clients = filterClientsBySearch(clients, this.searchQuery)
      clients = [...clients].sort((a, b) => {
        if (this.sortType === 'MIN_SLA') {
          return this.sortByMinimalSla(a, b)
        }
        if (this.sortType === 'LAST_MESSAGE') {
          return this.sortByLastMessage(a, b)
        }
        if (this.sortType === 'PINGS') {
          return this.sortByPings(a, b)
        }
        if (this.sortType === 'UNREAD_MESSAGES') {
          return this.sortByUnreadMessages(a, b)
        }
        if (this.sortType === 'TASKS_WITHOUT_ASSIGNEE') {
          return this.sortByTasksWithoutAssignee(a, b)
        }
        return this.sortByAnswerWait(a, b)
      })
      return clients
    }
  },

  methods: {
    search () {
    },

    getLastMessageDateMs (client) {
      const lastMessage = this.getLastMessageObject(client)
      const sortDate = lastMessage?.date || client?.lastActivityDate || 0
      const dateMs = new Date(sortDate).getTime()
      return Number.isFinite(dateMs) ? dateMs : 0
    },

    sortByAnswerWait (a, b) {
      const waitA = this.getAnswerRequiredWait(a)
      const waitB = this.getAnswerRequiredWait(b)
      const hasRequiredA = waitA !== null
      const hasRequiredB = waitB !== null
      if (hasRequiredA !== hasRequiredB) {
        return hasRequiredB ? 1 : -1
      }
      if (hasRequiredA && waitA !== waitB) {
        return waitB - waitA
      }
      if (hasRequiredA) {
        // Одинаковое ожидание (например, 0 вне рабочего времени): раньше написавший — выше
        const startDiff = this.getAnswerRequiredStartMs(a) - this.getAnswerRequiredStartMs(b)
        if (startDiff !== 0) {
          return startDiff
        }
      }
      return this.sortByLastMessage(a, b)
    },

    sortByMinimalSla (a, b) {
      const slaA = this.getClientMinimalSlaLeftMs(a)
      const slaB = this.getClientMinimalSlaLeftMs(b)
      const hasSlaA = slaA !== null
      const hasSlaB = slaB !== null
      if (hasSlaA !== hasSlaB) {
        return hasSlaB ? 1 : -1
      }
      if (hasSlaA && slaA !== slaB) {
        return slaA - slaB
      }
      return this.sortByLastMessage(a, b)
    },

    getUnreadMessagesCount (client) {
      return Number(client?.unreadMessagesCount || 0)
    },

    getClientPingScore (client) {
      if (this.isOnboardingDemoClient(client)) {
        return Number(client.demoPingCount || 0)
      }
      return calcClientPingScore(client, this.store.currentUser?.id)
    },

    isTaskWithoutAssignee (task) {
      return isTaskWithoutAssignee(task)
    },

    getTasksWithoutAssigneeCount (client) {
      if (this.isOnboardingDemoClient(client)) {
        return this.getActualTasks(client).filter(task => this.isTaskWithoutAssignee(task)).length
      }
      return Number(client?.tasksWithoutAssigneeCount || 0)
    },

    sortByPings (a, b) {
      const pingA = this.getClientPingScore(a)
      const pingB = this.getClientPingScore(b)
      if (pingA !== pingB) {
        return pingB - pingA
      }
      return this.sortByLastMessage(a, b)
    },

    sortByUnreadMessages (a, b) {
      const unreadA = this.getUnreadMessagesCount(a)
      const unreadB = this.getUnreadMessagesCount(b)
      if (unreadA !== unreadB) {
        return unreadB - unreadA
      }
      return this.sortByLastMessage(a, b)
    },

    sortByTasksWithoutAssignee (a, b) {
      const countA = this.getTasksWithoutAssigneeCount(a)
      const countB = this.getTasksWithoutAssigneeCount(b)
      if (countA !== countB) {
        return countB - countA
      }
      return this.sortByLastMessage(a, b)
    },

    sortByLastMessage (a, b) {
      return this.getLastMessageDateMs(b) - this.getLastMessageDateMs(a)
    }
  }
}
