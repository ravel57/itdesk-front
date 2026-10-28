// Чистые функции по сообщениям заявки: нормализация дат с backend и обновление локального списка.

export function normalizeMessageDateValue (value) {
  if (!value) {
    return value
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'number') {
    // Если backend отдал Unix timestamp в секундах.
    const millis = value < 100000000000 ? value * 1000 : value
    const date = new Date(millis)
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
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function normalizeTaskMessage (message) {
  if (!message) {
    return message
  }
  return {
    ...message,
    date: normalizeMessageDateValue(message.date),
    editedAt: normalizeMessageDateValue(message.editedAt)
  }
}

export function normalizeTaskMessages (messages) {
  if (!Array.isArray(messages)) {
    return []
  }
  return messages.map(message => normalizeTaskMessage(message))
}

// Добавляет сообщение в конец списка либо сливает его с уже существующим по id
export function upsertTaskMessage (messages, normalizedMessage) {
  const messageIndex = messages.findIndex(message => {
    return Number(message.id) === Number(normalizedMessage.id)
  })
  if (messageIndex === -1) {
    return [
      ...messages,
      normalizedMessage
    ]
  }
  return messages.map((message, index) => {
    return index === messageIndex
      ? {
          ...message,
          ...normalizedMessage
        }
      : message
  })
}

// Сливает обновлённое сообщение с существующим по id (новые сообщения не добавляет)
export function mergeTaskMessageById (messages, updatedMessage) {
  return messages.map(message => {
    return Number(message.id) === Number(updatedMessage.id)
      ? {
          ...message,
          ...updatedMessage
        }
      : message
  })
}
