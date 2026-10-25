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
      role: 'ADMIN',
      authorities: ['ADMIN'],
      welcomeSeen: true,
      taskCardFieldsConfig: null,
      onboardingProgress: {}
    },

    users: [
      {id: 1, username: 'dev', firstname: 'Dev', lastname: 'User', role: 'ADMIN', authorities: ['ADMIN']},
      {id: 2, username: 'operator', firstname: 'Олег', lastname: 'Оператор', role: 'OPERATOR', authorities: ['OPERATOR']}
    ],

    roles: ['ADMIN', 'OPERATOR', 'OBSERVER'],

    // Общие настройки (Настройки → Общее); по умолчанию «Требует ответа» считается календарно
    generalSettings: {
      timezone: 'Europe/Moscow',
      workingTimeEnabled: true,
      workdayStart: '09:00',
      workdayEnd: '18:00',
      mondayEnabled: true,
      tuesdayEnabled: true,
      wednesdayEnabled: true,
      thursdayEnabled: true,
      fridayEnabled: true,
      saturdayEnabled: false,
      sundayEnabled: false,
      supportLineAccessMode: 'HYBRID',
      answerWaitingWorkingTimeEnabled: false,
      slaOrangeStartPercent: 50,
      slaRedStartPercent: 25
    },
    supportLines: [
      {
        id: 1,
        name: '1-я линия',
        level: 1,
        responsible: {id: 1, firstname: 'Dev', lastname: 'User'},
        members: [{id: 1, firstname: 'Dev', lastname: 'User'}, {id: 2, firstname: 'Олег', lastname: 'Оператор'}],
        observers: []
      },
      {
        id: 2,
        name: '2-я линия',
        level: 2,
        responsible: {id: 2, firstname: 'Олег', lastname: 'Оператор'},
        members: [{id: 2, firstname: 'Олег', lastname: 'Оператор'}],
        observers: []
      }
    ],

    taskTypes: [
      {id: 1, name: 'Инцидент'},
      {id: 2, name: 'Запрос на обслуживание'}
    ],

    services: [
      {id: 1, code: 'PRINT', name: 'Печать и сканирование', active: true, assignments: [
        {id: 1, organization: {id: 1, name: 'ООО Ромашка'}, active: true},
        {id: 2, organization: {id: 2, name: 'ИП Иванов'}, active: true},
        {id: 5, organization: {id: 3, name: 'АО Вектор'}, active: true}
      ]},
      {id: 2, code: 'NET', name: 'Сеть и интернет', active: true, assignments: [
        {id: 3, organization: {id: 1, name: 'ООО Ромашка'}, active: true}
      ]},
      {id: 3, code: 'MAIL', name: 'Почта', active: true, assignments: []}
    ],

    // Задачи для /api/v1/tasks-page (отдельно от db.tasks — там упрощённая форма для чат-эндпоинтов)
    taskPageTasks: [
      {
        id: 'tp1',
        name: 'Не работает принтер',
        description: 'Принтер на 3 этаже мигает лампочкой и не печатает',
        status: {id: 1, name: 'OPEN'},
        priority: {id: 3, name: 'HIGH'},
        executor: {id: 1, firstname: 'Dev', lastname: 'User'},
        supportLine: {id: 1, name: '1-я линия', level: 1},
        organization: {id: 1, name: 'ООО Ромашка'},
        service: {id: 1, name: 'Печать и сканирование'},
        tags: [{id: 2, name: 'Принтер'}],
        clientId: 10,
        client: {id: 10, firstname: 'Иван', lastname: 'Петров'},
        createdAt: new Date(now() - 60 * 60 * 1000).toISOString(),
        deadline: new Date(now() + 6 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(now() - 10 * 60 * 1000).toISOString(),
        completed: false,
        frozen: false,
        unreadPingTasksMessages: 0,
        checklist: [],
        messages: []
      },
      {
        id: 'tp2',
        name: 'Не открывается сайт',
        description: 'Сайт не грузится, ошибка DNS_PROBE_FINISHED',
        status: {id: 2, name: 'IN_PROGRESS'},
        priority: {id: 2, name: 'MEDIUM'},
        executor: {id: 1, firstname: 'Dev', lastname: 'User'},
        supportLine: {id: 1, name: '1-я линия', level: 1},
        organization: {id: 2, name: 'ИП Иванов'},
        service: {id: 2, name: 'Сеть и интернет'},
        tags: [{id: 3, name: 'Интернет'}, {id: 1, name: 'Срочно'}],
        clientId: 11,
        client: {id: 11, firstname: 'Анна', lastname: 'Сидорова'},
        createdAt: new Date(now() - 2 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(now() + 2 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(now() - 5 * 60 * 1000).toISOString(),
        completed: false,
        frozen: false,
        unreadPingTasksMessages: 2,
        checklist: [],
        messages: []
      },
      {
        id: 'tp3',
        name: 'Настройка почты',
        description: 'Нужно настроить почтовый клиент на новом ноутбуке',
        status: {id: 1, name: 'OPEN'},
        priority: {id: 1, name: 'LOW'},
        executor: {id: 2, firstname: 'Олег', lastname: 'Оператор'},
        supportLine: {id: 2, name: '2-я линия', level: 2},
        organization: {id: 1, name: 'ООО Ромашка'},
        service: {id: 3, name: 'Почта'},
        tags: [],
        clientId: 10,
        client: {id: 10, firstname: 'Иван', lastname: 'Петров'},
        createdAt: new Date(now() - 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(now() + 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(now() - 20 * 60 * 60 * 1000).toISOString(),
        completed: false,
        frozen: false,
        unreadPingTasksMessages: 0,
        checklist: [],
        messages: []
      },
      {
        id: 'tp4',
        name: 'Замена картриджа',
        description: 'Картридж закончился, нужна замена',
        status: {id: 3, name: 'DONE'},
        priority: {id: 1, name: 'LOW'},
        executor: {id: 1, firstname: 'Dev', lastname: 'User'},
        supportLine: {id: 1, name: '1-я линия', level: 1},
        organization: {id: 1, name: 'ООО Ромашка'},
        service: {id: 1, name: 'Печать и сканирование'},
        tags: [{id: 2, name: 'Принтер'}],
        clientId: 10,
        client: {id: 10, firstname: 'Иван', lastname: 'Петров'},
        createdAt: new Date(now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: new Date(now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed: true,
        frozen: false,
        unreadPingTasksMessages: 0,
        checklist: [],
        messages: []
      },
      // Заявки с SLA и числовыми id — для проверки батчевой загрузки /tasks/sla/info
      ...[
        {hours: 8, leftHours: 6, paused: false},
        {hours: 8, leftHours: 3, paused: false},
        {hours: 8, leftHours: 1, paused: false},
        {hours: 8, leftHours: -1, paused: false},
        {hours: 4, leftHours: 2, paused: true},
        {hours: 24, leftHours: 20, paused: false}
      ].map((item, index) => ({
        id: 9101 + index,
        name: `Заявка с SLA №${index + 1}`,
        description: 'Демо-заявка для проверки батчевой загрузки SLA',
        status: {id: 1, name: 'OPEN'},
        priority: {id: 2, name: 'MEDIUM'},
        executor: {id: 1, firstname: 'Dev', lastname: 'User'},
        supportLine: {id: 1, name: '1-я линия', level: 1},
        organization: {id: 1, name: 'ООО Ромашка'},
        service: {id: 1, name: 'Печать и сканирование'},
        tags: [],
        clientId: 10,
        client: {id: 10, firstname: 'Иван', lastname: 'Петров'},
        createdAt: new Date(now() - (item.hours - item.leftHours) * 60 * 60 * 1000).toISOString(),
        lastActivity: new Date(now() - 15 * 60 * 1000).toISOString(),
        completed: false,
        frozen: false,
        unreadPingTasksMessages: 0,
        checklist: [],
        messages: [],
        sla: {
          startDate: new Date(now() - (item.hours - item.leftHours) * 60 * 60 * 1000).toISOString(),
          duration: `PT${item.hours}H`
        },
        __mockSlaPaused: item.paused
      }))
    ],

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
      {id: 1, title: 'Гайд: Принтер не печатает', text: '1) Проверь кабель\n2) Перезапусти очередь печати\n3) Драйвер', tags: [{id: 2, name: 'Принтер'}]},
      {id: 2, title: 'Гайд: Интернет не работает', text: '1) Проверить кабель\n2) IP\n3) DNS\n4) Перезапуск роутера', tags: [{id: 3, name: 'Интернет'}]}
    ],

    clients: [
      {
        id: 10,
        firstname: 'Иван',
        lastname: 'Петров',
        organization: {id: 1, name: 'ООО Ромашка'},
        phoneNumber: '+7 999 111-22-33',
        telegramId: '@ivanpetrov',
        moreInfo: 'Склад, 1 этаж',
        unreadMessagesCount: 2,
        hasCriticalTasks: true,
        unreadPingMessages: {1: 1},
        lastMessage: {
          date: new Date(now() - 12 * 60 * 1000).toISOString(),
          text: 'Добрый день! Принтер на складе опять мигает жёлтым и не берёт бумагу из второго лотка, уже пробовали перезагрузить'
        }
      },
      {
        id: 11,
        firstname: 'Анна',
        lastname: 'Сидорова',
        organization: {id: 2, name: 'ИП Иванов'},
        phoneNumber: '+7 999 444-55-66',
        telegramId: '@annasid',
        moreInfo: 'Офис 203',
        lastMessage: {
          date: new Date(now() - 40 * 60 * 1000).toISOString(),
          text: 'Хочу уточнить статус по моей заявке'
        }
      },
      {
        id: 12,
        firstname: null,
        lastname: null,
        organization: null,
        phoneNumber: '+7 999 777-88-99',
        moreInfo: 'Имя не указано — для проверки fallback',
        lastMessage: {
          date: new Date(now() - 2 * 60 * 1000).toISOString(),
          text: 'Здравствуйте, подскажите пожалуйста по моему вопросу'
        }
      },

      // Галерея индикаторов «требует внимания» в списке чатов: один вариант на клиента
      ...(() => {
        const minutes = count => count * 60 * 1000
        const hours = count => count * 60 * 60 * 1000
        const sla = (totalHours, leftHours) => ({
          minimalSlaTaskId: 9000,
          minimalSlaStartDate: new Date(now() - hours(totalHours - leftHours)).toISOString(),
          minimalSlaDurationSeconds: totalHours * 3600,
          minimalSlaDeadline: new Date(now() + hours(leftHours)).toISOString(),
          minimalSlaPaused: false
        })
        const variants = [
          {title: 'Критическая заявка', extra: {hasCriticalTasks: true}},
          {title: 'Упоминание @', extra: {unreadPingMessages: {1: 1}}},
          {title: 'Критическая + @', extra: {hasCriticalTasks: true, unreadPingMessages: {1: 1}}},
          {title: 'Непрочитанных: 1', extra: {unreadMessagesCount: 1}},
          {title: 'Непрочитанных: 128', extra: {unreadMessagesCount: 128}},
          {title: 'Ждёт ответа 7 минут', extra: {firstUnansweredMessageDate: new Date(now() - minutes(7)).toISOString()}},
          {title: 'Ждёт ответа 3 ч 20 м', extra: {firstUnansweredMessageDate: new Date(now() - minutes(200)).toISOString()}},
          {title: 'Ждёт ответа 2 дня', extra: {firstUnansweredMessageDate: new Date(now() - hours(50)).toISOString()}},
          {title: 'SLA в норме (>50%)', extra: sla(8, 6)},
          {title: 'SLA на исходе (<50%)', extra: sla(8, 3)},
          {title: 'SLA критично (<25%)', extra: sla(8, 1)},
          {title: 'SLA просрочен', extra: sla(8, -1)},
          {
            title: 'Всё сразу',
            extra: {
              hasCriticalTasks: true,
              unreadPingMessages: {1: 1},
              unreadMessagesCount: 5,
              firstUnansweredMessageDate: new Date(now() - minutes(65)).toISOString(),
              ...sla(8, 1)
            }
          }
        ]
        const channels = ['TELEGRAM', 'WHATSAPP', 'EMAIL']
        return variants.map((variant, index) => ({
          id: 100 + index,
          firstname: variant.title,
          lastname: 'Пример:',
          organization: {id: 1, name: 'ООО Ромашка'},
          phoneNumber: `+7 900 000-00-${String(index).padStart(2, '0')}`,
          messageFrom: channels[index % channels.length],
          lastMessage: {
            date: new Date(now() - minutes(5 + index)).toISOString(),
            text: 'Демонстрационное сообщение для проверки индикатора'
          },
          ...variant.extra
        }))
      })()
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

    // Счётчики в левом меню: «Заявки» (неоткрытые назначенные) и «Инциденты»
    mock.onGet(withPrefix('\\/tasks\\/unopened-assigned-count')).reply(() => ok({count: 4}))
    mock.onPost(withPrefix('\\/incidents-page')).reply(() => ok({totalElements: 4, incidents: [1, 2, 3, 4].map(n => ({id: n, incidentNumber: 'INC-00000' + n, title: 'Демо-инцидент ' + n, severity: 'P2', status: 'DECLARED'}))}))

    // PATCH /client/{clientId}/client — редактирование карточки клиента
    mock.onPatch(withPrefix('\\/client\\/(\\d+)\\/client')).reply((config) => {
      const m = config.url.match(/\/client\/(\d+)\/client/)
      const clientId = Number(m?.[1])
      const client = db.clients.find(item => item.id === clientId)
      if (!client) {
        return badRequest('Клиент не найден')
      }
      const body = JSON.parse(config.data || '{}')
      client.lastname = body.lastname ?? client.lastname
      client.firstname = body.firstname ?? client.firstname
      client.moreInfo = body.moreInfo ?? client.moreInfo
      if (typeof body.organization === 'string') {
        const found = db.organizations.find(org => org.name === body.organization)
        client.organization = found ? {...found} : {id: null, name: body.organization}
      }
      return ok(clone(client))
    })

    // DELETE /client/{clientId}
    mock.onDelete(withPrefix('\\/client\\/(\\d+)')).reply((config) => {
      const m = config.url.match(/\/client\/(\d+)/)
      const clientId = Number(m?.[1])
      db.clients = db.clients.filter(item => item.id !== clientId)
      return noContent()
    })

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
    // auth / session / permissions
    // ----------------------------

    // GET /user/current
    mock.onGet(withPrefix('\\/user\\/current')).reply(() => ok(clone(db.me)))

    // GET/PATCH /settings/general — общие настройки; GET /settings/answer-waiting — как считать «Требует ответа»
    mock.onGet(withPrefix('\\/settings\\/general')).reply(() => ok(clone(db.generalSettings)))
    mock.onPatch(withPrefix('\\/settings\\/general')).reply((config) => {
      db.generalSettings = {...db.generalSettings, ...JSON.parse(config.data || '{}')}
      return ok(clone(db.generalSettings))
    })
    mock.onGet(withPrefix('\\/settings\\/sla-zones')).reply(() => ok({
      orangeStartPercent: db.generalSettings.slaOrangeStartPercent,
      redStartPercent: db.generalSettings.slaRedStartPercent
    }))
    mock.onGet(withPrefix('\\/settings\\/answer-waiting')).reply(() => {
      const settings = db.generalSettings
      const dayFlags = [
        settings.mondayEnabled, settings.tuesdayEnabled, settings.wednesdayEnabled, settings.thursdayEnabled,
        settings.fridayEnabled, settings.saturdayEnabled, settings.sundayEnabled
      ]
      return ok({
        workingTimeUsed: !!settings.workingTimeEnabled && !!settings.answerWaitingWorkingTimeEnabled,
        timezone: settings.timezone,
        workdayStart: settings.workdayStart,
        workdayEnd: settings.workdayEnd,
        workingDays: dayFlags.map((enabled, index) => (enabled ? index + 1 : null)).filter(Boolean)
      })
    })

    // GET /user/permissions
    mock.onGet(withPrefix('\\/user\\/permissions')).reply(() => ok({
      permissions: [
        'CHAT_VIEW', 'TASK_VIEW', 'TASK_EDIT', 'INCIDENT_VIEW', 'ORGANIZATION_STATS',
        'GLOBAL_SEARCH', 'ANALYTICS_VIEW', 'KB_VIEW', 'STAFF_DIRECTORY_VIEW', 'NOTIFICATIONS',
        'SETTINGS_MANAGE', 'USER_MANAGE', 'ORGANIZATION_MANAGE', 'REFERENCE_MANAGE', 'SLA_MANAGE',
        'SERVICE_MANAGE', 'INCIDENT_TEMPLATE_MANAGE', 'CHANNEL_MANAGE', 'AUTOMATION_MANAGE',
        'PLUGIN_MANAGE', 'JWT_MANAGE', 'SECURITY_AUDIT_VIEW', 'TASK_EXPORT',
        'CLIENT_EDIT', 'CLIENT_DELETE', 'CHAT_REPLY'
      ]
    }))

    // GET /session/current
    mock.onGet(withPrefix('\\/session\\/current')).reply(() => ok({sessionId: 'mock-session-1'}))

    // POST /user-online, /user-offline
    mock.onPost(withPrefix('\\/user-online')).reply(() => ok(clone(db.me)))
    mock.onPost(withPrefix('\\/user-offline')).reply(() => noContent())

    // POST /user/change-password
    mock.onPost(withPrefix('\\/user\\/change-password')).reply(() => noContent())

    // POST /user/welcome-seen
    mock.onPost(withPrefix('\\/user\\/welcome-seen')).reply(() => {
      db.me.welcomeSeen = true
      return noContent()
    })

    // PATCH /user/task-card-config
    mock.onPatch(withPrefix('\\/user\\/task-card-config')).reply(config => {
      db.me.taskCardFieldsConfig = JSON.parse(config.data)
      return ok(clone(db.me.taskCardFieldsConfig))
    })

    // PATCH /user/onboarding-progress — принимает одну или сразу несколько пар ключ тура → статус
    mock.onPatch(withPrefix('\\/user\\/onboarding-progress')).reply(config => {
      const updates = JSON.parse(config.data)
      db.me.onboardingProgress = {...(db.me.onboardingProgress || {}), ...updates}
      return ok(clone(db.me.onboardingProgress))
    })

    // GET /support-lines, /task-types, /services
    mock.onGet(withPrefix('\\/support-lines')).reply(() => ok(clone(db.supportLines)))
    mock.onGet(withPrefix('\\/task-types')).reply(() => ok(clone(db.taskTypes)))
    mock.onGet(withPrefix('\\/services')).reply(() => ok(clone(db.services)))
    mock.onGet(withPrefix('\\/organization-service-assignments')).reply(() => ok([]))
    mock.onGet(withPrefix('\\/zabbix-integrations')).reply(() => ok([]))
    mock.onGet(withPrefix('\\/service-criticalities')).reply(() => ok([]))

    // GET /triggers, /trigger-types/options — автоматизации (несколько демо-правил, чтобы проверять папки)
    if (!db.automationTriggers) {
      const rule = (id, name, triggerType) => ({
        id,
        name,
        description: '',
        triggerType,
        expression: 'true',
        action: 'workflow.run()',
        elseAction: null,
        workflowDefinition: null,
        workflowVersion: 1,
        orderNumber: id - 1,
        folderId: null,
        displayOrder: id - 1,
        automationRuleStatus: 'ENABLED',
        stopProcessing: false,
        matchCount: id * 3,
        lastMatchedAt: null,
        failureCount: 0,
        lastFailedAt: null,
        lastError: null
      })
      db.automationTriggers = [
        rule(1, 'Назначить линию поддержки', 'TASK_CREATED'),
        rule(2, 'Повысить приоритет VIP-клиентов', 'TASK_CREATED'),
        rule(3, 'Уведомить о нарушении SLA', 'TASK_UPDATED'),
        rule(4, 'Закрыть заявку без ответа', 'TASK_UPDATED'),
        rule(5, 'Тегировать обращения из почты', 'TASK_CREATED')
      ]
      db.automationFolders = []
      db.nextFolderId = 1
    }

    // Логика как на бэкенде: хранится только «что в чём лежит и в каком порядке»,
    // order_number выполнения пересчитывается по порядку чтения дерева.
    const applyAutomationLayout = (items, excludedFolderId = null) => {
      const folders = db.automationFolders.filter(f => f.id !== excludedFolderId)
      const triggers = db.automationTriggers
      const placedTriggers = new Set()
      const placedFolders = new Map()
      const build = list => {
        const result = []
        for (const item of list || []) {
          if (item?.type === 'FOLDER') {
            const folder = folders.find(f => f.id === item.id)
            if (!folder || placedFolders.has(folder.id)) continue
            if (typeof item.collapsed === 'boolean') folder.collapsed = item.collapsed
            const node = {folder, children: []}
            placedFolders.set(folder.id, node)
            node.children = build(item.items)
            result.push(node)
          } else {
            const trigger = triggers.find(t => t.id === item?.id)
            if (trigger && !placedTriggers.has(trigger.id)) {
              placedTriggers.add(trigger.id)
              result.push({trigger})
            }
          }
        }
        return result
      }
      const tree = build(items)
      // Не упомянутое клиентом остаётся в своём контейнере (или уходит наверх).
      folders.filter(f => !placedFolders.has(f.id)).sort((a, b) => a.displayOrder - b.displayOrder).forEach(folder => {
        const node = {folder, children: []}
        placedFolders.set(folder.id, node)
        const parent = placedFolders.get(folder.parentId)
        ;(parent ? parent.children : tree).push(node)
      })
      triggers.filter(t => !placedTriggers.has(t.id)).sort((a, b) => a.orderNumber - b.orderNumber).forEach(trigger => {
        const parent = placedFolders.get(trigger.folderId)
        ;(parent ? parent.children : tree).push({trigger})
      })
      let executionOrder = 0
      const assign = (nodes, parentId) => nodes.forEach((node, position) => {
        if (node.folder) {
          Object.assign(node.folder, {displayOrder: position, parentId})
          assign(node.children, node.folder.id)
        } else {
          Object.assign(node.trigger, {folderId: parentId, displayOrder: position, orderNumber: executionOrder++})
        }
      })
      assign(tree, null)
    }
    const automationLayoutResponse = () => ({
      folders: clone([...db.automationFolders].sort((a, b) => a.displayOrder - b.displayOrder)),
      triggers: db.automationTriggers.map(t => ({
        id: t.id, folderId: t.folderId, displayOrder: t.displayOrder, orderNumber: t.orderNumber
      }))
    })
    const currentAutomationTree = (containerId = null) => {
      const nodes = []
      db.automationFolders.filter(f => (f.parentId ?? null) === containerId).forEach(folder => nodes.push({
        folder,
        position: folder.displayOrder,
        children: currentAutomationTree(folder.id)
      }))
      db.automationTriggers.filter(t => (t.folderId ?? null) === containerId).forEach(trigger => nodes.push({trigger, position: trigger.displayOrder}))
      return nodes.sort((a, b) => a.position - b.position)
    }
    const treeToItems = (nodes, liftedId) => nodes.flatMap(node => {
      if (!node.folder) return [{type: 'TRIGGER', id: node.trigger.id}]
      if (node.folder.id === liftedId) return treeToItems(node.children, liftedId)
      return [{type: 'FOLDER', id: node.folder.id, items: treeToItems(node.children, liftedId)}]
    })

    mock.onGet(withPrefix('\\/triggers')).reply(() => ok(clone([...db.automationTriggers].sort((a, b) => a.orderNumber - b.orderNumber))))
    mock.onGet(withPrefix('\\/trigger-types/options')).reply(() => ok([]))
    mock.onPost(withPrefix('\\/trigger')).reply(config => {
      const body = JSON.parse(config.data)
      const id = Math.max(0, ...db.automationTriggers.map(t => t.id)) + 1
      const trigger = {
        matchCount: 0, lastMatchedAt: null, failureCount: 0, lastFailedAt: null, lastError: null,
        ...body, id, folderId: null, orderNumber: db.automationTriggers.length, displayOrder: db.automationTriggers.length
      }
      db.automationTriggers.push(trigger)
      return ok(clone(trigger))
    })
    mock.onPost(withPrefix('\\/automation\\/validate')).reply(() => ok({valid: true, errors: []}))

    mock.onGet(withPrefix('\\/automation\\/operations')).reply(() => ok([
      {id: 'task.query', label: 'Заявки', group: 'Получить данные', description: 'Найти заявки по фильтру', result: 'Список заявок', fields: []},
      {id: 'client.messages.query', label: 'Сообщения клиента', group: 'Получить данные', description: 'Получить сообщения клиента', result: 'Список сообщений', fields: []},
      {id: 'services.query', label: 'Доступные сервисы', group: 'Получить данные', description: 'Получить список сервисов', result: 'Список сервисов', fields: []},
      {
        id: 'list.select',
        label: 'Отобрать и упорядочить',
        group: 'Списки',
        effect: 'PURE',
        description: 'Для каждого элемента проверяется условие. В условии элемент доступен как var.item.',
        fields: [
          {key: 'items', label: 'Исходный список', type: 'expression', defaultValue: null, help: '', required: false},
          {key: 'where', label: 'Условие отбора', type: 'script', defaultValue: 'true', help: 'Условие для каждого элемента списка. Текущий элемент — var.item; доступны также переменные сценария.', required: false, contextSource: 'items'},
          {key: 'sortBy', label: 'Поле сортировки', type: 'script', defaultValue: 'var.item.id', help: 'Выберите поле текущего элемента из подсказок, например var.item.createdAt.', required: false, contextSource: 'items', legacyItemPath: true}
        ],
        result: 'Список подходящих элементов.',
        resultFields: [],
        elementFields: ['id', 'name', 'date']
      },
      {
        id: 'task.update',
        label: 'Изменить заявку',
        group: 'Изменить заявку',
        description: 'Изменить поля заявки',
        result: 'Обновлённая заявка',
        fields: [
          {key: 'fields', label: 'Поля', type: 'object', help: 'Какие поля изменить', defaultValue: {}}
        ]
      },
      {
        id: 'ai.decide',
        label: 'Решение ИИ',
        group: 'Искусственный интеллект',
        description: 'Принять решение через Jev',
        result: 'Выбранный вариант',
        effect: 'IMPURE',
        fields: [
          {key: 'kind', label: 'Тип решения', type: 'select', help: 'Выбор варианта или вероятность', defaultValue: 'choice'}
        ]
      }
    ]))

    mock.onPost(withPrefix('\\/automation\\/expression\\/suggestions')).reply(config => {
      const body = JSON.parse(config.data || '{}')
      const term = String(body.text || '').toLowerCase()
      const varSuggestions = (body.variables || []).map(name => ({
        path: 'var.' + name,
        insertText: 'var.' + name,
        label: 'var.' + name,
        description: 'Переменная сценария',
        kind: 'VARIABLE',
        type: 'Object',
        hasChildren: false,
        callable: false
      }))
      const all = [
        {path: 'task.id', insertText: 'task.id', label: 'task.id', description: 'ID заявки', kind: 'NUMBER', type: 'Long', hasChildren: false, callable: false},
        {path: 'task.name', insertText: 'task.name', label: 'task.name', description: 'Название заявки', kind: 'STRING', type: 'String', hasChildren: false, callable: false},
        {path: 'task.priority', insertText: 'task.priority', label: 'task.priority', description: 'Приоритет заявки', kind: 'OBJECT', type: 'Priority', hasChildren: true, callable: false},
        {path: 'client.id', insertText: 'client.id', label: 'client.id', description: 'ID клиента', kind: 'NUMBER', type: 'Long', hasChildren: false, callable: false},
        {path: 'var', insertText: 'var', label: 'var', description: 'Переменные сценария', kind: 'VARIABLES', type: 'Variables', hasChildren: true, callable: false},
        ...varSuggestions
      ]
      const suggestions = term ? all.filter(s => s.label.toLowerCase().includes(term)) : all
      return ok({suggestions, replaceFrom: body.cursor, replaceTo: body.cursor})
    })

    // PATCH /trigger — переключатель «Активно/Выключено»
    mock.onPatch(withPrefix('\\/trigger')).reply(config => {
      const body = JSON.parse(config.data || '{}')
      const trigger = db.automationTriggers.find(t => t.id === body.id)
      if (!trigger) return [404]
      trigger.automationRuleStatus = body.automationRuleStatus || trigger.automationRuleStatus
      trigger.name = body.name || trigger.name
      return ok(clone(trigger))
    })

    // Папки автоматизаций
    mock.onGet(withPrefix('\\/automation\\/folders')).reply(() =>
      ok(clone([...db.automationFolders].sort((a, b) => a.displayOrder - b.displayOrder))))

    mock.onPost(withPrefix('\\/automation\\/folders')).reply(config => {
      const name = String(JSON.parse(config.data || '{}').name || '').trim()
      if (!name) return badRequest('name required')
      const top = Math.min(0, ...db.automationFolders.filter(f => f.parentId == null).map(f => f.displayOrder), ...db.automationTriggers.filter(t => t.folderId == null).map(t => t.displayOrder)) - 1
      const folder = {id: db.nextFolderId++, name, collapsed: false, displayOrder: top, parentId: null}
      db.automationFolders.push(folder)
      return ok(clone(folder))
    })

    mock.onPatch(withPrefix('\\/automation\\/folders\\/(\\d+)')).reply(config => {
      const id = Number(config.url.match(/folders\/(\d+)/)?.[1])
      const folder = db.automationFolders.find(f => f.id === id)
      if (!folder) return [404]
      const body = JSON.parse(config.data || '{}')
      if (body.name != null) {
        if (!String(body.name).trim()) return badRequest('name required')
        folder.name = String(body.name).trim()
      }
      if (typeof body.collapsed === 'boolean') folder.collapsed = body.collapsed
      return ok(clone(folder))
    })

    mock.onDelete(withPrefix('\\/automation\\/folders\\/(\\d+)')).reply(config => {
      const id = Number(config.url.match(/folders\/(\d+)/)?.[1])
      if (!db.automationFolders.some(f => f.id === id)) return [404]
      const items = treeToItems(currentAutomationTree(), id)
      applyAutomationLayout(items, id)
      db.automationFolders = db.automationFolders.filter(f => f.id !== id)
      return ok(automationLayoutResponse())
    })

    mock.onPut(withPrefix('\\/automation\\/layout')).reply(config => {
      applyAutomationLayout(JSON.parse(config.data || '{}').items)
      return ok(automationLayoutResponse())
    })

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
