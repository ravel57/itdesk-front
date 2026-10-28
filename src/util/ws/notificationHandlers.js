import {useStore} from 'stores/store'
import {useSystemNotifications} from 'src/composables/useSystemNotifications'
import {safeParseJson} from 'src/util/ws/json'

export function globalAlertMessageCallback(message) {
  useStore().globalAlertMessage = safeParseJson(message.body, null)
}

export function userNotificationCallback(message) {
  const {notify} = useSystemNotifications()
  const store = useStore()
  const parsedMessage = safeParseJson(message.body, null)

  if (!parsedMessage || Number(parsedMessage.userId) !== Number(store.currentUser?.id)) {
    return
  }

  store.receiveUserNotification(parsedMessage)

  notify(parsedMessage.title || 'ULDesk', {
    body: parsedMessage.body || getLegacyNotificationBody(parsedMessage),
    tag: `uldesk-${parsedMessage.event || 'notification'}-${parsedMessage.id || Date.now()}`
  })
}

function getLegacyNotificationBody(notification) {
  const message = notification?.message || ''
  switch (notification?.event) {
    case 'MENTIONED_USER':
      return `Вас упомянули в чате: ${message}`
    case 'MENTIONED_USER_IN_TASK_CHAT':
      return `Вас упомянули в заявке: ${message}`
    case 'NEW_TASK':
      return message ? `Новая заявка назначена на Вас: ${message}` : 'Новая заявка назначена на Вас'
    case 'NEW_CHAT_MESSAGE':
      return message
        ? `Новое сообщение в заявке, где Вы назначены исполнителем: ${message}`
        : 'Новое сообщение в заявке, где Вы назначены исполнителем'
    case 'SLA_HALF_TIME_PASSED':
      return message || 'SLA прошел больше чем на 50%'
    case 'SLA_OVERDUE':
      return message || 'SLA нарушен'
    case 'CHAT_UNANSWERED_TOO_LONG':
      return message || 'Есть чат без ответа'
    case 'DEADLINE_SOON':
      return message || 'Скоро дедлайн по заявке'
    case 'DEADLINE_OVERDUE':
      return message || 'Дедлайн нарушен'
    case 'INCIDENT_UPDATE_OVERDUE':
      return message || 'Просрочено обязательное обновление по инциденту'
    case 'INCIDENT_DETECTED':
      return message || 'Обнаружен массовый сбой'
    case 'INCIDENT_RECOVERY_FAILED':
      return message || 'Клиент сообщает, что после восстановления проблема сохраняется'
    case 'MONITORING_CONNECTION_LOST':
      return message || 'Нет связи с Zabbix'
    case 'MONITORING_CONNECTION_RESTORED':
      return message || 'Связь с Zabbix восстановлена'
    default:
      return message || 'Новое уведомление'
  }
}
