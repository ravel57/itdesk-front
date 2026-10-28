// Чистые функции подготовки данных заявки для массового действия.

// Только сегодняшние и будущие даты в q-date
export function dateOption (date) {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return date >= `${year}/${month}/${day}`
}

export function cloneChecklistForBulkAction (task) {
  if (!Array.isArray(task?.checklist)) {
    return []
  }
  return task.checklist
    .filter(item => item && item.text !== undefined && item.text !== null)
    .map(item => ({
      id: item.id,
      text: String(item.text || '').trim(),
      completed: item.completed === true
    }))
}

// Поля, которые не уходят на сервер при PATCH заявки
export function stripClientOnlyTaskFields (task) {
  delete task.client
  delete task.sla
  delete task.originalSla
  delete task.slaInfo
  delete task.slaSecondsLeft
  delete task.slaPercent
  delete task.slaExpired
  delete task.checklistCompleted
  delete task.checklistTotal
  delete task._bulkClientId
  return task
}
