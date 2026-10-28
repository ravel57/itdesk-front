// Чистые функции по сообщениям клиента в списке чатов: входящие/исходящие, ожидание ответа, последнее сообщение.

export function getClientMessages (client) {
  return client?.messages || client?.clientMessages || []
}

export function isIncomingMessage (message) {
  return message &&
    message.isSent === false &&
    message.isComment !== true &&
    message.deleted !== true
}

export function isOutgoingOperatorMessage (message) {
  return message &&
    message.isSent === true &&
    message.isComment !== true &&
    message.deleted !== true
}

export function getAnswerRequiredMessageId (client) {
  const explicitId = Number(client?.firstUnansweredMessageId)
  if (Number.isFinite(explicitId) && explicitId > 0) {
    return explicitId
  }

  const messages = [...getClientMessages(client)]
    .filter(message => message?.date && message.deleted !== true)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (messages.length === 0) {
    return null
  }

  let lastOperatorAnswerMs = 0
  messages.forEach(message => {
    if (isOutgoingOperatorMessage(message)) {
      const dateMs = new Date(message.date).getTime()
      if (Number.isFinite(dateMs)) {
        lastOperatorAnswerMs = Math.max(lastOperatorAnswerMs, dateMs)
      }
    }
  })

  const selectedMessage = [...messages]
    .filter(message => {
      const dateMs = new Date(message.date).getTime()
      return isIncomingMessage(message) &&
        Number.isFinite(dateMs) &&
        dateMs > lastOperatorAnswerMs
    })
    .reverse()
    .find(message =>
      message.answerRequired === 'ANSWER_REQUIRED' ||
      message.answerRequired === 'ANSWER_NOT_REQUIRED'
    )

  if (!selectedMessage || selectedMessage.answerRequired !== 'ANSWER_REQUIRED') {
    return null
  }

  const messageId = Number(selectedMessage.id)
  return Number.isFinite(messageId) && messageId > 0 ? messageId : null
}

export function getLastAnswerRequiredUnansweredMessageDate (client) {
  const messages = [...getClientMessages(client)]
    .filter(message => message?.date && message.deleted !== true)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (messages.length === 0) {
    return client.firstUnansweredMessageDate || null
  }
  let lastOperatorAnswerMs = 0
  messages.forEach(message => {
    if (isOutgoingOperatorMessage(message)) {
      const dateMs = new Date(message.date).getTime()
      if (Number.isFinite(dateMs)) {
        lastOperatorAnswerMs = Math.max(lastOperatorAnswerMs, dateMs)
      }
    }
  })
  const unansweredIncomingMessages = messages.filter(message => {
    const dateMs = new Date(message.date).getTime()
    return isIncomingMessage(message) &&
      Number.isFinite(dateMs) &&
      dateMs > lastOperatorAnswerMs
  })
  if (unansweredIncomingMessages.length === 0) {
    return null
  }
  const lastMarkedMessage = [...unansweredIncomingMessages]
    .reverse()
    .find(message =>
      message.answerRequired === 'ANSWER_REQUIRED' ||
      message.answerRequired === 'ANSWER_NOT_REQUIRED'
    )
  if (!lastMarkedMessage || lastMarkedMessage.answerRequired !== 'ANSWER_REQUIRED') {
    return null
  }
  return lastMarkedMessage.date
}

export function getLastMessageObject (client, isObserver) {
  if (!client) {
    return null
  }
  if (client.lastMessage && !(isObserver && client.lastMessage.deleted === true)) {
    return client.lastMessage
  }
  const messages = [...getClientMessages(client)]
    .filter(message => message && message.deleted !== true && message.isComment !== true)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
  return messages[0] || null
}

// Текст превью последнего сообщения (текст или тип вложения)
export function getLastMessagePreviewText (lastMessage) {
  if (!lastMessage) {
    return ''
  }
  if (lastMessage.text) {
    return lastMessage.text
  }
  if (lastMessage.fileType === null) {
    return 'Неизвестный формат файла'
  } else if (lastMessage.fileType.startsWith('video/')) {
    return 'Видео'
  } else if (lastMessage.fileType.startsWith('image/')) {
    return 'Изображение'
  } else if (lastMessage.fileType.startsWith('audio/')) {
    return 'Аудио'
  }
  return 'Файл'
}
