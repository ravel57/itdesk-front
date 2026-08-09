import SockJS from 'sockjs-client/dist/sockjs'
import {Stomp} from '@stomp/stompjs'
import {useStore} from 'stores/store'
import moment from 'moment/moment'
import {appConfig} from 'src/config/appConfig'
import {useSystemNotifications} from 'src/composables/useSystemNotifications'

let stompClient = null
let observerChatRevision = null
let reconnectTimer = null
let reconnectAttempt = 0
let shouldReconnect = false
let isConnecting = false

const RECONNECT_BASE_DELAY_MS = 1000
const RECONNECT_MAX_DELAY_MS = 15000

export function connect() {
  if (appConfig.useMocks) return

  shouldReconnect = true
  openConnection()
}

export function disconnect() {
  shouldReconnect = false
  isConnecting = false
  reconnectAttempt = 0
  observerChatRevision = null
  clearReconnectTimer()

  const client = stompClient
  stompClient = null
  safelyDisconnect(client)
}

export function isSocketConnected() {
  return Boolean(stompClient?.connected)
}

function openConnection() {
  if (!shouldReconnect || isConnecting || stompClient?.connected) {
    return
  }

  const store = useStore()
  if (!canConnectCurrentUser(store.currentUser)) {
    return
  }

  clearReconnectTimer()
  isConnecting = true

  // Важно создавать новый SockJS для каждой попытки. Повторное использование
  // уже закрытого WebSocket не позволяет STOMP восстановить соединение.
  const client = Stomp.over(() => new SockJS('/ws', null, {
    transports: ['websocket']
  }))
  stompClient = client
  client.debug = () => {
  }

  client.connect(
    {},
    () => handleConnected(client),
    error => handleConnectionLost(client, error),
    event => handleConnectionLost(client, event)
  )
}

function handleConnected(client) {
  if (client !== stompClient || !shouldReconnect) {
    safelyDisconnect(client)
    return
  }

  isConnecting = false
  reconnectAttempt = 0
  clearReconnectTimer()

  const store = useStore()
  if (!canConnectCurrentUser(store.currentUser)) {
    disconnect()
    return
  }

  const role = store.currentUser.authorities[0]
  const isSupportUser = ['ADMIN', 'MANAGER', 'OPERATOR'].includes(role)
  const isObserver = role === 'OBSERVER'

  if (isSupportUser || isObserver) {
    if (isObserver) {
      observerChatRevision = null
    }
    client.subscribe('/user/topic/clients/', message => clientsCallback(message))
    client.subscribe('/topic/clients-updated/', message => {
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
      if (observerChatRevision === null) {
        observerChatRevision = nextRevision
        if (nextRevision > 0) {
          observerChatInvalidatedCallback(payload?.observerChatEventType || 'updated')
        }
        return
      }
      if (nextRevision === observerChatRevision) {
        return
      }
      observerChatRevision = nextRevision
      observerChatInvalidatedCallback(payload?.observerChatEventType || 'updated')
    })
  }
  if (isSupportUser) {
    client.subscribe('/topic/authenticated-users/', message => authenticatedUsersCallback(message))
    client.subscribe('/topic/mark-read/', message => currentClientCallback(message))
    client.subscribe('/topic/support-messages/', message => supportMessagesCallback(message))
    client.subscribe('/topic/client-messages/', message => clientMessageCallback(message))
    client.subscribe('/topic/client-message-edited/', message => editedMessageCallback(message))
    client.subscribe('/topic/client-message-deleted/', message => deletedMessageCallback(message))
  }
  client.subscribe('/topic/global-notifications/', message => globalAlertMessageCallback(message))
  client.subscribe('/topic/user-notification/', message => userNotificationCallback(message))
  client.subscribe('/topic/task-messages/', message => taskMessageCallback(message))
  client.subscribe('/topic/task-updated/', message => taskUpdatedCallback(message))
  client.subscribe('/topic/force-logout/', message => forceLogoutCallback(message))

  // Синхронизация сразу после reconnect: периодический heartbeat userOnline
  // сам восстановится, но ждать следующего тика и следующего socket-event не нужно.
  userOnline(store.currentUser)
  refreshClientsFromSocket()
}

