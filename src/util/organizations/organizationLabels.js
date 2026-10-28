import { formatDate } from 'src/util/organizationHelpers'
import { formatDurationMs, formatMinutes, parseIsoDurationToMs } from 'src/util/organizations/organizationSla'

// Текстовые подписи организации (договор, соглашения SLA). Чистые функции.

export function getOrganizationContractLabel (organization) {
  if (!organization) {
    return 'Договор не указан'
  }
  const contractNumber = organization.contractNumber || organization.contractNo || organization.contract?.number
  const contractDate = organization.contractDate || organization.contract?.date || organization.contractStartDate
  const dateLabel = contractDate ? formatDate(contractDate) : ''

  if (contractNumber && dateLabel) {
    return `Договор № ${contractNumber} от ${dateLabel}`
  }
  if (contractNumber) {
    return `Договор № ${contractNumber}`
  }
  if (dateLabel) {
    return `Договор от ${dateLabel}`
  }
  return 'Договор не указан'
}

export function getOrganizationSlaAgreementLabel (organization) {
  return organization?.slaAgreementName ||
    organization?.slaPolicyName ||
    organization?.sla?.name ||
    organization?.settings?.slaAgreementName ||
    'По настройкам SLA в заявках / приоритетах'
}

// Подписи ниже сейчас нигде не вызываются: на них ссылается только закомментированный
// (FIXME) блок «Соглашения по SLA» в OrganizationInfoSection.vue. Оставлены для его возврата.

export function getOrganizationFirstResponseSlaLabel (organization) {
  const value = organization?.firstResponseSlaMinutes ||
    organization?.slaFirstResponseMinutes ||
    organization?.settings?.firstResponseSlaMinutes ||
    organization?.sla?.firstResponseMinutes

  if (Number.isFinite(Number(value))) {
    return formatMinutes(Number(value))
  }

  const duration = organization?.firstResponseSlaDuration || organization?.sla?.firstResponseDuration
  if (duration) {
    return formatDurationMs(parseIsoDurationToMs(duration))
  }

  return 'Из общих настроек'
}

export function getOrganizationResolutionSlaLabel (organization) {
  const value = organization?.resolutionSlaMinutes ||
    organization?.taskResolutionSlaMinutes ||
    organization?.settings?.resolutionSlaMinutes ||
    organization?.sla?.resolutionMinutes

  if (Number.isFinite(Number(value))) {
    return formatMinutes(Number(value))
  }

  const valueHours = organization?.slaResolutionHours || organization?.resolutionSlaHours || organization?.settings?.resolutionSlaHours
  if (Number.isFinite(Number(valueHours))) {
    return formatMinutes(Number(valueHours) * 60)
  }

  const duration = organization?.resolutionSlaDuration || organization?.sla?.duration || organization?.slaDuration
  if (duration) {
    return formatDurationMs(parseIsoDurationToMs(duration))
  }

  return 'Из настроек типа / приоритета заявки'
}

export function getOrganizationSlaCalendarLabel (organization) {
  const value = organization?.slaWorkCalendar
  const labels = {
    GENERAL_SETTINGS: 'Из общих настроек',
    BUSINESS_HOURS: 'Рабочее время',
    CALENDAR_24_7: '24/7'
  }
  return labels[value] || value || 'Из общих настроек'
}

export function getOrganizationPauseSlaOnWaitingClientLabel (organization) {
  return organization?.pauseSlaOnWaitingClient === false ? 'Нет' : 'Да'
}
