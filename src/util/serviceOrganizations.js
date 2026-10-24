// К каким организациям относится сервис. Связь многие-ко-многим хранится в назначениях услуг организациям
// (service.assignments из GET /api/v1/services); у сервиса, пришедшего из заявки или инцидента, назначений
// нет — тогда ищем его по id в загруженном каталоге.

const MAX_INLINE = 2

function findInCatalog (service, catalog) {
  if (!service) return null
  if (Array.isArray(service.assignments)) return service
  const id = service.id
  if (id == null) return service
  return (catalog || []).find(item => item && Number(item.id) === Number(id)) || service
}

/** Названия организаций с действующим подключением сервиса, без повторов. */
export function serviceOrganizationNames (service, catalog = []) {
  const source = findInCatalog(service, catalog)
  const assignments = Array.isArray(source?.assignments) ? source.assignments : []
  const names = assignments
    .filter(assignment => assignment && assignment.active !== false)
    .map(assignment => String(assignment.organization?.name || '').trim())
    .filter(Boolean)
  return [...new Set(names)].sort((left, right) => left.localeCompare(right, 'ru'))
}

/**
 * Короткая подпись организаций: «Орг. 1, Орг. 2 +3». Пустая строка — подключений нет
 * (старый режим каталога: сервис доступен всем организациям) или каталог ещё не загружен.
 */
export function serviceOrganizationsLabel (service, catalog = []) {
  const names = serviceOrganizationNames(service, catalog)
  if (!names.length) return ''
  const shown = names.slice(0, MAX_INLINE).join(', ')
  return names.length > MAX_INLINE ? `${shown} +${names.length - MAX_INLINE}` : shown
}

/** Подпись сервиса для выпадающих списков: «КОД · Название — Организации». */
export function serviceLabelWithOrganizations (service, catalog = []) {
  if (!service) return ''
  const base = [service.code, service.name].filter(Boolean).join(' · ') || `Сервис ${service.id ?? ''}`.trim()
  const organizations = serviceOrganizationsLabel(service, catalog)
  return organizations ? `${base} — ${organizations}` : base
}
