// Значения по умолчанию, справочники и нормализация организации для настроек (чистые функции).

export const defaultOrganization = () => ({
  id: null,
  name: '',
  orderNumber: 0,
  active: true,
  inn: '',
  kpp: '',
  externalId: '',
  mainAddress: '',
  priorityLevel: 'NORMAL',
  managerName: '',
  managerPhone: '',
  managerEmail: '',
  contractNumber: '',
  contractStartDate: null,
  contractEndDate: null,
  tariffName: '',
  servicePackageName: '',
  monthlyFee: null,
  description: '',
  useVisitsLimit: false,
  monthlyVisitsLimit: 0,
  visitsUsed: 0,
  extraVisitPrice: null,
  urgentVisitPrice: null,
  visitResetDay: 1,
  includedRemoteSupport: true,
  visitComment: '',
  slaAgreementName: '',
  slaFirstResponseMinutes: null,
  slaResolutionHours: null,
  slaWorkCalendar: 'GENERAL_SETTINGS',
  pauseSlaOnWaitingClient: true,
  slaComment: '',
  serviceAddresses: '',
  communicationChannels: '',
  internalComment: ''
})

export const PRIORITY_LEVEL_OPTIONS = [
  {label: 'Обычный', value: 'NORMAL'},
  {label: 'Важный', value: 'HIGH'},
  {label: 'VIP', value: 'VIP'},
  {label: 'Проблемный', value: 'PROBLEM'}
]

export const SLA_CALENDAR_OPTIONS = [
  {label: 'Из общих настроек', value: 'GENERAL_SETTINGS'},
  {label: 'Календарное время 24/7', value: 'CALENDAR_24_7'},
  {label: 'Только рабочее время', value: 'WORKING_HOURS'}
]

export const SLA_UNIT_OPTIONS = [
  {label: 'Минуты', value: 'MINUTES'},
  {label: 'Часы', value: 'HOURS'},
  {label: 'Дни', value: 'DAYS'}
]

export function normalizeOrganization(organization) {
  return {
    ...defaultOrganization(),
    ...JSON.parse(JSON.stringify(organization || {})),
    active: organization?.active !== false,
    useVisitsLimit: Boolean(organization?.useVisitsLimit),
    includedRemoteSupport: organization?.includedRemoteSupport !== false,
    pauseSlaOnWaitingClient: organization?.pauseSlaOnWaitingClient !== false
  }
}
