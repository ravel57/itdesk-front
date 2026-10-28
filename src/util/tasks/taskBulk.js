// Чистые функции массовых действий над заявками: снимки для undo/redo, статусы, тексты диалога причины.

export function cloneBulkTask (task) {
  const seen = new WeakSet()

  return JSON.parse(JSON.stringify(task, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString()
    }

    if (typeof value === 'function' || typeof value === 'symbol') {
      return undefined
    }

    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        return undefined
      }
      seen.add(value)
    }

    return value
  }))
}

export function areBulkTasksEqual (firstTask, secondTask) {
  return JSON.stringify(cloneBulkTask(firstTask)) === JSON.stringify(cloneBulkTask(secondTask))
}

// Копия заявки без вычисляемых на клиенте полей — для PATCH на сервер
export function sanitizeBulkTaskForSave (task) {
  const sanitizedTask = cloneBulkTask(task)
  delete sanitizedTask.originalSla
  delete sanitizedTask.slaInfo
  delete sanitizedTask.slaSecondsLeft
  delete sanitizedTask.slaPercent
  delete sanitizedTask.slaExpired
  delete sanitizedTask.checklistCompleted
  delete sanitizedTask.checklistTotal
  delete sanitizedTask._bulkClientId
  if (sanitizedTask.client && Array.isArray(sanitizedTask.client.tasks)) {
    delete sanitizedTask.client.tasks
  }
  return sanitizedTask
}

// Первый найденный clientId среди кандидатов (заявка, запасная заявка, заявка из store и т.п.)
export function findBulkClientId (candidates) {
  for (const candidate of candidates) {
    const client = candidate?.client
    const clientId = candidate?._bulkClientId ||
      candidate?.clientId ||
      candidate?.client_id ||
      candidate?.client?.id ||
      candidate?.client?.clientId ||
      (typeof client === 'number' ? client : null)

    if (clientId) {
      return clientId
    }
  }

  return null
}

export function getBulkActionLabel (action) {
  switch (action) {
    case 'close':
      return 'закрытие заявок'
    case 'open':
      return 'возврат заявок в работу'
    case 'freeze':
      return 'заморозка заявок'
    case 'supportLine':
      return 'смена линии поддержки'
    case 'executor':
      return 'смена исполнителя'
    case 'status':
      return 'смена статуса'
    case 'priority':
      return 'смена приоритета'
    case 'type':
      return 'смена типа заявки'
    case 'service':
      return 'смена сервиса'
    case 'tags':
      return 'смена тегов'
    case 'deadline':
      return 'смена дедлайна'
    default:
      return 'массовое действие'
  }
}

export function isBulkReasonRequired (action) {
  return ['close', 'open'].includes(action)
}

// Горячие клавиши undo/redo не срабатывают, пока фокус в поле ввода
export function isBulkHistoryShortcutTargetIgnored (target) {
  const tagName = target?.tagName?.toLowerCase()
  return target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName)
}

// ---- статусы ----

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

export function needBulkStatusChangeReason (oldStatusName, newStatusName, task = null) {
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

  if (!isOpenStatusName(newName)) {
    return false
  }

  return isClosedStatusName(oldName) || isFrozenStatusName(oldName) || task?.completed === true || task?.frozen === true
}

// Разбирает аргументы requestStatusChangeReason от модалки массовых действий.
// checkedTasks — выбранные заявки из store (значение по умолчанию для tasks).
export function getBulkStatusReasonPayload (payload = {}, maybeNewStatus = null, checkedTasks = []) {
  if (typeof payload === 'string' || maybeNewStatus !== null) {
    return {
      oldStatusName: getStatusName(payload),
      newStatusName: getStatusName(maybeNewStatus),
      tasks: checkedTasks || []
    }
  }

  return {
    oldStatusName: getStatusName(payload.oldStatus || payload.oldStatusName),
    newStatusName: getStatusName(payload.newStatus || payload.status || payload.newStatusName),
    tasks: payload.tasks || checkedTasks || []
  }
}

