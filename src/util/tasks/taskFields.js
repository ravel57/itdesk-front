// Чистые геттеры полей заявки для страницы заявок: имена исполнителя/типа/сервиса/линии, чек-лист.
// Метки «Вы» / «Без исполнителя» и текущий пользователь передаются аргументами.

export function isCurrentUserExecutor (task, currentUser) {
  return task?.executor?.id != null &&
    currentUser?.id != null &&
    Number(task.executor.id) === Number(currentUser.id)
}

export function getExecutorGroupName (task, unassignedExecutorLabel) {
  if (!task?.executor) {
    return unassignedExecutorLabel
  }
  return `${task.executor.firstname} ${task.executor.lastname}`
}

export function getTaskTypeName (task) {
  if (!task?.type) {
    return 'Не указан'
  }
  if (typeof task.type === 'string') {
    return task.type.trim() || 'Не указан'
  }
  return task.type.type || 'Не указан'
}

export function getServiceName (task) {
  const service = task?.service
  if (!service) return 'Без сервиса'
  const code = String(service.code || '').trim()
  const name = String(service.name || '').trim()
  return code && name ? `${code} · ${name}` : (name || code || 'Без сервиса')
}

export function getSupportLineName (task) {
  return String(task?.supportLine?.name || 'Без линии').trim() || 'Без линии'
}

export function getSupportLineLevelLabel (task) {
  const level = Number(task?.supportLine?.level)
  return Number.isFinite(level) && level > 0 ? `L${level}` : 'Без уровня'
}

export function getOrganizationName (task) {
  if (task) {
    return task.client.organization
      ? task.client.organization.name
      : ''
  } else {
    return ''
  }
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

export function getChecklistTableValue (task) {
  const total = getChecklistTotalCount(task)

  if (total === 0) {
    return ''
  }

  return `${getChecklistCompletedCount(task)} / ${total}`
}
