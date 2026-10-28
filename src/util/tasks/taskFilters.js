import moment from 'moment/moment'

// Чистые функции фильтров страницы заявок: каталог типов фильтров, нормализация
// для сервера / сохранения, диапазоны дат, гидрация цепочки фильтров.

// Типы фильтров. Фабрика, т.к. объекты кладутся в data компонента и не должны шариться между экземплярами.
export function createFilterTypes () {
  return [
    {label: 'Исполнитель', slug: 'executor'},
    {label: 'Линия поддержки', slug: 'supportLine'},
    {label: 'Уровень линии', slug: 'supportLineLevel'},
    {label: 'Тег', slug: 'tag'},
    {label: 'Организация', slug: 'organization'},
    {label: 'Приоритет', slug: 'priority'},
    {label: 'Статус', slug: 'status'},
    {label: 'Клиент', slug: 'client'},
    {label: 'Тип заявки', slug: 'type'},
    {label: 'Сервис', slug: 'service'},
    {label: 'Дата создания', slug: 'createdAt'},
    {label: 'Последняя активность', slug: 'lastActivity'},
    {label: 'Дедлайн', slug: 'deadline', isBeforeDeadline: false},
  ]
}

export function isValidFilterJoinOperator (value) {
  return ['AND', 'OR'].includes(value)
}

export function normalizeSavedFilterScope (scope) {
  return scope === 'PERSONAL' ? 'PERSONAL' : 'GLOBAL'
}

export function createEmptyDateRange () {
  return {
    from: '',
    to: ''
  }
}

export function isDateRangeFilter (filter) {
  return ['createdAt', 'lastActivity'].includes(filter?.slug)
}

export function normalizeDateRangeSelectedOptions (value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyDateRange()
  }
  return {
    from: value.from || '',
    to: value.to || ''
  }
}

export function cloneFilterSelectedOptions (value) {
  if (Array.isArray(value)) {
    return [...value]
  }
  if (value && typeof value === 'object') {
    return {...value}
  }
  return value
}

export function getFilterSelectedOptionsText (filter) {
  if (!filter) {
    return ''
  }
  if (isDateRangeFilter(filter)) {
    const range = normalizeDateRangeSelectedOptions(filter.selectedOptions)
    const parts = []
    if (range.from) {
      parts.push(`от ${range.from}`)
    }
    if (range.to) {
      parts.push(`до ${range.to}`)
    }
    return parts.length > 0 ? parts.join(', ') : 'не выбрано'
  }

  if (Array.isArray(filter.selectedOptions)) {
    return filter.selectedOptions.join(', ')
  }
  return filter.selectedOptions || ''
}

export function parseFilterDateStart (value) {
  const date = moment(String(value || ''), 'DD.MM.YYYY', true)
  return date.isValid() ? date.startOf('day').toDate() : null
}

export function parseFilterDateEnd (value) {
  const date = moment(String(value || ''), 'DD.MM.YYYY', true)
  return date.isValid() ? date.endOf('day').toDate() : null
}

export function isTaskDateInRange (taskDateValue, selectedOptions) {
  if (!taskDateValue) {
    return false
  }
  const range = normalizeDateRangeSelectedOptions(selectedOptions)
  const taskDate = new Date(taskDateValue)
  if (Number.isNaN(taskDate.getTime())) {
    return false
  }
  const from = parseFilterDateStart(range.from)
  const to = parseFilterDateEnd(range.to)
  if (from && taskDate < from) {
    return false
  }
  return !(to && taskDate > to);
}

// Формат для POST /api/v1/filter и localStorage
export function normalizeFilterForSave (filter) {
  const normalizedFilter = {
    label: filter.label,
    selectedOptions: cloneFilterSelectedOptions(filter.selectedOptions)
  }
  if (filter.isBeforeDeadline !== undefined) {
    normalizedFilter.isBeforeDeadline = filter.isBeforeDeadline
  }
  return normalizedFilter
}

export function normalizeFiltersForSave (filters) {
  return filters.map(filter => normalizeFilterForSave(filter))
}

// Формат для запроса страницы заявок на сервер
export function normalizeFiltersForServer (filters, filterTypes) {
  return filters.map(filter => ({
    label: filter.label,
    slug: filter.slug || filterTypes.find(type => type.label === filter.label)?.slug || '',
    selectedOptions: cloneFilterSelectedOptions(filter.selectedOptions),
    isBeforeDeadline: Boolean(filter.isBeforeDeadline)
  }))
}

// Отличается ли текущая цепочка от сохранённого фильтра
export function isFilterChainChangedFromSaved (savedFilter, filterJoinOperator, filterChain) {
  const savedJoinOperator = savedFilter.filterJoinOperator || 'AND'
  const currentJoinOperator = filterJoinOperator || 'AND'
  if (savedJoinOperator !== currentJoinOperator) {
    return true
  }
  const savedFilters = normalizeFiltersForSave(savedFilter.selectedOptions || [])
  const currentFilters = normalizeFiltersForSave(filterChain || [])
  return JSON.stringify(savedFilters) !== JSON.stringify(currentFilters)
}

// Варианты значений для фильтра по slug.
// sources: {executors, supportLines, supportLineLevels, tags, organizations, priorities, statuses, clients, taskTypes, services}
// Для фильтров без списка вариантов (даты, дедлайн) — null.
export function pickFilterOptions (slug, sources) {
  switch (slug) {
    case 'executor':
      return sources.executors
    case 'supportLine':
      return sources.supportLines
    case 'supportLineLevel':
      return sources.supportLineLevels
    case 'tag':
      return sources.tags
    case 'organization':
      return sources.organizations
    case 'priority':
      return sources.priorities
    case 'status':
      return sources.statuses
    case 'client':
      return sources.clients
    case 'type':
      return sources.taskTypes
    case 'service':
      return sources.services
    default:
      return null
  }
}

// Восстанавливает варианты значений у цепочки фильтров (из URL / localStorage / сохранённого фильтра)
export function hydrateFilterChainOptions (filterChain, filterTypes, sources) {
  if (!Array.isArray(filterChain)) {
    return []
  }

  return filterChain
    .filter(filter => filter?.label !== 'Состояние OLA' && filter?.slug !== 'olaStatus')
    .map(filter => {
      const normalizedFilter = {...filter}
      const filterType = filterTypes.find(el => el.label === normalizedFilter.label)
      if (!filterType) {
        normalizedFilter.options = null
        return normalizedFilter
      }

      normalizedFilter.slug = filterType.slug
      normalizedFilter.options = pickFilterOptions(normalizedFilter.slug, sources)
      if (isDateRangeFilter(normalizedFilter)) {
        normalizedFilter.selectedOptions = normalizeDateRangeSelectedOptions(normalizedFilter.selectedOptions)
      }
      return normalizedFilter
    })
}
