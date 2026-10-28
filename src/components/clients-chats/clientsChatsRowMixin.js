import { getClientAvatarAbbreviation, getClientDisplayName } from 'src/util/clientName'
import { saveChatNavigationTarget, getChatNavigationStorageKey } from 'src/util/clientsChats/chatNavigationTarget'
import { getLastMessageObject, getLastMessagePreviewText } from 'src/util/clientsChats/clientMessages'
import { formatTimeSinceMessage, nameToPastelHex } from 'src/util/clientsChats/clientRowFormat'
import { hasClientPingFor } from 'src/util/clientsChats/clientsListQuery'

// Данные строки клиента в списке: имя, аватар, последнее сообщение, пинги, переход в чат.
// Требует в компоненте: this.store, this.getSortedAndFilteredClients (sort-миксин),
// this.getAnswerRequiredMessageId (answer-waiting-миксин), this.isOnboardingDemoClient (onboarding-миксин).
export default {
  computed: {
    isObserver () {
      return this.store.currentUser?.authorities?.includes('OBSERVER') === true
    }
  },

  methods: {
    getClientChatRoute (client) {
      if (this.isOnboardingDemoClient(client)) {
        return this.$route?.fullPath || '/chats'
      }
      return `/chats/${client.id}`
    },

    getChatNavigationStorageKey (clientId) {
      return getChatNavigationStorageKey(clientId)
    },

    saveChatNavigationTarget (client) {
      saveChatNavigationTarget(client, () => this.getAnswerRequiredMessageId(client))
    },

    handleClientChatClick (client, event) {
      if (this.isOnboardingDemoClient(client)) {
        event?.preventDefault()
        event?.stopPropagation()
        return
      }

      // Для открытия в новой вкладке не используем общий sessionStorage-таргет:
      // он предназначен только для обычной навигации внутри текущей вкладки.
      if (event && (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) {
        return
      }

      this.saveChatNavigationTarget(client)
    },

    isFirstClient (client) {
      return this.getSortedAndFilteredClients[0]?.id === client?.id
    },

    nameToPastelHex (name) {
      return nameToPastelHex(name)
    },

    getOrganization (client) {
      if (client.organization) {
        return client.organization.name
      } else {
        return ''
      }
    },

    getTimeLastMessage (client) {
      return formatTimeSinceMessage(this.getLastMessageObject(client))
    },

    getLastMessage (client) {
      return getLastMessagePreviewText(this.getLastMessageObject(client))
    },

    getLastMessageObject (client) {
      return getLastMessageObject(client, this.isObserver)
    },

    getAbbreviation (client) {
      return getClientAvatarAbbreviation(client)
    },

    getClientName (client) {
      return getClientDisplayName(client)
    },

    isHavePing (client) {
      if (this.isOnboardingDemoClient(client)) {
        return Number(client.demoPingCount || 0) > 0
      }
      return hasClientPingFor(client, this.store.currentUser?.id)
    },

    hasCriticalTasks (client) {
      if (this.isOnboardingDemoClient(client)) {
        return client.tasks?.some(task => task.priority?.critical && !task.completed) === true
      }
      return client.hasCriticalTasks === true
    }
  }
}