export function getBulkStatusReasonAffectedTasks (oldStatusName, newStatusName, tasks) {
  const checkedTasks = tasks || []
  const affectedTasks = checkedTasks.filter(task => needBulkStatusChangeReason(
    getStatusName(task?.status) || oldStatusName,
    newStatusName,
    task
  ))

  if (affectedTasks.length > 0) {
    return affectedTasks
  }

  if (needBulkStatusChangeReason(oldStatusName, newStatusName)) {
    return checkedTasks.length > 0
      ? checkedTasks
      : [{
          status: oldStatusName,
          completed: isClosedStatusName(oldStatusName),
          frozen: isFrozenStatusName(oldStatusName)
        }]
  }

  return []
}

// Заголовок и текст диалога причины при смене статуса
export function buildBulkStatusReasonDialogTexts (affectedTasks, newStatusName) {
  const isClosing = affectedTasks.some(task =>
    isClosedStatusName(newStatusName) &&
    !isClosedStatusName(getStatusName(task?.status))
  )
  const isFreezing = affectedTasks.some(task =>
    isFrozenStatusName(newStatusName) &&
    !isFrozenStatusName(getStatusName(task?.status))
  )
  const isReopening = affectedTasks.some(task =>
    isOpenStatusName(newStatusName) &&
    (
      isClosedStatusName(getStatusName(task?.status)) ||
      isFrozenStatusName(getStatusName(task?.status)) ||
      task?.completed === true ||
      task?.frozen === true
    )
  )

  if (isClosing && !isFreezing && !isReopening) {
    return {
      title: 'Причина закрытия заявок',
      message: `Будет закрыто заявок: ${affectedTasks.length}. Укажите причину закрытия.`
    }
  } else if (isFreezing && !isClosing && !isReopening) {
    return {
      title: 'Причина заморозки заявок',
      message: `Будет заморожено заявок: ${affectedTasks.length}. Укажите причину заморозки.`
    }
  } else if (isReopening && !isClosing && !isFreezing) {
    return {
      title: 'Причина возврата заявок в работу',
      message: `Будет возвращено в работу заявок: ${affectedTasks.length}. Укажите причину возврата.`
    }
  }
  return {
    title: 'Причина изменения статуса заявок',
    message: `Будет изменён тип состояния заявок: ${affectedTasks.length}. Укажите причину.`
  }
}

// Заголовок диалога причины (customTitle — заданный явно, имеет приоритет)
export function resolveBulkReasonDialogTitle (pendingBulkAction, customTitle) {
  if (customTitle) {
    return customTitle
  }

  switch (pendingBulkAction) {
    case 'close':
      return 'Причина закрытия заявок'
    case 'open':
      return 'Причина возврата заявок в работу'
    default:
      return 'Причина изменения заявок'
  }
}

// getCheckedCount — функция, возвращающая число выбранных заявок (вызывается, только если текст не задан явно)
export function resolveBulkReasonDialogMessage (pendingBulkAction, customMessage, getCheckedCount) {
  if (customMessage) {
    return customMessage
  }

  const checkedCount = getCheckedCount()

  switch (pendingBulkAction) {
    case 'close':
      return `Будет закрыто заявок: ${checkedCount}. Укажите причину закрытия.`
    case 'open':
      return `Будет возвращено в работу заявок: ${checkedCount}. Укажите причину возврата.`
    default:
      return `Будет изменено заявок: ${checkedCount}. Укажите причину.`
  }
}

export function resolveBulkReasonConfirmLabel (pendingBulkAction) {
  if (pendingBulkAction === 'close') {
    return 'Закрыть'
  }

  return 'Продолжить'
}

// Заявка для массового закрытия (без служебных клиентских полей)
export function buildBulkCloseTaskPayload (originalTask, closedStatus, reason) {
  const task = {
    ...cloneBulkTask(originalTask),
    completed: true,
    frozen: false,
    frozenFrom: null,
    frozenUntil: null,
    statusChangeReason: reason
  }

  if (closedStatus) {
    task.status = closedStatus
  }

  return sanitizeBulkTaskForSave(task)
}
