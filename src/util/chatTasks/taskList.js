// Чистая логика списка заявок чата: варианты сортировки, подмена привязанных сообщений,
// фильтрация по поиску и сортировка демо-списка на клиенте.

export const SORTING_TYPES = [
  { label: 'По дедлайну', slug: 'deadline' },
  { label: 'По дате создания', slug: 'creating' },
  { label: 'Приоритету', slug: 'priority' },
  { label: 'SLA', slug: 'sla' },
  { label: 'По статусу', slug: 'status' }
]

// null/null считаются одинаковыми, иначе сравниваем как числа
export function isSameLinkedMessage (currentLinkedMessageId, actualLinkedMessageId) {
  return currentLinkedMessageId === null && actualLinkedMessageId === null
    ? true
    : Number(currentLinkedMessageId) === Number(actualLinkedMessageId)
}

// Список заявок страницы с актуальными linkedMessageId из родительского списка tasks
export function applyActualLinkedMessageIds (pagedTasks, parentTasks) {
  const actualLinkedMessageIdByTaskId = new Map(
    (parentTasks || [])
      .filter(task => task?.id !== undefined && task?.id !== null)
      .map(task => [Number(task.id), task?.linkedMessageId ?? null])
  )
  return (pagedTasks || []).map(task => {
    const taskId = Number(task?.id)
    if (!actualLinkedMessageIdByTaskId.has(taskId)) {
      return task
    }
    const actualLinkedMessageId = actualLinkedMessageIdByTaskId.get(taskId)
    const currentLinkedMessageId = task?.linkedMessageId ?? null
    const sameLinkedMessage = isSameLinkedMessage(currentLinkedMessageId, actualLinkedMessageId)
    return sameLinkedMessage
      ? task
      : {
          ...task,
          linkedMessageId: actualLinkedMessageId
        }
  })
}

export function filterTasksForList (sourceTasks, isShowCompletedTasks, searchText) {
  return sourceTasks.filter(task => {
    if (!task) {
      return false
    }
    const showCompleted = (!task.frozen && !task.completed) || isShowCompletedTasks
    let matchSearch = true
    if (searchText) {
      const search = searchText.toLowerCase()
      matchSearch =
        String(task.name || '').toLowerCase().includes(search) ||
        String(task.id || '').toLowerCase().includes(search) ||
        String(task.priority?.name || '').toLowerCase().includes(search) ||
        String(task.status?.name || '').toLowerCase().includes(search) ||
        (Array.isArray(task.tags) && task.tags.some(tag => String(tag?.name || '').toLowerCase().includes(search)))
    }
    return showCompleted && matchSearch
  })
}

// Сортирует массив на месте (как и раньше) и возвращает его
export function sortTasksForDemo (filteredTasks, slug, ascendingSort, compareTasksBySla) {
  if (ascendingSort) {
    filteredTasks.sort((a, b) => {
      switch (slug) {
        case 'deadline':
          return new Date(a.deadline) - new Date(b.deadline)
        case 'creating':
          return new Date(a.createdAt) - new Date(b.createdAt)
        case 'priority':
          return Number(b.priority?.orderNumber || 0) - Number(a.priority?.orderNumber || 0)
        case 'sla':
          return compareTasksBySla(a, b)
        case 'status':
          return Number(b.status?.orderNumber || 0) - Number(a.status?.orderNumber || 0)
        default:
          return 0
      }
    })
  } else {
    filteredTasks.sort((a, b) => {
      switch (slug) {
        case 'deadline':
          return new Date(b.deadline) - new Date(a.deadline)
        case 'creating':
          return new Date(b.createdAt) - new Date(a.createdAt)
        case 'priority':
          return Number(a.priority?.orderNumber || 0) - Number(b.priority?.orderNumber || 0)
        case 'sla':
          return compareTasksBySla(a, b)
        case 'status':
          return Number(a.status?.orderNumber || 0) - Number(b.status?.orderNumber || 0)
        default:
          return 0
      }
    })
  }
  return filteredTasks
}
