// Чистые функции по статусам заявки: распознавание закрытого/замороженного/открытого,
// необходимость причины смены статуса, выбор статуса «по умолчанию» и для возврата в работу.

export function getStatusName (status) {
  if (!status) {
    return ''
  }
  return typeof status === 'string' ? status : status.name || ''
}

export function isClosedStatusName (statusName) {
  return ['закрыта', 'закрыто', 'закрыт'].includes(String(statusName || '').trim().toLowerCase())
}

export function isFrozenStatusName (statusName) {
  return ['заморожена', 'заморожено', 'заморожен'].includes(String(statusName || '').trim().toLowerCase())
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

export function getDefaultOpenStatus (statuses) {
  return statuses.find(status => isOpenStatusName(status.name) && status.defaultSelection === true) ||
    statuses.find(status => isOpenStatusName(status.name))
}

export function getReopenStatus (task, statuses) {
  if (task?.previousStatus && isOpenStatusName(task.previousStatus.name)) {
    return task.previousStatus
  }
  return getDefaultOpenStatus(statuses)
}

// Заявка уже заморожена со сроком (есть frozenFrom и frozenUntil)
export function isFrozenWithTimer (task) {
  return task?.frozen === true && !!task?.frozenFrom && !!task?.frozenUntil
}
