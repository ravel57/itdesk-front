// Столбцы таблицы заявок и их связь с настройками карточек заявок (src/util/taskCardConfig.js).
// Пока пользователь не менял столбцы таблицы, показываются столбцы, соответствующие включённым полям карточки.

export const TABLE_SETTINGS_KEY = 'taskTableSettings'
// Флаг «таблица настроена вручную». Без него столбцы берутся из настроек карточек.
export const TABLE_CUSTOMIZED_KEY = 'taskTableSettingsCustomized'

export function defaultTableColumns () {
  return [
    { name: 'id', label: 'ID', active: true },
    { name: 'name', label: 'Название', active: true },
    { name: 'type', label: 'Тип', active: true },
    { name: 'service', label: 'Сервис', active: true },
    { name: 'checklist', label: 'Чек-лист', active: true },
    { name: 'tags', label: 'Теги', active: true },
    { name: 'priority', label: 'Приоритет', active: true },
    { name: 'createdAt', label: 'Создана', active: true },
    { name: 'status', label: 'Статус', active: true },
    { name: 'deadline', label: 'Дедлайн', active: true },
    { name: 'supportLine', label: 'Линия поддержки', active: true },
    { name: 'executor', label: 'Исполнитель', active: true },
    { name: 'sla', label: 'SLA', active: true },
    { name: 'ola', label: 'OLA', active: true }
  ]
}

// Карточка всегда показывает номер, название и статус заявки — их столбцы есть в таблице всегда
const ALWAYS_SHOWN_COLUMNS = ['id', 'name', 'status']

// Поле карточки → столбец таблицы. Поля без столбца-аналога (description, closeReason, lastActivity)
// в таблице не отображаются; столбец ola, которого нет в карточке, по умолчанию скрыт.
const CARD_FIELD_TO_COLUMN = {
  type: 'type',
  service: 'service',
  checklist: 'checklist',
  tags: 'tags',
  supportLine: 'supportLine',
  priority: 'priority',
  executor: 'executor',
  createdAt: 'createdAt',
  deadline: 'deadline',
  sla: 'sla'
}

export function columnsFromCardConfig (cardConfig) {
  const names = new Set(ALWAYS_SHOWN_COLUMNS)
  for (const field of Array.isArray(cardConfig) ? cardConfig : []) {
    if (field && field.enabled !== false && CARD_FIELD_TO_COLUMN[field.key]) {
      names.add(CARD_FIELD_TO_COLUMN[field.key])
    }
  }
  return names
}

// Столбцы по умолчанию с активностью, выведенной из настроек карточек
export function tableColumnsFromCardConfig (cardConfig) {
  const names = columnsFromCardConfig(cardConfig)
  return defaultTableColumns().map(column => ({ ...column, active: names.has(column.name) }))
}

// Сохранённые настройки поверх списка по умолчанию (новые столбцы берут значение по умолчанию)
export function mergeTableColumns (savedColumns) {
  const defaults = defaultTableColumns()
  if (!Array.isArray(savedColumns)) {
    return defaults
  }
  const savedByName = new Map(savedColumns.filter(column => column && column.name).map(column => [column.name, column]))
  return defaults.map(column => ({
    ...column,
    active: savedByName.has(column.name) ? savedByName.get(column.name).active : column.active
  }))
}

// Настройки, сохранённые до появления флага: если все столбцы включены — пользователь таблицу
// не менял (это значение по умолчанию, оно записывалось само), иначе — настроил вручную.
export function isLegacyCustomized (savedColumns) {
  if (!Array.isArray(savedColumns)) {
    return false
  }
  return mergeTableColumns(savedColumns).some(column => column.active === false)
}

function readStorage (storage, key) {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function parseJson (raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Столбцы таблицы для старта: { columns, customized }
export function resolveTableColumns (storage, cardConfig) {
  const savedColumns = parseJson(readStorage(storage, TABLE_SETTINGS_KEY))
  const hasFlag = readStorage(storage, TABLE_CUSTOMIZED_KEY) === 'true'
  const customized = hasFlag || isLegacyCustomized(savedColumns)
  if (customized) {
    return { columns: mergeTableColumns(savedColumns), customized: true }
  }
  return { columns: tableColumnsFromCardConfig(cardConfig), customized: false }
}
