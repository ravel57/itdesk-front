// Правила: когда при смене статуса заявки нужно запросить причину.

export function getStatusName(status) {
  if (!status) {
    return ''
  }
  return typeof status === 'string' ? status : status.name || ''
}

export function isClosedStatusName(statusName) {
  return ['закрыта', 'закрыто', 'закрыт'].includes(String(statusName || '').trim().toLowerCase())
}

export function isFrozenStatusName(statusName) {
  return ['заморожена', 'заморожено', 'заморожен'].includes(String(statusName || '').trim().toLowerCase())
}

export function isOpenStatusName(statusName) {
  return !!statusName && !isClosedStatusName(statusName) && !isFrozenStatusName(statusName)
}

export function needStatusChangeReason(oldStatusName, newStatusName) {
  const oldName = String(oldStatusName || '').trim()
  const newName = String(newStatusName || '').trim()
  if (!oldName || !newName || oldName.toLowerCase() === newName.toLowerCase()) {
    return false
  }
  if (isClosedStatusName(newName) || isFrozenStatusName(newName)) {
    return true
  }
  return isClosedStatusName(oldName) && isOpenStatusName(newName)
}

export function getStatusChangeReasonTitle(oldStatusName, newStatusName) {
  if (isClosedStatusName(newStatusName)) {
    return 'Причина закрытия заявки'
  }

  if (isFrozenStatusName(newStatusName)) {
    return 'Причина заморозки заявки'
  }

  if (isClosedStatusName(oldStatusName) && isOpenStatusName(newStatusName)) {
    return 'Причина возврата заявки в работу'
  }
  return 'Причина изменения статуса'
}
