import SockJS from 'sockjs-client/dist/sockjs'
import { Stomp } from '@stomp/stompjs'
import { useStore } from 'stores/store'
import moment from 'moment/moment'

let stompClient = null

export function connect () {
  const socket = new SockJS('/ws', null, { transports: ['websocket'] })
  stompClient = Stomp.over(() => { return socket })
  stompClient.debug = () => {}
  stompClient.connect({}, () => {
    if (['ADMIN', 'OPERATOR'].includes(useStore().currentUser.authorities[0])) {
      stompClient.subscribe('/topic/clients/', message => clientsCallback(message))
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
  })
}

function clientsCallback (clients) {
  const parsedClients = JSON.parse(clients.body)
  parsedClients.forEach(client => {
    if (client.lastname === null) {
      client.lastname = ''
    }
    // client.messages.forEach(message => {
    //   message.date = new Date(message.date)
    // })
    try {
      client.messages = useStore().clients.find(c => c.id === client.id).messages
    } catch (ignoreError) {}
    client.tasks.forEach(task => {
      task.createdAt = new Date(task.createdAt)
      if (task.deadline) {
        task.deadline = new Date(task.deadline)
      }
      if (task.sla) {
        task.sla.startDate = moment(new Date(task.sla.startDate), 'DD.MM.YYYY HH:mm')
        task.sla.duration = moment.duration(task.sla.duration * 1000)
      }
      task.messages.forEach(message => {
        message.date = new Date(message.date)
      })
    })
    if (client.user != null) {
      client.user.forEach(user => {
        if (user.lastname === null) {
          user.lastname = ''
        }
      })
    }
    client.tasks.forEach(task => { task.client = client })
  })
  useStore().clients = parsedClients
}

function authenticatedUsersCallback (usersOnline) {
  const users = JSON.parse(usersOnline.body)
  users.forEach(user => {
    if (user.lastname === null) {
      user.lastname = ''
    }
  })
  useStore().usersOnline = users
}

export function markRead (client) {
  const user = useStore().currentUser
  client.tasks.forEach(task => { delete task.client })
  stompClient.send('/app/mark-read', {}, JSON.stringify({ client, user }))
}

export function userOnline (user) {
  stompClient.send('/app/user-online', {}, JSON.stringify(user))
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
  const cleanClient = removeCycles(client)
  const cleanUser = removeCycles(user)
  const message = { client: cleanClient, user: cleanUser, text }
  const messageString = JSON.stringify(message)
  stompClient.send('/app/typing', {}, messageString)
}

export function getClientsForObserver (user) {
// FIXME TODO
  stompClient.send('/app/observer', {}, JSON.stringify(user))
}

function clientsForObserverCallback (message) {
  const parsedClients = JSON.parse(message.body)
  parsedClients.forEach(it => {
    if (it.lastname === null) {
      it.lastname = ''
    }
    // it.messages.forEach(message => {
    //   message.date = new Date(message.date)
    // })
    it.tasks.forEach(task => {
      task.createdAt = new Date(task.createdAt)
      if (task.deadline) {
        task.deadline = new Date(task.deadline)
      }
      if (task.sla) {
        task.sla.startDate = moment(new Date(task.sla.startDate), 'DD.MM.YYYY HH:mm')
        task.sla.duration = moment.duration(task.sla.duration * 1000)
      }
    })
    if (it.user != null) {
      it.user.forEach(user => {
        if (user.lastname === null) {
          user.lastname = ''
        }
      })
    }
  })
  useStore().clients = parsedClients
}

function currentClientCallback (message) {
  const binaryData = new Uint8Array(message._binaryBody)
  const textDecoder = new TextDecoder('utf-8')
  const decodedString = textDecoder.decode(binaryData)
  const paredClient = JSON.parse(decodedString)
  // paredClient.messages.forEach(m => {
  //   m.date = new Date(m.date)
  // })
  paredClient.tasks.forEach(task => {
    task.createdAt = new Date(task.createdAt)
    if (task.deadline) {
      task.deadline = new Date(task.deadline)
    }
    if (task.sla) {
      task.sla.startDate = moment(new Date(task.sla.startDate), 'DD.MM.YYYY HH:mm')
      task.sla.duration = moment.duration(task.sla.duration * 1000)
    }
    task.messages.forEach(message => {
      message.date = new Date(message.date)
    })
  })
  useStore().currentClient = paredClient
}

function clientMessageCallback (message) {
  const clientMessage = JSON.parse(message.body)
  clientMessage.message.date = new Date(clientMessage.message.date)
  if (!(useStore().clients.find(c => c.id === clientMessage.client.id))) {
    useStore().clients.push(clientMessage.client)
  }
  const client = useStore().clients.find(c => c.id === clientMessage.client.id)
  try {
    client.messages.push(clientMessage.message)
  } catch (ignoredError) {}
}

function supportMessagesCallback (message) {
  const supportMessages = JSON.parse(message.body)
  supportMessages.forEach(message => {
    message.date = new Date(message.date)
  })
  useStore().supportMessages = supportMessages
}

function globalAlertMessageCallback (message) {
  useStore().globalAlertMessage = JSON.parse(message.body)
}
