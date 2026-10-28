import {useStore} from 'stores/store'
import {socketState} from 'src/util/ws/state'
import {safeParseJson} from 'src/util/ws/json'
import {notifyClientMessageListeners} from 'src/util/ws/listeners'
import {refreshClientsFromSocket} from 'src/util/ws/outgoing'
import {
  getLastMessageSignature,
  normalizeClientFromSocket,
  normalizeIncomingClientMessage,
  normalizeMessagesRevision,
  sortMessagesByDateAndId
} from 'src/util/ws/normalizers'
import {
  clientMessageCallback,
  deletedMessageCallback,
  editedMessageCallback
} from 'src/util/ws/chatMessageHandlers'

export function clientsCallback(clients) {
  const store = useStore()
  const payload = safeParseJson(clients.body, null)

  // Для OBSERVER этот же персональный /user/topic/clients/ используется и для
  // лёгких событий чата. Канал уже используется для загрузки списка клиентов,
  // поэтому не заводим отдельные user-destination подписки для message events.
  if (handleObserverClientEvent(payload)) {
    return
  }

  const parsedClients = Array.isArray(payload) ? payload : []
  const previousClients = Array.isArray(store.clients) ? store.clients : []
  const isObserver = store.currentUser?.authorities?.[0] === 'OBSERVER'
  const invalidatedClientIds = []

  store.clients = Array.isArray(parsedClients)
    ? parsedClients.map(client => {
      const existingClient = previousClients.find(existing => Number(existing.id) === Number(client.id))
      if (isObserver && existingClient) {
        const previousMessagesRevision = normalizeMessagesRevision(existingClient.messagesRevision)
        const nextMessagesRevision = normalizeMessagesRevision(client?.messagesRevision)
        const revisionChanged = Boolean(
          previousMessagesRevision &&
          nextMessagesRevision &&
          previousMessagesRevision !== nextMessagesRevision
        )
        const lastMessageChanged = Boolean(
          client?.lastMessage &&
          getLastMessageSignature(existingClient.lastMessage) !== getLastMessageSignature(client.lastMessage)
        )

        // messagesRevision вычисляется backend по ВСЕЙ истории клиента, поэтому
        // ловит edit/delete старого сообщения, даже если lastMessage не менялся.
        if (revisionChanged || lastMessageChanged) {
          invalidatedClientIds.push(Number(client.id))
        }
      }
      return normalizeClientFromSocket(client, existingClient)
    })
    : []

  // Fallback для OBSERVER: персональный список клиентов приходит через тот же
  // /user/topic механизм, что и первоначальная загрузка. Если отдельное событие
  // сообщения потерялось, изменение lastMessage инициирует дозагрузку последней
  // страницы открытого чата. Это не даёт пропустить пачку сообщений.
  invalidatedClientIds.forEach(clientId => {
    notifyClientMessageListeners({
      client: {id: clientId},
      refreshRequired: true,
      refreshLoadedWindow: true,
      eventType: 'client-history-revision-changed'
    })
  })
}

function observerChatInvalidatedCallback(eventType = 'updated') {
  // clients-updated уже стабильно доставляется OBSERVER в текущем окружении.
  // Специальный payload не содержит clientId или текста сообщения: ChatPage
  // перечитает только уже открытый чат через REST с object-level проверкой.
  notifyClientMessageListeners({
    refreshRequired: true,
    refreshLoadedWindow: true,
    eventType: `${eventType || 'updated'}-invalidated`
  })
}

function handleObserverClientEvent(payload) {
  if (!payload || Array.isArray(payload) || payload.observerClientEvent !== true) {
    return false
  }

  const clientId = Number(payload.clientId)
  if (!clientId || !payload.message) {
    return true
  }

  const syntheticMessage = {
    body: JSON.stringify({
      client: {id: clientId},
      message: payload.message
    })
  }

  switch (payload.eventType) {
    case 'created':
      clientMessageCallback(syntheticMessage)
      break
    case 'edited':
      editedMessageCallback(syntheticMessage)
      break
    case 'deleted':
      deletedMessageCallback(syntheticMessage)
      break
    default:
      break
  }

  return true
}

export function authenticatedUsersCallback(usersOnline) {
  const users = safeParseJson(usersOnline.body, [])
  if (!Array.isArray(users)) {
    useStore().usersOnline = []
    return
  }

  users.forEach(user => {
    if (user.lastname === null) {
      user.lastname = ''
    }
  })
  useStore().usersOnline = users
}

export function currentClientCallback(message) {
  const store = useStore()
  const binaryData = new Uint8Array(message._binaryBody)
  const textDecoder = new TextDecoder('utf-8')
  const decodedString = textDecoder.decode(binaryData)
  const parsedClient = safeParseJson(decodedString, null)

  if (!parsedClient) {
    return
  }

  store.currentClient = normalizeClientFromSocket(parsedClient, store.currentClient)
}

export function supportMessagesCallback(message) {
  const supportMessages = safeParseJson(message.body, [])
  useStore().supportMessages = Array.isArray(supportMessages)
    ? sortMessagesByDateAndId(supportMessages.map(normalizeIncomingClientMessage))
    : []
}

export function clientsUpdatedCallback(message, isObserver) {
  refreshClientsFromSocket()
  if (!isObserver) {
    return
  }
  const payload = safeParseJson(message.body, null)

  // Backward compatibility with the previous one-shot marker.
  if (payload?.observerChatInvalidated === true) {
    observerChatInvalidatedCallback(payload.eventType)
    return
  }

  // Надёжный путь: backend хранит revision истории, а существующий
  // scheduler повторяет её каждые 500 мс в этом уже рабочем topic.
  // Поэтому потеря одного WebSocket frame больше не теряет edit/delete.
  const nextRevision = Number(payload?.observerChatRevision)
  if (!Number.isFinite(nextRevision)) {
    return
  }
  if (socketState.observerChatRevision === null) {
    socketState.observerChatRevision = nextRevision
    if (nextRevision > 0) {
      observerChatInvalidatedCallback(payload?.observerChatEventType || 'updated')
    }
    return
  }
  if (nextRevision === socketState.observerChatRevision) {
    return
  }
  socketState.observerChatRevision = nextRevision
  observerChatInvalidatedCallback(payload?.observerChatEventType || 'updated')
}
