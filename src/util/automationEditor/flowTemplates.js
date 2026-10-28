import { createDefaultWorkflow, createEdge, createNode } from 'src/util/automationFlow'
import { operationConfig } from 'src/util/automationNodeCatalog'

// Готовые шаблоны графов. Справочники передаются явно: {priorities, supportLines, tags, operationCatalog}.

function configureOperation(operationCatalog, node, id, args, label) {
  const spec = operationCatalog.find(operation => operation.id === id)
  node.type = 'OPERATION'
  node.label = label || spec?.label || 'Шаг сценария'
  node.config = spec ? operationConfig(spec) : {operation: id, arguments: {}, resultVariable: '', background: id === 'ai.generate'}
  node.config.arguments = {...node.config.arguments, ...args}
  return node
}

function priorityTemplate({priorities, supportLines, operationCatalog}) {
  const flow = createDefaultWorkflow('TASK_CREATED')
  const condition = flow.nodes.find(node => node.type === 'CONDITION')
  condition.label = 'Критичный приоритет?'
  const critical = priorities.find(priority => String(priority.name).toLowerCase().includes('крит')) || priorities[0]
  condition.config.rule = {left: '=task.priority.id', operator: '=', right: critical?.id || null}
  condition.config.expression = 'task.priority.id = ' + (critical?.id || 'null')
  configureOperation(operationCatalog, flow.nodes.find(node => node.type === 'OPERATION'), 'task.assignLeastLoaded',
    {taskId: '=task.id', lineId: supportLines[0]?.id || null}, 'Назначить сотрудника экспертной линии')
  return flow
}

function slaTemplate({supportLines, tags, operationCatalog}) {
  const event = createNode('EVENT', 70, 240, {triggerType: 'SLA_WARNING'})
  const tag = configureOperation(operationCatalog, createNode('OPERATION', 390, 110), 'task.addTag',
    {taskId: '=task.id', tag: tags[0]?.name || 'Контроль SLA'})
  const delay = createNode('DELAY', 800, 110, {amount: 15, unit: 'MINUTES'})
  const condition = createNode('CONDITION', 1160, 180, {
    rule: {left: '=task.completed', operator: '=', right: false}, expression: 'task.completed = false'
  })
  condition.label = 'Заявка ещё открыта?'
  const assign = configureOperation(operationCatalog, createNode('OPERATION', 1570, 70), 'task.assignLeastLoaded',
    {taskId: '=task.id', lineId: supportLines[0]?.id || null})
  const end = createNode('END', 2000, 230, {result: 'Контроль SLA завершён'})
  return {
    version: 3,
    entryNodeId: event.id,
    nodes: [event, tag, delay, condition, assign, end],
    edges: [
      createEdge(event.id, tag.id, 'next'), createEdge(tag.id, delay.id, 'success'), createEdge(tag.id, end.id, 'error'),
      createEdge(delay.id, condition.id, 'next'), createEdge(condition.id, assign.id, 'true'), createEdge(condition.id, end.id, 'false'),
      createEdge(assign.id, end.id, 'success'), createEdge(assign.id, end.id, 'error')
    ]
  }
}

function reopenTemplate({supportLines, operationCatalog}) {
  const flow = createDefaultWorkflow('TASK_REOPENED')
  const condition = flow.nodes.find(node => node.type === 'CONDITION')
  condition.label = 'Есть исполнитель?'
  condition.config.rule = {left: '=task.executor.id', operator: 'notNull'}
  condition.config.expression = 'task.executor.id.notNull()'
  const clear = configureOperation(operationCatalog, flow.nodes.find(node => node.type === 'OPERATION'), 'task.update',
    {taskId: '=task.id', fields: {clearAssignee: true}}, 'Снять прежнего исполнителя')
  const assign = configureOperation(operationCatalog, createNode('OPERATION', 1220, 90), 'task.assignLeastLoaded',
    {taskId: '=task.id', lineId: supportLines[0]?.id || null})
  const end = flow.nodes.find(node => node.type === 'END')
  end.x = 1640
  flow.nodes.push(assign)
  flow.edges.find(edge => edge.source === clear.id && edge.sourceHandle === 'success').target = assign.id
  flow.edges.push(createEdge(assign.id, end.id, 'success'), createEdge(assign.id, end.id, 'error'))
  return flow
}

export function buildFlowTemplate(type, context) {
  let flow
  if (type === 'priority') flow = priorityTemplate(context)
  if (type === 'sla') flow = slaTemplate(context)
  if (type === 'reopen') flow = reopenTemplate(context)
  return flow
}
