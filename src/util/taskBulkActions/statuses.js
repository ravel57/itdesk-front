// Чистые функции по статусам для модалки массовых действий: распознавание по имени, необходимость причины.

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

export function needStatusChangeReason (oldStatusName, newStatusName, task = null) {
  const oldName = String(oldStatusName || '').trim()
  const newName = String(newStatusName || '').trim()

  if (!newName) {
    return false
  }

  if (oldName && oldName.toLowerCase() === newName.toLowerCase()) {
    return false
  }

  if (isClosedStatusName(newName) || isFrozenStatusName(newName)) {
    return true
  }

  return isOpenStatusName(newName) && (
    isClosedStatusName(oldName) ||
    isFrozenStatusName(oldName) ||
    task?.completed === true ||
    task?.frozen === true
  )
}
