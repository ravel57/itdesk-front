// Сортировка и поиск по списку организаций в настройках (чистые функции).

export function sortByOrderNumber(organizations) {
  return [...organizations]
    .sort((a, b) => Number(a.orderNumber || 0) - Number(b.orderNumber || 0))
}

export function filterOrganizationsBySearch(organizations, search) {
  const query = (search || '').trim().toLowerCase()
  if (!query) {
    return organizations
  }
  return organizations.filter(organization => [
    organization.name,
    organization.inn,
    organization.contractNumber,
    organization.tariffName,
    organization.servicePackageName,
    organization.mainAddress,
    organization.managerName,
    organization.managerEmail,
    organization.externalId
  ].filter(Boolean).some(value => String(value).toLowerCase().includes(query)))
}

export function countOrganizationClients(clients, organization) {
  if (!organization?.id || !clients) {
    return 0
  }
  return clients.filter(client => client.organization?.id === organization.id).length
}