function handleConnectionLost(client, error) {
  if (client !== stompClient) {
    return
  }

  stompClient = null
  isConnecting = false
  observerChatRevision = null

  if (error) {
    console.warn('STOMP connection lost, reconnect scheduled')
  }

  scheduleReconnect()
}

function scheduleReconnect() {
  if (!shouldReconnect || reconnectTimer) {
    return
  }

  const store = useStore()
  if (!canConnectCurrentUser(store.currentUser)) {
    return
  }

  const delay = Math.min(
    RECONNECT_BASE_DELAY_MS * (2 ** reconnectAttempt),
    RECONNECT_MAX_DELAY_MS
  )
  reconnectAttempt = Math.min(reconnectAttempt + 1, 4)

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    openConnection()
  }, delay)
}

function clearReconnectTimer() {
  if (!reconnectTimer) {
    return
  }
  window.clearTimeout(reconnectTimer)
  reconnectTimer = null
}

function canConnectCurrentUser(user) {
  return Boolean(
    user &&
    user.username &&
    Array.isArray(user.authorities) &&
    !user.authorities.includes('CLIENT')
  )
}

function safelyDisconnect(client) {
  if (!client) {
    return
  }
  try {
    if (client.connected) {
      client.disconnect(() => {
      })
    }
  } catch (error) {
    console.warn('Не удалось корректно закрыть STOMP-соединение', error)
  }
}

