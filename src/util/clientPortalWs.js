import SockJS from 'sockjs-client/dist/sockjs'
import {Stomp} from '@stomp/stompjs'
import {appConfig} from 'src/config/appConfig'

const RECONNECT_DELAY_MS = 3000
const MESSAGE_DESTINATION = '/user/queue/client-portal-messages'
const MESSAGE_DELETED_DESTINATION = '/user/queue/client-portal-message-deleted'

let stompClient = null
let reconnectTimer = null
let shouldReconnect = false
let isConnecting = false
let callbacks = {}

export function connectClientPortalSocket(options = {}) {
  callbacks = {
    onMessage: options.onMessage,
    onMessageDeleted: options.onMessageDeleted,
    onConnected: options.onConnected,
    onDisconnected: options.onDisconnected,
    onError: options.onError
  }
  shouldReconnect = true

  if (appConfig.useMocks || isConnecting || stompClient?.connected) {
    return
  }

  openConnection()
}

export function disconnectClientPortalSocket() {
  shouldReconnect = false
  isConnecting = false
  clearReconnectTimer()

  const client = stompClient
  stompClient = null
  callbacks = {}

  if (!client) {
    return
  }

  try {
    if (client.connected) {
      client.disconnect(() => {
      })
    }
  } catch (error) {
    console.warn('Не удалось корректно отключить сокет клиентского портала', error)
  }
}

export function isClientPortalSocketConnected() {
  return Boolean(stompClient?.connected)
}

function openConnection() {
  if (!shouldReconnect || isConnecting || stompClient?.connected) {
    return
  }

  clearReconnectTimer()
  isConnecting = true

  const socket = new SockJS('/client-portal-ws', null, {
    transports: ['websocket']
  })
  const client = Stomp.over(() => socket)
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
  client.subscribe(MESSAGE_DESTINATION, frame => {
    const payload = parseMessage(frame?.body)
    if (payload !== null && typeof callbacks.onMessage === 'function') {
      callbacks.onMessage(payload)
    }
  })

  client.subscribe(MESSAGE_DELETED_DESTINATION, frame => {
    const messageId = parseMessage(frame?.body)
    if (messageId !== null && typeof callbacks.onMessageDeleted === 'function') {
      callbacks.onMessageDeleted(messageId)
    }
  })

  if (typeof callbacks.onConnected === 'function') {
    callbacks.onConnected()
  }
}

function handleConnectionLost(client, error) {
  if (client !== stompClient) {
    return
  }

  stompClient = null
  isConnecting = false

  if (typeof callbacks.onDisconnected === 'function') {
    callbacks.onDisconnected()
  }
  if (error && typeof callbacks.onError === 'function') {
    callbacks.onError(error)
  }

  scheduleReconnect()
}

function scheduleReconnect() {
  if (!shouldReconnect || reconnectTimer) {
    return
  }

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null
    openConnection()
  }, RECONNECT_DELAY_MS)
}

function clearReconnectTimer() {
  if (!reconnectTimer) {
    return
  }

  window.clearTimeout(reconnectTimer)
  reconnectTimer = null
}

function parseMessage(body) {
  if (body === null || body === undefined || body === '') {
    return null
  }

  if (typeof body !== 'string') {
    return body
  }

  try {
    return JSON.parse(body)
  } catch (error) {
    console.error('Сокет клиентского портала вернул некорректный JSON', error)
    return null
  }
}

function safelyDisconnect(client) {
  try {
    if (client?.connected) {
      client.disconnect(() => {
      })
    }
  } catch (error) {
    console.warn('Не удалось закрыть устаревшее подключение клиентского портала', error)
  }
}
