import moment from 'moment'

// Чистые функции форматирования, общие для страницы организаций и её подкомпонентов
// (src/pages/OrganizationsPage.vue, src/components/organization/*).

export function formatDate (value) {
  if (!value) {
    return '—'
  }
  const date = moment(value)
  return date.isValid() ? date.format('DD.MM.YYYY') : '—'
}

export function formatDateTime (value) {
  if (!value) {
    return '—'
  }
  const date = moment(value)
  return date.isValid() ? date.format('DD.MM.YYYY HH:mm') : '—'
}

export function formatMoney (value) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return '—'
  }
  return `${number.toLocaleString('ru-RU')} ₽`
}

export function firstFiniteNumber (values) {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) {
      return number
    }
  }
  return null
}

export function getOrganizationName (organization) {
  return organization?.name || organization?.title || organization?.shortName || 'Без названия'
}

export function getOrganizationValueLabel (value, fallback = 'Не указано') {
  return value !== undefined && value !== null && String(value).trim() !== '' ? value : fallback
}

export function getOrganizationVisitResetDayLabel (organization) {
  const value = organization?.visitResetDay
  if (Number.isFinite(Number(value)) && Number(value) > 0) {
    return `${Number(value)} число каждого месяца`
  }
  return 'Ежемесячно'
}

export function getClientName (client) {
  return [client?.lastname, client?.firstname]
    .filter(Boolean)
    .join(' ') || client?.username || client?.name || 'Без имени'
}

export function getTaskTitle (task) {
  return task?.title || task?.name || `Заявка #${task?.id || ''}`
}

export function getTaskTypeName (task) {
  const type = task?.type
  if (!type) {
    return 'Без типа'
  }
  if (typeof type === 'string') {
    return type
  }
  return type.name || 'Без типа'
}

export function getTaskStatusName (task) {
  return task?.status?.name || 'Без статуса'
}

export function getTaskDeadlineLabel (task) {
  return task?.deadline ? formatDateTime(task.deadline) : '—'
}

export function isTaskClosed (task) {
  if (!task) {
    return false
  }
  if (task.completed === true) {
    return true
  }
  const statusName = (task.status?.name || '').toLowerCase()
  return ['закрыта', 'закрыто', 'выполнена', 'выполнено', 'решена', 'решено'].includes(statusName)
}

export function isVisitTask (task) {
  if (!task) {
    return false
  }
  if (task.visit === true || task.fieldVisit === true || task.onsite === true || task.outboundVisit === true) {
    return true
  }
  const source = [
    task.serviceType,
    task.workFormat,
    task.executionFormat,
    task.type?.name,
    task.type,
    task.title,
    task.name,
    task.description
  ].filter(Boolean).join(' ').toLowerCase()

  return source.includes('выезд') || source.includes('на месте') || source.includes('onsite')
}
