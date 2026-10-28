import axios from 'axios'
import { typing } from 'src/util/ws'
import { getUploadErrorMessage, getUploadProgress } from 'src/util/messageFileUpload'
import { normalizeClientMessage, calculateFirstUnansweredMessageDate, calculateFirstUnansweredMessageId } from 'src/util/chatPage/messages'

// Действия над сообщениями: отправка (с файлами), редактирование, удаление,
// признак «нужен ответ», набор текста и вставка шаблонов.
export default {
  data: () => ({
    isSending: false,
    uploadProgress: null
  }),

  methods: {
    onTemplateClick(text) {
      this.inputField += ' ' + text
    },

    sendMessage(event) {
      if (this.isChatOnboardingActive) {
        this.isSending = false
        this.inputField = ''
        return
      }
      if (event.attachedFiles && event.attachedFiles.length > 0) {
        const formData = new FormData()
        event.attachedFiles.forEach(file => {
          formData.append('files', file)
        })
        this.uploadProgress = 0
        axios.post('/files/upload', formData, {
          headers: {'Content-Type': 'multipart/form-data'},
          onUploadProgress: progressEvent => {
            this.uploadProgress = getUploadProgress(progressEvent)
          }
        })
          .then(response => {
            this.uploadProgress = 1
            response.data.map((fileUuid, index) => ({
              ...event.message,
              text: event.message.text || '',
              fileUuid,
              fileName: event.attachedFiles[index].name,
              fileType: event.attachedFiles[index].type,
              isComment: event.message.isComment === true,
              isSent: true,
              isRead: true,
            })).forEach(message => {
              this.sendTextMessage(message)
            })
          })
          .catch(e => {
            this.isSending = false
            this.$q.notify({
              message: getUploadErrorMessage(e),
              type: 'negative'
            })
          })
          .finally(() => {
            this.uploadProgress = null
          })
      } else {
        this.sendTextMessage(event.message)
      }
    },

    sendTextMessage(message) {
      if (this.isChatOnboardingActive) {
        this.isSending = false
        return
      }
      axios.post(`/api/v1/client/${this.getClient.id}/message`, message)
        .then((response) => {
          this.isSending = false
          const savedMessage = response.data
          if (savedMessage && savedMessage.id) {
            this.addOrUpdateClientMessage(savedMessage)
          }
          this.keyPressed('')
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
    },

    addOrUpdateClientMessage(message) {
      if (!this.getClient) {
        return
      }
      if (!Array.isArray(this.getClient.messages)) {
        this.getClient.messages = []
      }
      const normalizedMessage = this.normalizeReplyMessage(
        normalizeClientMessage(message)
      )
      if (!normalizedMessage?.id) {
        return
      }
      const hasLocalMessage = this.getClient.messages.some(item => {
        return Number(item.id) === Number(normalizedMessage.id)
      })
      if (hasLocalMessage) {
        // Обновляем все локальные экземпляры одного message.id и обязательно
        // присваиваем новый массив. Это важно после пагинации/WebSocket, когда
        // в памяти могли временно остаться две ссылки на одно сообщение.
        const nextMessages = this.getClient.messages.map(item => {
          return Number(item.id) === Number(normalizedMessage.id)
            ? {
                ...item,
                ...normalizedMessage
              }
            : item
        })
        this.setClientMessages(nextMessages)
        return
      }
      const isOutgoingMessage = Boolean(normalizedMessage.isSent)
      const isIncomingClientMessage = !normalizedMessage.isSent && !normalizedMessage.isComment
      const shouldAppendToDom =
        isOutgoingMessage ||
        (
          !this.hasTrimmedNewerMessages &&
          this.isCurrentChatNearBottom()
        )
      if (!shouldAppendToDom) {
        if (isIncomingClientMessage) {
          this.pendingNewMessagesCount += 1
        }
        return
      }
      this.setClientMessages(
        this.trimMessagesForBottom([
          ...this.getClient.messages,
          normalizedMessage
        ])
      )
      if (isIncomingClientMessage) {
        this.$nextTick(() => {
          this.scrollCurrentChatToBottom()
          this.markMessagesRead()
        })
        return
      }
      this.$nextTick(() => {
        this.scrollCurrentChatToBottom()
      })
    },

    keyPressed(text) {
      this.inputField = text
      if (this.isChatOnboardingActive) {
        return
      }
      typing(this.getClient, this.store.currentUser, text)
    },

    pastToInputField(text) {
      this.inputField = text
      typing(this.getClient, this.store.currentUser, text)
    },

    editMessage({message, text}) {
      if (!message || !message.id) {
        this.isSending = false
        return
      }
      axios.patch(`/api/v1/client/${this.getClient.id}/message/${message.id}`, {
        text
      })
        .then(response => {
          // Не мутируем найденный объект по месту: заменяем сообщение через
          // общий reactive-путь, который также синхронизирует chat cache.
          this.addOrUpdateClientMessage(response.data)
          this.keyPressed('')
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
        .finally(() => {
          this.isSending = false
        })
    },

    deleteMessage(message) {
      const messageId = Number(message?.id)
      const clientId = Number(this.getClient?.id)
      if (!messageId || !clientId) {
        return
      }

      axios.delete(`/api/v1/client/${clientId}/delete-message/${messageId}`)
        .then(() => {
          // Не ждём повторной загрузки истории или сокета: удалённое сообщение
          // должно зачеркнуться в текущем чате сразу после успешного ответа API.
          this.markMessageDeleted(messageId)
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative'
          })
        })
    },

    markMessageDeleted(messageId) {
      const id = Number(messageId)
      if (!id || !Array.isArray(this.getClient?.messages)) {
        return
      }

      let changed = false
      const nextMessages = this.getClient.messages.map(item => {
        if (Number(item?.id) !== id || item?.deleted === true) {
          return item
        }
        changed = true
        return {
          ...item,
          deleted: true
        }
      })

      if (changed) {
        this.setClientMessages(nextMessages)
      }
    },

    setAnswerRequired({messageId, clientId, answerRequired, groupMessageIds = [], resetMessageIds = []}) {
      const id = Number(messageId)
      const cid = Number(clientId)

      if (!Number.isFinite(id) || id <= 0) {
        this.$q.notify({
          message: 'Сообщение ещё не сохранено, невозможно изменить признак ответа',
          type: 'warning'
        })
        return
      }

      if (!Number.isFinite(cid) || cid <= 0) {
        this.$q.notify({
          message: 'Не найден клиент для изменения признака ответа',
          type: 'warning'
        })
        return
      }

      const groupIds = new Set([
        ...groupMessageIds,
        ...resetMessageIds,
        id
      ].map(value => Number(value)))

      const applyLocalState = (client, responseData = null) => {
        if (!client || !Array.isArray(client.messages)) {
          return
        }

        // Создаём новый массив и новые объекты сообщений. Так состояние кнопок
        // становится единственным источником истины и не зависит от мутации
        // props внутри ChatDialog.
        const nextMessages = client.messages.map(message => {
          const currentMessageId = Number(message?.id)
          if (!groupIds.has(currentMessageId)) {
            return message
          }
          return {
            ...message,
            answerRequired: currentMessageId === id
              ? answerRequired
              : 'NOT_SET'
          }
        })

        client.messages = nextMessages
        client.firstUnansweredMessageDate = calculateFirstUnansweredMessageDate(client)
        client.firstUnansweredMessageId = calculateFirstUnansweredMessageId(client)

        if (responseData && Object.prototype.hasOwnProperty.call(responseData, 'firstUnansweredMessageDate')) {
          client.firstUnansweredMessageDate = responseData.firstUnansweredMessageDate
        }
        if (responseData && Object.prototype.hasOwnProperty.call(responseData, 'firstUnansweredMessageId')) {
          client.firstUnansweredMessageId = responseData.firstUnansweredMessageId
        }

        // ВАЖНО: fetchData/getMessagePage берут историю из этого кэша.
        // Если его не обновить, следующий refresh клиентов возвращает значения
        // answerRequired, которые были при первоначальной загрузке страницы.
        if (Number(this.store.currentChatMessageData?.clientId) === cid) {
          this.store.currentChatMessageData = {
            ...this.store.currentChatMessageData,
            clientId: cid,
            messages: nextMessages.map(message => ({...message}))
          }
        }

        if (Number(this.store.currentClient?.id) === cid) {
          this.store.currentClient = client
        }

        const clientIndex = this.store.clients.findIndex(item => Number(item?.id) === cid)
        if (clientIndex !== -1) {
          this.store.clients.splice(clientIndex, 1, client)
        }
      }

      if (this.isChatOnboardingActive) {
        applyLocalState(this.chatOnboardingDemoClient)
        return
      }

      // ChatDialog уже меняет состояние оптимистично перед emit, но здесь мы
      // сразу синхронизируем также store.currentChatMessageData. Благодаря этому
      // socket refresh и повторный fetchData не могут вернуть старый выбор.
      const currentClient = this.store.clients.find(client => Number(client?.id) === cid)
      applyLocalState(currentClient)

      axios.patch(`/api/v1/client/${cid}/message/${id}/answer-required`, {
        answerRequired,
        groupMessageIds
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((response) => {
          // За время запроса объект клиента мог быть заменён обновлением списка,
          // поэтому всегда берём актуальный объект из store повторно.
          const actualClient = this.store.clients.find(client => Number(client?.id) === cid)
          applyLocalState(actualClient, response.data)
        })
        .catch(e => {
          this.$q.notify({
            message: e.response?.data?.message || e.message,
            type: 'negative'
          })
        })
    },

    deleteClient() {
      this.store.clients = this.store.clients.filter(client => client.id !== this.getClient.id)
      this.$router.push('/')
    },

    updateClient(newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },
  },
}
