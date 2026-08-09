export const FLOW_VERSION = 2

let sequence = 1

export function nextFlowId(prefix = 'node') {
  const id = `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`
  sequence += 1
  return id
}

export function deepClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

export function createDefaultWorkflow(triggerType = 'TASK_CREATED') {
  const eventId = nextFlowId('event')
  const conditionId = nextFlowId('condition')
  const actionId = nextFlowId('action')
  const endId = nextFlowId('end')

  return {
    version: FLOW_VERSION,
    entryNodeId: eventId,
    nodes: [
      createNode('EVENT', 80, 220, {triggerType}, eventId),
      createNode('CONDITION', 410, 190, {
        expression: 'true',
        groups: [],
        manualExpression: false
      }, conditionId),
      createNode('ACTION', 810, 90, {
        actionScript: '',
        actions: [{id: nextFlowId('action-item'), type: 'ASSIGN_LINE', value: null}],
        continueOnError: false,
        manualScript: false
      }, actionId),
      createNode('END', 1210, 220, {result: 'Сценарий завершён'}, endId)
    ],
    edges: [
      createEdge(eventId, conditionId, 'next'),
      createEdge(conditionId, actionId, 'true'),
      createEdge(conditionId, endId, 'false'),
      createEdge(actionId, endId, 'next')
    ]
  }
}

export function createNode(type, x = 120, y = 120, config = {}, id = nextFlowId(type.toLowerCase())) {
  return {
    id,
    type: String(type || 'NOTE').toUpperCase(),
    label: defaultNodeLabel(type),
    x,
    y,
    config: deepClone(config) || {}
  }
}

export function createEdge(source, target, sourceHandle = 'next') {
  return {
    id: nextFlowId('edge'),
    source,
    target,
    sourceHandle
  }
}

export function defaultNodeLabel(type) {
  switch (String(type || '').toUpperCase()) {
    case 'EVENT':
      return 'Событие'
    case 'CONDITION':
      return 'Условие'
    case 'SWITCH':
      return 'Разветвление по значению'
    case 'ACTION':
      return 'Действия'
    case 'DELAY':
      return 'Задержка'
    case 'WAIT_UNTIL':
      return 'Ждать до момента'
    case 'WAIT_EVENT':
      return 'Ждать событие'
    case 'WAIT_TASK':
      return 'Ждать связанную заявку'
    case 'APPROVAL':
      return 'Ручное решение'
    case 'SUBFLOW':
      return 'Подпроцесс'
    case 'FORK':
      return 'Параллельные ветки'
    case 'JOIN':
      return 'Объединение веток'
    case 'HTTP_REQUEST':
      return 'HTTP-запрос'
    case 'SET_VARIABLE':
      return 'Установить переменную'
    case 'EXPRESSION':
      return 'Вычислить значение'
    case 'COUNTER':
      return 'Счётчик'
    case 'ERROR_HANDLER':
      return 'Действие с обработкой ошибки'
    case 'RETRY':
      return 'Повтор с задержкой'
    case 'ESCALATE':
      return 'Эскалация'
    case 'CREATE_TASK':
      return 'Создать заявку'
    case 'NOTIFY':
      return 'Уведомление'
    case 'BUSINESS_HOURS':
      return 'Рабочее время'
    case 'THROTTLE':
      return 'Ограничитель частоты'
    case 'DEDUPLICATE':
      return 'Поиск дубля'
    case 'NOTE':
      return 'Комментарий'
    case 'END':
      return 'Завершение'
    default:
      return 'Узел'
  }
}

