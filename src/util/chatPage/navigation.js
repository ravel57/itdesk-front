// Переход к сообщению при открытии чата из списка: ключ и чтение запомненного
// messageId в sessionStorage.

export function getChatNavigationStorageKey(clientId) {
  return `chat-navigation-message:${Number(clientId)}`
}

export function getStoredNavigationMessageId(clientId) {
  if (typeof sessionStorage === 'undefined') {
    return null
  }

  const id = Number(clientId)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  const key = getChatNavigationStorageKey(id)
  const raw = sessionStorage.getItem(key)
  if (!raw) {
    return null
  }

  try {
    const value = JSON.parse(raw)
    const messageId = Number(value?.messageId)
    const createdAt = Number(value?.createdAt)
    const isExpired = !Number.isFinite(createdAt) || Date.now() - createdAt > 5 * 60 * 1000
    const isWrongClient = Number(value?.clientId) !== id
    if (!Number.isFinite(messageId) || messageId <= 0 || isExpired || isWrongClient) {
      sessionStorage.removeItem(key)
      return null
    }
    return messageId
  } catch (ignoreError) {
    sessionStorage.removeItem(key)
    return null
  }
}
