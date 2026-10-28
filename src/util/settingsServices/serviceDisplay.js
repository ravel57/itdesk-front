// Подписи и цвета для таблиц страницы «Сервисы и мониторинг».

export function monitoringColor(status) {
  return ({
    OK: 'positive',
    WARNING: 'warning',
    CRITICAL: 'negative',
    UNAVAILABLE: 'grey-8',
    NOT_CONFIGURED: 'grey'
  })[status] || 'grey'
}

export function monitoringLabel(status) {
  return ({
    OK: 'Работает',
    WARNING: 'Предупреждение',
    CRITICAL: 'Критично',
    UNAVAILABLE: 'Недоступен',
    NOT_CONFIGURED: 'Не настроен'
  })[status] || status || 'Не настроен'
}

export function dateRange(from, to) {
  return `${from || '—'} — ${to || '∞'}`
}

export function minutesLabel(value) {
  return value == null ? 'по сервису' : `${value} мин.`
}
