// Опции селекта «Карточка клиента»
export function buildClientOptions(clients, getDisplayName) {
  return (clients || [])
    .filter(client => client?.id)
    .map(client => {
      const name = getDisplayName(client)
      const organizationName = client.organization?.name || ''
      const organizationSuffix = organizationName ? ` — ${organizationName}` : ''
      const email = client.email || ''
      const phone = client.phoneNumber || ''
      return {
        id: client.id,
        label: `${name}${organizationSuffix}`,
        organizationId: client.organization?.id || null,
        searchText: [client.id, name, organizationName, email, phone]
          .filter(value => value !== null && value !== undefined && String(value).trim())
          .join(' ')
          .toLocaleLowerCase('ru-RU')
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label, 'ru'))
}

// Опции селекта «Организация»
export function buildOrganizationOptions(organizations) {
  return (organizations || [])
    .filter(organization => organization?.id)
    .map(organization => ({
      id: organization.id,
      name: organization.name || `Организация ${organization.id}`
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'ru'))
}
