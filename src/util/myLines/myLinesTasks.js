import moment from 'moment'

// Чистые функции страницы «Мои линии», связанные с заявками: нормализация, запрос страницы,
// слияние страниц, группировка по линиям, применение изменённой заявки и расстояние до конца документа.

const DATE_FIELDS = ['createdAt', 'deadline', 'frozenFrom', 'frozenUntil', 'closedAt', 'lastActivity', 'olaDeadline', 'enteredCurrentLineAt']

// Приведение заявки с сервера к виду для TaskCard/TaskDialog: даты → Date, sla → moment, messages всегда массив
export function normalizeLineTask (task) {
  if (!task) return task
  const normalizedTask = {...task}

  DATE_FIELDS.forEach(field => {
    if (normalizedTask[field]) normalizedTask[field] = new Date(normalizedTask[field])
  })

  if (normalizedTask.sla) {
    normalizedTask.sla = {...normalizedTask.sla}
    if (normalizedTask.sla.startDate) {
      normalizedTask.sla.startDate = moment(new Date(normalizedTask.sla.startDate), 'DD.MM.YYYY HH:mm')
    }
    if (normalizedTask.sla.duration !== undefined && normalizedTask.sla.duration !== null) {
      normalizedTask.sla.duration = moment.duration(normalizedTask.sla.duration * 1000)
    }
  }

  normalizedTask.messages = Array.isArray(normalizedTask.messages)
    ? normalizedTask.messages.map(message => ({
      ...message,
      date: message.date ? new Date(message.date) : message.date
    }))
    : []

  return normalizedTask
}

// requestLines — линии, по которым идёт запрос (выбранная или все доступные)
export function buildLinesPageRequest (page, size, search, requestLines) {
  const lineNames = requestLines
    .map(line => String(line?.name || '').trim())
    .filter(Boolean)

  return {
    page,
    size,
    search: search || '',
    includeCompleted: false,
    sortSlug: 'creating',
    ascendingSort: false,
    filterJoinOperator: 'AND',
    filterChain: lineNames.length > 0
      ? [{
          label: 'Линия поддержки',
          slug: 'supportLine',
          selectedOptions: lineNames,
          isBeforeDeadline: false
        }]
      : [],
    requiredFilterChain: []
  }
}

export function mergeLineTasks (currentTasks = [], newTasks = []) {
  const taskById = new Map()
  currentTasks.forEach(task => {
    if (task?.id != null) taskById.set(Number(task.id), task)
  })
  newTasks.forEach(task => {
    if (task?.id != null) taskById.set(Number(task.id), task)
  })
  return Array.from(taskById.values())
}

// Группы «линия → её заявки» в порядке requestLines; линии без заявок и заявки чужих линий пропускаются
export function groupTasksByLine (pagedTasks, currentUserLines, requestLines) {
  const groups = []
  const lineById = new Map(currentUserLines.map(line => [Number(line.id), line]))
  const tasksByLineId = new Map()

  pagedTasks.forEach(task => {
    const lineId = Number(task?.supportLine?.id)
    if (!Number.isFinite(lineId) || !lineById.has(lineId)) {
      return
    }
    if (!tasksByLineId.has(lineId)) {
      tasksByLineId.set(lineId, [])
    }
    tasksByLineId.get(lineId).push(task)
  })

  requestLines.forEach(line => {
    const tasks = tasksByLineId.get(Number(line.id)) || []
    if (tasks.length > 0) {
      groups.push({line, tasks})
    }
  })

  return groups
}

export function isTaskInLines (task, lines) {
  const taskLineId = Number(task?.supportLine?.id)
  if (!Number.isFinite(taskLineId)) return false
  return lines.some(line => Number(line.id) === taskLineId)
}

// Применяет изменённую заявку к списку. inScope — заявка принадлежит текущей области (линиям запроса).
// Завершённая/замороженная/вне области удаляется (total уменьшается, только если она была в списке),
// новая добавляется в начало, существующая обновляется на месте. Возвращает новые tasks и totalElements.
export function applyLineTaskUpsert (tasks, totalElements, normalizedTask, inScope) {
  if (normalizedTask.completed || normalizedTask.frozen || !inScope) {
    const hadTask = tasks.some(item => Number(item.id) === Number(normalizedTask.id))
    return {
      tasks: tasks.filter(item => Number(item.id) !== Number(normalizedTask.id)),
      totalElements: hadTask ? Math.max(0, Number(totalElements || 0) - 1) : totalElements
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
  nextTasks.splice(index, 1, {...nextTasks[index], ...normalizedTask})
  return {tasks: nextTasks, totalElements}
}

// Сколько пикселей осталось до конца страницы
export function getDocumentDistanceToBottom () {
  const documentElement = document.documentElement
  const body = document.body
  const scrollTop = window.scrollY || documentElement.scrollTop || body.scrollTop || 0
  const scrollHeight = Math.max(body.scrollHeight, documentElement.scrollHeight, body.offsetHeight, documentElement.offsetHeight)
  const clientHeight = window.innerHeight || documentElement.clientHeight
  return scrollHeight - scrollTop - clientHeight
}
