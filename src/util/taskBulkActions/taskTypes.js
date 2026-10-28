// Чистые функции по типам заявок для модалки массовых действий: нормализация, ключи, валидация, список опций.

export function getMixedTaskTypeOption () {
  return {
    id: null,
    type: 'Смешанные типы',
    mixed: true
  }
}

export function getTaskTypeName (taskType) {
  if (!taskType) {
    return ''
  }
  if (typeof taskType === 'string') {
    return taskType.trim()
  }
  return String(taskType.type || taskType.name || '').trim()
}

export function getTaskTypeKey (taskType) {
  if (!taskType || taskType.mixed) {
    return 'none'
  }
  if (typeof taskType === 'object' && taskType.id != null) {
    return `id:${taskType.id}`
  }
  const name = getTaskTypeName(taskType).toLowerCase()
  return name ? `name:${name}` : 'none'
}

export function normalizeTaskTypeOption (taskType) {
  if (!taskType) {
    return null
  }
  if (taskType.mixed) {
    return getMixedTaskTypeOption()
  }
  if (typeof taskType === 'string') {
    const type = taskType.trim()
    return type ? {id: null, type} : null
  }
  const type = getTaskTypeName(taskType)
  if (!type) {
    return null
  }
  return {
    ...taskType,
    type
  }
}

export function isValidTaskTypeSelection (taskType) {
  if (!taskType || taskType.mixed) {
    return false
  }
  const type = getTaskTypeName(taskType)
  return type.length > 0 && type.toLowerCase() !== 'не указан'
}

// Уникальные по ключу валидные типы, отсортированные по названию
export function buildTaskTypeOptions (taskTypes) {
  const optionsByKey = new Map()
  ;(taskTypes || []).forEach(taskType => {
    const option = normalizeTaskTypeOption(taskType)
    if (option && isValidTaskTypeSelection(option)) {
      optionsByKey.set(getTaskTypeKey(option), option)
    }
  })
  return Array.from(optionsByKey.values())
    .sort((a, b) => String(a.type || '').localeCompare(String(b.type || ''), 'ru'))
}

// Типы из загруженных заявок — запасной вариант, если справочник типов не загрузился
export function collectTaskTypesFromTasks (tasks) {
  const typesByKey = new Map()
  ;(tasks || []).forEach(task => {
    const option = normalizeTaskTypeOption(task?.type)
    if (option) {
      typesByKey.set(getTaskTypeKey(option), option)
    }
  })
  return Array.from(typesByKey.values())
}
