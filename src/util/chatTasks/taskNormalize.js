// Нормализация заявок и сообщений, пришедших с сервера (строки дат -> Date, сортировка сообщений).

export function normalizeTaskMessage (message) {
  if (!message) {
    return message
  }
  return {
    ...message,
    date: message.date ? new Date(message.date) : message.date,
    editedAt: message.editedAt ? new Date(message.editedAt) : message.editedAt
  }
}

export function getMessageSortTime (message) {
  const rawDate = message?.date
  const time = rawDate instanceof Date
    ? rawDate.getTime()
    : new Date(rawDate || 0).getTime()
  return Number.isFinite(time) ? time : 0
}

export function sortMessagesByDateAndId (messages) {
  if (!Array.isArray(messages)) {
    return []
  }
  return [...messages].sort((a, b) => {
    const dateDiff = getMessageSortTime(a) - getMessageSortTime(b)
    if (dateDiff !== 0) {
      return dateDiff
    }
    return Number(a?.id || 0) - Number(b?.id || 0)
  })
}

export function uniqueMessagesById (messages) {
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

export function normalizeTaskPageTask (task) {
  if (!task) {
    return task
  }
  const normalizedTask = { ...task }
  if (normalizedTask.createdAt) {
    normalizedTask.createdAt = new Date(normalizedTask.createdAt)
  }
  if (normalizedTask.deadline) {
    normalizedTask.deadline = new Date(normalizedTask.deadline)
  }
  if (normalizedTask.frozenFrom) {
    normalizedTask.frozenFrom = new Date(normalizedTask.frozenFrom)
  }
  if (normalizedTask.frozenUntil) {
    normalizedTask.frozenUntil = new Date(normalizedTask.frozenUntil)
  }
  if (normalizedTask.closedAt) {
    normalizedTask.closedAt = new Date(normalizedTask.closedAt)
  }
  if (normalizedTask.lastActivity) {
    normalizedTask.lastActivity = new Date(normalizedTask.lastActivity)
  }
  if (normalizedTask.sla) {
    normalizedTask.sla = { ...normalizedTask.sla }
  }
  if (!Array.isArray(normalizedTask.messages)) {
    normalizedTask.messages = []
  }
  normalizedTask.messages = sortMessagesByDateAndId(
    normalizedTask.messages.map(normalizeTaskMessage)
  )

  return normalizedTask
}

export function mergePagedTasks (currentTasks = [], newTasks = []) {
  const taskById = new Map()
  currentTasks.forEach(task => {
    if (task?.id !== undefined && task?.id !== null) {
      taskById.set(Number(task.id), task)
    }
  })
  newTasks.forEach(task => {
    if (task?.id !== undefined && task?.id !== null) {
      taskById.set(Number(task.id), task)
    }
  })
  return Array.from(taskById.values())
}
