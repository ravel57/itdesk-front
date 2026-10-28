// Чистые функции по сервисам (каталог услуг) заявки.

export function getServiceLabel (service) {
  if (!service) return ''
  const code = String(service.code || '').trim()
  const name = String(service.name || '').trim()
  return code ? `${code} · ${name}` : name
}

// Активные сервисы; если у организации заявки есть назначения — только назначенные ей и действующие
export function filterAvailableServices (storeServices, organization) {
  const services = (storeServices || []).filter(service => service?.active !== false)
  const organizationId = Number(organization?.id || organization || 0)
  if (!organizationId) return services

  const organizationAssignments = services.flatMap(service =>
    (Array.isArray(service.assignments) ? service.assignments : [])
      .filter(assignment => Number(assignment?.organization?.id) === organizationId)
  )
  if (organizationAssignments.length === 0) return services

  return services.filter(service => Array.isArray(service.assignments) && service.assignments.some(assignment =>
    Number(assignment?.organization?.id) === organizationId &&
    assignment?.active !== false &&
    assignment?.effective !== false
  ))
}
