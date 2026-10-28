// Справочники страницы SLA и OLA.

export const OLA_UNIT_OPTIONS = [
  {label: 'минуты', value: 'MINUTES'},
  {label: 'часы', value: 'HOURS'},
  {label: 'рабочие дни', value: 'WORKING_DAYS'}
]

export const OLA_COLUMNS = [
  {name: 'name', label: 'Линия', field: 'name', align: 'left', sortable: true},
  {name: 'enabled', label: 'OLA', field: 'olaEnabled', align: 'center'},
  {name: 'duration', label: 'Внутренний срок', field: 'olaValue', align: 'left'},
  {name: 'warning', label: 'Предупреждение', field: 'olaWarningPercent', align: 'left'},
  {name: 'workingTime', label: 'Рабочее время', field: 'olaUseWorkingTime', align: 'center'}
]

export const SLA_PERIOD_OPTIONS = [
  {
    label: 'минуты',
    value: 'MINUTES'
  },
  {
    label: 'часы',
    value: 'HOURS'
  },
  {
    label: 'дни',
    value: 'DAYS'
  }
]
