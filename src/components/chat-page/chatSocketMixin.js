import axios from 'axios'
import { uniqueMessagesById, normalizeClientMessage } from 'src/util/chatPage/messages'

// Входящие события сообщений по WebSocket и отложенное обновление окна сообщений.
export default {
  data: () => ({
    clientMessageUnsubscribe: null,
    socketMessageRefreshTimer: null,
    socketMessageRefreshLoadedWindow: false
  }),

  methods: {
    onClientMessageFromSocket(payload) {
      // Во время обучения показан демо-чат; после него finishChatOnboarding перезагружает переписку
      if (this.isChatOnboardingActive) {
        return
      }
      // Глобальная observer-инвалидация намеренно не содержит clientId, чтобы
      // не раскрывать идентификаторы клиентов других организаций. Обновляем
      // только уже открытый чат; REST endpoint повторно проверит доступ.
      if (payload?.refreshRequired && !payload?.client?.id) {
        this.scheduleSocketMessageRefresh(Boolean(payload.refreshLoadedWindow))
        return
      }
      if (!payload?.client?.id) {
        return
      }
      if (Number(payload.client.id) !== Number(this.getClient?.id)) {
        return
      }
      if (payload.refreshRequired) {
        this.scheduleSocketMessageRefresh(Boolean(payload.refreshLoadedWindow))
        return
      }
      if (!payload.message) {
        return
      }
      if (payload.eventType === 'edited') {
        this.applyEditedClientMessageFromSocket(payload.message)
        return
      }
      this.addOrUpdateClientMessage(payload.message)
    },

    applyEditedClientMessageFromSocket(message) {
      const normalizedMessage = this.normalizeReplyMessage(
        normalizeClientMessage(message)
      )
      if (!normalizedMessage?.id) {
        return
      }

      const cachedMessages = Number(this.store.currentChatMessageData?.clientId) === Number(this.getClient?.id)
        ? (this.store.currentChatMessageData?.messages || [])
        : []
      const sourceMessages = uniqueMessagesById([
        ...(this.getClient?.messages || []),
        ...cachedMessages
      ])
      const hasMessage = sourceMessages.some(item =>
        Number(item?.id) === Number(normalizedMessage.id)
      )

      if (!hasMessage) {
        // Событие редактирования пришло по сокету, но локальная история могла
        // ещё не успеть привязаться к объекту клиента. Дозагружаем актуальную
        // страницу вместо потери edit-события.
        this.scheduleSocketMessageRefresh()
        return
      }

      this.setClientMessages(sourceMessages.map(item =>
        Number(item?.id) === Number(normalizedMessage.id)
          ? {
              ...item,
              ...normalizedMessage
            }
          : item
      ))
    },

    scheduleSocketMessageRefresh(refreshLoadedWindow = false) {
      this.socketMessageRefreshLoadedWindow =
        this.socketMessageRefreshLoadedWindow || Boolean(refreshLoadedWindow)
      clearTimeout(this.socketMessageRefreshTimer)
      this.socketMessageRefreshTimer = setTimeout(() => {
        this.socketMessageRefreshTimer = null
        const shouldRefreshLoadedWindow = this.socketMessageRefreshLoadedWindow
        this.socketMessageRefreshLoadedWindow = false
        if (shouldRefreshLoadedWindow) {
          this.refreshLoadedMessagesFromSocket()
          return
        }
        this.refreshLatestMessagesFromSocket()
      }, 120)
    },

    refreshLoadedMessagesFromSocket() {
      const clientId = Number(this.getClient?.id)
      if (!clientId) {
        return
      }

      // Редактируемое сообщение уже видно пользователю, значит оно находится
      // в одной из загруженных страниц. Перечитываем именно текущее окно, а не
      // только page=1: иначе edit старого видимого сообщения останется stale.
      const newestPage = Math.max(1, Number(this.newestLoadedMessagePage || 1))
      const oldestPage = Math.max(newestPage, Number(this.oldestLoadedMessagePage || newestPage))
      const requests = []
      for (let page = newestPage; page <= oldestPage; page += 1) {
        requests.push(axios.get(`/api/v1/client/${clientId}/messages-page?page=${page}`))
      }

      Promise.all(requests)
        .then(responses => {
          if (Number(this.getClient?.id) !== clientId) {
            return
          }
          const loadedMessages = responses.flatMap(response =>
            this.normalizeClientMessages(response.data?.messages || [])
          )
          // Это полная socket-синхронизация уже загруженного окна для OBSERVER.
          // Не смешиваем свежий ответ с локальным массивом: иначе сообщение,
          // удалённое на сервере и отсутствующее в response, останется в DOM.
          this.setClientMessages(loadedMessages)
        })
        .catch(e => {
          this.$q.notify({
            message: e.message || 'Не удалось обновить сообщения',
            type: 'negative'
          })
        })
    },

    refreshLatestMessagesFromSocket() {
      const clientId = Number(this.getClient?.id)
      if (!clientId) {
        return
      }
      axios.get(`/api/v1/client/${clientId}/messages-page?page=1`)
        .then(response => {
          if (Number(this.getClient?.id) !== clientId) {
            return
          }
          const loadedMessages = this.normalizeClientMessages(response.data?.messages || [])
          const mergedMessages = uniqueMessagesById([
            ...(this.getClient.messages || []),
            ...loadedMessages
          ])
          this.setClientMessages(this.trimMessagesForBottom(mergedMessages))
          this.pendingNewMessagesCount = 0
          this.hasTrimmedNewerMessages = false
          this.$nextTick(() => this.scrollCurrentChatToBottom())
        })
        .catch(() => undefined)
    },
  },
}
