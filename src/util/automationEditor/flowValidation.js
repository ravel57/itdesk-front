import { edgeHandleLabel, requiredOutputHandles } from './nodePorts'
import { nodeTypeLabel } from './nodeVisuals'

// Валидация графа автоматизации. getCatalog — ленивый доступ к каталогу операций (нужен только
// для подписи узла без названия), чтобы не создавать лишнюю реактивную зависимость.

export function hasEdge(flow, source, handle) {
  return flow.edges.some(edge => edge.source === source && (edge.sourceHandle || 'next') === handle)
}

export function edgeTarget(flow, source, handle) {
  return flow.edges.find(edge => edge.source === source && (edge.sourceHandle || 'next') === handle)?.target || null
}

export function validateForkPath(ctx, nodeId, joinId, path) {
  if (nodeId === joinId) return {reachesJoin: true, asyncNode: null}
  if (!nodeId || path.has(nodeId)) return {reachesJoin: false, asyncNode: null}
  const node = ctx.nodeMap.get(nodeId)
  if (!node) return {reachesJoin: false, asyncNode: null}
  const nextPath = new Set(path)
  nextPath.add(nodeId)
  const asyncTypes = ['DELAY', 'WAIT_UNTIL', 'WAIT_EVENT', 'WAIT_TASK', 'APPROVAL', 'RETRY']
  if (asyncTypes.includes(node.type) || (node.type === 'SUBFLOW' && node.config?.mode === 'ASYNC')) {
    return {reachesJoin: false, asyncNode: node.label || nodeTypeLabel(node, ctx.getCatalog())}
  }
  if (node.type === 'END') return {reachesJoin: false, asyncNode: null}
  const outgoing = ctx.flow.edges.filter(edge => edge.source === nodeId)
  if (!outgoing.length) return {reachesJoin: false, asyncNode: null}
  let reachesJoin = true
  let asyncNode = null
  for (const edge of outgoing) {
    const child = validateForkPath(ctx, edge.target, joinId, nextPath)
    reachesJoin = reachesJoin && child.reachesJoin
    if (!asyncNode && child.asyncNode) asyncNode = child.asyncNode
  }
  return {reachesJoin, asyncNode}
}

export function hasCycle(flow) {
  const adjacency = new Map()
  flow.edges.forEach(edge => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, [])
    adjacency.get(edge.source).push(edge.target)
  })
  const visiting = new Set()
  const visited = new Set()
  const dfs = nodeId => {
    if (visited.has(nodeId)) return false
    if (visiting.has(nodeId)) return true
    visiting.add(nodeId)
    for (const next of adjacency.get(nodeId) || []) {
      if (dfs(next)) return true
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
    return false
  }
  return flow.nodes.some(node => dfs(node.id))
}

