// Цель навигации в чат: sessionStorage-запись с id сообщения, к которому нужно прокрутить чат при открытии.

export function getChatNavigationStorageKey (clientId) {
  return `chat-navigation-message:${Number(clientId)}`
}

// getMessageId — функция, возвращающая id сообщения, ожидающего ответа (или null: запись сбрасывается)
export function saveChatNavigationTarget (client, getMessageId) {
  if (typeof sessionStorage === 'undefined') {
    return
  }

  const clientId = Number(client?.id)
  if (!Number.isFinite(clientId) || clientId <= 0) {
    return
  }

  const key = getChatNavigationStorageKey(clientId)
  const messageId = getMessageId()
  if (!messageId) {
    sessionStorage.removeItem(key)
    return
  }

  sessionStorage.setItem(key, JSON.stringify({
    clientId,
    messageId,
    createdAt: Date.now()
  }))
}
