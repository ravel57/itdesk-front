// Чистые функции для работы с сообщениями и заявками чата: нормализация дат,
// дедупликация, сортировка, связанные задачи и расчёт «первого неотвеченного».

export function normalizeDateValue(value) {
  if (!value) {
    return value
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'number') {
    const millis = value < 100000000000 ? value * 1000 : value
    const date = new Date(millis)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }
    const numericValue = Number(trimmed)
    if (Number.isFinite(numericValue)) {
      const millis = numericValue < 100000000000 ? numericValue * 1000 : numericValue
      const date = new Date(millis)
      return Number.isNaN(date.getTime()) ? null : date
    }
    const date = new Date(trimmed)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (Array.isArray(value)) {
    const [
      year,
      month,
      day,
      hour = 0,
      minute = 0,
      second = 0,
      nano = 0
    ] = value
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      Math.floor(Number(nano) / 1000000)
    )
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

export function uniqueMessagesById(messages) {
  const map = new Map()
  ;(messages || []).forEach(message => {
    if (!message) {
      return
    }
    if (message.id === undefined || message.id === null) {
      map.set(Symbol('message-without-id'), message)
      return
    }
    map.set(Number(message.id), message)
  })
  return [...map.values()]
}

export function sortMessagesByDate(messages) {
  return [...(messages || [])].sort((left, right) => {
    const leftTime = new Date(left?.date || 0).getTime()
    const rightTime = new Date(right?.date || 0).getTime()
    if (leftTime === rightTime) {
      return Number(left?.id || 0) - Number(right?.id || 0)
    }
    return leftTime - rightTime
  })
}

export function uniqueTasksById(tasks) {
  const map = new Map()
  ;(tasks || []).forEach(task => {
    if (!task?.id) {
      return
    }
    map.set(Number(task.id), task)
  })
  return [...map.values()]
}

export function getLinkedTaskIdFromMessage(message) {
  if (!message) {
    return null
  }

  const linkedTaskId = message.linkedTaskId

  if (linkedTaskId && typeof linkedTaskId === 'object') {
    const id = Number(linkedTaskId.id || linkedTaskId.taskId || linkedTaskId.value)
    return Number.isFinite(id) && id > 0 ? id : null
  }

  const id = Number(linkedTaskId)
  return Number.isFinite(id) && id > 0 ? id : null
}

export function normalizeClientMessage(message) {
  if (!message) {
    return message
  }
  return {
    ...message,
    date: normalizeDateValue(message.date) || new Date(),
    editedAt: normalizeDateValue(message.editedAt)
  }
}

export function calculateFirstUnansweredMessage(client) {
  const messages = [...(client.messages || [])]
    .filter(message => message?.date && message.deleted !== true)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (messages.length === 0) {
    return null
  }
  let lastOperatorAnswerMs = 0
  messages.forEach(message => {
    if (message.isSent === true && message.isComment !== true) {
      const dateMs = new Date(message.date).getTime()
      if (Number.isFinite(dateMs)) {
        lastOperatorAnswerMs = Math.max(lastOperatorAnswerMs, dateMs)
      }
    }
  })
  const unansweredIncomingMessages = messages.filter(message => {
    const dateMs = new Date(message.date).getTime()
    return message.isSent === false &&
      message.isComment !== true &&
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
  return lastMarkedMessage
}

export function calculateFirstUnansweredMessageDate(client) {
  return calculateFirstUnansweredMessage(client)?.date || null
}

export function calculateFirstUnansweredMessageId(client) {
  const messageId = Number(calculateFirstUnansweredMessage(client)?.id)
  return Number.isFinite(messageId) && messageId > 0 ? messageId : null
}
