import {now} from 'src/boot/mocks/helpers'

export function createTasksDb() {
  return {
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
}
