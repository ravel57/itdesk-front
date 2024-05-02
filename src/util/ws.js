import SockJS from 'sockjs-client/dist/sockjs'
import { Stomp } from '@stomp/stompjs'
import { useStore } from 'stores/store'

export function connect () {
  const socket = new SockJS('http://localhost:8080/ws')
  const stompClient = Stomp.over(socket)
  stompClient.debug = function () {}
  stompClient.connect({}, () => {
    stompClient.subscribe('/topic/clients/', message => clientsCallback(message))
  })
}

function clientsCallback (clients) {
  useStore().clients = JSON.parse(clients.body)
  useStore().clients.forEach(it => it.messages.forEach(message => {
    message.date = new Date(message.date)
  }))
}
