// Черновики маршрутизации: форма, выражение условия, превью и хранение в localStorage.

export const ROUTING_STORAGE_KEY = 'uldesk.support-line-routing-drafts'

export function createEmptyRoutingForm() {
  return {
    id: null,
    name: '',
    trigger: 'TASK_CREATED',
    conditionField: 'type',
    conditionOperator: 'EQUALS',
    conditionValue: '',
    targetLineId: null,
    assignmentStrategy: 'GROUP_ONLY'
  }
}

export function buildRoutingCondition(routingForm) {
  const value = String(routingForm.conditionValue || '').trim().replaceAll("'", "\\'")
  if (!value) {
    return ''
  }

  const fieldExpressions = {
    type: 'task.type.type',
    priority: 'task.priority.name',
    supportLine: 'task.supportLine.name'
  }

  if (routingForm.conditionField === 'tag') {
    return routingForm.conditionOperator === 'NOT_EQUALS'
      ? `!task.hasTag('${value}')`
      : `task.hasTag('${value}')`
  }
  if (routingForm.conditionField === 'name') {
    return routingForm.conditionOperator === 'NOT_EQUALS'
      ? `!task.nameContains('${value}')`
      : `task.nameContains('${value}')`
  }

  const expression = fieldExpressions[routingForm.conditionField] || 'task.name'
  if (routingForm.conditionOperator === 'NOT_EQUALS') {
    return `${expression} !== '${value}'`
  }
  if (routingForm.conditionOperator === 'CONTAINS') {
    return `${expression}.toLowerCase().includes('${value.toLowerCase()}')`
  }
  return `${expression} === '${value}'`
}

export function buildRoutingPreview(routingForm) {
  const condition = buildRoutingCondition(routingForm)
  const lineId = Number(routingForm.targetLineId)
  const actions = []

  if (Number.isFinite(lineId)) {
    actions.push(`task.assignToGroup(${lineId})`)
    if (routingForm.assignmentStrategy === 'LEAST_LOADED') {
      actions.push(`task.assignToLeastLoadedMember(${lineId})`)
    }
  }

  return [
    `Событие: ${routingForm.trigger || 'TASK_CREATED'}`,
    `Условие: ${condition || 'true'}`,
    `Действия: ${actions.length ? actions.join('; ') : 'выберите целевую линию'}`
  ].join('\n')
}

export function readRoutingDrafts() {
  try {
    const value = JSON.parse(localStorage.getItem(ROUTING_STORAGE_KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch (e) {
    return []
  }
}

export function writeRoutingDrafts(drafts) {
  localStorage.setItem(ROUTING_STORAGE_KEY, JSON.stringify(drafts))
}
