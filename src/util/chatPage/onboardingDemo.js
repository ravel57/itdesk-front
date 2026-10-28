// Демо-данные для обучающего тура страницы чата. Функции создают свежие объекты
// на каждый вызов (даты считаются от текущего момента).

export const createDemoClient = () => ({
  id: -100500,
  firstname: 'Иван',
  lastname: 'Петров',
  username: 'ivan.petrov',
  messageFrom: 'TELEGRAM',
  sourceChannel: 'Telegram / Поддержка',
  moreInfo: 'VIP-клиент, договор № 42, нужен быстрый первый ответ',
  organization: {
    id: -100500,
    name: 'ООО Демо-Сервис'
  },
  typingUsers: [],
  watchingUsers: [],
  typingMessageText: {},
  messages: [
    {
      id: -100501,
      text: 'Добрый день! Не получается войти в личный кабинет, пишет ошибку авторизации.',
      date: new Date(Date.now() - 1000 * 60 * 35),
      isSent: false,
      isComment: false,
      isRead: false,
      deleted: false,
      answerRequired: 'ANSWER_NOT_REQUIRED'
    },
    {
      id: -100502,
      text: 'Здравствуйте! Проверю доступ и подскажу, что нужно сделать.',
      date: new Date(Date.now() - 1000 * 60 * 28),
      isSent: true,
      isComment: false,
      isRead: true,
      deleted: false,
      user: {
        id: -100501,
        firstname: 'Оператор',
        lastname: 'Поддержки',
        username: 'operator'
      }
    },
    {
      id: -100503,
      text: 'Сейчас еще появилась ошибка при восстановлении пароля. Нужно ответить клиенту.',
      date: new Date(Date.now() - 1000 * 60 * 9),
      isSent: false,
      isComment: false,
      isRead: false,
      deleted: false,
      answerRequired: 'ANSWER_REQUIRED'
    }
  ],
  tasks: [
    {
      id: -100501,
      __onboardingDemo: true,
      name: 'Проверить доступ клиента',
      description: 'Клиент не может войти в личный кабинет. Нужно проверить учетную запись и отправить инструкцию.',
      status: {id: -100501, name: 'В работе', orderNumber: 2},
      priority: {id: -100501, name: 'Высокий', critical: true, orderNumber: 3},
      executor: {id: -100501, firstname: 'Оператор', lastname: 'Поддержки'},
      tags: [{id: -100501, name: 'Доступ'}, {id: -100502, name: 'VIP'}],
      completed: false,
      frozen: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 35),
      deadline: new Date(Date.now() + 1000 * 60 * 90),
      linkedMessageId: -100503,
      sla: {
        startDate: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
        duration: 'PT2H'
      }
    }
  ]
})

export const createDemoTemplates = () => [
  {id: -100501, shortcut: 'hello', text: 'Здравствуйте! Уже проверяю ваш вопрос и скоро вернусь с ответом.'},
  {
    id: -100502,
    shortcut: 'access',
    text: 'Попробуйте восстановить пароль по ссылке. Если ошибка повторится, пришлите скриншот.'
  }
]

export const createDemoKnowledgeBase = () => [
  {
    id: -100501,
    title: 'Проблемы со входом в личный кабинет',
    text: 'Проверить статус пользователя, блокировку, актуальность email и историю попыток входа.',
    tags: [{id: -100501, name: 'Доступ'}]
  },
  {
    id: -100502,
    title: 'Инструкция по восстановлению пароля',
    text: 'Попросить клиента открыть страницу восстановления пароля и проверить письмо во входящих и спаме.',
    tags: [{id: -100502, name: 'Пароль'}]
  }
]

export const createDemoTags = () => [
  {id: -100501, name: 'Доступ'},
  {id: -100502, name: 'VIP'},
  {id: -100503, name: 'Пароль'}
]

export const createDemoUsers = () => [
  {id: -100501, firstname: 'Оператор', lastname: 'Поддержки', username: 'operator'}
]

export const createDemoOrganizations = () => [
  {id: -100500, name: 'ООО Демо-Сервис'}
]

export const createDemoStatuses = () => [
  {id: -100501, name: 'Новая', orderNumber: 1},
  {id: -100502, name: 'В работе', orderNumber: 2}
]

export const createDemoPriorities = () => [
  {id: -100501, name: 'Обычный', critical: false, orderNumber: 1},
  {id: -100502, name: 'Высокий', critical: true, orderNumber: 3}
]

export const CHAT_ONBOARDING_STEPS = [
  {
    target: 'chat-dialog-column',
    tab: 'tab1',
    title: 'Диалог с клиентом',
    text: 'Здесь идёт переписка, а поиск по сообщениям — сверху. Во время обучения показан тестовый чат; после завершения он заменится реальными данными.'
  },
  {
    target: 'chat-answer-required',
    tab: 'tab1',
    title: 'Нужно ли отвечать',
    text: 'Последнее входящее сообщение можно пометить как требующее ответа или не требующее. От этого зависит очередь внимания и таймер ожидания.'
  },
  {
    target: 'chat-helper-column',
    tab: 'tab2',
    requiresHelper: true,
    title: 'Помощник оператора',
    text: 'Шаблоны ответов и база знаний с поиском и тегами — каждый со своим полем поиска. Шаблон или статья вставляются кликом.'
  },
  {
    target: 'chat-helper-ai-query',
    tab: 'tab2',
    requiresHelper: true,
    title: 'Запрос к ИИ',
    text: 'Сформулируйте вопрос по проблеме клиента. ИИ использует доступные материалы поддержки и показывает ответ прямо здесь.'
  },
  {
    target: 'chat-client-card',
    tab: 'tab3',
    title: 'Карточка клиента',
    text: 'Имя, организация, заметки и канал обращения — всё видно сразу. Карандаш рядом с именем открывает редактирование.'
  },
  {
    target: 'chat-task-toolbar',
    tab: 'tab3',
    title: 'Заявки клиента',
    text: 'Ниже — связанные заявки. У поиска, сортировки и переключателя закрытых уже есть подсказки при наведении.'
  },
  {
    target: 'chat-create-task',
    tab: 'tab3',
    title: 'Создание заявки',
    text: 'Если переписку нужно превратить в контролируемую работу, создайте заявку с исполнителем, приоритетом, дедлайном и SLA.'
  },
  {
    target: 'chat-task-card',
    tab: 'tab3',
    title: 'Активная заявка',
    text: 'В заявке видны статус, приоритет, срок, SLA и привязка к сообщению. По клику открывается подробная карточка.'
  }
]
