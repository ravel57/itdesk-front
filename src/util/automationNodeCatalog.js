// The operation ID is the block's semantic type. All operation blocks share one runtime format.
const definitions = [
  ['structure', 'Старт и структура', 'account_tree', 'indigo-7', [['EVENT', 'Событие', 'bolt'], ['PARAMETERS', 'Настройки сценария', 'tune'], ['SUBFLOW', 'Вызвать другой сценарий', 'account_tree'], ['END', 'Завершение', 'flag'], ['NOTE', 'Пояснение на холсте', 'sticky_note_2']]],
  ['messages', 'Сообщения и уведомления', 'chat', 'teal-7', []],
  ['tasks', 'Заявки', 'support_agent', 'teal-7', []],
  ['logic', 'Условия и ветвление', 'call_split', 'orange-8', [['CONDITION', 'Условие ДА/НЕТ', 'call_split'], ['SWITCH', 'Варианты значения', 'alt_route'], ['BUSINESS_HOURS', 'Рабочее время', 'schedule'], ['FORK', 'Разделить ветки', 'fork_right'], ['JOIN', 'Объединить ветки', 'merge']]],
  ['read', 'Получить данные', 'download', 'blue-8', []],
  ['values', 'Значения и списки', 'data_object', 'blue-8', [['COUNTER', 'Счётчик', 'exposure_plus_1'], ['FOR_EACH', 'Для каждого элемента', 'repeat'], ['LOOP_END', 'Следующий элемент', 'keyboard_return'], ['LOOP_BREAK', 'Остановить цикл', 'stop_circle']]],
  ['ai', 'Решения ИИ', 'psychology', 'purple-7', []],
  ['incidents', 'Инциденты', 'campaign', 'deep-orange-7', []],
  ['signals', 'Сигналы сбоев', 'hub', 'deep-orange-7', []],
  ['wait', 'Ожидание и согласование', 'hourglass_top', 'purple-7', [['DELAY', 'Задержка', 'hourglass_bottom'], ['WAIT_UNTIL', 'Ждать до момента', 'event'], ['WAIT_EVENT', 'Ждать событие', 'notifications_active'], ['WAIT_TASK', 'Ждать изменение заявки', 'task_alt'], ['APPROVAL', 'Ручное решение', 'approval']]],
  ['control', 'Защита от повторов', 'shield', 'red-7', [['THROTTLE', 'Ограничить частоту', 'speed'], ['DEDUPLICATE', 'Найти похожую заявку', 'content_copy']]],
  ['integrations', 'Интеграции', 'http', 'blue-grey-7', [['HTTP_REQUEST', 'HTTP-запрос', 'http']]],
  ['advanced', 'Дополнительно: скрипты', 'code', 'grey-7', [['ACTION', 'Скрипт команд', 'code'], ['ERROR_HANDLER', 'Скрипт обработки ошибки', 'error_outline'], ['RETRY', 'Повторить скрипт', 'replay']]]
]

export function buildAutomationPalette (catalog = []) {
  const groups = definitions.map(([id, label, icon, color, items]) => ({
    id,
    label,
    icon,
    color,
    items: items.map(([type, name, symbol]) => ({
      key: type,
      type,
      label: name,
      icon: symbol,
      color
    }))
  }))
  for (const operation of catalog) {
    let group = groups.find(g => g.label === operation.group)
    if (!group) {
      group = {
        id: 'operations-' + operation.group,
        label: operation.group,
        icon: 'widgets',
        color: 'blue-grey-7',
        items: []
      }
      groups.push(group)
    }
    group.items.push({
      key: operation.id,
      type: 'OPERATION',
      operation: operation.id,
      label: operation.label,
      icon: operation.icon || 'widgets',
      color: group.color
    })
  }
  return groups.filter(g => g.items.length)
}

export function operationConfig (operation) {
  return {
    operation: operation.id,
    arguments: Object.fromEntries((operation.fields || []).map(field => [field.key, JSON.parse(JSON.stringify(field.defaultValue ?? null))])),
    resultVariable: operation.defaultResultVariable || '',
    background: operation.id === 'ai.generate'
  }
}
