import { ACTION_TYPES, DELAY_UNITS } from './editorConstants'

// Иконка, цвет, подписи и краткое описание узла. Каталог операций и прочий контекст передаются явно.

export function nodeIcon(node, operationCatalog) {
  const type = typeof node === 'string' ? node : node.type
  const operation = type === 'OPERATION' && operationCatalog.find(o => o.id === node.config?.operation)
  if (operation) return operation.icon || 'widgets'

  return {
    OPERATION: 'widgets',
    PARAMETERS: 'tune',
    FOR_EACH: 'repeat',
    LOOP_END: 'keyboard_return',
    LOOP_BREAK: 'stop_circle',
    EVENT: 'bolt',
    CONDITION: 'call_split',
    SWITCH: 'alt_route',
    ACTION: 'play_arrow',
    DELAY: 'hourglass_bottom',
    WAIT_UNTIL: 'event',
    WAIT_EVENT: 'notifications_active',
    WAIT_TASK: 'task_alt',
    APPROVAL: 'approval',
    SUBFLOW: 'account_tree',
    FORK: 'fork_right',
    JOIN: 'merge',
    HTTP_REQUEST: 'http',
    SET_VARIABLE: 'data_object',
    EXPRESSION: 'calculate',
    COUNTER: 'exposure_plus_1',
    ERROR_HANDLER: 'error_outline',
    RETRY: 'replay',
    ESCALATE: 'trending_up',
    CREATE_TASK: 'add_task',
    NOTIFY: 'notifications',
    BUSINESS_HOURS: 'schedule',
    THROTTLE: 'speed',
    DEDUPLICATE: 'content_copy',
    NOTE: 'sticky_note_2',
    END: 'flag'
  }[type] || 'crop_square'
}

export function nodeColor(node, operationCatalog, paletteGroups) {
  const type = typeof node === 'string' ? node : node.type
  const operation = type === 'OPERATION' && operationCatalog.find(o => o.id === node.config?.operation)
  if (operation) return paletteGroups.find(group => group.label === operation.group)?.color || 'blue-8'

  return {
    EVENT: 'indigo-6',
    SUBFLOW: 'indigo-7',
    END: 'indigo-8',
    CONDITION: 'orange-6',
    SWITCH: 'orange-7',
    BUSINESS_HOURS: 'orange-8',
    FORK: 'orange-9',
    JOIN: 'deep-orange-8',
    ACTION: 'teal-5',
    ESCALATE: 'teal-6',
    CREATE_TASK: 'teal-7',
    NOTIFY: 'teal-8',
    DELAY: 'purple-5',
    WAIT_UNTIL: 'purple-6',
    WAIT_EVENT: 'purple-7',
    WAIT_TASK: 'purple-8',
    APPROVAL: 'purple-9',
    HTTP_REQUEST: 'blue-grey-5',
    SET_VARIABLE: 'blue-grey-6',
    EXPRESSION: 'blue-grey-7',
    COUNTER: 'blue-grey-8',
    ERROR_HANDLER: 'red-5',
    RETRY: 'red-6',
    THROTTLE: 'red-7',
    DEDUPLICATE: 'red-8',
    NOTE: 'grey-7'
  }[type] || 'grey'
}

export function nodeTypeLabel(node, operationCatalog) {
  const type = typeof node === 'string' ? node : node.type
  const operation = type === 'OPERATION' && operationCatalog.find(o => o.id === node.config?.operation)
  if (operation) return operation.label

  const labels = {OPERATION: 'Выберите шаг', PARAMETERS: 'Настройки сценария', FOR_EACH: 'Для каждого элемента', LOOP_END: 'Следующий элемент', LOOP_BREAK: 'Остановить цикл'}
  if (labels[type]) return labels[type]
  return {
    EVENT: 'Стартовое событие',
    CONDITION: 'Проверка условия',
    SWITCH: 'Многовариантное ветвление',
    ACTION: 'Скрипт команд',
    DELAY: 'Отложенное продолжение',
    WAIT_UNTIL: 'Ожидание момента',
    WAIT_EVENT: 'Ожидание события',
    WAIT_TASK: 'Ожидание связанной заявки',
    APPROVAL: 'Ручное решение',
    SUBFLOW: 'Вызов автоматизации',
    FORK: 'Разделение на ветки',
    JOIN: 'Объединение веток',
    HTTP_REQUEST: 'Внешний HTTP-запрос',
    SET_VARIABLE: 'Запись переменной',
    EXPRESSION: 'Вычисление значения',
    COUNTER: 'Изменение счётчика',
    ERROR_HANDLER: 'Действие с веткой ошибки',
    RETRY: 'Повтор с backoff',
    ESCALATE: 'Эскалация заявки',
    CREATE_TASK: 'Создание связанной заявки',
    NOTIFY: 'Отправка уведомления',
    BUSINESS_HOURS: 'Разветвление по рабочему времени',
    THROTTLE: 'Ограничение частоты',
    DEDUPLICATE: 'Поиск похожей заявки',
    NOTE: 'Комментарий',
    END: 'Конец ветки'
  }[type] || type
}

