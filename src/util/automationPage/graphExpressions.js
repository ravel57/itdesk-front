// Перевод условий и действий простого редактора правил в строки выражений и обратно.
import {GRAPH_CONDITION_FIELDS, conditionFieldMeta} from 'src/util/automationPage/graphFields'

export function escapeScriptString(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll("'", "\\'")
}

export function buildConditionExpression(condition) {
  if (!condition || !condition.field || condition.value === null || condition.value === undefined || condition.value === '') {
    return ''
  }
  const meta = conditionFieldMeta(condition.field)
  const quotedValue = `'${escapeScriptString(condition.value)}'`

  if (condition.value === '__NULL__') {
    return condition.operator === 'not_equals'
      ? `notNull(${condition.field})`
      : `isNull(${condition.field})`
  }
  if (meta.kind === 'tag') {
    const expression = `${condition.field}.hasTag(${quotedValue})`
    return condition.operator === 'no_tag' ? `!${expression}` : expression
  }
  if (meta.kind === 'text') {
    if (condition.operator === 'contains' || condition.operator === 'not_contains') {
      const expression = `${condition.field}.contains(${quotedValue})`
      return condition.operator === 'not_contains' ? `!${expression}` : expression
    }
    const expression = `${condition.field} = ${quotedValue}`
    return condition.operator === 'not_equals' ? `!(${expression})` : expression
  }

  const value = meta.kind === 'boolean' || typeof condition.value === 'number'
    ? String(condition.value)
    : quotedValue
  const expression = `${condition.field} = ${value}`
  return condition.operator === 'not_equals' ? `!(${expression})` : expression
}

export function buildActionExpression(action) {
  if (!action || !action.type) {
    return ''
  }
  if (action.type !== 'CLEAR_ASSIGNEE' && (action.value === null || action.value === undefined || action.value === '')) {
    return ''
  }
  const value = escapeScriptString(action.value)
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
    case 'SET_ANSWER_REQUIRED':
      return 'client.setAnswerRequired()'
    default:
      return ''
  }
}

export function splitTopLevel(value, separator) {
  const result = []
  let start = 0
  let depth = 0
  let quote = null
  const marker = separator === ';' ? ';' : ` ${separator} `
  for (let index = 0; index < value.length; index++) {
    const char = value[index]
    if (quote) {
      if (char === quote && value[index - 1] !== '\\') quote = null
      continue
    }
    if (char === "'" || char === '"') {
      quote = char
      continue
    }
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (depth === 0 && value.startsWith(marker, index)) {
      result.push(value.slice(start, index).trim())
      start = index + marker.length
      index = start - 1
    }
  }
  result.push(value.slice(start).trim())
  return result.filter(Boolean)
}

export function stripOuterBrackets(value) {
  const trimmed = String(value || '').trim()
  return trimmed.startsWith('(') && trimmed.endsWith(')')
    ? trimmed.slice(1, -1).trim()
    : trimmed
}

export function parseGraphCondition(rawCondition, nextGraphId) {
  let source = String(rawCondition || '').trim()
  let negative = false
  if (source.startsWith('!(') && source.endsWith(')')) {
    negative = true
    source = source.slice(2, -1).trim()
  } else if (source.startsWith('!')) {
    negative = true
    source = source.slice(1).trim()
  }

  let match = source.match(/^(isNull|notNull)\(([a-zA-Z0-9_.]+)\)$/)
  if (match) {
    return {
      id: nextGraphId(),
      field: match[2],
      operator: match[1] === 'notNull' ? 'not_equals' : 'equals',
      value: '__NULL__'
    }
  }

  match = source.match(/^task\.tags\.hasTag\('((?:\\'|[^'])*)'\)$/)
  if (match) {
    return {
      id: nextGraphId(),
      field: 'task.tags',
      operator: negative ? 'no_tag' : 'has_tag',
      value: match[1].replaceAll("\\'", "'")
    }
  }

  match = source.match(/^([a-zA-Z0-9_.]+)\.contains\('((?:\\'|[^'])*)'\)$/)
  if (match) {
    return {
      id: nextGraphId(),
      field: match[1],
      operator: negative ? 'not_contains' : 'contains',
      value: match[2].replaceAll("\\'", "'")
    }
  }

  match = source.match(/^([a-zA-Z0-9_.]+)\s*=\s*(.+)$/)
  if (!match || !GRAPH_CONDITION_FIELDS.some(item => item.value === match[1])) {
    return null
  }
  let value = match[2].trim()
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
    value = value.slice(1, -1).replaceAll("\\'", "'")
  } else if (value === 'true' || value === 'false') {
    value = value === 'true'
  } else if (/^-?\d+(\.\d+)?$/.test(value)) {
    value = Number(value)
  }
  return {
    id: nextGraphId(),
    field: match[1],
    operator: negative ? 'not_equals' : 'equals',
    value
  }
}

export function parseGraphAction(rawAction, nextGraphId) {
  const source = String(rawAction || '').trim()
  let match = source.match(/^task\.assignToGroup\((\d+)\)$/)
  if (match) return {id: nextGraphId(), type: 'ASSIGN_LINE', value: Number(match[1])}
  match = source.match(/^task\.assignToLeastLoadedMember\((\d+)\)$/)
  if (match) return {id: nextGraphId(), type: 'ASSIGN_LEAST_LOADED', value: Number(match[1])}
  match = source.match(/^task\.assignToUser\((\d+)\)$/)
  if (match) return {id: nextGraphId(), type: 'ASSIGN_USER', value: Number(match[1])}
  if (source === 'task.clearAssignee()') return {id: nextGraphId(), type: 'CLEAR_ASSIGNEE', value: null}
  match = source.match(/^task\.setPriority\('((?:\\'|[^'])*)'\)$/)
  if (match) return {id: nextGraphId(), type: 'SET_PRIORITY', value: match[1].replaceAll("\\'", "'")}
  match = source.match(/^task\.setStatus\('((?:\\'|[^'])*)'\)$/)
  if (match) return {id: nextGraphId(), type: 'SET_STATUS', value: match[1].replaceAll("\\'", "'")}
  match = source.match(/^task\.addTag\('((?:\\'|[^'])*)'\)$/)
  if (match) return {id: nextGraphId(), type: 'ADD_TAG', value: match[1].replaceAll("\\'", "'")}
  match = source.match(/^task\.removeTag\('((?:\\'|[^'])*)'\)$/)
  if (match) return {id: nextGraphId(), type: 'REMOVE_TAG', value: match[1].replaceAll("\\'", "'")}
  if (source === 'client.setAnswerRequired()') return {id: nextGraphId(), type: 'SET_ANSWER_REQUIRED', value: null}
  return null
}
