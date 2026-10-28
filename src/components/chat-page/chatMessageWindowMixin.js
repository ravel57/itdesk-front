import axios from 'axios'
import { markRead } from 'src/util/ws'
import { uniqueMessagesById, sortMessagesByDate, normalizeClientMessage } from 'src/util/chatPage/messages'

// Окно сообщений текущего чата: загрузка страниц истории, кэш в store, обрезка
// отрисованных сообщений, прокрутка и отметка о прочтении.
export default {
  data: () => ({
    isEnd: false,
    pageCounter: 0,
    messagesLoadedForCurrentChat: false,
    maxRenderedMessages: 400,
    pendingNewMessagesCount: 0,
    hasTrimmedNewerMessages: false,
    oldestLoadedMessagePage: 1,
    newestLoadedMessagePage: 1
  }),

  methods: {
    getRealClientByRoute() {
      const clientId = Number(this.$route.params.clientId)
      return this.store.clients.find(client => Number(client?.id) === clientId)
    },

    syncCachedMessagesToRealClient() {
      const clientId = Number(this.$route.params.clientId)
      const cached = this.store.currentChatMessageData
      if (
        Number(cached?.clientId) !== clientId ||
        !Array.isArray(cached?.messages)
      ) {
        return false
      }

      const client = this.getRealClientByRoute()
      if (!client) {
        return false
      }

      client.messages = sortMessagesByDate(
        uniqueMessagesById(this.normalizeClientMessages(cached.messages))
      )
      this.store.currentClient = client
      this.isEnd = Boolean(cached.isEnd)
      return true
    },

    loadCurrentChatData() {
      const client = this.getRealClientByRoute()
      if (!client || this.messagesLoadedForCurrentChat) {
        return
      }

      this.syncCachedMessagesToRealClient()
      this.markMessagesRead()
      this.initCurrentChatDraft()
      this.messagesLoadedForCurrentChat = true

      // Переход к сообщению должен загружать сразу нужную страницу.
      // Иначе параллельный getMessagePage() может позже вернуть последнюю
      // страницу и затереть результат linked-message.
      if (this.getNavigationMessageId(client.id)) {
        this.$nextTick(() => this.handleRouteMessageId())
        return
      }

      this.getMessagePage()
    },

    initCurrentChatDraft() {
      const client = this.getRealClientByRoute()
      const currentUserId = this.store.currentUser?.id
      const draft = client?.typingMessageText?.[currentUserId]
      if (draft) {
        this.inputField = draft
      }
    },

    getMessagePage(pageCounter = 0) {
      if (this.isChatOnboardingActive || !this.getClient?.id) {
        return
      }
      if (pageCounter > 0) {
        this.loadOlderMessagePage()
        return
      }
      this.pageCounter = 1
      this.oldestLoadedMessagePage = 1
      this.newestLoadedMessagePage = 1
      const cached = this.store.currentChatMessageData
      const currentClientId = Number(this.$route.params.clientId)
      if (
        Number(cached?.clientId) === currentClientId &&
        Array.isArray(cached?.messages)
      ) {
        const messages = this.normalizeClientMessages(cached.messages)
        this.setClientMessages(this.trimMessagesForBottom(messages))
        this.isEnd = Boolean(cached.isEnd)
        this.pendingNewMessagesCount = 0
        this.hasTrimmedNewerMessages = false
        return
      }
      this.loadMessagePageFromServer(1, 'replace-bottom')
    },

    loadMessagePageFromServer(page, mode = 'top', scrollToBottomAfterLoad = false) {
      if (!this.getClient?.id) {
        return
      }

      axios.get(`/api/v1/client/${this.getClient.id}/messages-page?page=${page}`)
        .then(response => {
          const loadedMessages = this.normalizeClientMessages(response.data?.messages || [])
          if (mode === 'replace-bottom') {
            this.setClientMessages(this.trimMessagesForBottom(loadedMessages))
            this.pageCounter = 1
            this.oldestLoadedMessagePage = 1
            this.newestLoadedMessagePage = 1
            this.isEnd = Boolean(response.data?.isEnd)
            this.pendingNewMessagesCount = 0
            this.hasTrimmedNewerMessages = false
            if (scrollToBottomAfterLoad) {
              this.$nextTick(() => {
                setTimeout(() => this.scrollCurrentChatToBottom(), 50)
              })
            }

            return
          }
          if (mode === 'top') {
            const currentMessages = Array.isArray(this.getClient.messages)
              ? this.getClient.messages
              : []
            const mergedMessages = uniqueMessagesById([
              ...loadedMessages,
              ...currentMessages
            ])
            const trimmedMessages = this.trimMessagesForTop(mergedMessages)
            this.setClientMessages(trimmedMessages)
            this.oldestLoadedMessagePage = Math.max(this.oldestLoadedMessagePage, page)
            this.recalculateMessageWindowPagesFromOldest()
            this.pageCounter = this.oldestLoadedMessagePage
            this.isEnd = Boolean(response.data?.isEnd)
            this.hasTrimmedNewerMessages = this.newestLoadedMessagePage > 1

            return
          }
          if (mode === 'bottom') {
            const currentMessages = Array.isArray(this.getClient.messages)
              ? this.getClient.messages
              : []
            const mergedMessages = uniqueMessagesById([
              ...currentMessages,
              ...loadedMessages
            ])
            const trimmedMessages = this.trimMessagesForBottom(mergedMessages)
            this.setClientMessages(trimmedMessages)
            this.newestLoadedMessagePage = Math.min(this.newestLoadedMessagePage, page)
            this.recalculateMessageWindowPagesFromNewest()
            this.pageCounter = this.oldestLoadedMessagePage
            this.hasTrimmedNewerMessages = this.newestLoadedMessagePage > 1
            // Если при движении вниз старые сообщения сверху отрезались,
            // значит сверху снова можно догружать историю.
            if (this.oldestLoadedMessagePage > 1) {
              this.isEnd = false
            }
          }
        })
        .catch(e => {
          this.$q.notify({
            message: e.message || 'Не удалось загрузить сообщения',
            type: 'negative'
          })
        })
    },

    loadOlderMessagePage() {
      if (this.isEnd) {
        return
      }
      const nextPage = Math.max(1, Number(this.oldestLoadedMessagePage || 1)) + 1
      this.loadMessagePageFromServer(nextPage, 'top')
    },

    getNewerMessagePage() {
      if (this.newestLoadedMessagePage <= 1) {
        this.hasTrimmedNewerMessages = false
        return
      }
      const nextPage = this.newestLoadedMessagePage - 1
      this.loadMessagePageFromServer(nextPage, 'bottom')
    },

    getRenderedMessagePageCount() {
      const messagesCount = Array.isArray(this.getClient?.messages)
        ? this.getClient.messages.length
        : 0
      return Math.max(1, Math.ceil(messagesCount / 100))
    },

    recalculateMessageWindowPagesFromOldest() {
      const pageCount = this.getRenderedMessagePageCount()
      this.newestLoadedMessagePage = Math.max(
        1,
        this.oldestLoadedMessagePage - pageCount + 1
      )
    },

    recalculateMessageWindowPagesFromNewest() {
      const pageCount = this.getRenderedMessagePageCount()
      this.oldestLoadedMessagePage = this.newestLoadedMessagePage + pageCount - 1
    },

    goToLatestMessages() {
      if (this.isChatOnboardingActive || !this.getClient?.id) {
        return
      }
      this.pageCounter = 1
      this.oldestLoadedMessagePage = 1
      this.newestLoadedMessagePage = 1
      this.pendingNewMessagesCount = 0
      this.hasTrimmedNewerMessages = false
      this.loadMessagePageFromServer(1, 'replace-bottom', true)
    },

    scrollCurrentChatToBottom() {
      const chat = document.getElementById('chat-dialog')
      const scrollZone = chat?.children?.[0]?.children?.[0]
      if (!scrollZone) {
        return
      }
      scrollZone.scrollTo(0, scrollZone.scrollHeight)
    },

    getCurrentChatScrollZone() {
      const chat = document.getElementById('chat-dialog')
      return chat?.children?.[0]?.children?.[0] || null
    },

    isCurrentChatNearBottom(threshold = 180) {
      const scrollZone = this.getCurrentChatScrollZone()
      if (!scrollZone) {
        return true
      }
      return scrollZone.scrollHeight - scrollZone.clientHeight - scrollZone.scrollTop <= threshold
    },

    setClientMessages(messages) {
      const clientId = Number(this.$route.params.clientId)
      const nextMessages = sortMessagesByDate(
        uniqueMessagesById(messages || [])
      )
      const realClient = this.getRealClientByRoute()
      const targetClient = realClient || this.getClient

      if (targetClient) {
        targetClient.messages = nextMessages
      }
      if (realClient) {
        this.store.currentClient = realClient
      }

      // Храним историю отдельно от списка клиентов. Это защищает чат от
      // гонки: messages-page успевает ответить раньше /api/v1/clients, после
      // чего новый объект клиента больше не может затереть переписку пустым [].
      const cachedIsEnd = Number(this.store.currentChatMessageData?.clientId) === clientId
        ? this.store.currentChatMessageData?.isEnd
        : this.isEnd
      this.store.currentChatMessageData = {
        clientId,
        messages: nextMessages,
        isEnd: Boolean(cachedIsEnd)
      }
    },

    trimMessagesForBottom(messages) {
      const normalizedMessages = sortMessagesByDate(uniqueMessagesById(messages))
      if (normalizedMessages.length <= this.maxRenderedMessages) {
        return normalizedMessages
      }
      return normalizedMessages.slice(-this.maxRenderedMessages)
    },

    trimMessagesForTop(messages) {
      const normalizedMessages = sortMessagesByDate(uniqueMessagesById(messages))
      if (normalizedMessages.length <= this.maxRenderedMessages) {
        return normalizedMessages
      }
      this.hasTrimmedNewerMessages = true
      return normalizedMessages.slice(0, this.maxRenderedMessages)
    },

    normalizeClientMessages(messages) {
      return Array.isArray(messages)
        ? messages.map(message => this.normalizeReplyMessage(normalizeClientMessage(message)))
        : []
    },

    normalizeReplyMessage(message) {
      if (!message || !message.replyMessageId || message.replyMessageText) {
        return message
      }
      const repliedMessage = this.getClient.messages.find(item =>
        Number(item.id) === Number(message.replyMessageId)
      )
      return {
        ...message,
        replyMessageText: repliedMessage?.text || '',
        replyFileType: message.replyFileType || repliedMessage?.fileType || null,
        replyUuid: message.replyUuid || repliedMessage?.fileUuid || null
      }
    },

    markMessagesRead(force = false) {
      // OBSERVER is a read-only role: opening/scrolling a chat must not
      // acknowledge support messages or change unread state.
      if (this.isObserverUser) {
        return
      }
      if (this.isChatOnboardingActive) {
        return
      }
      if (!this.getClient?.id) {
        return
      }
      if (!force && !this.canMarkCurrentChatRead()) {
        return
      }
      markRead(this.getClient)
      this.pendingNewMessagesCount = 0
      const client = this.store.clients.find(item => Number(item.id) === Number(this.getClient.id))
      if (client) {
        client.unreadMessagesCount = 0
      }
      if (this.getClient) {
        this.getClient.unreadMessagesCount = 0
      }
    },

    canMarkCurrentChatRead() {
      if (this.hasTrimmedNewerMessages) {
        return false
      }
      if (Number(this.newestLoadedMessagePage || 1) > 1) {
        return false
      }
      return this.isCurrentChatNearBottom(220)
    },
  },
}
