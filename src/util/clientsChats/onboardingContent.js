// Контент обучения страницы «Чаты»: демо-клиенты (показываются на время обучения) и шаги.
// Функции возвращают свежие данные при каждом вызове (даты демо-сообщений считаются от Date.now()).

export function buildOnboardingDemoClients () {
  return [
    {
      id: '__onboarding_demo_client_1__',
      isOnboardingDemoClient: true,
      firstname: 'Иван',
      lastname: 'Петров',
      messageFrom: 'TELEGRAM',
      sourceChannel: 'Telegram',
      organization: {
        name: 'ООО «Северный офис»'
      },
      unreadMessagesCount: 2,
      demoPingCount: 1,
      lastMessage: {
        date: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        text: 'Здравствуйте! Не получается подключиться к рабочему VPN.'
      },
      messages: [
        {
          id: '__onboarding_demo_message_1_1__',
          date: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
          text: 'Здравствуйте! Не получается подключиться к рабочему VPN.',
          isSent: false,
          isComment: false,
          deleted: false,
          answerRequired: 'ANSWER_REQUIRED'
        },
        {
          id: '__onboarding_demo_message_1_2__',
          date: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          text: 'Подскажите, пожалуйста, когда сможете посмотреть?',
          isSent: false,
          isComment: false,
          deleted: false,
          answerRequired: 'ANSWER_REQUIRED'
        }
      ],
      tasks: [
        {
          id: null,
          title: 'Проверить доступ к VPN',
          completed: false,
          priority: {
            critical: true
          },
          sla: {
            startDate: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
            duration: 'PT45M'
          },
          unreadPingTasksMessages: {
            onboarding: 1
          }
        }
      ]
    },
    {
      id: '__onboarding_demo_client_2__',
      isOnboardingDemoClient: true,
      firstname: 'Мария',
      lastname: 'Смирнова',
      messageFrom: 'EMAIL',
      sourceChannel: 'Email',
      organization: {
        name: 'ИП Смирнова'
      },
      unreadMessagesCount: 1,
      demoPingCount: 0,
      lastMessage: {
        date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        text: 'Прикладываю скриншот ошибки при входе в личный кабинет.'
      },
      messages: [
        {
          id: '__onboarding_demo_message_2_1__',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          text: 'Прикладываю скриншот ошибки при входе в личный кабинет.',
          isSent: false,
          isComment: false,
          deleted: false,
          answerRequired: 'ANSWER_REQUIRED'
        }
      ],
      tasks: [
        {
          id: null,
          title: 'Восстановить доступ к личному кабинету',
          completed: false,
          priority: {
            critical: false
          },
          sla: {
            startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            duration: 'PT6H'
          }
        },
        {
          id: null,
          title: 'Назначить исполнителя по обращению',
          completed: false,
          priority: {
            critical: false
          }
        }
      ]
    },
    {
      id: '__onboarding_demo_client_3__',
      isOnboardingDemoClient: true,
      firstname: 'Алексей',
      lastname: 'Орлов',
      messageFrom: 'WHATSAPP',
      sourceChannel: 'WhatsApp',
      organization: {
        name: 'ООО «Ромашка»'
      },
      unreadMessagesCount: 0,
      demoPingCount: 0,
      lastMessage: {
        date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        text: 'Спасибо, всё заработало.'
      },
      messages: [
        {
          id: '__onboarding_demo_message_3_1__',
          date: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
          text: 'Добрый день, принтер не печатает.',
          isSent: false,
          isComment: false,
          deleted: false,
          answerRequired: 'ANSWER_REQUIRED'
        },
        {
          id: '__onboarding_demo_message_3_2__',
          date: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
          text: 'Проверьте, пожалуйста, очередь печати и перезапустите службу.',
          isSent: true,
          isComment: false,
          deleted: false
        },
        {
          id: '__onboarding_demo_message_3_3__',
          date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
          text: 'Спасибо, всё заработало.',
          isSent: false,
          isComment: false,
          deleted: false,
          answerRequired: 'ANSWER_NOT_REQUIRED'
        }
      ],
      tasks: []
    }
  ]
}

export function buildOnboardingSteps () {
  return [
    {
      selector: '[data-tour="chat-search"]',
      placement: 'bottom',
      title: 'Поиск по клиентам',
      text: 'Здесь можно быстро найти чат по имени клиента, организации или каналу обращения.'
    },
    {
      selector: '[data-tour="chat-sort"]',
      placement: 'bottom',
      title: 'Сортировка очереди',
      text: 'Переключайте порядок списка: по времени ожидания, SLA, последнему сообщению, пингам, непрочитанным или заявкам без исполнителя.'
    },
    {
      selector: '[data-tour="client-row"]',
      placement: 'bottom',
      title: 'Строка клиента',
      text: 'Каждая строка — это клиентский диалог. Нажмите на строку, чтобы открыть чат и карточку клиента.'
    },
    {
      selector: '[data-tour="client-name"]',
      placement: 'right',
      title: 'Имя и организация',
      text: 'Имя клиента и, через «|», организация, к которой он привязан. Красный значок «!» на аватаре — критичная заявка или упоминание, наведите для подробностей.'
    },
    {
      selector: '[data-tour="client-sla"]',
      placement: 'right',
      title: 'Минимальный SLA',
      text: 'Полоса показывает самый срочный SLA среди открытых заявок клиента. Чем меньше осталось времени, тем тревожнее цвет.'
    },
    {
      selector: '[data-tour="client-alerts"]',
      placement: 'left',
      title: 'Время ответа и непрочитанные',
      text: 'Здесь видно сколько времени клиент ждёт ответа, и сколько сообщений ещё не прочитано.'
    },
    {
      selector: '[data-tour="client-last-message"]',
      placement: 'top',
      title: 'Последнее сообщение',
      text: 'Эта строка помогает быстро понять, когда клиент писал последний раз и о чём было сообщение.'
    },
    {
      selector: '[data-tour="empty-state"]',
      placement: 'top',
      title: 'Пока чатов нет',
      text: 'Когда появятся обращения клиентов, они будут отображаться на этом экране списком.'
    }
  ]
}
