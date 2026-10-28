// Определение организации заявки по заявке/клиенту и справочнику организаций.
// getOrganizations — функция, возвращающая справочник (вызывается только когда он нужен для поиска).
export function resolveTaskOrganization (task, client, getOrganizations) {
  const taskClient = task?.client || client || {}
  const rawOrganization = taskClient.organization ||
    taskClient.organizationId ||
    taskClient.organizationName ||
    task?.organization ||
    task?.organizationId ||
    task?.organizationName ||
    null

  if (!rawOrganization) {
    return null
  }

  if (typeof rawOrganization === 'object') {
    return rawOrganization
  }

  const rawValue = String(rawOrganization)
  const normalizedRawValue = rawValue.replace(/^id:/i, '')
  const organizations = getOrganizations()
  const organizationList = Array.isArray(organizations) ? organizations : []
  const foundOrganization = organizationList.find(organization => {
    return String(organization.id) === normalizedRawValue ||
      String(organization.name) === rawValue
  })

  if (foundOrganization) {
    return foundOrganization
  }

  if (Number.isFinite(Number(normalizedRawValue))) {
    return {
      id: Number(normalizedRawValue),
      name: rawValue
    }
  }

  return null
}