function clientsCallback(clients) {
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

function normalizeMessagesRevision(value) {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value).trim()
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


function getLastMessageSignature(message) {
  if (!message) {
    return ''
  }
  return [
    message.id ?? '',
    message.date ?? '',
    message.editedAt ?? '',
    message.deleted ?? false,
    message.text ?? '',
    message.fileUuid ?? ''
  ].join('|')
}

function normalizeClientFromSocket(client, existingClient = null) {
  const normalizedClient = {
    // Socket payloads are not equivalent: the clients list contains calculated
    // display fields, while mark-read and message events can contain a raw Client.
    // Keep already loaded fields when a partial payload does not include them.
    ...(existingClient || {}),
    ...(client || {}),
    lastname: client?.lastname === null
      ? ''
      : (client?.lastname ?? existingClient?.lastname ?? ''),
    sourceChannel: resolveClientSourceChannel(client, existingClient),
    messages: normalizeClientMessages(client, existingClient),
    tasks: Array.isArray(client?.tasks)
      ? client.tasks.map(task => normalizeTaskFromSocket(task))
      : (Array.isArray(existingClient?.tasks) ? existingClient.tasks : [])
  }

  if (Array.isArray(normalizedClient.user)) {
    normalizedClient.user = normalizedClient.user.map(user => ({
      ...user,
      lastname: user?.lastname === null ? '' : user?.lastname
    }))
  }

  normalizedClient.tasks.forEach(task => {
    task.client = normalizedClient
  })

  return normalizedClient
}

function resolveClientSourceChannel(client, existingClient = null) {
  const directValue = normalizeNonBlankString(client?.sourceChannel)
  if (directValue) {
    return directValue
  }

  const derivedValue = deriveClientSourceChannel(client)
  if (derivedValue) {
    return derivedValue
  }

  const existingValue = normalizeNonBlankString(existingClient?.sourceChannel)
  if (existingValue) {
    return existingValue
  }

  return deriveClientSourceChannel(existingClient)
}

function deriveClientSourceChannel(client) {
  if (!client) {
    return null
  }

  const messageFrom = String(client.messageFrom || '').toUpperCase()

  if (messageFrom === 'TELEGRAM') {
    return normalizeNonBlankString(client.tgBot?.name)
  }
  if (messageFrom === 'WHATSAPP') {
    return normalizeNonBlankString(client.whatsappAccount?.name)
  }
  if (messageFrom === 'EMAIL') {
    return normalizeNonBlankString(client.emailAccountSender?.name)
  }

  return null
}

function normalizeNonBlankString(value) {
  const normalized = String(value ?? '').trim()
  return normalized || null
}

function normalizeClientMessages(client, existingClient = null) {
  // Ответ /app/clients/refresh содержит данные для списка чатов, а не полную
  // историю. На сервере поле messages при этом может сериализоваться как [],
  // и раньше этот пустой массив затирал уже загруженную страницу переписки.
  // Загруженная локальная история является приоритетной; socket-события
  // добавляются в нее отдельно через clientMessageCallback.
  if (Array.isArray(existingClient?.messages) && existingClient.messages.length > 0) {
    return sortMessagesByDateAndId(
      existingClient.messages.map(normalizeIncomingClientMessage)
    )
  }
  if (Array.isArray(client?.messages)) {
    return sortMessagesByDateAndId(
      client.messages.map(normalizeIncomingClientMessage)
    )
  }
  if (Array.isArray(existingClient?.messages)) {
    return []
  }
  return []
}

function normalizeTaskFromSocket(task) {
  const normalizedTask = {
    ...task,
    createdAt: task?.createdAt ? new Date(task.createdAt) : task?.createdAt,
    deadline: task?.deadline ? new Date(task.deadline) : task?.deadline,
    lastActivity: task?.lastActivity ? new Date(task.lastActivity) : task?.lastActivity,
    closedAt: task?.closedAt ? new Date(task.closedAt) : task?.closedAt,
    frozenFrom: task?.frozenFrom ? new Date(task.frozenFrom) : task?.frozenFrom,
    frozenUntil: task?.frozenUntil ? new Date(task.frozenUntil) : task?.frozenUntil,
    messages: Array.isArray(task?.messages)
      ? sortMessagesByDateAndId(task.messages.map(normalizeIncomingClientMessage))
      : []
  }
  if (normalizedTask.sla) {
    normalizedTask.sla = {
      ...normalizedTask.sla,
      startDate: normalizedTask.sla.startDate
        ? moment(new Date(normalizedTask.sla.startDate), 'DD.MM.YYYY HH:mm')
        : normalizedTask.sla.startDate,
      duration: normalizeSlaDuration(normalizedTask.sla.duration)
    }
  }
  return normalizedTask
}

function normalizeSlaDuration(duration) {
  if (!duration) {
    return moment.duration(0)
  }
  if (typeof duration === 'number') {
    return moment.duration(duration, 'seconds')
  }
  if (typeof duration === 'string') {
    const parsed = Number(duration)
    if (Number.isFinite(parsed)) {
      return moment.duration(parsed, 'seconds')
    }
    return moment.duration(duration)
  }
  if (typeof duration === 'object') {
    if (Number.isFinite(duration.seconds)) {
      return moment.duration(duration.seconds, 'seconds')
    }
    if (Number.isFinite(duration._milliseconds)) {
      return moment.duration(duration._milliseconds, 'milliseconds')
    }
  }
  return moment.duration(0)
}

function authenticatedUsersCallback(usersOnline) {
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

export function markRead(client) {
  if (appConfig.useMocks) {
    return
  }
  if (!client) {
    return
  }

  if (!stompClient || !stompClient.connected) {
    console.warn('STOMP is not connected, mark-read skipped')
    return
  }

  const user = useStore().currentUser
  if (!user) {
    return
  }
  if (Array.isArray(user.authorities) && user.authorities.includes('OBSERVER')) {
    return
  }

  const cleanClient = removeCycles(client)
  const cleanUser = removeCycles(user)

  if (cleanClient.tasks) {
    cleanClient.tasks.forEach(task => {
      delete task.client
    })
  }

  stompClient.send('/app/mark-read', {}, JSON.stringify({
    clientId: cleanClient.id,
    userId: cleanUser.id
  }))
}

export function userOnline(user) {
  if (appConfig.useMocks) {
    return
  }
  if (!user) {
    return
  }
  if (!stompClient || !stompClient.connected) {
    console.warn('STOMP is not connected, user-online skipped')
    return
  }
  stompClient.send('/app/user-online', {}, JSON.stringify({
    id: user.id,
    username: user.username
  }))
}

function removeCycles(obj) {
  const seenObjects = new WeakMap()

  function clone(obj) {
    if (obj && typeof obj === 'object') {
      if (seenObjects.has(obj)) {
        return
      }
      seenObjects.set(obj, true)

      if (obj instanceof Date) {
        return new Date(obj.getTime())
      }

      if (Array.isArray(obj)) {
        return obj.map(item => clone(item))
      } else {
        const clonedObj = {}
        for (const key in obj) {
          if (key === '_locale' || key === '_calendar') {
            continue
          }
          clonedObj[key] = clone(obj[key])
        }
        return clonedObj
      }
    }
    return obj
  }

  return clone(obj)
}

export function typing(client, user, text) {
  if (appConfig.useMocks) {
    return
  }
  if (!stompClient || !stompClient.connected) {
    console.warn('STOMP is not connected, typing skipped')
    return
  }
  if (!client || !user) {
    return
  }
  stompClient.send('/app/typing', {}, JSON.stringify({
    clientId: client.id,
    userId: user.id,
    text
  }))
}

function currentClientCallback(message) {
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

function clientMessageCallback(message) {
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

function normalizeIncomingClientMessage(message) {
  if (!message) {
    return message
  }
  return {
    ...message,
    date: message.date instanceof Date
      ? message.date
      : new Date(message.date || Date.now()),
    editedAt: message.editedAt
      ? new Date(message.editedAt)
      : message.editedAt
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

function supportMessagesCallback(message) {
  const supportMessages = safeParseJson(message.body, [])
  useStore().supportMessages = Array.isArray(supportMessages)
    ? sortMessagesByDateAndId(supportMessages.map(normalizeIncomingClientMessage))
    : []
}

function globalAlertMessageCallback(message) {
  useStore().globalAlertMessage = safeParseJson(message.body, null)
}

function editedMessageCallback(message) {
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

function deletedMessageCallback(message) {
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

function userNotificationCallback(message) {
  const {notify} = useSystemNotifications()
  const store = useStore()
  const parsedMessage = safeParseJson(message.body, null)

  if (!parsedMessage || Number(parsedMessage.userId) !== Number(store.currentUser?.id)) {
    return
  }

  store.receiveUserNotification(parsedMessage)

  notify(parsedMessage.title || 'ULDesk', {
    body: parsedMessage.body || getLegacyNotificationBody(parsedMessage),
    tag: `uldesk-${parsedMessage.event || 'notification'}-${parsedMessage.id || Date.now()}`
  })
}

function getLegacyNotificationBody(notification) {
  const message = notification?.message || ''
  switch (notification?.event) {
    case 'MENTIONED_USER':
      return `Вас упомянули в чате: ${message}`
    case 'MENTIONED_USER_IN_TASK_CHAT':
      return `Вас упомянули в заявке: ${message}`
    case 'NEW_TASK':
      return message ? `Новая заявка назначена на Вас: ${message}` : 'Новая заявка назначена на Вас'
    case 'NEW_CHAT_MESSAGE':
      return message
        ? `Новое сообщение в заявке, где Вы назначены исполнителем: ${message}`
        : 'Новое сообщение в заявке, где Вы назначены исполнителем'
    case 'SLA_HALF_TIME_PASSED':
      return message || 'SLA прошел больше чем на 50%'
    case 'SLA_OVERDUE':
      return message || 'SLA нарушен'
    case 'CHAT_UNANSWERED_TOO_LONG':
      return message || 'Есть чат без ответа'
    case 'DEADLINE_SOON':
      return message || 'Скоро дедлайн по заявке'
    case 'DEADLINE_OVERDUE':
      return message || 'Дедлайн нарушен'
    case 'INCIDENT_UPDATE_OVERDUE':
      return message || 'Просрочено обязательное обновление по инциденту'
    default:
      return message || 'Новое уведомление'
  }
}

const taskMessageListeners = new Set()

export function onTaskMessage(listener) {
  taskMessageListeners.add(listener)
  return () => {
    taskMessageListeners.delete(listener)
  }
}

const taskUpdatedListeners = new Set()

export function onTaskUpdated(listener) {
  taskUpdatedListeners.add(listener)

  return () => {
    taskUpdatedListeners.delete(listener)
  }
}

function taskMessageCallback(message) {
  const payload = safeParseJson(message.body, null)
  if (!payload || !payload.taskId || !payload.message) {
    return
  }
  payload.message = normalizeIncomingClientMessage(payload.message)
  addMessageToTaskInClient(useStore().clients.find(c => Number(c.id) === Number(payload.clientId)), payload)
  addMessageToTaskInClient(
    Number(useStore().currentClient?.id) === Number(payload.clientId)
      ? useStore().currentClient
      : null,
    payload
  )
  taskMessageListeners.forEach(listener => {
    listener(payload)
  })
}

function addMessageToTaskInClient(client, payload) {
  if (!client || !Array.isArray(client.tasks)) {
    return
  }
  const task = client.tasks.find(t => Number(t.id) === Number(payload.taskId))
  if (!task) {
    return
  }
  if (!Array.isArray(task.messages)) {
    task.messages = []
  }
  const normalizedMessage = normalizeIncomingClientMessage(payload.message)
  const existingMessage = task.messages.find(m => Number(m.id) === Number(normalizedMessage.id))
  if (existingMessage) {
    Object.assign(existingMessage, normalizedMessage)
  } else {
    task.messages.push(normalizedMessage)
  }
  task.messages = sortMessagesByDateAndId(task.messages.map(normalizeIncomingClientMessage))
}

function forceLogoutCallback(message) {
  const payload = safeParseJson(message.body, null)
  const store = useStore()
  const currentUsername = store.currentUser?.username
  const currentSessionId = store.currentSessionId || localStorage.getItem('currentSessionId')

  if (!payload || !currentUsername || !currentSessionId) {
    return
  }
  if (payload.username !== currentUsername) {
    return
  }
  if (payload.sessionId === currentSessionId) {
    return
  }
  disconnect()
  store.logoutByForce()
}

function safeParseJson(value, fallback) {
  try {
    return JSON.parse(value)
  } catch (ignoredError) {
    return fallback
  }
}

function refreshClientsFromSocket() {
  if (!stompClient || !stompClient.connected) {
    return
  }
  stompClient.send('/app/clients/refresh', {}, '{}')
}

function taskUpdatedCallback(message) {
  const payload = safeParseJson(message.body, null)

  if (!payload || !payload.task || !payload.task.id) {
    return
  }

  const store = useStore()

  const normalizedTask = store.normalizeTaskPageTask
    ? store.normalizeTaskPageTask(payload.task)
    : normalizeTaskFromSocket(payload.task)

  const normalizedPayload = {
    ...payload,
    task: normalizedTask
  }

  if (typeof store.updateLoadedTaskPageTaskFromSocket === 'function') {
    store.updateLoadedTaskPageTaskFromSocket(normalizedTask)
  }

  updateTaskInClient(
    store.clients.find(client => Number(client.id) === Number(payload.clientId)),
    normalizedTask
  )

  if (Number(store.currentClient?.id) === Number(payload.clientId)) {
    updateTaskInClient(store.currentClient, normalizedTask)
  }

  taskUpdatedListeners.forEach(listener => {
    listener(normalizedPayload)
  })
}

function updateTaskInClient(client, task) {
  if (!client || !Array.isArray(client.tasks) || !task?.id) {
    return
  }

  const index = client.tasks.findIndex(item => {
    return Number(item?.id) === Number(task.id)
  })

  if (index === -1) {
    return
  }

  const existingTask = client.tasks[index]

  client.tasks.splice(index, 1, {
    ...existingTask,
    ...normalizeTaskFromSocket({
      ...task,
      client: task.client || existingTask.client || client
    })
  })
}

const clientMessageListeners = new Set()

export function onClientMessage(listener) {
  clientMessageListeners.add(listener)

  return () => {
    clientMessageListeners.delete(listener)
  }
}

function notifyClientMessageListeners(payload) {
  clientMessageListeners.forEach(listener => {
    try {
      listener(payload)
    } catch (e) {
      console.error(e)
    }
  })
}

function sortMessagesByDateAndId(messages) {
  if (!Array.isArray(messages)) {
    return []
  }

  return [...messages].sort((a, b) => {
    const dateDiff = getMessageTime(a) - getMessageTime(b)

    if (dateDiff !== 0) {
      return dateDiff
    }

    return Number(a?.id || 0) - Number(b?.id || 0)
  })
}

function getMessageTime(message) {
  const rawDate = message?.date
  const time = rawDate instanceof Date
    ? rawDate.getTime()
    : new Date(rawDate || 0).getTime()

  return Number.isFinite(time) ? time : 0
}
