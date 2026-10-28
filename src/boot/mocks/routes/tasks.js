import {withPrefix, ok, badRequest, now, clone, genTaskId, genMsgId} from 'src/boot/mocks/helpers'

export function registerTaskMocks(mock, db) {
  // Счётчики в левом меню: «Заявки» (неоткрытые назначенные) и «Инциденты»
  mock.onGet(withPrefix('\\/tasks\\/unopened-assigned-count')).reply(() => ok({count: 4}))
  mock.onPost(withPrefix('\\/incidents-page')).reply(() => ok({totalElements: 4, incidents: [1, 2, 3, 4].map(n => ({id: n, incidentNumber: 'INC-00000' + n, title: 'Демо-инцидент ' + n, severity: 'P2', status: 'DECLARED'}))}))

  // POST /tasks/sla/info — батч SLA: {taskIds: [..]} -> {id: SlaInfoDto}; неизвестные id пропускаются
  mock.onPost(withPrefix('\\/tasks\\/sla\\/info')).reply((config) => {
    const body = JSON.parse(config.data || '{}')
    const taskIds = Array.isArray(body.taskIds) ? body.taskIds : []
    if (taskIds.length > 200) return badRequest('Слишком много заявок в запросе: максимум 200')
    // счётчик для проверки в браузере: window.__mockSlaInfoBatches = [размеры пачек]
    window.__mockSlaInfoBatches = [...(window.__mockSlaInfoBatches || []), taskIds.length]
    const workdaySeconds = 8 * 3600
    const result = {}
    taskIds.forEach(taskId => {
      const task = db.taskPageTasks.find(item => String(item.id) === String(taskId) && item.sla)
      if (!task) return
      const durationSeconds = (Number((String(task.sla.duration).match(/PT(\d+)H/) || [])[1]) || 0) * 3600
      const deadlineMs = new Date(task.sla.startDate).getTime() + durationSeconds * 1000
      result[taskId] = {
        paused: Boolean(task.__mockSlaPaused),
        deadline: new Date(deadlineMs).toISOString(),
        remainingSeconds: Math.round((deadlineMs - now()) / 1000),
        pausedSeconds: task.__mockSlaPaused ? 600 : 0,
        slaWorkingDays: Math.round(durationSeconds / workdaySeconds * 100) / 100,
        workdaySeconds
      }
    })
    return ok(result)
  })

  // POST /tasks-page — упрощённая фильтрация: поиск по названию и исполнитель «Вы»
  mock.onPost(withPrefix('\\/tasks-page')).reply((config) => {
    const body = JSON.parse(config.data || '{}')
    let tasks = clone(db.taskPageTasks)

    if (!body.includeCompleted) {
      tasks = tasks.filter(task => !task.completed)
    }

    const search = String(body.search || '').trim().toLowerCase()
    if (search) {
      tasks = tasks.filter(task => task.name.toLowerCase().includes(search))
    }

    const executorFilter = (body.filterChain || []).find(filter => filter.slug === 'executor')
    if (executorFilter?.selectedOptions?.includes('Вы')) {
      tasks = tasks.filter(task => Number(task.executor?.id) === Number(db.me.id))
    }

    const page = Number(body.page) || 1
    const size = Number(body.size) || 10
    const start = (page - 1) * size
    const pageTasks = tasks.slice(start, start + size)

    return ok({
      tasks: pageTasks,
      page,
      size,
      totalElements: tasks.length,
      totalPages: Math.ceil(tasks.length / size),
      isEnd: start + size >= tasks.length
    })
  })

  // ----------------------------
  // tasks
  // ----------------------------

  // POST /client/{clientId}/task  (создать задачу)
  mock.onPost(withPrefix('\\/client\\/(\\d+)\\/task')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)\/task/)
    const clientId = Number(m?.[1])
    if (Number.isNaN(clientId)) return badRequest('clientId is invalid')

    const body = JSON.parse(config.data || '{}')

    const task = {
      id: genTaskId(),
      clientId,
      title: body.title || 'Новая задача',
      description: body.description || '',
      status: body.status || 'OPEN',
      priority: body.priority || 'MEDIUM',
      tags: Array.isArray(body.tags) ? body.tags : [],
      createdAt: now(),
      deadlineAt: body.deadlineAt || null,
      assigneeId: body.assigneeId || null
    }

    db.tasks.push(task)
    return ok(clone(task))
  })

  // PATCH /client/{clientId}/task  (обновить задачу)
  mock.onPatch(withPrefix('\\/client\\/(\\d+)\\/task')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)\/task/)
    const clientId = Number(m?.[1])
    if (Number.isNaN(clientId)) return badRequest('clientId is invalid')

    const body = JSON.parse(config.data || '{}')
    if (!body.id) return badRequest('task.id required')

    const task = db.tasks.find(t => t.clientId === clientId && String(t.id) === String(body.id))
    if (!task) return badRequest('task not found')

    Object.assign(task, body)
    return ok(clone(task))
  })

  // POST /client/{clientId}/task/{taskId}/message  (сообщение в задачу)
  mock.onPost(withPrefix('\\/client\\/(\\d+)\\/task\\/([^/]+)\\/message')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)\/task\/([^/]+)\/message/)
    const clientId = Number(m?.[1])
    const taskId = String(m?.[2] || '')
    if (!clientId || !taskId) return badRequest('clientId/taskId invalid')

    const task = db.tasks.find(t => t.clientId === clientId && String(t.id) === taskId)
    if (!task) return badRequest('task not found')

    const body = JSON.parse(config.data || '{}')
    const text = String(body?.text || '').trim()
    if (!text) return badRequest('text is empty')

    db.taskMessages.push({
      id: genMsgId(),
      taskId,
      from: 'operator',
      text,
      createdAt: now()
    })

    // контроллер возвращает пустое body (200) или 409 :contentReference[oaicite:3]{index=3}
    return [200]
  })

  // POST /client/{clientId}/task/{taskId}/search-messages
  mock.onPost(withPrefix('\\/client\\/(\\d+)\\/task\\/([^/]+)\\/search-messages')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)\/task\/([^/]+)\/search-messages/)
    const clientId = Number(m?.[1])
    const taskId = String(m?.[2] || '')
    if (!clientId || !taskId) return badRequest('clientId/taskId invalid')

    const body = JSON.parse(config.data || '{}')
    const query = String(body?.text || body?.message || body?.query || '').toLowerCase().trim()

    const out = db.taskMessages
      .filter(x => String(x.taskId) === taskId)
      .filter(x => !query || String(x.text).toLowerCase().includes(query))

    return ok(clone(out))
  })
}
