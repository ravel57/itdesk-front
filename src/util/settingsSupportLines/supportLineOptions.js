// Справочники выбора для линий поддержки (диалог линии, подписи в списке).

export const ASSIGNMENT_STRATEGY_OPTIONS = [
  {label: 'Оставлять без исполнителя', value: 'KEEP_UNASSIGNED'},
  {label: 'Ручное назначение', value: 'MANUAL'},
  {label: 'Наименее загруженный участник', value: 'LEAST_LOADED'},
  {label: 'По очереди (Round Robin)', value: 'ROUND_ROBIN'}
]

export const VISIBILITY_OPTIONS = [
  {label: 'Наследовать общую настройку', value: 'INHERIT'},
  {label: 'Все операторы', value: 'ALL_OPERATORS'},
  {label: 'Только участники', value: 'LINE_MEMBERS'},
  {label: 'Участники и наблюдатели', value: 'LINE_MEMBERS_AND_OBSERVERS'}
]

export const OLA_UNIT_OPTIONS = [
  {label: 'Минуты', value: 'MINUTES'},
  {label: 'Часы', value: 'HOURS'},
  {label: 'Рабочие дни', value: 'WORKING_DAYS'}
]

export const ROUTING_TRIGGER_OPTIONS = [
  {label: 'При создании заявки', value: 'TASK_CREATED'},
  {label: 'При изменении типа', value: 'TASK_TYPE_CHANGED'},
  {label: 'При изменении приоритета', value: 'TASK_PRIORITY_CHANGED'},
  {label: 'При изменении линии', value: 'TASK_GROUP_CHANGED'}
]

export const ROUTING_CONDITION_FIELD_OPTIONS = [
  {label: 'Тип заявки', value: 'type'},
  {label: 'Приоритет', value: 'priority'},
  {label: 'Текущая линия', value: 'supportLine'},
  {label: 'Тег', value: 'tag'},
  {label: 'Название содержит', value: 'name'}
]

export const ROUTING_OPERATOR_OPTIONS = [
  {label: 'равно', value: 'EQUALS'},
  {label: 'не равно', value: 'NOT_EQUALS'},
  {label: 'содержит', value: 'CONTAINS'}
]

export const ROUTING_ASSIGNMENT_OPTIONS = [
  {label: 'Только перевести на линию', value: 'GROUP_ONLY'},
  {label: 'Назначить наименее загруженного', value: 'LEAST_LOADED'}
]
