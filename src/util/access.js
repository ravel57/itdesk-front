import { useStore } from 'stores/store'

// Роли сотрудников поддержки (иерархия на бэкенде: ADMIN > MANAGER > SENIOR_OPERATOR > OPERATOR)
export const STAFF_ROLES = ['ADMIN', 'MANAGER', 'SENIOR_OPERATOR', 'OPERATOR']

export const ROLE_LABELS = {
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер поддержки',
  SENIOR_OPERATOR: 'Старший оператор',
  OPERATOR: 'Оператор поддержки',
  OBSERVER: 'Менеджер организации',
  CLIENT: 'Клиент'
}

function rolesOf (user) {
  const authorities = Array.isArray(user?.authorities) ? user.authorities : []
  return authorities.map(role => String(role).replace(/^ROLE_/, ''))
}

/**
 * Право текущего пользователя (GET /api/v1/user/permissions). Действия показываются по тем же правам,
 * что проверяет бэкенд, поэтому кнопки не расходятся с ответами 403.
 */
export function can (permission) {
  const permissions = useStore().permissions
  return Array.isArray(permissions) && permissions.includes(permission)
}

export function canAny (...permissions) {
  return permissions.flat().some(permission => can(permission))
}

export function hasRole (role, user = useStore().currentUser) {
  return rolesOf(user).includes(role)
}

/** Сотрудник поддержки любого уровня (не менеджер организации и не клиент). */
export function isStaff (user = useStore().currentUser) {
  return rolesOf(user).some(role => STAFF_ROLES.includes(role))
}

export function roleLabel (role) {
  return ROLE_LABELS[role] || role
}
