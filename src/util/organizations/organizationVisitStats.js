import {
  firstFiniteNumber,
  formatDate,
  getOrganizationVisitResetDayLabel
} from 'src/util/organizationHelpers'

// Статистика выездов по договорному лимиту организации (чистые функции).

export function emptyVisitStats () {
  return {
    enabled: false,
    limit: 0,
    used: 0,
    left: 0,
    overLimit: 0,
    percent: 0,
    color: 'grey',
    label: 'Не настроены',
    extraPriceLabel: 'Не указана',
    resetLabel: 'Не указана'
  }
}

export function getOrganizationVisitStats (organization) {
  if (!organization || organization.useVisitsLimit !== true) {
    return emptyVisitStats()
  }

  const limitRaw = firstFiniteNumber([
    organization.monthlyVisitsLimit,
    organization.visitsLimit,
    organization.visitLimit,
    organization.includedVisits,
    organization.servicePackage?.visitsLimit,
    organization.settings?.monthlyVisitsLimit
  ])

  const usedRaw = firstFiniteNumber([
    organization.monthlyVisitsUsed,
    organization.visitsUsed,
    organization.usedVisits,
    organization.servicePackage?.visitsUsed,
    organization.settings?.monthlyVisitsUsed
  ])

  const limit = limitRaw !== null ? limitRaw : 0
  const used = usedRaw !== null ? usedRaw : 0
  const left = Math.max(0, limit - used)
  const overLimit = Math.max(0, used - limit)
  const percent = limit > 0 ? Math.min(1, used / limit) : 0

  const extraPrice = firstFiniteNumber([
    organization.extraVisitPrice,
    organization.visitOverLimitPrice,
    organization.visitPrice,
    organization.servicePackage?.extraVisitPrice,
    organization.settings?.extraVisitPrice
  ])

  const resetDate = organization.visitsResetDate || organization.visitResetDate || organization.servicePackage?.visitsResetDate

  return {
    enabled: true,
    limit,
    used,
    left,
    overLimit,
    percent,
    color: overLimit > 0 ? 'negative' : percent >= 0.8 ? 'orange' : 'primary',
    label: `${used} / ${limit}`,
    extraPriceLabel: extraPrice !== null ? `${extraPrice.toLocaleString('ru-RU')} ₽` : 'Не указана',
    resetLabel: resetDate ? formatDate(resetDate) : getOrganizationVisitResetDayLabel(organization)
  }
}
