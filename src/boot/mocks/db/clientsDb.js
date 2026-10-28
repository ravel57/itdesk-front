import {now} from 'src/boot/mocks/helpers'

export function createClientsDb() {
  return {
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
    ]
  }
}
