import SockJS from 'sockjs-client/dist/sockjs'
import { Stomp } from '@stomp/stompjs'
import { useStore } from 'stores/store'
import moment from 'moment/moment'
import { appConfig } from 'src/config/appConfig'
import { useSystemNotifications } from 'src/composables/useSystemNotifications'
import axios from 'axios'

let stompClient = null

export function connect () {
  if (appConfig.useMocks) return
  const store = useStore()
  if (!store.currentUser || !store.currentUser.username || !Array.isArray(store.currentUser.authorities)) {
    return
  }
  const socket = new SockJS('/ws', null, { transports: ['websocket'] })
  stompClient = Stomp.over(() => {
    return socket
  })
  stompClient.debug = () => {
  }
  stompClient.connect({}, () => {
    if (['ADMIN', 'OPERATOR'].includes(useStore().currentUser.authorities[0])) {
      stompClient.subscribe('/user/topic/clients/', message => clientsCallback(message))
      stompClient.subscribe('/topic/clients-updated/', () => refreshClientsFromSocket())
      refreshClientsFromSocket()
    } else if (['OBSERVER'].includes(useStore().currentUser.authorities[0])) {
      stompClient.subscribe('/topic/clients-for-observer/', message => clientsForObserverCallback(message))
    }
    if (['ADMIN', 'OPERATOR'].includes(useStore().currentUser.authorities[0])) {
      stompClient.subscribe('/topic/authenticated-users/', message => authenticatedUsersCallback(message))
    }
    if (['ADMIN', 'OPERATOR'].includes(useStore().currentUser.authorities[0])) {
      stompClient.subscribe('/topic/mark-read/', message => currentClientCallback(message))
    }
    if (['ADMIN', 'OPERATOR'].includes(useStore().currentUser.authorities[0])) {
      stompClient.subscribe('/topic/support-messages/', message => supportMessagesCallback(message))
    }
    stompClient.subscribe('/topic/client-messages/', message => clientMessageCallback(message))
    stompClient.subscribe('/topic/global-notifications/', message => globalAlertMessageCallback(message))
    stompClient.subscribe('/topic/client-message-edited/', message => editedMessageCallback(message))

    stompClient.subscribe('/topic/user-notification/', message => userNotificationCallback(message))

    stompClient.subscribe('/topic/task-messages/', message => taskMessageCallback(message))

    stompClient.subscribe('/topic/force-logout/', message => forceLogoutCallback(message))
  })
}

function clientsCallback (clients) {
  const store = useStore()
  const parsedClients = safeParseJson(clients.body, [])

  store.clients = Array.isArray(parsedClients)
    ? parsedClients.map(client => normalizeClientFromSocket(
      client,
      store.clients.find(existingClient => Number(existingClient.id) === Number(client.id))
    ))
    : []
}