export function normalizeWorkflow(value, fallbackTriggerType = 'TASK_CREATED') {
  if (!value || typeof value !== 'object') {
    return createDefaultWorkflow(fallbackTriggerType)
  }

  const flow = deepClone(value)
  flow.version = Number(flow.version || FLOW_VERSION)
  flow.nodes = Array.isArray(flow.nodes) ? flow.nodes : []
  flow.edges = Array.isArray(flow.edges) ? flow.edges : []

  flow.nodes = flow.nodes.map((node, index) => ({
    id: node.id || nextFlowId('node'),
    type: String(node.type || 'NOTE').toUpperCase(),
    label: node.label || defaultNodeLabel(node.type),
    x: Number.isFinite(Number(node.x)) ? Number(node.x) : 100 + index * 320,
    y: Number.isFinite(Number(node.y)) ? Number(node.y) : 180,
    config: node.config && typeof node.config === 'object' ? node.config : {}
  }))

  const nodeIds = new Set(flow.nodes.map(node => node.id))
  flow.edges = flow.edges
    .filter(edge => edge && nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map(edge => ({
      id: edge.id || nextFlowId('edge'),
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'next'
    }))

  const eventNode = flow.nodes.find(node => node.type === 'EVENT')
  flow.entryNodeId = nodeIds.has(flow.entryNodeId)
    ? flow.entryNodeId
    : eventNode?.id || flow.nodes[0]?.id || null

  return flow
}

export function parseWorkflowDefinition(value, fallbackTriggerType = 'TASK_CREATED') {
  if (!value) return null
  try {
    return normalizeWorkflow(typeof value === 'string' ? JSON.parse(value) : value, fallbackTriggerType)
  } catch (error) {
    console.warn('Unable to parse automation workflow', error)
    return null
  }
}

export function legacyRuleToWorkflow({triggerType, expression, action, elseAction}) {
  const eventId = nextFlowId('event')
  const conditionId = nextFlowId('condition')
  const yesActionId = nextFlowId('action')
  const noActionId = elseAction ? nextFlowId('action') : null
  const endId = nextFlowId('end')

  const nodes = [
    createNode('EVENT', 80, 260, {triggerType: triggerType || 'TASK_CREATED'}, eventId),
    createNode('CONDITION', 400, 230, {
      expression: expression || 'true',
      groups: [],
      manualExpression: true
    }, conditionId),
    createNode('ACTION', 790, 100, {
      actionScript: action || '',
      actions: [],
      manualScript: true,
      continueOnError: false
    }, yesActionId),
    createNode('END', 1190, 260, {result: 'Сценарий завершён'}, endId)
  ]

  if (noActionId) {
    nodes.push(createNode('ACTION', 790, 420, {
      actionScript: elseAction,
      actions: [],
      manualScript: true,
      continueOnError: false
    }, noActionId))
  }

  const edges = [
    createEdge(eventId, conditionId, 'next'),
    createEdge(conditionId, yesActionId, 'true'),
    createEdge(yesActionId, endId, 'next')
  ]

  if (noActionId) {
    edges.push(createEdge(conditionId, noActionId, 'false'))
    edges.push(createEdge(noActionId, endId, 'next'))
  } else {
    edges.push(createEdge(conditionId, endId, 'false'))
  }

  return normalizeWorkflow({version: FLOW_VERSION, entryNodeId: eventId, nodes, edges})
}

export function getEventNode(flow) {
  const normalized = normalizeWorkflow(flow)
  return normalized.nodes.find(node => node.id === normalized.entryNodeId) || normalized.nodes.find(node => node.type === 'EVENT') || null
}

export function getWorkflowTriggerType(flow, fallback = 'TASK_CREATED') {
  return getEventNode(flow)?.config?.triggerType || fallback
}

export function workflowStats(flow) {
  const normalized = normalizeWorkflow(flow)
  return {
    nodes: normalized.nodes.length,
    edges: normalized.edges.length,
    conditions: normalized.nodes.filter(node => ['CONDITION', 'SWITCH', 'BUSINESS_HOURS', 'DEDUPLICATE', 'THROTTLE'].includes(node.type)).length,
    actions: normalized.nodes.filter(node => ['ACTION', 'ESCALATE', 'CREATE_TASK', 'NOTIFY', 'HTTP_REQUEST'].includes(node.type)).length,
    waits: normalized.nodes.filter(node => ['DELAY', 'WAIT_UNTIL', 'WAIT_EVENT', 'WAIT_TASK', 'APPROVAL', 'RETRY'].includes(node.type)).length
  }
}
