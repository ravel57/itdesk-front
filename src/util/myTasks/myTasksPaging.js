// Чистые функции постраничной загрузки страницы «Мои заявки»: запрос к серверу, слияние страниц,
// обновление списка после изменения заявки и расстояние до конца документа для подгрузки по прокрутке.

export function buildMyTasksPageRequest (page, size, search) {
  return {
    page,
    size,
    search: search || '',
    includeCompleted: false,
    sortSlug: 'creating',
    ascendingSort: false,
    filterJoinOperator: 'AND',
    filterChain: [
      {
        label: 'Исполнитель',
        slug: 'executor',
        selectedOptions: ['Вы']
      }
    ],
    requiredFilterChain: []
  }
}

// Объединяет уже загруженные заявки с новой страницей по id (новые затирают старые, порядок — по первому появлению)
export function mergeMyTasks (currentTasks = [], newTasks = []) {
  const taskById = new Map()

  currentTasks.forEach(task => {
    if (task?.id !== undefined && task?.id !== null) {
      taskById.set(Number(task.id), task)
    }
  })

  newTasks.forEach(task => {
    if (task?.id !== undefined && task?.id !== null) {
      taskById.set(Number(task.id), task)
    }
  })

  return Array.from(taskById.values())
}

// Применяет изменённую заявку к списку: завершённая/замороженная уходит из списка,
// новая добавляется в начало, существующая обновляется на месте. Возвращает новые tasks и totalElements.
export function applyMyTaskUpsert (tasks, totalElements, normalizedTask) {
  if (normalizedTask.completed || normalizedTask.frozen) {
    return {
      tasks: tasks.filter(item => Number(item.id) !== Number(normalizedTask.id)),
      totalElements: Math.max(0, Number(totalElements || 0) - 1)
    }
  }
  const index = tasks.findIndex(item => Number(item.id) === Number(normalizedTask.id))
  if (index === -1) {
    return {
      tasks: [normalizedTask, ...tasks],
      totalElements: Number(totalElements || 0) + 1
    }
  }
  const nextTasks = [...tasks]
  nextTasks.splice(index, 1, {
    ...nextTasks[index],
    ...normalizedTask
  })
  return { tasks: nextTasks, totalElements }
}

// Сколько пикселей осталось до конца страницы
export function getDocumentDistanceToBottom () {
  const documentElement = document.documentElement
  const body = document.body
  const scrollTop = window.scrollY || documentElement.scrollTop || body.scrollTop || 0
  const scrollHeight = Math.max(
    body.scrollHeight,
    documentElement.scrollHeight,
    body.offsetHeight,
    documentElement.offsetHeight
  )
  const clientHeight = window.innerHeight || documentElement.clientHeight
  return scrollHeight - scrollTop - clientHeight
}

export function getMyTaskChatLink (id, task = null) {
  if (task?.__demo) {
    return '#'
  }
  const origin = window.location.origin
  return `${origin}/chats/${id}`
}
