import {useStore} from 'stores/store'
import {safeParseJson} from 'src/util/ws/json'
import {notifyClientMessageListeners} from 'src/util/ws/listeners'
import {refreshClientsFromSocket} from 'src/util/ws/outgoing'
import {normalizeIncomingClientMessage, sortMessagesByDateAndId} from 'src/util/ws/normalizers'

export function clientMessageCallback(message) {
  const store = useStore()
  const clientMessage = safeParseJson(message.body, null)

  if (!clientMessage || !clientMessage.message || !clientMessage.client?.id) {
    return
  }

  const incomingMessage = normalizeIncomingClientMessage(clientMessage.message)
  const clientId = Number(clientMessage.client.id)

  const client = store.clients.find(c => Number(c.id) === clientId)
  if (client) {
    client.lastMessage = incomingMessage
    if (!incomingMessage.isSent && !incomingMessage.isComment) {
      client.unreadMessagesCount = Number(client.unreadMessagesCount || 0) + 1
    }
  }

  if (client) {
    upsertClientMessage(client, incomingMessage)
  }

  // Всегда передаём событие активным страницам чата. ChatPage сам проверяет
  // clientId по route/getClient, поэтому здесь нельзя зависеть от store.currentClient:
  // у OBSERVER персональный список клиентов может обновиться позже сообщения.
  notifyClientMessageListeners({
    client: clientMessage.client,
    message: incomingMessage
  })

  if (!client) {
    refreshClientsFromSocket()
  }
}

function upsertClientMessage(client, message) {
  if (!client || !message || !message.id) {
    return
  }
  if (!Array.isArray(client.messages)) {
    client.messages = []
  }
  const normalizedMessage = hydrateReplyMessageFromClient(client, normalizeIncomingClientMessage(message))
  const index = client.messages.findIndex(item =>
    Number(item.id) === Number(normalizedMessage.id)
  )
  if (index === -1) {
    client.messages.push(normalizedMessage)
  } else {
    client.messages.splice(index, 1, {
      ...client.messages[index],
      ...normalizedMessage
    })
  }
  client.messages = sortMessagesByDateAndId(client.messages)
}

function hydrateReplyMessageFromClient(client, message) {
  if (!message.replyMessageId || message.replyMessageText) {
    return message
  }

  const messages = Array.isArray(client?.messages) ? client.messages : []
  const repliedMessage = messages.find(item =>
    Number(item.id) === Number(message.replyMessageId)
  )
  return {
    ...message,
    replyMessageText: repliedMessage?.text || '',
    replyFileType: message.replyFileType || repliedMessage?.fileType || null,
    replyUuid: message.replyUuid || repliedMessage?.fileUuid || null
  }
}

export function editedMessageCallback(message) {
  const clientMessage = safeParseJson(message.body, null)

  if (!clientMessage || !clientMessage.message || !clientMessage.client?.id) {
    return
  }

  const store = useStore()
  const clientId = Number(clientMessage.client.id)
  const normalizedMessage = normalizeIncomingClientMessage(clientMessage.message)

  // Используем immutable upsert вместо Object.assign: он гарантированно
  // создаёт новый массив сообщений и обновляет DOM без перезагрузки страницы.
  const client = store.clients.find(c => Number(c.id) === clientId)
  if (client) {
    upsertClientMessage(client, normalizedMessage)
  }
  if (Number(store.currentClient?.id) === clientId && store.currentClient !== client) {
    upsertClientMessage(store.currentClient, normalizedMessage)
  }

  if (Number(store.currentChatMessageData?.clientId) === clientId && Array.isArray(store.currentChatMessageData?.messages)) {
    const hasCachedMessage = store.currentChatMessageData.messages.some(item =>
      Number(item?.id) === Number(normalizedMessage.id)
    )
    if (hasCachedMessage) {
      const messages = store.currentChatMessageData.messages.map(item =>
        Number(item?.id) === Number(normalizedMessage.id)
          ? {
              ...item,
              ...normalizedMessage
            }
          : item
      )
      store.currentChatMessageData = {
        ...store.currentChatMessageData,
        messages: sortMessagesByDateAndId(messages)
      }
    }
  }

  notifyClientMessageListeners({
    client: clientMessage.client,
    message: normalizedMessage,
    eventType: 'edited'
  })

  // Синхронизируем персональный список клиентов у OBSERVER после редактирования.
  // Это служит дополнительной socket-инвалидацией, если клиент был пересоздан
  // в store между загрузкой истории и приходом события редактирования.
  if (store.currentUser?.authorities?.[0] === 'OBSERVER') {
    refreshClientsFromSocket()
  }
}

export function deletedMessageCallback(message) {
  const clientMessage = safeParseJson(message.body, null)

  if (!clientMessage || !clientMessage.message || !clientMessage.client?.id) {
    return
  }

  const store = useStore()
  const clientId = Number(clientMessage.client.id)
  const normalizedMessage = normalizeIncomingClientMessage({
    ...clientMessage.message,
    deleted: true
  })

  const client = store.clients.find(c => Number(c.id) === clientId)
  if (client) {
    upsertClientMessage(client, normalizedMessage)
  }
  if (Number(store.currentClient?.id) === clientId && store.currentClient !== client) {
    upsertClientMessage(store.currentClient, normalizedMessage)
  }

  if (Number(store.currentChatMessageData?.clientId) === clientId && Array.isArray(store.currentChatMessageData?.messages)) {
    const hasCachedMessage = store.currentChatMessageData.messages.some(item =>
      Number(item?.id) === Number(normalizedMessage.id)
    )
    if (hasCachedMessage) {
      const messages = store.currentChatMessageData.messages.map(item =>
        Number(item?.id) === Number(normalizedMessage.id)
          ? {
              ...item,
              ...normalizedMessage,
              deleted: true
            }
          : item
      )
      store.currentChatMessageData = {
        ...store.currentChatMessageData,
        messages: sortMessagesByDateAndId(messages)
      }
    }
  }

  notifyClientMessageListeners({
    client: clientMessage.client,
    message: normalizedMessage
  })
}
