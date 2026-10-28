// Пустые формы и преобразование строк API в формы для страницы «Сервисы и мониторинг».

export const emptyService = () => ({
  id: null,
  code: '',
  name: '',
  description: '',
  monitoringUrl: '',
  active: true,
  orderNumber: 0,
  criticalityId: null,
  ownerId: null,
  defaultSupportLineId: null,
  defaultPriorityId: null,
  taskTypeIds: [],
  executorIds: [],
  dependencyIds: [],
  firstResponseSlaMinutes: null,
  resolutionSlaMinutes: null,
  supportCalendar: 'GENERAL_SETTINGS',
  pauseSlaOnWaitingClient: true,
  autoAssignDefaultLine: true,
  priorityRules: [],
  olaStages: [],
  zabbixIntegrationId: null,
  zabbixEnabled: false,
  monitoringIdentifiers: {hostIds: '', hostNames: '', hostGroupIds: '', hostGroupNames: ''}
})

export const emptyAssignment = () => ({
  id: null,
  organizationId: null,
  serviceId: null,
  contractNumber: '',
  tariffName: '',
  validFrom: null,
  validTo: null,
  supportCalendar: 'GENERAL_SETTINGS',
  slaPolicyName: '',
  firstResponseSlaMinutes: null,
  resolutionSlaMinutes: null,
  availableChannels: ['EMAIL', 'TELEGRAM', 'WHATSAPP', 'PORTAL'],
  active: true,
  defaultForOrganization: false,
  notes: ''
})

export const emptyCriticality = () => ({id: null, name: '', orderNumber: null, defaultSelection: false})

/** Форма сервиса из строки GET /api/v1/services; null — новый сервис. */
export function serviceFormFromRow(row = null) {
  if (!row) {
    return emptyService()
  }
  return {
    ...emptyService(),
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    monitoringUrl: row.monitoringUrl || '',
    active: row.active,
    orderNumber: row.orderNumber,
    criticalityId: row.criticality?.id || null,
    ownerId: row.owner?.id || null,
    defaultSupportLineId: row.defaultSupportLine?.id || null,
    defaultPriorityId: row.defaultPriority?.id || null,
    taskTypeIds: (row.taskTypes || []).map(x => x.id),
    executorIds: (row.executors || []).map(x => x.id),
    dependencyIds: (row.dependencies || []).map(x => x.id),
    firstResponseSlaMinutes: row.firstResponseSlaMinutes,
    resolutionSlaMinutes: row.resolutionSlaMinutes,
    supportCalendar: row.supportCalendar || 'GENERAL_SETTINGS',
    pauseSlaOnWaitingClient: row.pauseSlaOnWaitingClient !== false,
    autoAssignDefaultLine: row.autoAssignDefaultLine !== false,
    priorityRules: JSON.parse(JSON.stringify(row.priorityRules || [])),
    olaStages: JSON.parse(JSON.stringify(row.olaStages || [])),
    zabbixIntegrationId: row.zabbixIntegration?.id || null,
    zabbixEnabled: Boolean(row.zabbixEnabled),
    monitoringIdentifiers: {hostIds: '', hostNames: '', hostGroupIds: '', hostGroupNames: '', ...(row.monitoringIdentifiers || {})}
  }
}

/** Форма подключения сервиса к организации из строки таблицы; null — новое подключение. */
export function assignmentFormFromRow(row = null) {
  return row ? {
    ...emptyAssignment(),
    ...row,
    organizationId: row.organization?.id,
    serviceId: row.service?.id
  } : emptyAssignment()
}
