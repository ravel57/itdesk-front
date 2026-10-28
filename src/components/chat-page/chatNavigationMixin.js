import axios from 'axios'
import { getChatNavigationStorageKey, getStoredNavigationMessageId } from 'src/util/chatPage/navigation'

// Переход к конкретному сообщению: из роута/sessionStorage, из поиска по сообщениям
// и из связанной заявки.
export default {
  data: () => ({
    linkedMessageId: null,
    // Переход к неотвеченному сообщению при открытии чата из списка — без подсветки пузыря
    isSilentLinkedMessage: false,
    routeMessageIdHandled: false
  }),

  methods: {
    clearLinkedMessageId() {
      this.linkedMessageId = null
      this.isSilentLinkedMessage = false
    },

    getMessageOnSearch(messageId) {
      if (this.isChatOnboardingActive) {
        return Promise.resolve(false)
      }
      const id = Number(messageId)
      const clientId = Number(this.$route.params.clientId)
      if (!id || !clientId || Number(this.getClient.id) !== clientId) {
        return Promise.resolve(false)
      }
      return axios.get(`/api/v1/client/${clientId}/linked-message?linkedMessageId=${id}`)
        .then(response => {
          // Пока запрос выполнялся, пользователь мог открыть другой чат.
          // Не применяем страницу сообщений к уже сменившемуся clientId.
          if (Number(this.$route.params.clientId) !== clientId) {
            return false
          }
          const messages = this.normalizeClientMessages(response.data.messages || [])
          const page = Math.max(1, Number(response.data?.page || 1))
          this.pageCounter = page
          this.oldestLoadedMessagePage = page
          this.newestLoadedMessagePage = page
          this.isEnd = Boolean(response.data?.isEnd)
          this.pendingNewMessagesCount = 0
          this.hasTrimmedNewerMessages = page > 1
          this.setClientMessages(messages)
          this.linkedMessageId = null
          this.$nextTick(() => {
            setTimeout(() => {
              if (Number(this.$route.params.clientId) === clientId) {
                this.linkedMessageId = id
              }
            }, 100)
          })
          return true
        })
    },

    // Повторное нажатие на то же сообщение во время подсветки тоже должно прокрутить к нему
    showLinkedMessage(messageId) {
      this.linkedMessageId = null
      this.$nextTick(() => {
        this.linkedMessageId = messageId
      })
    },

    getLinkedMessage(task) {
      if (this.isChatOnboardingActive) {
        this.showLinkedMessage(task.linkedMessageId)
        return
      }
      const taskWithLinkedMessage = this.getClient.messages.filter(m => m.id === task.linkedMessageId)
      if (taskWithLinkedMessage.length > 0) {
        this.showLinkedMessage(task.linkedMessageId)
      } else {
        axios.get(`/api/v1/client/${this.getClient.id}/linked-message?linkedMessageId=${task.linkedMessageId}`)
          .then(response => {
            const messages = this.normalizeClientMessages(response.data.messages || [])
            const page = Math.max(1, Number(response.data?.page || 1))
            this.pageCounter = page
            this.oldestLoadedMessagePage = page
            this.newestLoadedMessagePage = page
            this.isEnd = Boolean(response.data?.isEnd)
            this.pendingNewMessagesCount = 0
            this.hasTrimmedNewerMessages = page > 1
            this.setClientMessages(messages)
            setTimeout(() => {
              this.linkedMessageId = task.linkedMessageId
            }, 100)
          })
      }
    },

    getRouteMessageId() {
      const raw = this.$route.query.messageId
      if (Array.isArray(raw)) {
        return Number(raw[0])
      }
      const id = Number(raw)
      return Number.isFinite(id) && id > 0 ? id : null
    },

    getNavigationMessageId(clientId = Number(this.$route.params.clientId)) {
      return this.getRouteMessageId() || getStoredNavigationMessageId(clientId)
    },

    consumeNavigationMessageId(clientId, messageId) {
      if (typeof sessionStorage !== 'undefined') {
        const key = getChatNavigationStorageKey(clientId)
        const storedMessageId = getStoredNavigationMessageId(clientId)
        if (Number(storedMessageId) === Number(messageId)) {
          sessionStorage.removeItem(key)
        }
      }

      if (Number(this.getRouteMessageId()) !== Number(messageId)) {
        return
      }

      const query = {...this.$route.query}
      delete query.messageId
      this.$router.replace({
        path: this.$route.path,
        query,
        hash: this.$route.hash
      }).catch(() => undefined)
    },

    activateNavigationMessage(clientId, messageId, routeKey) {
      this.linkedMessageId = null
      this.isSilentLinkedMessage = !this.getRouteMessageId()
      this.$nextTick(() => {
        setTimeout(() => {
          if (Number(this.$route.params.clientId) !== Number(clientId)) {
            return
          }
          this.linkedMessageId = Number(messageId)
          this.routeMessageIdHandled = routeKey
          this.consumeNavigationMessageId(clientId, messageId)
        }, 100)
      })
    },

    handleRouteMessageId() {
      const clientId = Number(this.$route.params.clientId)
      const messageId = this.getNavigationMessageId(clientId)
      if (!messageId || !clientId) {
        this.routeMessageIdHandled = null
        return
      }

      if (Number(this.getClient.id) !== clientId) {
        return
      }

      const routeKey = `${clientId}:${messageId}`
      if (this.routeMessageIdHandled === routeKey) {
        return
      }

      const alreadyLoaded = this.getClient.messages
        ?.some(message => Number(message.id) === Number(messageId))
      if (alreadyLoaded) {
        this.activateNavigationMessage(clientId, messageId, routeKey)
        return
      }

      this.getMessageOnSearch(messageId)
        .then(loaded => {
          if (!loaded || Number(this.$route.params.clientId) !== clientId) {
            return
          }
          this.routeMessageIdHandled = routeKey
          this.consumeNavigationMessageId(clientId, messageId)
        })
        .catch(() => {
          if (this.routeMessageIdHandled === routeKey) {
            this.routeMessageIdHandled = null
          }
        })
    },
  },
}
