import {serviceOrganizationNames} from 'src/util/serviceOrganizations'

// Колонки таблиц страницы «Сервисы и мониторинг» (функции, чтобы у каждого экземпляра был свой массив).

export const createServiceColumns = () => [
  {name: 'name', label: 'Сервис', field: row => `${row.code} ${row.name}`, align: 'left', sortable: true},
  {name: 'organizations', label: 'Организации', field: row => serviceOrganizationNames(row).join(', '), align: 'left'},
  {
    name: 'criticality',
    label: 'Критичность',
    field: row => row.criticality?.name || '',
    align: 'left',
    sortable: true
  },
  {
    name: 'owner',
    label: 'Владелец',
    field: row => [row.owner?.lastname, row.owner?.firstname].filter(Boolean).join(' ') || row.owner?.username || '—',
    align: 'left'
  },
  {name: 'defaultLine', label: 'Линия', field: row => row.defaultSupportLine?.name || '—', align: 'left'},
  {name: 'monitoring', label: 'Мониторинг', field: 'monitoringStatus', align: 'left'},
  {name: 'active', label: 'Активен', field: 'active', align: 'center'},
  {name: 'actions', label: '', field: 'id', align: 'right'}
]

export const createAssignmentColumns = () => [
  {
    name: 'organization',
    label: 'Организация',
    field: row => row.organization?.name || '',
    align: 'left',
    sortable: true
  },
  {name: 'service', label: 'Сервис', field: row => row.service?.name || '', align: 'left', sortable: true},
  {
    name: 'contract',
    label: 'Договор / тариф',
    field: row => [row.contractNumber, row.tariffName].filter(Boolean).join(' · ') || '—',
    align: 'left'
  },
  {name: 'validity', label: 'Период', field: 'validFrom', align: 'left'},
  {name: 'sla', label: 'SLA', field: 'resolutionSlaMinutes', align: 'left'},
  {name: 'active', label: 'Активно', field: 'active', align: 'center'},
  {name: 'actions', label: '', field: 'id', align: 'right'}
]

export const createZabbixColumns = () => [
  {name: 'name', label: 'Название', field: 'name', align: 'left', sortable: true},
  {name: 'mode', label: 'Режим', field: 'mode', align: 'left'},
  {
    name: 'url',
    label: 'Адрес',
    field: row => (row.mode === 'WEBHOOK' ? row.eventsUrl || 'адрес появится после выпуска токена' : row.baseUrl),
    align: 'left'
  },
  {name: 'auth', label: 'Авторизация', field: 'hasApiToken', align: 'left'},
  {name: 'lastTest', label: 'Последняя проверка', field: 'lastTestMessage', align: 'left'},
  {name: 'actions', label: '', field: 'id', align: 'right'}
]

export const CHANNEL_VALUES = ['EMAIL', 'TELEGRAM', 'WHATSAPP', 'PORTAL', 'PHONE']
