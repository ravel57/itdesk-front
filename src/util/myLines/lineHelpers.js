// Чистые функции для линий поддержки на странице «Мои линии»: связь пользователя с линией,
// подписи роли/OLA/участников, счётчики по заявкам группы и ссылка на чат.

export function getRelatedUsers (line, keys) {
  return keys.flatMap(key => {
    const value = line?.[key]
    if (Array.isArray(value)) return value
    return value ? [value] : []
  }).filter(Boolean)
}

export function getResponsible (line) {
  return line?.responsible || line?.owner || line?.manager || null
}

export function getMembers (line) {
  return getRelatedUsers(line, ['members', 'participants', 'operators'])
}

export function getObservers (line) {
  return getRelatedUsers(line, ['observers', 'watchers'])
}

export function isSameUser (user, userId) {
  return Number(user?.id) === Number(userId)
}

export function isUserRelatedToLine (line, userId) {
  return isSameUser(getResponsible(line), userId) ||
      getMembers(line).some(user => isSameUser(user, userId)) ||
      getObservers(line).some(user => isSameUser(user, userId))
}

// userId — id текущего пользователя (this.store.currentUser?.id)
export function getLineRoleLabel (line, userId) {
  const id = Number(userId)
  if (isSameUser(getResponsible(line), id)) return 'Ответственный'
  if (getMembers(line).some(user => isSameUser(user, id))) return 'Участник'
  if (getObservers(line).some(user => isSameUser(user, id))) return 'Наблюдатель'
  return 'Доступ'
}

export function getLineMemberCount (line) {
  const ids = new Set()
  const responsible = getResponsible(line)
  if (responsible?.id != null) ids.add(Number(responsible.id))
  getMembers(line).forEach(user => {
    if (user?.id != null) ids.add(Number(user.id))
  })
  return ids.size
}

export function formatMinutes (value) {
  const minutes = Math.max(0, Math.round(Number(value) || 0))
  if (minutes >= 1440 && minutes % 1440 === 0) return `${minutes / 1440} д.`
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} ч.`
  return `${minutes} мин.`
}

export function getLineOlaLabel (line) {
  if (line?.olaEnabled === false) return 'OLA не применяется'

  const directMinutes = Number(line?.olaMinutes ?? line?.olaDurationMinutes)
  if (Number.isFinite(directMinutes) && directMinutes > 0) {
    return `OLA: ${formatMinutes(directMinutes)}`
  }

  const value = Number(line?.olaValue ?? line?.olaDuration)
  if (!Number.isFinite(value) || value <= 0) return 'OLA не настроена'

  const unit = String(line?.olaUnit || 'MINUTES').toUpperCase()
  const multiplier = unit === 'DAYS' ? 1440 : unit === 'HOURS' ? 60 : 1
  return `OLA: ${formatMinutes(value * multiplier)}`
}

export function pluralizeLines (value) {
  const number = Math.abs(Number(value) || 0) % 100
  const lastDigit = number % 10
  if (number > 10 && number < 20) return 'линий'
  if (lastDigit === 1) return 'линия'
  if (lastDigit >= 2 && lastDigit <= 4) return 'линии'
  return 'линий'
}

export function countUnassigned (tasks) {
  return tasks.filter(task => !task?.executor?.id).length
}

export function countOlaRisk (tasks) {
  return tasks.filter(task => {
    const info = task?.olaInfo || {}
    const status = String(info.status || task?.olaStatus || '').toUpperCase()
    if (['WARNING', 'BREACHED'].includes(status)) return true
    const deadline = info.deadline || task?.olaDeadline
    if (!deadline || task?.completed) return false
    const deadlineTime = new Date(deadline).getTime()
    return Number.isFinite(deadlineTime) && deadlineTime <= Date.now()
  }).length
}

export function getLineChatLink (clientId) {
  return clientId == null ? '#' : `${window.location.origin}/chats/${clientId}`
}

// Пользовательские линии: активные, связанные с пользователем, отсортированные по orderNumber → level → имени
export function pickUserLines (supportLines, currentUserId) {
  if (!Number.isFinite(currentUserId)) {
    return []
  }

  return (supportLines || [])
    .filter(line => line && line.active !== false && line.id != null)
    .filter(line => isUserRelatedToLine(line, currentUserId))
    .slice()
    .sort((left, right) => {
      const orderDiff = Number(left.orderNumber ?? 9999) - Number(right.orderNumber ?? 9999)
      if (orderDiff !== 0) return orderDiff
      const levelDiff = Number(left.level || 1) - Number(right.level || 1)
      if (levelDiff !== 0) return levelDiff
      return String(left.name || '').localeCompare(String(right.name || ''), 'ru')
    })
}
