// Подписи результатов проверки маршрута и статусов шагов журнала выполнения.

export function isWorkflowTestResult(result) {
  return result?.mode === 'WORKFLOW' || Array.isArray(result?.trace)
}

export function workflowTestResultTitle(result) {
  if (result?.trace?.some(step => step.status === 'NEEDS_INPUT')) return 'Проверка остановлена: задайте пример ответа анализа'
  if (result?.executed) return 'Маршрут проверен; реальные изменения не выполнялись'
  if (result?.scheduled) return 'Маршрут остановится на ожидающем узле'
  if (result?.completed) return 'Маршрут завершится без выполнения действий'
  return 'Маршрут не дошёл до выполняемого действия'
}

export function workflowTraceStatusLabel(status) {
  const labels = {
    PREVIEW: 'проверка без изменений',
    NEEDS_INPUT: 'нужен пример ответа анализа',
    QUEUED: 'поставлено в очередь',
    ITERATED: 'список обработан',
    BREAK: 'цикл остановлен',
    PASSED: 'пройдено',
    ROUTED: 'выбрана ветка',
    TRUE: 'условие истинно',
    FALSE: 'условие ложно',
    WOULD_EXECUTE: 'будет выполнено',
    EXECUTED: 'выполнено',
    WOULD_WAIT: 'будет ожидание',
    WOULD_WAIT_EVENT: 'будет ожидание события',
    WOULD_REQUEST_APPROVAL: 'будет запрошено согласование',
    WOULD_REQUEST: 'будет выполнен запрос',
    WOULD_START: 'будет запущено',
    COMPLETED: 'завершено',
    FAILED: 'ошибка',
    ERROR: 'ошибка',
    BLOCKED: 'заблокировано',
    ALLOWED: 'разрешено',
    UNIQUE: 'дубликат не найден',
    DUPLICATE: 'найден дубликат',
    SET: 'значение установлено',
    FORKED: 'ветки запущены',
    JOINED: 'ветки объединены'
  }
  return labels[status] || status || 'пройдено'
}

export function formatDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ru-RU')
}
