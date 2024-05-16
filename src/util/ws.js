import SockJS from 'sockjs-client/dist/sockjs'
import { Stomp } from '@stomp/stompjs'
import { useStore } from 'stores/store'

let stompClient = null

export function connect () {
  const socket = new SockJS('/ws') /* http://localhost:8080 */
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
    it.messages.forEach(message => {
      message.date = new Date(message.date)
    })
    it.tasks.forEach(task => {
      task.createdAt = new Date(task.createdAt)
    })
  })
  useStore().clients = parsedClients
}

function authenticatedUsersCallback (usersOnline) {
  useStore().usersOnline = JSON.parse(usersOnline.body)
}

export function markRead (clientId) {
  stompClient.send('/app/mark-read', {}, clientId)
}

export function typing (client, user) {
  stompClient.send('/app/typing', {}, JSON.stringify({ client, user }))
}
