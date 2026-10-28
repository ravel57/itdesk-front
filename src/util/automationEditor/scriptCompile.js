import { CONDITION_FIELDS } from './editorConstants'

// Компиляция условий и действий визуального конструктора в строку сценария.

export function conditionMeta(field) {
  return CONDITION_FIELDS.find(item => item.value === field) || {kind: 'text'}
}

export function conditionOperatorOptions(condition) {
  const kind = conditionMeta(condition.field).kind
  if (kind === 'tag') {
    return [
      {label: 'содержит', value: 'has_tag'},
      {label: 'не содержит', value: 'no_tag'}
    ]
  }
  if (kind === 'text') {
    return [
      {label: 'содержит', value: 'contains'},
      {label: 'не содержит', value: 'not_contains'},
      {label: 'равно', value: 'equals'},
      {label: 'не равно', value: 'not_equals'},
      {label: 'начинается с', value: 'starts_with'},
      {label: 'заканчивается на', value: 'ends_with'},
      {label: 'регулярное выражение', value: 'matches'}
    ]
  }
  return [
    {label: 'равно', value: 'equals'},
    {label: 'не равно', value: 'not_equals'}
  ]
}

export function escapeScript(value) {
  // Строка сценария оборачивается в одинарные кавычки. Сохраняем
  // поддерживаемые escape-последовательности (\n, \r, \t), чтобы
  // визуальный конструктор не превращал \n в литеральный текст "\\n".
  let normalized = String(value ?? '')
  while (normalized.includes('\\"')) {
    normalized = normalized.replaceAll('\\"', '"')
  }

  let result = ''
  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index]

    if (current === '\n') {
      result += '\\n'
      continue
    }
    if (current === '\r') {
      result += '\\r'
      continue
    }
    if (current === '\t') {
      result += '\\t'
      continue
    }
    if (current === "'") {
      result += "\\'"
      continue
    }
    if (current !== '\\') {
      result += current
      continue
    }

    const next = normalized[index + 1]
    if (['n', 'r', 't', '\\', "'", '"'].includes(next)) {
      result += `\\${next}`
      index += 1
    } else {
      result += '\\\\'
    }
  }

  return result
}

export function compileCondition(condition) {
  if (!condition?.field || condition.value === null || condition.value === undefined || condition.value === '') return ''
  const meta = conditionMeta(condition.field)
  if (meta.kind === 'function-boolean') {
    const fn = condition.field === '__WEEKEND__' ? 'is_weekend()' : 'is_working_hours()'
    return condition.value ? fn : `!${fn}`
  }
  if (condition.value === '__NULL__') return condition.operator === 'not_equals' ? `notNull(${condition.field})` : `isNull(${condition.field})`
  const quoted = `'${escapeScript(condition.value)}'`
  if (meta.kind === 'tag') {
    const expression = `${condition.field}.hasTag(${quoted})`
    return condition.operator === 'no_tag' ? `!${expression}` : expression
  }
  if (meta.kind === 'text') {
    if (condition.operator === 'contains' || condition.operator === 'not_contains') {
      const expression = `${condition.field}.contains(${quoted})`
      return condition.operator === 'not_contains' ? `!${expression}` : expression
    }
    if (condition.operator === 'starts_with') return `startsWith(${condition.field}, ${quoted})`
    if (condition.operator === 'ends_with') return `endsWith(${condition.field}, ${quoted})`
    if (condition.operator === 'matches') return `matches(${condition.field}, ${quoted})`
    const expression = `${condition.field} = ${quoted}`
    return condition.operator === 'not_equals' ? `!(${expression})` : expression
  }
  const raw = meta.kind === 'boolean' || typeof condition.value === 'number' ? String(condition.value) : quoted
  const expression = `${condition.field} = ${raw}`
  return condition.operator === 'not_equals' ? `!(${expression})` : expression
}

export function actionNeedsValue(action) {
  return !['CLEAR_ASSIGNEE', 'CLEAR_DEADLINE', 'SET_ANSWER_REQUIRED'].includes(action.type)
}

export function compileAction(action) {
  if (!action?.type) return ''
  if (actionNeedsValue(action) && (action.value === null || action.value === undefined || action.value === '')) return ''
  const value = escapeScript(action.value)
  switch (action.type) {
    case 'ASSIGN_LINE':
      return `task.assignToGroup(${action.value})`
    case 'ASSIGN_LEAST_LOADED':
      return `task.assignToLeastLoadedMember(${action.value})`
    case 'ASSIGN_USER':
      return `task.assignToUser(${action.value})`
    case 'CLEAR_ASSIGNEE':
      return 'task.clearAssignee()'
    case 'SET_PRIORITY':
      return `task.setPriority('${value}')`
    case 'SET_STATUS':
      return `task.setStatus('${value}')`
    case 'ADD_TAG':
      return `task.addTag('${value}')`
    case 'REMOVE_TAG':
      return `task.removeTag('${value}')`
    case 'SET_NAME':
      return `task.setName('${value}')`
    case 'SET_DESCRIPTION':
      return `task.setDescription('${value}')`
    case 'SET_DEADLINE_MINUTES':
      return `task.setDeadlineAfterMinutes(${Number(action.value)})`
    case 'CLEAR_DEADLINE':
      return 'task.clearDeadline()'
    case 'SEND_MESSAGE':
      return `client.sendMessage('${value}')`
    case 'SET_ANSWER_REQUIRED':
      return 'client.setAnswerRequired()'
    default:
      return ''
  }
}
