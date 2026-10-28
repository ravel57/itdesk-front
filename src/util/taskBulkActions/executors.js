// Чистые функции по исполнителям для модалки массовых действий: имя, поиск, права назначения.

export function getUserName (user) {
  if (!user) {
    return ''
  }
  const lastname = String(user.lastname || '').trim()
  const firstname = String(user.firstname || '').trim()
  const fullName = [lastname, firstname].filter(Boolean).join(' ')
  return fullName || String(user.username || user.email || '').trim()
}

export function normalizeExecutorSearchValue (value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('ё', 'е')
}

export function isAssignableExecutor (user) {
  if (!user) {
    return false
  }

  const authorities = Array.isArray(user.authorities) ? user.authorities : []
  const roles = Array.isArray(user.roles)
    ? user.roles
    : (user.roles ? [user.roles] : [])

  const userRoles = [...authorities, ...roles]
    .filter(Boolean)
    .map(role => String(role).trim().toUpperCase())

  return ['ADMIN', 'MANAGER', 'SENIOR_OPERATOR', 'OPERATOR'].some(role => userRoles.includes(role))
}

export function getExecutorSearchText (user) {
  const firstname = String(user?.firstname || '').trim()
  const lastname = String(user?.lastname || '').trim()
  return normalizeExecutorSearchValue([
    firstname,
    lastname,
    `${firstname} ${lastname}`,
    `${lastname} ${firstname}`,
    user?.username,
    user?.email
  ].filter(Boolean).join(' '))
}

export function isExecutorInSupportLine (executor, supportLine) {
  if (!executor?.id || !supportLine) {
    return false
  }

  const executorId = Number(executor.id)
  if (Number(supportLine.responsible?.id) === executorId) {
    return true
  }

  return (supportLine.members || []).some(member => Number(member?.id) === executorId)
}
