// Чистые функции прав доступа к аналитике.

export const ANALYTICS_SCOPE_LABELS = {
  ADMIN: 'Полная аналитика по всем данным',
  MANAGER: 'Полная аналитика по всем данным',
  OPERATOR: 'Данные доступных организаций и линий поддержки',
  OBSERVER: 'Данные назначенных организаций'
}

export const BREAKDOWN_BY_OPTIONS = [
  {
    label: 'По типам заявок',
    value: 'type'
  },
  {
    label: 'По сервисам',
    value: 'service'
  },
  {
    label: 'По приоритетам',
    value: 'priority'
  },
  {
    label: 'По исполнителям',
    value: 'executor'
  },
  {
    label: 'По тегам',
    value: 'tag'
  },
  {
    label: 'По линиям поддержки',
    value: 'supportLine',
  }
]

// Права: сначала из summary.access, затем из store.analyticsAccess, затем выводятся из ролей пользователя.
export function resolveAnalyticsAccess(summary, storeAnalyticsAccess, currentUser) {
  const summaryAccess = summary?.access
  if (summaryAccess && typeof summaryAccess === 'object') {
    return summaryAccess
  }
  if (storeAnalyticsAccess && typeof storeAnalyticsAccess === 'object' &&
    (storeAnalyticsAccess.role || storeAnalyticsAccess.scope !== 'NONE')) {
    return storeAnalyticsAccess
  }
  const authorities = Array.isArray(currentUser?.authorities)
    ? currentUser.authorities
    : []
  const role = ['ADMIN', 'MANAGER', 'SENIOR_OPERATOR', 'OPERATOR', 'OBSERVER']
    .find(item => authorities.includes(item)) || null
  const canViewInternalData = ['ADMIN', 'MANAGER', 'SENIOR_OPERATOR', 'OPERATOR'].includes(role)
  return {
    role,
    scope: ['ADMIN', 'MANAGER'].includes(role) ? 'ALL' : role ? 'RESTRICTED' : 'NONE',
    organizationIds: [],
    canViewInternalData,
    canViewOperators: canViewInternalData,
    canViewSupportLines: canViewInternalData,
    canFilterExecutors: canViewInternalData,
    canFilterSupportLines: canViewInternalData
  }
}

export function getAnalyticsScopeLabel(role) {
  return ANALYTICS_SCOPE_LABELS[role] || 'Доступ к аналитике ограничен'
}

export function filterBreakdownOptions(options, {canViewOperators, canViewSupportLines}) {
  return options.filter(option => {
    if (option.value === 'executor') {
      return canViewOperators
    }
    if (option.value === 'supportLine') {
      return canViewSupportLines
    }
    return true
  })
}
