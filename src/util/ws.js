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
    stompClient.subscribe('/topic/clients/', message => clientsCallback(message))
    stompClient.subscribe('/topic/authenticated-users/', message => authenticatedUsersCallback(message))
    stompClient.subscribe('/topic/mark-read/', message => console.log(message))
  })
}

function clientsCallback (clients) {
  const parsedClients = JSON.parse(clients.body)
  parsedClients.forEach(it => {
    if (it.lastname === null) {
      it.lastname = ''
    }
    it.messages.forEach(message => {
      message.date = new Date(message.date)
    })
    it.tasks.forEach(task => {
      task.createdAt = new Date(task.createdAt)
      if (task.deadline) {
        task.deadline = new Date(task.deadline)
      }
      if (task.sla) {
        task.sla.startDate = moment(new Date(task.sla.startDate), 'DD.MM.YYYY HH:mm')
        task.sla.duration = moment.duration(task.sla.duration)
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
  stompClient.send('/app/mark-read', {}, JSON.stringify({ client, user }))
}

export function userOnline (user) {
  stompClient.send('/app/user-online', {}, JSON.stringify(user))
}

export function typing (client, user, text) {
  stompClient.send('/app/typing', {}, JSON.stringify({ client, user, text }))
}
