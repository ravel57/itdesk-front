import {appConfig} from 'src/config/appConfig'
import {useStore} from 'stores/store'
import {socketState} from 'src/util/ws/state'

export function markRead(client) {
  if (appConfig.useMocks) {
    return
  }
  if (!client) {
    return
  }

  if (!socketState.stompClient || !socketState.stompClient.connected) {
    console.warn('STOMP is not connected, mark-read skipped')
    return
  }

  const user = useStore().currentUser
  if (!user) {
    return
  }
  if (isObserverUser(user)) {
    return
  }

  const cleanClient = removeCycles(client)
  const cleanUser = removeCycles(user)

  if (cleanClient.tasks) {
    cleanClient.tasks.forEach(task => {
      delete task.client
    })
  }

  socketState.stompClient.send('/app/mark-read', {}, JSON.stringify({
    clientId: cleanClient.id,
    userId: cleanUser.id
  }))
}

// OBSERVER is read-only: the backend denies its /app/* sends except
// /app/clients/refresh, and a denied SEND closes the whole STOMP session.
function isObserverUser(user) {
  return Array.isArray(user?.authorities) && user.authorities.includes('OBSERVER')
}

export function userOnline(user) {
  if (appConfig.useMocks) {
    return
  }
  if (!user || isObserverUser(user)) {
    return
  }
  if (!socketState.stompClient || !socketState.stompClient.connected) {
    return
  }
  socketState.stompClient.send('/app/user-online', {}, JSON.stringify({
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
  if (!socketState.stompClient || !socketState.stompClient.connected) {
    console.warn('STOMP is not connected, typing skipped')
    return
  }
  if (!client || !user || isObserverUser(user)) {
    return
  }
  socketState.stompClient.send('/app/typing', {}, JSON.stringify({
    clientId: client.id,
    userId: user.id,
    text
  }))
}

export function refreshClientsFromSocket() {
  if (!socketState.stompClient || !socketState.stompClient.connected) {
    return
  }
  socketState.stompClient.send('/app/clients/refresh', {}, '{}')
}
