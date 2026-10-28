// Общее изменяемое состояние STOMP-клиента: единственный экземпляр на приложение,
// им пользуются и соединение, и отправка сообщений, и обработчики подписок.

export const socketState = {
  stompClient: null,
  observerChatRevision: null
}
