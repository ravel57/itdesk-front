// Чистые функции для начальных значений полей массового действия: «одинаково у всех выбранных заявок
// или смешано». Ключ сравнивает значения у заявок, значение — то, что кладётся в поле формы.
import moment from 'moment'
import { getUserName } from 'src/util/taskBulkActions/executors'
import { getStatusName } from 'src/util/taskBulkActions/statuses'

export function getEntityKey (entity, nameGetter) {
  if (!entity) {
    return 'none'
  }
  if (typeof entity === 'object' && entity.id != null) {
    return `id:${entity.id}`
  }
  const rawName = typeof nameGetter === 'function'
    ? nameGetter(entity)
    : entity
  const name = String(rawName || '').trim().toLowerCase()
  return name ? `name:${name}` : 'none'
}

export function getSupportLineKey (task) {
  return getEntityKey(task?.supportLine, supportLine => supportLine?.name || supportLine)
}

export function getSupportLineValue (task) {
  return task?.supportLine?.id || null
}

export function getExecutorKey (task) {
  return getEntityKey(task?.executor, executor => getUserName(executor))
}

export function getExecutorValue (task) {
  return task?.executor ? getUserName(task.executor) : ''
}

export function getPriorityKey (task) {
  return getEntityKey(task?.priority, priority => priority?.name || priority)
}

export function getPriorityValue (task) {
  return task?.priority?.name || ''
}

export function getStatusKey (task) {
  return getEntityKey(task?.status, status => getStatusName(status))
}

export function getStatusValue (task) {
  return getStatusName(task?.status)
}

export function getDeadlineKey (task) {
  const value = task?.deadline
  if (!value) {
    return 'none'
  }
  const date = moment(value)
  if (date.isValid()) {
    return date.format('YYYY-MM-DDTHH:mm')
  }
  const strictDate = moment(String(value), 'DD.MM.YYYY HH:mm', true)
  if (strictDate.isValid()) {
    return strictDate.format('YYYY-MM-DDTHH:mm')
  }
  return `raw:${String(value).trim()}`
}

export function getDeadlineValue (task) {
  const value = task?.deadline
  if (!value) {
    return ''
  }
  const date = moment(value)
  if (date.isValid()) {
    return date.format('DD.MM.YYYY HH:mm')
  }
  const strictDate = moment(String(value), 'DD.MM.YYYY HH:mm', true)
  return strictDate.isValid()
    ? strictDate.format('DD.MM.YYYY HH:mm')
    : String(value)
}

export function getTagKey (tag) {
  return getEntityKey(tag, item => item?.name || item)
}

export function getTagsKey (task) {
  const tags = Array.isArray(task?.tags) ? task.tags : []
  if (tags.length === 0) {
    return 'none'
  }
  return tags
    .map(tag => getTagKey(tag))
    .sort()
    .join('|')
}

export function getTagsValue (task) {
  return Array.isArray(task?.tags)
    ? task.tags.map(tag => tag?.name || String(tag || '')).filter(Boolean)
    : []
}

export function getSameSelectedTaskValue (checkedTasks, keyGetter, valueGetter, mixedValue) {
  const tasks = Array.isArray(checkedTasks) ? checkedTasks : []
  const firstTask = tasks[0]

  if (!firstTask) {
    return typeof valueGetter === 'function' ? valueGetter(null) : ''
  }

  const firstKey = keyGetter(firstTask)
  const hasMixedValues = tasks.some(task => keyGetter(task) !== firstKey)

  return hasMixedValues ? mixedValue : valueGetter(firstTask)
}

export function isMixedBulkValue (value) {
  if (Array.isArray(value)) {
    return value.length === 1 && isMixedBulkValue(value[0])
  }
  return String(value || '').trim().toLowerCase().startsWith('смешанные')
}
