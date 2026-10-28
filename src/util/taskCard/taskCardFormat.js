// Чистые функции отображения карточки заявки: даты, имена, причина закрытия, чек-лист, последнее действие.

export function getServiceLabel (service) {
  if (!service) return 'Без сервиса'
  const code = String(service.code || '').trim()
  const name = String(service.name || '').trim()
  return code && name ? `${code} · ${name}` : (name || code || 'Без сервиса')
}

export function getStamp (date) {
  if (!date) {
    return ''
  }
  const parsedDate = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsedDate.getTime())) {
    return ''
  }
  return parsedDate.toLocaleTimeString('ru-RU', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function getName (executor) {
  if (executor) {
    return executor.lastname + ' ' + executor.firstname
  } else {
    return ''
  }
}

export function shortenLine (string, maxLength) {
  if (string.length > maxLength) {
    return string.substring(0, maxLength) + '...'
  } else {
    return string
  }
}

// Есть ли у текущего пользователя (или у кого-либо, если пользователь неизвестен) непрочитанный пинг
export function isHaveInTaskPing (task, currentUserId) {
  if (!task.unreadPingTasksMessages) {
    return false
  }
  if (currentUserId) {
    return !!task.unreadPingTasksMessages[currentUserId]
  }
  return Object.values(task.unreadPingTasksMessages).some(Boolean)
}

export function getCloseReason (task) {
  return String(task?.statusChangeReason || '').trim()
}

export function getShortCloseReason (task) {
  const reason = getCloseReason(task)
  const maxLength = 50
  if (reason.length <= maxLength) {
    return reason
  }
  return `${reason.slice(0, maxLength).trim()}...`
}

export function isCloseReasonVisible (task) {
  return Boolean(task?.completed) && getCloseReason(task).length > 0
}

export function getTaskTypeName (task) {
  return task?.type?.type
}

export function getTaskPriorityId (task) {
  return task?.priority?.id || null
}

export function getChecklistItems (task) {
  if (!Array.isArray(task?.checklist)) {
    return []
  }

  return task.checklist.filter(item => item && item.text !== undefined && item.text !== null)
}

export function getChecklistTotalCount (task) {
  return getChecklistItems(task).length
}

export function getChecklistCompletedCount (task) {
  return getChecklistItems(task)
    .filter(item => Boolean(item.completed))
    .length
}

export function getChecklistProgress (task) {
  const total = getChecklistTotalCount(task)
  if (total === 0) {
    return 0
  }
  return getChecklistCompletedCount(task) / total
}

export function getLastTaskHistoryEvent (task) {
  const history = [
    ...(Array.isArray(task?.history) ? task.history : []),
    ...(Array.isArray(task?.taskHistory) ? task.taskHistory : []),
    ...(Array.isArray(task?.events) ? task.events : [])
  ]
  return history
    .filter(event => event?.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
}

export function getLastTaskHistoryTime (task) {
  const event = getLastTaskHistoryEvent(task)
  if (event?.createdAt) {
    return getStamp(new Date(event.createdAt))
  }
  if (task?.lastActivity) {
    return getStamp(new Date(task.lastActivity))
  }
  return '—'
}
