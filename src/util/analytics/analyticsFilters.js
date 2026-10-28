import {toIsoParam} from './analyticsPeriod'

// Чистые функции фильтров аналитики: нормализация id, опции селектов, параметры запроса.

export function getDefaultAnalyticsFilters() {
  return {
    typeIds: [],
    priorityIds: [],
    executorIds: [],
    tagIds: [],
    supportLineIds: []
  }
}

export function normalizeSelectedIds(value) {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter(item => item !== undefined && item !== null && item !== '')
    .map(item => Number(item))
    .filter(item => Number.isFinite(item))
}

export function toEntityOptions(items, fallbackLabel) {
  return (items || [])
    .filter(item => item && item.id !== undefined && item.id !== null)
    .map(item => ({
      label: item.name || item.type || item.title || fallbackLabel,
      value: item.id
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

export function getUserDisplayName(user) {
  const firstname = user && user.firstname ? user.firstname : ''
  const lastname = user && user.lastname ? user.lastname : ''
  const fullName = `${firstname} ${lastname}`.trim()
  return fullName || (user && user.username) || 'Без имени'
}

export function toExecutorOptions(users) {
  const options = (users || [])
    .filter(user => user && user.id !== undefined && user.id !== null)
    .map(user => ({
      label: getUserDisplayName(user),
      value: user.id
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
  return [
    {
      label: 'Без исполнителя',
      value: -1
    },
    ...options
  ]
}

export function filterOptionsBySearch(options, search) {
  const needle = String(search || '').trim().toLowerCase()
  if (!needle) {
    return options || []
  }
  return (options || []).filter(option => {
    const label = String(option?.label || '').toLowerCase()
    return label.includes(needle)
  })
}

export function toCsvParam(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined
  }
  return value.join(',')
}

// Параметры GET /api/v1/analytics/summary. filters — уже нормализованный analyticsFilterQuery.
export function buildAnalyticsParams({fromDate, toDate, groupBy, filters}) {
  return {
    from: toIsoParam(fromDate, false),
    to: toIsoParam(toDate, true),
    groupBy,
    typeIds: toCsvParam(filters.typeIds),
    priorityIds: toCsvParam(filters.priorityIds),
    executorIds: toCsvParam(filters.executorIds),
    tagIds: toCsvParam(filters.tagIds),
    supportLineIds: toCsvParam(filters.supportLineIds),
  }
}
