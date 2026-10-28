import { getUserName } from './taskFormat'

// Кого можно назначить исполнителем: пользователи выбранной линии поддержки
// (участники, ответственный и ответ assignable-users) или общий список операторов.

export function isAssignableSupportLineUser (user) {
  if (!user || user.enabled === false || user.isEnabled === false || user.active === false) {
    return false
  }
  const authorities = Array.isArray(user.authorities) ? user.authorities : []
  const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : [])
  return [...authorities, ...roles]
    .map(role => String(role).toUpperCase())
    .some(role => role.includes('ADMIN') || role.includes('MANAGER') || role.includes('OPERATOR'))
}

export function mergeSupportLineUser (baseUser, lineUser) {
  if (!baseUser) return lineUser
  if (!lineUser) return baseUser
  return { ...lineUser, ...baseUser }
}

// users — store.users, supportLines — store.supportLines, supportLineName — выбранная линия в диалоге,
// assignableUsers/assignableUsersLineId — последний ответ /assignable-users и линия, для которой он загружен
export function buildSupportLineUsers ({ users, supportLines, supportLineName, assignableUsers, assignableUsersLineId }) {
  const storeUsers = (users || []).filter(Boolean)
  const selectedLine = (supportLines || []).find(line => line.name === supportLineName)

  if (!selectedLine) {
    return storeUsers
      .filter(isAssignableSupportLineUser)
      .sort((left, right) => getUserName(left).localeCompare(getUserName(right), 'ru'))
  }

  const storeUsersById = new Map(
    storeUsers
      .filter(user => user?.id != null)
      .map(user => [Number(user.id), user])
  )
  const usersById = new Map()
  const addLineUser = lineUser => {
    if (lineUser?.id == null) return
    const id = Number(lineUser.id)
    const fullUser = mergeSupportLineUser(storeUsersById.get(id), lineUser)
    const current = usersById.get(id)
    usersById.set(id, mergeSupportLineUser(fullUser, current))
  }

  ;[...(selectedLine.members || []), selectedLine.responsible].forEach(addLineUser)

  if (Number(assignableUsersLineId) === Number(selectedLine.id)) {
    ;(assignableUsers || []).forEach(addLineUser)
  }

  return Array.from(usersById.values())
    .filter(isAssignableSupportLineUser)
    .sort((left, right) => getUserName(left).localeCompare(getUserName(right), 'ru'))
}
