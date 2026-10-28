import axios from 'axios'

export const chatActions = {
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
  }
}