export function validateFlow(flow, getCatalog) {
  const errors = []
  const warnings = []
  const nodes = flow.nodes
  const edges = flow.edges
  const nodeIds = new Set(nodes.map(node => node.id))
  const nodeMap = new Map(nodes.map(node => [node.id, node]))
  const ctx = {flow, nodeMap, getCatalog}
  const events = nodes.filter(node => node.type === 'EVENT')
  if (events.length !== 1) errors.push('В графе должен быть ровно один узел события')
  if (!flow.entryNodeId || !nodeIds.has(flow.entryNodeId)) errors.push('Не указан стартовый узел')

  edges.forEach(edge => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) errors.push('Есть связь с удалённым узлом')
  })

  const incoming = new Map()
  nodes.forEach(node => incoming.set(node.id, 0))
  edges.forEach(edge => incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1))

  nodes.forEach(node => {
    const type = node.type
    const config = node.config || {}
    if (type !== 'EVENT' && !incoming.get(node.id)) warnings.push(`Узел «${node.label}» не имеет входа`)
    if (type === 'EVENT' && !config.triggerType) errors.push('В стартовом узле не выбрано событие')

    const requiredHandles = requiredOutputHandles(node)
    requiredHandles.forEach(handle => {
      if (!hasEdge(flow, node.id, handle)) errors.push(`У узла «${node.label}» не подключён выход «${edgeHandleLabel(node, handle) || handle}»`)
    })

    if (type === 'OPERATION' && !config.operation) errors.push(`В узле «${node.label}» не выбрана операция`)
    if (type === 'FOR_EACH' && (!config.itemsExpression || !config.endNodeId)) errors.push(`В цикле «${node.label}» выберите список и конец итерации`)
    if (type === 'END' && edges.some(edge => edge.source === node.id)) errors.push(`Из конечного узла «${node.label}» не должно быть связи`)
    if (type === 'CONDITION' && !config.expression) errors.push(`Не заполнено условие «${node.label}»`)
    if (type === 'SWITCH') {
      if (!config.valueExpression) errors.push(`Не указано значение для SWITCH «${node.label}»`)
      if (!Array.isArray(config.cases) || !config.cases.length) errors.push(`В SWITCH «${node.label}» нет вариантов`)
    }
    if (type === 'ACTION' && !config.actionScript) errors.push(`В узле «${node.label}» нет действий`)
    if (type === 'DELAY' && Number(config.amount || 0) < 1) errors.push(`В узле «${node.label}» некорректная задержка`)
    if (type === 'WAIT_EVENT' || type === 'WAIT_TASK') {
      if (!config.eventType) errors.push(`В узле «${node.label}» не выбрано ожидаемое событие`)
      if (type === 'WAIT_TASK' && !config.taskIdExpression) errors.push(`В узле «${node.label}» не указан ID заявки`)
    }
    if (type === 'APPROVAL' && !config.title) errors.push(`У ручного решения «${node.label}» нет заголовка`)
    if (type === 'SUBFLOW' && !config.triggerId) errors.push(`В узле «${node.label}» не выбран подпроцесс`)
    if (type === 'FORK') {
      if (!config.joinNodeId || !nodeIds.has(config.joinNodeId)) {
        errors.push(`У FORK «${node.label}» не выбран JOIN`)
      } else if (nodeMap.get(config.joinNodeId)?.type !== 'JOIN') {
        errors.push(`У FORK «${node.label}» выбран узел, который не является JOIN`)
      } else {
        for (const branch of config.branches || []) {
          const start = edgeTarget(flow, node.id, `branch:${branch.id}`)
          if (!start) continue
          const result = validateForkPath(ctx, start, config.joinNodeId, new Set())
          if (!result.reachesJoin) errors.push(`Ветка «${branch.label || branch.id}» должна завершаться выбранным JOIN`)
          if (result.asyncNode) errors.push(`Ветка «${branch.label || branch.id}» содержит ожидание «${result.asyncNode}». Вынесите его после JOIN`)
        }
      }
      if (!Array.isArray(config.branches) || config.branches.length < 2) errors.push(`У FORK «${node.label}» должно быть минимум две ветки`)
    }
    if (type === 'HTTP_REQUEST' && (!config.url || !config.method)) errors.push(`В HTTP-узле «${node.label}» не заполнены метод и URL`)
    if (['SET_VARIABLE', 'EXPRESSION', 'COUNTER'].includes(type) && !config.name) errors.push(`В узле «${node.label}» не указано имя переменной`)
    if (['ERROR_HANDLER', 'RETRY'].includes(type) && !config.actionScript) errors.push(`В узле «${node.label}» не заполнен сценарий`)
    if (type === 'ESCALATE' && !config.supportLineId) errors.push(`В эскалации «${node.label}» не выбрана линия`)
    if (type === 'CREATE_TASK' && !config.title) errors.push(`В узле создания заявки «${node.label}» нет названия`)
    if (type === 'NOTIFY' && !config.text) errors.push(`В уведомлении «${node.label}» нет текста`)
    if (type === 'THROTTLE' && Number(config.amount || 0) < 1) errors.push(`В ограничителе «${node.label}» некорректный интервал`)
    if (type === 'DEDUPLICATE' && Number(config.windowMinutes || 0) < 1) errors.push(`В поиске дубля «${node.label}» некорректный период`)
  })

  if (hasCycle(flow)) errors.push('Произвольные циклические связи запрещены. Для повторов используйте узел «Повтор»')
  return {errors: [...new Set(errors)], warnings: [...new Set(warnings)]}
}
