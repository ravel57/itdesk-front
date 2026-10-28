// Поля условий и типы действий простого («графового») редактора правил, а также чистые функции вокруг них.

export const GRAPH_CONDITION_FIELDS = [
  {label: 'Тип заявки', value: 'task.type.id', kind: 'entity', source: 'taskTypes'},
  {label: 'Приоритет', value: 'task.priority.id', kind: 'entity', source: 'priorities'},
  {label: 'Статус', value: 'task.status.id', kind: 'entity', source: 'statuses'},
  {label: 'Текущая линия', value: 'task.supportLine.id', kind: 'entity-nullable', source: 'supportLines'},
  {label: 'Исполнитель', value: 'task.executor.id', kind: 'entity-nullable', source: 'users'},
  {label: 'Тег заявки', value: 'task.tags', kind: 'tag', source: 'tags'},
  {label: 'Название заявки', value: 'task.name', kind: 'text'},
  {label: 'Описание заявки', value: 'task.description', kind: 'text'},
  {label: 'Заявка закрыта', value: 'task.completed', kind: 'boolean'},
  {label: 'Заявка приостановлена', value: 'task.frozen', kind: 'boolean'},
  {
    label: 'Организация клиента',
    value: 'client.organization.id',
    kind: 'entity-nullable',
    source: 'organizations'
  },
  {label: 'Канал обращения', value: 'client.sourceChannel', kind: 'text'},
  {label: 'Источник сообщения события', value: 'message.fromSource', kind: 'text'},
  {label: 'Источник последнего сообщения', value: 'client.lastMessage.fromSource', kind: 'text'}
]

export const GRAPH_ACTION_TYPES = [
  {label: 'Назначить линию поддержки', value: 'ASSIGN_LINE'},
  {label: 'Назначить наименее загруженного участника линии', value: 'ASSIGN_LEAST_LOADED'},
  {label: 'Назначить исполнителя', value: 'ASSIGN_USER'},
  {label: 'Очистить исполнителя', value: 'CLEAR_ASSIGNEE'},
  {label: 'Изменить приоритет', value: 'SET_PRIORITY'},
  {label: 'Изменить статус', value: 'SET_STATUS'},
  {label: 'Добавить тег', value: 'ADD_TAG'},
  {label: 'Удалить тег', value: 'REMOVE_TAG'},
  {label: 'Установить «Требует ответа»', value: 'SET_ANSWER_REQUIRED'}
]

export function conditionFieldMeta(field) {
  return GRAPH_CONDITION_FIELDS.find(item => item.value === field) || {kind: 'text'}
}

export function toOptions(items, labelGetter, valueGetter = item => item.id) {
  return (items || [])
    .filter(item => item && item.id !== undefined && item.id !== null && item.active !== false)
    .map(item => ({label: labelGetter(item), value: valueGetter(item)}))
}

export function conditionOperatorOptions(condition) {
  const kind = conditionFieldMeta(condition.field).kind
  if (kind === 'tag') {
    return [
      {label: 'содержит тег', value: 'has_tag'},
      {label: 'не содержит тег', value: 'no_tag'}
    ]
  }
  if (kind === 'text') {
    return [
      {label: 'содержит', value: 'contains'},
      {label: 'не содержит', value: 'not_contains'},
      {label: 'равно', value: 'equals'},
      {label: 'не равно', value: 'not_equals'}
    ]
  }
  return [
    {label: 'равно', value: 'equals'},
    {label: 'не равно', value: 'not_equals'}
  ]
}

export function actionNeedsValue(action) {
  return !['CLEAR_ASSIGNEE', 'SET_ANSWER_REQUIRED'].includes(action.type)
}

// sources: {store, supportLineOptions, userOptions} — справочники для выпадающих списков значений.
export function conditionValueOptions(condition, {store, supportLineOptions, userOptions}) {
  const meta = conditionFieldMeta(condition.field)
  let options = []
  switch (meta.source) {
    case 'taskTypes':
      options = toOptions(store.taskTypes, item => item.type || item.name)
      break
    case 'priorities':
      options = toOptions(store.priorities, item => item.name)
      break
    case 'statuses':
      options = toOptions(store.statuses, item => item.name)
      break
    case 'supportLines':
      options = supportLineOptions
      break
    case 'users':
      options = userOptions
      break
    case 'organizations':
      options = toOptions(store.organizations, item => item.name)
      break
    case 'tags':
      options = toOptions(store.tags, item => item.name, item => item.name)
      break
    default:
      options = []
  }
  if (meta.kind === 'boolean') {
    return [
      {label: 'Да', value: true},
      {label: 'Нет', value: false}
    ]
  }
  if (meta.kind === 'entity-nullable') {
    return [{label: 'Не назначено', value: '__NULL__'}, ...options]
  }
  return options
}

export function actionValueOptions(action, {store, supportLineOptions, userOptions}) {
  switch (action.type) {
    case 'ASSIGN_LINE':
    case 'ASSIGN_LEAST_LOADED':
      return supportLineOptions
    case 'ASSIGN_USER':
      return userOptions
    case 'SET_PRIORITY':
      return toOptions(store.priorities, item => item.name, item => item.name)
    case 'SET_STATUS':
      return toOptions(store.statuses, item => item.name, item => item.name)
    case 'ADD_TAG':
    case 'REMOVE_TAG':
      return toOptions(store.tags, item => item.name, item => item.name)
    default:
      return []
  }
}
