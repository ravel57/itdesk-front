// Числовые и текстовые форматтеры для карточки организации в настройках (чистые функции).

export function numberOrZero(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function visitUsagePercent(organization) {
  const limit = numberOrZero(organization.monthlyVisitsLimit)
  if (limit <= 0) {
    return 0
  }
  return Math.min(100, Math.round(numberOrZero(organization.visitsUsed) * 100 / limit))
}

export function visitsLeft(organization) {
  const left = numberOrZero(organization.monthlyVisitsLimit) - numberOrZero(organization.visitsUsed)
  if (left < 0) {
    return `+${Math.abs(left)} сверх пакета`
  }
  return `осталось ${left}`
}

export function visitProgressColor(organization) {
  const percent = visitUsagePercent(organization)
  if (percent >= 100) return 'negative'
  if (percent >= 80) return 'orange'
  if (percent >= 50) return 'warning'
  return 'primary'
}

export function slaUnitLabel(unit) {
  if (unit === 'MINUTES') return 'мин'
  if (unit === 'DAYS') return 'дн'
  return 'ч'
}

export function pluralize(count, words) {
  const value = Math.abs(Number(count)) % 100
  const last = value % 10
  if (value > 10 && value < 20) return words[2]
  if (last > 1 && last < 5) return words[1]
  if (last === 1) return words[0]
  return words[2]
}
