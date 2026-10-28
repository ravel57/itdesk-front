// Общие текстовые хелперы чата (поиск по сообщениям, лента сообщений, панель ввода).

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Экранирует текст и подсвечивает в нём фрагменты, совпадающие с поисковым запросом.
export function highlightSearchText(text, search) {
  const value = String(text ?? '')
  const query = String(search || '').trim()
  if (!query) {
    return escapeHtml(value)
  }
  const searchRegex = new RegExp(escapeRegExp(query), 'gi')
  let result = ''
  let lastIndex = 0

  value.replace(searchRegex, (match, offset) => {
    result += escapeHtml(value.slice(lastIndex, offset))
    result += `<mark class="chat-search-highlight">${escapeHtml(match)}</mark>`
    lastIndex = offset + match.length
    return match
  })

  result += escapeHtml(value.slice(lastIndex))
  return result
}

// Превращает ссылки в тексте сообщения в <a>, остальной текст экранирует и подсвечивает по поиску.
export function findLinks(message, search) {
  const urlRegex = /https?:\/\/\S+/g
  const decodedText = document.createElement('textarea')
  decodedText.innerHTML = String(message ?? '')
  const text = decodedText.value
  let result = ''
  let lastIndex = 0

  text.replace(urlRegex, (url, offset) => {
    result += highlightSearchText(text.slice(lastIndex, offset), search)
    const safeUrl = escapeHtml(url)
    result += `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${highlightSearchText(url, search)}</a>`
    lastIndex = offset + url.length
    return url
  })

  result += highlightSearchText(text.slice(lastIndex), search)
  return result
}

export function getMessageSenderName(message) {
  if (message?.user) {
    const name = `${message.user.firstname || ''} ${message.user.lastname || ''}`.trim()
    if (name) {
      return name
    }
  }
  return String(message?.senderName || '').trim()
}

export function shortenLine(string) {
  if (string.length > 25) {
    return string.substring(0, 25) + '...'
  } else {
    return string
  }
}

export function getMessageId(message) {
  const id = Number(message?.id)
  return Number.isFinite(id) && id > 0 ? id : null
}
