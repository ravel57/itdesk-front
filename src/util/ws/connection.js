import SockJS from 'sockjs-client/dist/sockjs'
import {Stomp} from '@stomp/stompjs'
import {useStore} from 'stores/store'
import {appConfig} from 'src/config/appConfig'
import {getStompCsrfHeaders} from 'boot/axios'
import {socketState} from 'src/util/ws/state'
import {safeParseJson} from 'src/util/ws/json'
import {notifyTaskOpened} from 'src/util/ws/listeners'
import {refreshClientsFromSocket, userOnline} from 'src/util/ws/outgoing'
import {
  authenticatedUsersCallback,
  clientsCallback,
  clientsUpdatedCallback,
  currentClientCallback,
  supportMessagesCallback
} from 'src/util/ws/clientListHandlers'
import {
  clientMessageCallback,
  deletedMessageCallback,
  editedMessageCallback
} from 'src/util/ws/chatMessageHandlers'
import {globalAlertMessageCallback, userNotificationCallback} from 'src/util/ws/notificationHandlers'
import {incidentUpdatedCallback, taskMessageCallback, taskUpdatedCallback} from 'src/util/ws/taskHandlers'

let reconnectTimer = null
let reconnectAttempt = 0
let shouldReconnect = false
let isConnecting = false
let connectionGeneration = 0

const RECONNECT_BASE_DELAY_MS = 1000
const RECONNECT_MAX_DELAY_MS = 15000

export function connect() {
  if (appConfig.useMocks) return

  shouldReconnect = true
  openConnection()
}

export function disconnect() {
  connectionGeneration += 1
  shouldReconnect = false
  isConnecting = false
  reconnectAttempt = 0
  socketState.observerChatRevision = null
  clearReconnectTimer()

  const client = socketState.stompClient
  socketState.stompClient = null
  safelyDisconnect(client)
}

export function isSocketConnected() {
  return Boolean(socketState.stompClient?.connected)
}

async function openConnection() {
  if (!shouldReconnect || isConnecting || socketState.stompClient?.connected) {
    return
  }

  const store = useStore()
  if (!canConnectCurrentUser(store.currentUser)) {
    return
  }

  clearReconnectTimer()
  isConnecting = true
  const generation = ++connectionGeneration

  let connectHeaders
  try {
    // Spring Security WebSocket CSRF expects the request-attribute token
    // (masked/XOR token), not the raw XSRF-TOKEN cookie value.
    connectHeaders = await getStompCsrfHeaders()
  } catch (error) {
    if (generation !== connectionGeneration) {
      return
    }
    isConnecting = false
    console.warn('Failed to load CSRF token for STOMP, reconnect scheduled', error)
    scheduleReconnect()
    return
  }

  // disconnect() or a newer connection attempt may have happened while /csrf was loading.
  if (generation !== connectionGeneration || !shouldReconnect) {
    return
  }

  const currentStore = useStore()
  if (!canConnectCurrentUser(currentStore.currentUser)) {
    disconnect()
    return
  }

  // Important: create a fresh SockJS instance for each attempt.
  const client = Stomp.over(() => new SockJS('/ws', null, {
    transports: ['websocket']
  }))
  socketState.stompClient = client
  client.debug = () => {
  }

  client.connect(
    connectHeaders,
    () => handleConnected(client),
    error => handleConnectionLost(client, error),
    event => handleConnectionLost(client, event)
  )
}

function handleConnected(client) {
  if (client !== socketState.stompClient || !shouldReconnect) {
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
  const isSupportUser = ['ADMIN', 'MANAGER', 'SENIOR_OPERATOR', 'OPERATOR'].includes(role)
  const isObserver = role === 'OBSERVER'

  if (isSupportUser || isObserver) {
    if (isObserver) {
      socketState.observerChatRevision = null
    }
    client.subscribe('/user/topic/clients/', message => clientsCallback(message))
    client.subscribe('/topic/clients-updated/', message => clientsUpdatedCallback(message, isObserver))
  }
  if (isSupportUser) {
    client.subscribe('/topic/authenticated-users/', message => authenticatedUsersCallback(message))
    client.subscribe('/user/topic/mark-read/', message => currentClientCallback(message))
    client.subscribe('/topic/support-messages/', message => supportMessagesCallback(message))
    client.subscribe('/user/topic/client-messages/', message => clientMessageCallback(message))
    client.subscribe('/user/topic/client-message-edited/', message => editedMessageCallback(message))
    client.subscribe('/user/topic/client-message-deleted/', message => deletedMessageCallback(message))
  }
  client.subscribe('/topic/global-notifications/', message => globalAlertMessageCallback(message))
  client.subscribe('/user/topic/user-notification/', message => userNotificationCallback(message))
  client.subscribe('/user/topic/task-messages/', message => taskMessageCallback(message))
  client.subscribe('/user/topic/task-updated/', message => taskUpdatedCallback(message))
  client.subscribe('/user/topic/task-opened/', message => notifyTaskOpened(safeParseJson(message.body, null)))
  client.subscribe('/user/topic/incidents-updated/', message => incidentUpdatedCallback(message))
  client.subscribe('/user/topic/force-logout/', message => forceLogoutCallback(message))

  // Синхронизация сразу после reconnect: периодический heartbeat userOnline
  // сам восстановится, но ждать следующего тика и следующего socket-event не нужно.
  userOnline(store.currentUser)
  refreshClientsFromSocket()
}

function handleConnectionLost(client, error) {
  if (client !== socketState.stompClient) {
    return
  }

  socketState.stompClient = null
  isConnecting = false
  socketState.observerChatRevision = null

  if (error) {
    console.warn('STOMP connection lost, reconnect scheduled', error)
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
