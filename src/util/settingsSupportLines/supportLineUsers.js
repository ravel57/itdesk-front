// Работа с пользователями в настройках линии: допустимые роли, имена, списки выбора.

export function normalizeUserRole(role) {
  return String(role || '')
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, '')
}

export function isTeamUser(user) {
  if (!user || user.enabled === false || user.isEnabled === false || user.active === false) {
    return false
  }
  const authorities = Array.isArray(user.authorities) ? user.authorities : []
  const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : [])
  const allowedRoles = new Set(['ADMIN', 'MANAGER', 'SENIOR_OPERATOR', 'OPERATOR'])
  return [...authorities, ...roles]
    .map(role => normalizeUserRole(role))
    .some(role => allowedRoles.has(role))
}

export function sanitizeLineUserIds(users) {
  return (users || [])
    .filter(user => user?.id && isTeamUser(user))
    .map(user => Number(user.id))
    .filter(id => Number.isFinite(id))
}

export function userName(user) {
  const fullName = `${user?.firstname || ''} ${user?.lastname || ''}`.trim()
  return fullName || user?.username || user?.email || `Пользователь ${user?.id}`
}

export function buildUserOptions(users) {
  return (users || [])
    .filter(user => user?.id && isTeamUser(user))
    .map(user => ({value: user.id, label: userName(user)}))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
}

export function buildObserverOptions(users, form) {
  const teamMemberIds = new Set((form.memberIds || []).map(id => Number(id)))
  if (form.responsibleUserId != null) {
    teamMemberIds.add(Number(form.responsibleUserId))
  }

  return (users || [])
    .filter(user => user?.id && isTeamUser(user))
    .filter(user => !teamMemberIds.has(Number(user.id)))
    .map(user => ({value: user.id, label: userName(user)}))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
}
