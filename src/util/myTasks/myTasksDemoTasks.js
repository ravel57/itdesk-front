// Тестовые заявки, которые показываются на странице «Мои заявки» во время обучения
// (после завершения обучения возвращаются реальные данные).
// storeCurrentUser — this.store.currentUser; если пользователя ещё нет, подставляется заглушка.
export function buildMyTasksOnboardingDemoTasks (storeCurrentUser) {
  const now = Date.now()
  const currentUser = storeCurrentUser || {
    id: 1,
    firstname: 'Пётр',
    lastname: 'Петров'
  }
  const currentUserId = currentUser.id || 1
  const hasCurrentUser = !!storeCurrentUser?.id

  return [
    {
      __demo: true,
      __onboardingDemo: true,
      id: 9101,
      name: 'Не открывается 1С у бухгалтера',
      description: 'Пользователь не может открыть базу после обновления. Нужно проверить доступ к серверу и права.',
      type: {id: 1, type: 'Инцидент'},
      service: {id: 1, code: '1C', name: '1С:Предприятие'},
      checklist: [
        {id: 1, text: 'Проверить доступность сервера', completed: true},
        {id: 2, text: 'Проверить права пользователя', completed: false}
      ],
      supportLine: {id: 1, name: 'Первая линия'},
      tags: [{id: 1, name: '1 линия'}, {id: 2, name: '1С'}],
      priority: {id: 1, name: 'Критичный', critical: true},
      executor: currentUser,
      status: {id: 1, name: 'В работе'},
      completed: false,
      frozen: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      firstResponseDeadline: new Date(now + 20 * 60 * 1000).toISOString(),
      deadline: new Date(now + 55 * 60 * 1000).toISOString(),
      lastActivity: new Date(now - 18 * 60 * 1000).toISOString(),
      sla: {
        startDate: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        duration: 4 * 60 * 60
      },
      __onboardingSlaInfo: {
        deadline: new Date(now + 55 * 60 * 1000).toISOString(),
        remainingSeconds: 55 * 60,
        pausedSeconds: 0,
        paused: false
      },
      client: {
        id: 'demo-client-accounting',
        firstname: 'Анна',
        lastname: 'Соколова',
        lastMessage: {
          date: new Date(now - 18 * 60 * 1000).toISOString()
        }
      },
      unreadPingTasksMessages: hasCurrentUser
        ? {
            [currentUserId]: true
          }
        : null,
      messages: []
    },
    {
      __demo: true,
      __onboardingDemo: true,
      id: 9102,
      name: 'Настроить доступ новому сотруднику',
      description: 'Создать учетную запись, выдать права на почту, VPN и рабочие папки.',
      tags: [{id: 3, name: 'Доступы'}, {id: 4, name: 'Онбординг'}],
      priority: {id: 2, name: 'Средний', critical: false},
      executor: currentUser,
      status: {id: 2, name: 'Ожидает выполнения'},
      completed: false,
      frozen: false,
      createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      deadline: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      client: {
        id: 'demo-client-hr',
        firstname: 'Ирина',
        lastname: 'HR',
        lastMessage: {
          date: new Date(now - 70 * 60 * 1000).toISOString()
        }
      },
      unreadPingTasksMessages: null,
      messages: []
    },
    {
      __demo: true,
      __onboardingDemo: true,
      id: 9103,
      name: 'Проверить медленную печать на складе',
      description: 'Принтер печатает с задержкой, нужно проверить очередь печати и сетевое подключение.',
      tags: [{id: 5, name: 'Принтеры'}],
      priority: {id: 3, name: 'Низкий', critical: false},
      executor: currentUser,
      status: {id: 3, name: 'Новая'},
      completed: false,
      frozen: false,
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
      deadline: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
      client: {
        id: 'demo-client-storage',
        firstname: 'Склад',
        lastname: '№2',
        lastMessage: {
          date: new Date(now - 25 * 60 * 1000).toISOString()
        }
      },
      unreadPingTasksMessages: null,
      messages: []
    }
  ]
}
