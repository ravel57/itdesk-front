import moment from 'moment'

// Чистые функции разбора ответа аналитики и форматирования значений.
// Используются analyticsSummaryMixin, страницей аналитики и расчётами вкладок.

export function unwrapAnalyticsResponse(value) {
  if (!value) {
    return {}
  }
  if (value.data && typeof value.data === 'object') {
    return value.data
  }
  return value
}

export function getSummaryNumber(summary, keys) {
  for (const key of keys) {
    if (summary[key] !== undefined && summary[key] !== null) {
      return Number(summary[key] || 0)
    }
  }
  return 0
}

export function getSummaryRows(summary, keys) {
  const unwrapped = unwrapAnalyticsResponse(summary)
  for (const key of keys) {
    const value = unwrapped[key]
    if (Array.isArray(value)) {
      return value
    }
    if (value && typeof value === 'object') {
      return Object.entries(value).map(([entryKey, row]) => {
        if (row && typeof row === 'object') {
          return {
            key: row.key || entryKey,
            name: row.name || row.label || entryKey,
            ...row
          }
        }
        return {
          key: entryKey,
          name: entryKey,
          totalTasks: Number(row || 0)
        }
      })
    }
  }
  return []
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('ru-RU')
}

export function formatDuration(seconds) {
  const totalSeconds = Number(seconds || 0)
  if (totalSeconds <= 0) {
    return '—'
  }
  if (totalSeconds < 60) {
    return '< 1 мин'
  }
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) {
    return `${minutes} мин`
  }
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  if (hours < 24) {
    return restMinutes > 0 ? `${hours} ч ${restMinutes} мин` : `${hours} ч`
  }
  const days = Math.floor(hours / 24)
  const restHours = hours % 24
  return restHours > 0 ? `${days} д ${restHours} ч` : `${days} д`
}

export function formatPeriodDate(value) {
  if (!value) {
    return '—'
  }
  const date = moment(value, ['YYYY-MM-DD', moment.ISO_8601], true)
  if (!date.isValid()) {
    return value
  }
  return date.format('DD.MM.YYYY')
}

export function getProgressValue(value, max) {
  const safeMax = Number(max || 0)
  if (safeMax <= 0) {
    return 0
  }
  return Math.max(0, Math.min(1, Number(value || 0) / safeMax))
}

export function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`
}