export function nodeSummary(node, {operationCatalog, eventLabels}) {
  if (node.type === 'OPERATION') { const spec = operationCatalog.find(o => o.id === node.config.operation); return (spec?.label || 'Выберите действие') + (node.config.resultVariable ? ' → var.' + node.config.resultVariable : '') }
  if (node.type === 'PARAMETERS') return (node.config.parameters || []).slice(0, 3).map(p => p.label + ': ' + (typeof p.value === 'object' ? JSON.stringify(p.value) : p.value)).join(' · ')
  if (node.type === 'FOR_EACH') return 'Для каждого элемента: ' + (node.config.itemsExpression || 'Выберите список')
  if (node.type === 'LOOP_END') return 'Завершить обработку текущего элемента'
  if (node.type === 'LOOP_BREAK') return 'Перейти к выходу «Готово» у цикла'
  if (node.type === 'CONDITION' && node.config.rule) return node.config.description || 'Условия редактируются в правой панели'
  const c = node.config || {}
  if (node.type === 'EVENT') return eventLabels[c.triggerType] || c.triggerType || 'Событие не выбрано'
  if (node.type === 'CONDITION') return c.expression || 'Условие не заполнено'
  if (node.type === 'SWITCH') return `${c.valueExpression || 'значение не задано'} · вариантов: ${(c.cases || []).length}`
  if (node.type === 'ACTION') {
    const actions = Array.isArray(c.actions) ? c.actions : []
    if (c.manualScript) return c.actionScript || 'Скрипт не заполнен'
    if (!actions.length) return 'Нет действий'
    return actions.map(action => ACTION_TYPES.find(item => item.value === action.type)?.label || action.type).join(' → ')
  }
  if (node.type === 'DELAY') return `${c.amount || 0} ${DELAY_UNITS.find(item => item.value === c.unit)?.label || ''}`
  if (node.type === 'WAIT_UNTIL') return c.mode === 'FIXED' ? (c.dateTime || 'Дата не задана') : (c.mode || 'Режим не выбран')
  if (node.type === 'WAIT_EVENT') return `${eventLabels[c.eventType] || c.eventType || 'Событие не выбрано'} · ${c.scope || 'TASK'}`
  if (node.type === 'WAIT_TASK') return `${eventLabels[c.eventType] || c.eventType || 'Событие'} · заявка ${c.taskIdExpression || '?'}`
  if (node.type === 'APPROVAL') return c.title || 'Решение не настроено'
  if (node.type === 'SUBFLOW') return `Автоматизация #${c.triggerId || '?'} · ${c.mode || 'INLINE'}`
  if (node.type === 'FORK') return `${(c.branches || []).length} ветки → ${c.joinNodeId || 'JOIN не выбран'}`
  if (node.type === 'JOIN') return c.description || 'Синхронизация веток'
  if (node.type === 'HTTP_REQUEST') return `${c.method || 'GET'} ${c.url || 'URL не задан'}`
  if (node.type === 'SET_VARIABLE' || node.type === 'EXPRESSION') return `var.${c.name || '?'} = ${c.expression || '?'}`
  if (node.type === 'COUNTER') return `var.${c.name || '?'} ${c.operation || 'ADD'} ${c.amountExpression || 1}`
  if (node.type === 'ERROR_HANDLER' || node.type === 'RETRY') return c.actionScript || 'Сценарий не заполнен'
  if (node.type === 'ESCALATE') return `Линия #${c.supportLineId || '?'}${c.priorityName ? ` · ${c.priorityName}` : ''}`
  if (node.type === 'CREATE_TASK') return c.title || 'Название не задано'
  if (node.type === 'NOTIFY') return `${c.channel || 'CLIENT'} · ${c.text || 'Текст не задан'}`
  if (node.type === 'BUSINESS_HOURS') return 'Рабочее время / вне работы / выходной'
  if (node.type === 'THROTTLE') return `${c.scope || 'TASK'} · ${c.amount || 1} ${DELAY_UNITS.find(item => item.value === c.unit)?.label || ''}`
  if (node.type === 'DEDUPLICATE') return `Окно ${c.windowMinutes || 0} мин. · ${c.titleMode || 'NONE'}`
  if (node.type === 'NOTE') return c.text || 'Комментарий к схеме'
  if (node.type === 'END') return c.result || 'Сценарий завершён'
  return ''
}
