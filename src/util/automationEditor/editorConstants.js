// Статические справочники визуального редактора автоматизаций.

export const GRAPH_SEARCH_CRITERIA = [
  {label: 'Совпадение текста', value: 'text'},
  {label: 'Переменная', value: 'variable'}
]

export const DELAY_UNITS = [
  {label: 'сек.', value: 'SECONDS'},
  {label: 'мин.', value: 'MINUTES'},
  {label: 'ч.', value: 'HOURS'},
  {label: 'дн.', value: 'DAYS'}
]

export const CONDITION_FIELDS = [
  {label: 'Тип заявки', value: 'task.type.id', kind: 'entity', source: 'taskTypes'},
  {label: 'Сервис', value: 'task.service.id', kind: 'nullable-entity', source: 'services'},
  {label: 'Приоритет', value: 'task.priority.id', kind: 'entity', source: 'priorities'},
  {label: 'Статус', value: 'task.status.id', kind: 'entity', source: 'statuses'},
  {label: 'Линия поддержки', value: 'task.supportLine.id', kind: 'nullable-entity', source: 'supportLines'},
  {label: 'Исполнитель', value: 'task.executor.id', kind: 'nullable-entity', source: 'users'},
  {label: 'Тег', value: 'task.tags', kind: 'tag', source: 'tags'},
  {label: 'Название заявки', value: 'task.name', kind: 'text'},
  {label: 'Описание заявки', value: 'task.description', kind: 'text'},
  {label: 'Заявка закрыта', value: 'task.completed', kind: 'boolean'},
  {label: 'Заявка приостановлена', value: 'task.frozen', kind: 'boolean'},
  {
    label: 'Организация клиента',
    value: 'client.organization.id',
    kind: 'nullable-entity',
    source: 'organizations'
  },
  {label: 'Канал обращения', value: 'client.sourceChannel', kind: 'text'},
  {label: 'Текст сообщения', value: 'message.text', kind: 'text'},
  {label: 'Источник сообщения события', value: 'message.fromSource', kind: 'text'},
  {label: 'Источник последнего сообщения', value: 'client.lastMessage.fromSource', kind: 'text'},
  {label: 'Сейчас рабочее время', value: '__WORKING_HOURS__', kind: 'function-boolean'},
  {label: 'Сейчас выходной', value: '__WEEKEND__', kind: 'function-boolean'}
]

export const ACTION_TYPES = [
  {label: 'Назначить линию поддержки', value: 'ASSIGN_LINE'},
  {label: 'Назначить наименее загруженного участника линии', value: 'ASSIGN_LEAST_LOADED'},
  {label: 'Назначить конкретного исполнителя', value: 'ASSIGN_USER'},
  {label: 'Очистить исполнителя', value: 'CLEAR_ASSIGNEE'},
  {label: 'Изменить приоритет', value: 'SET_PRIORITY'},
  {label: 'Изменить статус', value: 'SET_STATUS'},
  {label: 'Добавить тег', value: 'ADD_TAG'},
  {label: 'Удалить тег', value: 'REMOVE_TAG'},
  {label: 'Изменить название заявки', value: 'SET_NAME'},
  {label: 'Изменить описание заявки', value: 'SET_DESCRIPTION'},
  {label: 'Установить дедлайн через N минут', value: 'SET_DEADLINE_MINUTES'},
  {label: 'Очистить дедлайн', value: 'CLEAR_DEADLINE'},
  {label: 'Отправить сообщение клиенту', value: 'SEND_MESSAGE'},
  {label: 'Установить «Требует ответа»', value: 'SET_ANSWER_REQUIRED'}
]
