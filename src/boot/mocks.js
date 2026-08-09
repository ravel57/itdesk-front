import {boot} from 'quasar/wrappers'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import {api} from 'src/boot/axios'
import {appConfig} from 'src/config/appConfig'

export default boot(() => {
  if (!appConfig.useMocks) return

  // const mock = new MockAdapter(api, { delayResponse: 200 })
  console.log('[MOCK] enabled')

  const mockApi = new MockAdapter(api, {delayResponse: 200})
  const mockAxios = new MockAdapter(axios, {delayResponse: 200})

  // GET /client/{clientId}/messages-page?page=N
  const withPrefix = (pathRegex) => new RegExp(`^(?:\\/api\\/v1)?${pathRegex}(?:\\?.*)?$`)
  const ok = (data) => [200, data]
  const noContent = () => [204]
  // const conflict = (msg = 'Conflict') => [409, { message: msg }]
  const badRequest = (msg = 'Bad Request') => [400, {message: msg}]

  const now = () => Date.now()
  const clone = (x) => JSON.parse(JSON.stringify(x))

  let nextTaskId = 100
  let nextMsgId = 1000

  const genTaskId = () => (nextTaskId++).toString()
  const genMsgId = () => (nextMsgId++).toString()

  // ----------------------------
  // in-memory mock DB
  // ----------------------------
  const db = {
    me: {
      id: 1,
      username: 'dev',
      firstname: 'Dev',
      lastname: 'User',
      role: 'ADMIN'
    },

    users: [
      {id: 1, username: 'dev', firstname: 'Dev', lastname: 'User', role: 'ADMIN'},
      {id: 2, username: 'operator', firstname: 'Олег', lastname: 'Оператор', role: 'OPERATOR'}
    ],

    roles: ['ADMIN', 'OPERATOR', 'OBSERVER'],

    organizations: [
      {id: 1, name: 'ООО Ромашка'},
      {id: 2, name: 'ИП Иванов'}
    ],

    tags: [
      {id: 1, name: 'Срочно'},
      {id: 2, name: 'Принтер'},
      {id: 3, name: 'Интернет'}
    ],

    statuses: [
      {id: 1, name: 'OPEN', isDefault: true},
      {id: 2, name: 'IN_PROGRESS', isDefault: false},
      {id: 3, name: 'DONE', isDefault: false}
    ],

    priorities: [
      {id: 1, name: 'LOW', isDefault: true},
      {id: 2, name: 'MEDIUM', isDefault: false},
      {id: 3, name: 'HIGH', isDefault: false}
    ],

    templates: [
      {id: 1, name: 'Приветствие', text: 'Здравствуйте! Сейчас проверю и вернусь с ответом.'},
      {id: 2, name: 'Сбор данных', text: 'Уточните, пожалуйста: ОС, ошибка, когда началось, что менялось?'}
    ],

    knowledgeBase: [
      {id: 1, title: 'Гайд: Принтер не печатает', text: '1) Проверь кабель\n2) Перезапусти очередь печати\n3) Драйвер'},
      {id: 2, title: 'Гайд: Интернет не работает', text: '1) Проверить кабель\n2) IP\n3) DNS\n4) Перезапуск роутера'}
    ],

    clients: [
      {
        id: 10,
        firstname: 'Иван',
        lastname: 'Петров',
        organizationId: 1,
        phoneNumber: '+7 999 111-22-33',
        telegramId: '@ivanpetrov',
        moreInfo: 'Склад, 1 этаж'
      },
      {
        id: 11,
        firstname: 'Анна',
        lastname: 'Сидорова',
        organizationId: 2,
        phoneNumber: '+7 999 444-55-66',
        telegramId: '@annasid',
        moreInfo: 'Офис 203'
      }
    ],

    // tasks per client
    tasks: [
      {
        id: 't1',
        clientId: 10,
        title: 'Не работает принтер',
        description: 'Не печатает, мигает лампочка',
        status: 'OPEN',
        priority: 'MEDIUM',
        tags: ['Принтер'],
        createdAt: now() - 60 * 60 * 1000,
        deadlineAt: now() + 6 * 60 * 60 * 1000,
        assigneeId: 2
      },
      {
        id: 't2',
        clientId: 11,
        title: 'Не открывается сайт',
        description: 'Сайт не грузится, ошибка DNS',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        tags: ['Интернет', 'Срочно'],
        createdAt: now() - 2 * 60 * 60 * 1000,
        deadlineAt: now() + 2 * 60 * 60 * 1000,
        assigneeId: 1
      }
    ],

    // messages per client (чат клиента)
    clientMessages: [
      {
        id: 'm1',
        clientId: 10,
        from: 'client',
        text: 'Принтер мигает и не печатает',
        createdAt: now() - 45 * 60 * 1000
      },
      {
        id: 'm2',
        clientId: 10,
        from: 'operator',
        text: 'Понял, проверю. Подключение по USB или по сети?',
        createdAt: now() - 43 * 60 * 1000
      },
      {
        id: 'm3',
        clientId: 11,
        from: 'client',
        text: 'Не открывается сайт, пишет DNS_PROBE_FINISHED',
        createdAt: now() - 90 * 60 * 1000
      }
    ],

    // messages per task (обсуждение задачи)
    taskMessages: [
      {
        id: 'tm1',
        taskId: 't1',
        from: 'operator',
        text: 'Проверьте кабель питания и USB.',
        createdAt: now() - 40 * 60 * 1000
      }
    ]
  }

  // ----------------------------
  // matchers
  // ----------------------------
  const apply = (mock) => {
    // GET /clients
    mock.onGet(withPrefix('\\/clients')).reply(() => ok(clone(db.clients)))

    // GET /users
    mock.onGet(withPrefix('\\/users')).reply(() => ok(clone(db.users)))

    // GET /roles
    mock.onGet(withPrefix('\\/roles')).reply(() => ok(clone(db.roles)))

    // GET /organizations
    mock.onGet(withPrefix('\\/organizations')).reply(() => ok(clone(db.organizations)))

    // GET /tags
    mock.onGet(withPrefix('\\/tags')).reply(() => ok(clone(db.tags)))

    // GET /statuses
    mock.onGet(withPrefix('\\/statuses')).reply(() => ok(clone(db.statuses)))

    // GET /priorities
    mock.onGet(withPrefix('\\/priorities')).reply(() => ok(clone(db.priorities)))

    // GET /templates
    mock.onGet(withPrefix('\\/templates')).reply(() => ok(clone(db.templates)))

    // GET /filters
    mock.onGet(withPrefix('\\/filters')).reply(() => ok([]))

    // GET /license-info
    mock.onGet(withPrefix('\\/license-info')).reply(() =>
      ok({
        maxUsers: 999,
        usedUsersCount: 2,
        availableUsersCount: 997,
        licenseUntil: '2099-12-31',
        roleCounts: [
          {code: 'ADMIN', name: 'Администратор', count: 1, countsTowardsLicense: true},
          {code: 'MANAGER', name: 'Менеджер поддержки', count: 0, countsTowardsLicense: true},
          {code: 'OPERATOR', name: 'Оператор поддержки', count: 1, countsTowardsLicense: true},
          {code: 'OBSERVER', name: 'Менеджер организации', count: 0, countsTowardsLicense: false},
          {code: 'CLIENT', name: 'Клиент', count: 0, countsTowardsLicense: false}
        ]
      })
    )


    // GET /llm/query?query=...
    mock.onGet(withPrefix('\\/llm/query')).reply((config) => {
      const q = config.params?.query || ''
      return ok({
        answer: `MOCK LLM ANSWER: ${q}`,
        context: []
      })
    })

    // GET /knowledge-base
    mock.onGet(withPrefix('\\/knowledge-base')).reply(() => ok(clone(db.knowledgeBase)))

    // ----------------------------
    // client chat
    // ----------------------------

    mock.onGet(withPrefix('\\/client\\/(\\d+)\\/messages-page')).reply((config) => {
      const m = config.url.match(/\/client\/(\d+)\/messages-page/)
      const clientId = Number(m?.[1])

      // clientId=0 — просто пусто
      if (Number.isNaN(clientId) || clientId === 0) {
        return ok({messages: [], isEnd: true})
      }

      // page читаем из query params
      const page = Number(config.params?.page ?? 1)

      const messages = [
        {
          id: 'm1',
          date: new Date().toISOString(),
          text: `MOCK: clientId=${clientId}, page=${page}`,
          from: 'client'
        },
        {
          id: 'm2',
          date: new Date().toISOString(),
          text: 'MOCK: ответ оператора',
          from: 'operator'
        }
      ]

      return ok({
        messages,
        isEnd: true
      })
    })

    // POST /client/{clientId}/message  (отправить сообщение клиенту)
    mock.onPost(withPrefix('\\/client\\/(\\d+)\\/message')).reply((config) => {
      const m = config.url.match(/\/client\/(\d+)\/message/)
      const clientId = Number(m?.[1])
      if (Number.isNaN(clientId)) return badRequest('clientId is invalid')

      const body = JSON.parse(config.data || '{}')
      const text = String(body?.text || '').trim()
      if (!text) return badRequest('text is empty')

      db.clientMessages.push({
        id: genMsgId(),
        clientId,
        from: 'operator',
        text,
        createdAt: now()
      })

      // у тебя контроллер возвращает true/409 :contentReference[oaicite:2]{index=2}
      return ok(true)
    })

    // POST /client/{clientId}/search-messages  (поиск по чату клиента)
    mock.onPost(withPrefix('\\/client\\/(\\d+)\\/search-messages')).reply((config) => {
      const m = config.url.match(/\/client\/(\d+)\/search-messages/)
      const clientId = Number(m?.[1])
      if (Number.isNaN(clientId)) return badRequest('clientId is invalid')

      const body = JSON.parse(config.data || '{}')
      const query = String(body?.text || body?.message || body?.query || '').toLowerCase().trim()

      const out = db.clientMessages
        .filter(x => x.clientId === clientId)
        .filter(x => !query || String(x.text).toLowerCase().includes(query))

      return ok(clone(out))
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

    // ----------------------------
    // admin crud (минимально, чтобы UI не падал)
    // ----------------------------

    // POST /tag
    mock.onPost(withPrefix('\\/tag')).reply((config) => {
      const body = JSON.parse(config.data || '{}')
      const name = String(body?.name || '').trim()
      if (!name) return badRequest('name required')

      const id = Math.max(0, ...db.tags.map(t => t.id)) + 1
      const tag = {id, name}
      db.tags.push(tag)
      return ok(clone(tag))
    })

    // PATCH /tag
    mock.onPatch(withPrefix('\\/tag')).reply((config) => {
      const body = JSON.parse(config.data || '{}')
      const id = Number(body?.id)
      const name = String(body?.name || '').trim()
      if (!id || !name) return badRequest('id/name required')

      const tag = db.tags.find(t => t.id === id)
      if (!tag) return badRequest('tag not found')

      tag.name = name
      return ok(clone(tag))
    })

    // DELETE /tag/{tagId}
    mock.onDelete(withPrefix('\\/tag\\/(\\d+)')).reply((config) => {
      const m = config.url.match(/\/tag\/(\d+)/)
      const tagId = Number(m?.[1])
      if (!tagId) return badRequest('tagId invalid')

      db.tags = db.tags.filter(t => t.id !== tagId)
      return noContent()
    })

    // ----------------------------
    // fallback
    // ----------------------------
    mock.onAny().reply((config) => {
      console.warn('[MOCK] No handler:', config.method?.toUpperCase(), config.url)
      return [404, {message: `No mock for ${config.method?.toUpperCase()} ${config.url}`}]
    })
  }

  apply(mockApi)
  apply(mockAxios)
})
