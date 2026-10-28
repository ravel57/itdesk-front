// Чистые функции по статусам заявки: распознавание закрытого/замороженного/открытого,
// необходимость причины смены статуса, выбор статуса «по умолчанию» и для возврата в работу.

// Модель статуса (id, name, orderNumber, defaultSelection) не содержит признака замороженного/закрытого,
// поэтому такие статусы распознаются по имени. Имена системных статусов — только здесь.
export const FROZEN_STATUS_NAME = 'Заморожена'
export const CLOSED_STATUS_NAME = 'Закрыта'

const CLOSED_STATUS_NAMES = [CLOSED_STATUS_NAME, 'закрыто', 'закрыт'].map(name => name.toLowerCase())
const FROZEN_STATUS_NAMES = [FROZEN_STATUS_NAME, 'заморожено', 'заморожен'].map(name => name.toLowerCase())

export function getStatusName (status) {
  if (!status) {
    return ''
  }
  return typeof status === 'string' ? status : status.name || ''
}

export function isClosedStatusName (statusName) {
  return CLOSED_STATUS_NAMES.includes(String(statusName || '').trim().toLowerCase())
}

export function isFrozenStatusName (statusName) {
  return FROZEN_STATUS_NAMES.includes(String(statusName || '').trim().toLowerCase())
}

export function isOpenStatusName (statusName) {
  return !!statusName && !isClosedStatusName(statusName) && !isFrozenStatusName(statusName)
}

export function needStatusChangeReason (oldStatusName, newStatusName) {
  const oldName = String(oldStatusName || '').trim()
  const newName = String(newStatusName || '').trim()
  if (!oldName || !newName || oldName.toLowerCase() === newName.toLowerCase()) {
    return false
  }
  if (isClosedStatusName(newName) || isFrozenStatusName(newName)) {
    return true
  }
  return isOpenStatusName(newName) && (
    isClosedStatusName(oldName) ||
    isFrozenStatusName(oldName)
  )
}

export function getStatusChangeReasonTitle (oldStatusName, newStatusName) {
  if (isClosedStatusName(newStatusName)) {
    return 'Причина закрытия заявки'
  }
  if (isFrozenStatusName(newStatusName)) {
    return 'Причина заморозки заявки'
  }
  if (isFrozenStatusName(oldStatusName) && isOpenStatusName(newStatusName)) {
    return 'Причина разморозки заявки'
  }
  if (isClosedStatusName(oldStatusName) && isOpenStatusName(newStatusName)) {
    return 'Причина возврата заявки в работу'
  }
  return 'Причина изменения статуса'
}

export function getReopenStatus (task, statuses) {
  if (task?.previousStatus && isOpenStatusName(task.previousStatus.name)) {
    return task.previousStatus
  }
  return statuses.find(status => isOpenStatusName(status.name) && status.defaultSelection === true) ||
    statuses.find(status => isOpenStatusName(status.name))
}

// Заявка уже заморожена со сроком (есть frozenFrom и frozenUntil)
export function isFrozenWithTimer (task) {
  return task?.frozen === true && !!task?.frozenFrom && !!task?.frozenUntil
}
