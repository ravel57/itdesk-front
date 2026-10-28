import { getOrganizationName } from 'src/util/organizationHelpers'

// Идентификация организаций и нормализация данных справочника (чистые функции).

export function getOrganizationKey (organization) {
  if (!organization) {
    return ''
  }
  if (organization.id !== undefined && organization.id !== null) {
    return `id:${organization.id}`
  }
  return `name:${getOrganizationName(organization).toLowerCase()}`
}

export function isSameOrganization (left, right) {
  if (!left || !right) {
    return false
  }
  if (left.id !== undefined && right.id !== undefined && left.id !== null && right.id !== null) {
    return Number(left.id) === Number(right.id)
  }
  return getOrganizationName(left).toLowerCase() === getOrganizationName(right).toLowerCase()
}

export function getTaskOrganization (task) {
  return task?.client?.organization || task?.organization || null
}

// Объединяет организации из справочника и организации, найденные у клиентов (без дублей по ключу).
export function normalizeOrganizations (organizations, clients) {
  const map = new Map()

  organizations.forEach(organization => {
    if (!organization) {
      return
    }
    map.set(getOrganizationKey(organization), organization)
  })

  clients.forEach(client => {
    const organization = client?.organization
    if (!organization) {
      return
    }
    const key = getOrganizationKey(organization)
    if (!map.has(key)) {
      map.set(key, organization)
    }
  })

  return [...map.values()].filter(organization => getOrganizationName(organization))
}

export function uniqueTasksById (tasks) {
  const map = new Map()
  ;(tasks || []).forEach(task => {
    if (!task || task.id === undefined || task.id === null) {
      return
    }
    map.set(Number(task.id), task)
  })
  return [...map.values()]
}