function normalizeClientFromSocket (client, existingClient = null) {
  const normalizedClient = {
    ...client,
    lastname: client?.lastname === null ? '' : client?.lastname,
    messages: normalizeClientMessages(client, existingClient),
    tasks: Array.isArray(client?.tasks)
      ? client.tasks.map(task => normalizeTaskFromSocket(task))
      : []
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

function normalizeClientMessages (client, existingClient = null) {
  if (Array.isArray(client?.messages)) {
    return client.messages.map(normalizeIncomingClientMessage)
  }

  if (Array.isArray(existingClient?.messages)) {
    return existingClient.messages.map(normalizeIncomingClientMessage)
  }

  return []
}

function normalizeTaskFromSocket (task) {
  const normalizedTask = {
    ...task,
    createdAt: task?.createdAt ? new Date(task.createdAt) : task?.createdAt,
    deadline: task?.deadline ? new Date(task.deadline) : task?.deadline,
    messages: Array.isArray(task?.messages)
      ? task.messages.map(normalizeIncomingClientMessage)
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

function normalizeSlaDuration (duration) {
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

function authenticatedUsersCallback (usersOnline) {
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

export function markRead (client) {
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

export function userOnline (user) {
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

function removeCycles (obj) {
  const seenObjects = new WeakMap()

  function clone (obj) {
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

export function typing (client, user, text) {
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

export function getClientsForObserver (user) {
  if (appConfig.useMocks) {
    return
  }
  if (!stompClient || !stompClient.connected) {
    console.warn('STOMP is not connected, observer skipped')
    return
  }
  if (!user) {
    return
  }
  stompClient.send('/app/observer', {}, user.username)
}

function clientsForObserverCallback (message) {
  const store = useStore()
  const parsedClients = safeParseJson(message.body, [])

  store.clients = Array.isArray(parsedClients)
    ? parsedClients.map(client => normalizeClientFromSocket(
      client,
      store.clients.find(existingClient => Number(existingClient.id) === Number(client.id))
    ))
    : []
}

function currentClientCallback (message) {
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

function clientMessageCallback (message) {
  const store = useStore()
  const clientMessage = safeParseJson(message.body, null)

  if (!clientMessage || !clientMessage.message || !clientMessage.client?.id) {
    return
  }

  const incomingMessage = normalizeIncomingClientMessage(clientMessage.message)
  const client = store.clients.find(c => Number(c.id) === Number(clientMessage.client.id))
  if (!client) {
    refreshClientsFromSocket()
    return
  } else if (!Array.isArray(client.messages)) {
    client.messages = []
  }
  upsertClientMessage(client, incomingMessage)
  if (Number(store.currentClient?.id) === Number(client.id)) {
    upsertClientMessage(store.currentClient, incomingMessage)
  }
  client.lastMessage = incomingMessage
}

function normalizeIncomingClientMessage (message) {
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

function upsertClientMessage (client, message) {
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

  client.messages = [...client.messages]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

function hydrateReplyMessageFromClient (client, message) {
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

function supportMessagesCallback (message) {
  const supportMessages = safeParseJson(message.body, [])
  useStore().supportMessages = Array.isArray(supportMessages)
    ? supportMessages.map(normalizeIncomingClientMessage)
    : []
}

function globalAlertMessageCallback (message) {
  useStore().globalAlertMessage = safeParseJson(message.body, null)
}

function editedMessageCallback (message) {
  const clientMessage = safeParseJson(message.body, null)

  if (!clientMessage || !clientMessage.message || !clientMessage.client?.id) {
    return
  }

  const normalizedMessage = normalizeIncomingClientMessage(clientMessage.message)
  const updateMessage = client => {
    if (!client || !Array.isArray(client.messages)) {
      return
    }

    const localMessage = client.messages.find(m => Number(m.id) === Number(normalizedMessage.id))
    if (localMessage) {
      Object.assign(localMessage, normalizedMessage)
    }
  }
  updateMessage(useStore().clients.find(c => Number(c.id) === Number(clientMessage.client.id)))
  if (Number(useStore().currentClient?.id) === Number(clientMessage.client.id)) {
    updateMessage(useStore().currentClient)
  }
}

function userNotificationCallback (message) {
  const { notify } = useSystemNotifications()
  const parsedMessage = safeParseJson(message.body, null)

  if (!parsedMessage || parsedMessage.userId !== useStore().currentUser.id) {
    return
  }

  switch (parsedMessage.event) {
    case 'MENTIONED_USER':
      notify('ULDesk', {
        body: `Вас упомянули в чате: ${parsedMessage.message}`,
        tag: 'new-task'
      })
      break
    case 'MENTIONED_USER_IN_TASK_CHAT':
      notify('ULDesk', {
        body: `Вас упомянули в заявке: ${parsedMessage.message}`,
        tag: 'new-task'
      })
      break
    case 'NEW_TASK':
      notify('ULDesk', {
        body: 'Новая заявка назначена на Вас',
        tag: 'new-task'
      })
      break
    case 'NEW_CHAT_MESSAGE':
      notify('ULDesk', {
        body: 'Новое сообщение в чате, где Вы назначены исполнителем',
        tag: 'new-task'
      })
      break
    case 'SLA_HALF_TIME_PASSED':
      notify('ULDesk', {
        body: parsedMessage.message || 'SLA прошел больше чем на 50%',
        tag: `sla-half-${parsedMessage.userId}`
      })
      break

    case 'SLA_OVERDUE':
      notify('ULDesk', {
        body: parsedMessage.message || 'SLA нарушен',
        tag: `sla-overdue-${parsedMessage.userId}`
      })
      break

    case 'CHAT_UNANSWERED_TOO_LONG':
      notify('ULDesk', {
        body: parsedMessage.message || 'Есть чат без ответа',
        tag: `chat-unanswered-${parsedMessage.userId}`
      })
      break

    case 'DEADLINE_SOON':
      notify('ULDesk', {
        body: parsedMessage.message || 'Скоро дедлайн по заявке',
        tag: `deadline-soon-${parsedMessage.userId}`
      })
      break

    case 'DEADLINE_OVERDUE':
      notify('ULDesk', {
        body: parsedMessage.message || 'Дедлайн нарушен',
        tag: `deadline-overdue-${parsedMessage.userId}`
      })
      break
  }
}

const taskMessageListeners = new Set()

export function onTaskMessage (listener) {
  taskMessageListeners.add(listener)
  return () => {
    taskMessageListeners.delete(listener)
  }
}

function taskMessageCallback (message) {
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

function addMessageToTaskInClient (client, payload) {
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
  const existingMessage = task.messages.find(m => Number(m.id) === Number(payload.message.id))
  if (existingMessage) {
    Object.assign(existingMessage, payload.message)
  } else {
    task.messages.push(payload.message)
  }
}

function forceLogoutCallback (message) {
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
  store.logoutByForce()
}

function safeParseJson (value, fallback) {
  try {
    return JSON.parse(value)
  } catch (ignoredError) {
    return fallback
  }
}

function refreshClientsFromSocket () {
  if (!stompClient || !stompClient.connected) {
    return
  }
  stompClient.send('/app/clients/refresh', {}, '{}')
}
