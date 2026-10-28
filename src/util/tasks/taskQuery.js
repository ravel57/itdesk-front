import {normalizeFiltersForSave} from 'src/util/tasks/taskFilters'

// Чистые функции сериализации страницы заявок: query-параметры URL (цепочка фильтров в base64),
// payload активного фильтра в localStorage и сборка запроса страницы заявок к серверу.

export const ACTIVE_FILTER_STORAGE_KEY = 'tasksPageActiveFilter'

export function base64EncodeUnicode (str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(`0x${p1}`)
    })
  )
}

export function base64DecodeUnicode (str) {
  return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
    return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`
  }).join(''))
}

// В URL есть параметры фильтра (search — это window.location.search)
export function hasFilterQueryParams (search) {
  const queryParams = new URLSearchParams(search)
  return !!queryParams.get('filterChain') || !!queryParams.get('filterJoinOperator')
}

// Новый query с цепочкой фильтров (или без неё, если цепочка пуста); остальные параметры сохраняются
export function buildFilterChainQuery (search, filterChain, filterJoinOperator) {
  const queryParams = new URLSearchParams(search)
  if (filterChain.length) {
    queryParams.set('filterChain', base64EncodeUnicode(JSON.stringify(filterChain)))
    queryParams.set('filterJoinOperator', filterJoinOperator)
  } else {
    queryParams.delete('filterChain')
    queryParams.delete('filterJoinOperator')
  }
  return Object.fromEntries(queryParams.entries())
}

// Query без параметров фильтра. hadFilterParams=false — менять URL не нужно.
export function stripFilterQueryParams (search) {
  const queryParams = new URLSearchParams(search)
  const hadFilterParams = Boolean(queryParams.get('filterChain') || queryParams.get('filterJoinOperator'))
  if (hadFilterParams) {
    queryParams.delete('filterChain')
    queryParams.delete('filterJoinOperator')
  }
  return {hadFilterParams, query: Object.fromEntries(queryParams.entries())}
}

// Payload активного фильтра для localStorage
export function buildActiveFilterPayload ({isFilterSelected, selectedSavedFilter, filterJoinOperator, isJoinOperatorValid, filterChain}) {
  return {
    isFilterSelected: Boolean(isFilterSelected),
    selectedSavedFilter: selectedSavedFilter || '',
    filterJoinOperator: isJoinOperatorValid ? filterJoinOperator : 'AND',
    filterChain: normalizeFiltersForSave(filterChain || [])
  }
}

// Пустой payload хранить не нужно
export function isActiveFilterPayloadEmpty (payload) {
  return !payload.isFilterSelected && !payload.selectedSavedFilter && payload.filterChain.length === 0
}

// Запрос страницы заявок. Все значения приходят уже вычисленными компонентом.
export function buildTasksPageRequest ({
  page,
  size,
  search,
  includeCompleted,
  sortSlug,
  ascendingSort,
  filterJoinOperator,
  filterChain,
  requiredFilterChain,
  isMyLinesScope,
  isMyTasksScope,
  currentExecutorLabel
}) {
  const request = {
    page,
    size,
    search,
    includeCompleted,
    sortSlug,
    ascendingSort,
    filterJoinOperator,
    filterChain,
    requiredFilterChain
  }
  if (isMyLinesScope) {
    request.scope = 'MY_SUPPORT_LINES'
  }
  if (isMyTasksScope) {
    request.requiredFilterChain = [
      ...request.requiredFilterChain,
      {
        label: 'Исполнитель',
        slug: 'executor',
        selectedOptions: [currentExecutorLabel],
        isBeforeDeadline: false
      }
    ]
  }
  return request
}
