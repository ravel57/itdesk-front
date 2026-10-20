// Static analysis only: expressions and actions are never executed to obtain hints.
const unknown = () => ({ type: 'UNKNOWN' })
const scalar = type => ({ type })
const list = element => ({ type: 'LIST', element: element || unknown() })
const object = fields => ({ type: 'OBJECT', fields })
const variableName = value => String(value || '').replace(/^var\./, '').trim()

export function mergeVariableTypes (left, right, depth = 0) {
  if (depth > 8) return unknown()
  if (!left || left.type === 'UNKNOWN') return left?.conflict ? left : (right || unknown())
  if (!right || right.type === 'UNKNOWN') return right?.conflict ? right : left
  if (left.type === 'NULL') return right
  if (right.type === 'NULL') return left
  if (left.type !== right.type) return { type: 'UNKNOWN', conflict: true }
  if (left.type === 'LIST') return list(mergeVariableTypes(left.element, right.element, depth + 1))
  if (left.type === 'OBJECT') {
    const fields = { ...left.fields }
    for (const [key, value] of Object.entries(right.fields || {})) fields[key] = mergeVariableTypes(fields[key], value, depth + 1)
    return object(fields)
  }
  return left
}

function literalType (value, environment, roots, depth = 0) {
  if (depth > 8) return unknown()
  if (value == null) return scalar('NULL')
  if (Array.isArray(value)) return list(value.reduce((type, item) => mergeVariableTypes(type, literalType(item, environment, roots, depth + 1)), unknown()))
  if (typeof value === 'object') return object(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, literalType(item, environment, roots, depth + 1)])))
  if (typeof value === 'string') return value.startsWith('=') ? inferExpressionType(value.slice(1), environment, roots) : scalar('STRING')
  return scalar(typeof value === 'number' ? 'NUMBER' : 'BOOLEAN')
}

function methodType (type, method) {
  if (['first', 'last'].includes(method)) return type.type === 'LIST' ? type.element || unknown() : unknown()
  if (['size', 'length', 'daysSince', 'minutesSince', 'daysBetween', 'minutesBetween', 'hour', 'openCount', 'closedCount'].includes(method)) return scalar('NUMBER')
  if (['lower', 'upper', 'trim', 'truncate'].includes(method)) return scalar('STRING')
  if (['isNull', 'notNull', 'isEmpty', 'notEmpty', 'isTrue', 'isFalse', 'contains', 'startsWith', 'endsWith', 'equalsIgnoreCase', 'matches', 'isBefore', 'isAfter', 'isToday', 'fieldEquals', 'fieldExists', 'fieldContains'].includes(method)) return scalar('BOOLEAN')
  return unknown()
}

// A small type parser for the expression grammar. Incomplete/unknown expressions stay UNKNOWN.
export function inferExpressionType (expression, environment = {}, roots = {}) {
  const source = String(expression || '').replace(/^=/, '')
  if (!source || source.length > 20000) return unknown()
  const tokens = source.match(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\d+(?:\.\d+)?|[A-Za-z_][\w]*|==|!=|>=|<=|&&|\|\||[^\s]/g) || []
  let position = 0
  let depth = 0
  const precedence = { '||': 1, '&&': 2, '=': 3, '==': 3, '!=': 3, '>': 3, '<': 3, '>=': 3, '<=': 3, in: 3, '+': 4, '-': 4, '*': 5, '/': 5 }
  const take = token => tokens[position] === token && (++position > 0)
  const expect = token => { if (!take(token)) throw new Error('Incomplete expression') }
  function parse (minimum = 0) {
    if (++depth > 50) throw new Error('Expression too deep')
    let result = primary()
    while (precedence[tokens[position]] >= minimum) {
      const operator = tokens[position++]
      const right = parse(precedence[operator] + 1)
      result = precedence[operator] <= 3 ? scalar('BOOLEAN') : scalar(operator === '+' && (result.type === 'STRING' || right.type === 'STRING') ? 'STRING' : 'NUMBER')
    }
    depth--
    return result
  }
  function primary () {
    const token = tokens[position++]
    if (!token) throw new Error('Incomplete expression')
    let result
    if (token === '!' || token === '-') {
      primary()
      result = scalar(token === '!' ? 'BOOLEAN' : 'NUMBER')
    } else if (token === '(') {
      result = parse(); expect(')')
    } else if (token === '[') {
      let element = unknown()
      if (!take(']')) {
        do { element = mergeVariableTypes(element, parse()) } while (take(','))
        expect(']')
      }
      result = list(element)
    } else if (token === '{') {
      const fields = Object.create(null)
      if (!take('}')) {
        do {
          const key = tokens[position++].replace(/^['"]|['"]$/g, '')
          expect(':'); fields[key] = parse()
        } while (take(','))
        expect('}')
      }
      result = object(fields)
    } else if (/^['"]/.test(token)) result = scalar('STRING')
    else if (/^\d/.test(token)) result = scalar('NUMBER')
    else if (['true', 'false', 'null'].includes(token)) result = scalar(token === 'null' ? 'NULL' : 'BOOLEAN')
    else if (token === 'var') result = object(environment)
    else result = roots[token] || unknown()
    while (take('.')) {
      const member = tokens[position++]
      if (!member) throw new Error('Incomplete member')
      if (take('(')) {
        if (!take(')')) { do { parse() } while (take(',')); expect(')') }
        result = methodType(result, member)
      } else result = result.fields?.[member] || unknown()
    }
    return result
  }
  try {
    const result = parse()
    return position === tokens.length ? result : unknown()
  } catch { return unknown() }
}

function boundedType (schema, depth = 0) {
  if (!schema || depth > 8) return unknown()
  if (schema.type === 'LIST') return list(boundedType(schema.element, depth + 1))
  if (schema.type === 'OBJECT') {
    return object(Object.fromEntries(Object.entries(schema.fields || {}).slice(0, 100)
      .filter(([name]) => !['__proto__', 'constructor', 'prototype'].includes(name))
      .map(([name, type]) => [name, boundedType(type, depth + 1)])))
  }
  return { ...schema }
}

function put (environment, name, type) {
  const parts = variableName(name).split('.').filter(Boolean)
  if (!parts.length || parts.length > 8 || parts.some(part => !/^[A-Za-z_]\w*$/.test(part) || ['__proto__', 'constructor', 'prototype'].includes(part))) return
  let target = environment
  for (const part of parts.slice(0, -1)) {
    if (!target[part] || target[part].type !== 'OBJECT') target[part] = object({})
    // Clone fields before assigning: an alias must not mutate its source schema.
    target[part] = object({ ...target[part].fields })
    target = target[part].fields
  }
  const key = parts[parts.length - 1]
  target[key] = boundedType(mergeVariableTypes(target[key], boundedType(type)))
}

export function analyzeAutomationVariables (flow, catalog, selectedNodeId) {
  const environment = {}
  const definitions = new Map(catalog.map(operation => [operation.id, operation]))
  const roots = {
    task: definitions.get('data.task')?.resultSchema || unknown(),
    service: definitions.get('data.service')?.resultSchema || unknown(),
    client: object({ id: scalar('NUMBER'), name: scalar('STRING'), organization: object({ id: scalar('NUMBER'), name: scalar('STRING') }) }),
    message: object({ id: scalar('NUMBER'), text: scalar('STRING'), date: scalar('DATE_TIME') })
  }
  const nodes = flow.nodes || []
  const loops = nodes.filter(node => node.type === 'FOR_EACH').map(node => {
    const pending = (flow.edges || []).filter(edge => edge.source === node.id && edge.sourceHandle === 'body').map(edge => edge.target)
    const body = new Set()
    while (pending.length) {
      const id = pending.pop()
      if (body.has(id) || id === node.config.endNodeId || id === node.id) continue
      body.add(id)
      pending.push(...(flow.edges || []).filter(edge => edge.source === id).map(edge => edge.target))
    }
    return { node, body }
  }).sort((left, right) => right.body.size - left.body.size)
  function contextAt (id) {
    const context = { ...environment }
    for (const { node, body } of loops) {
      if (!body.has(id) && id !== node.id) continue
      const c = node.config
      context[variableName(c.itemVariable || 'item')] = inferExpressionType(c.itemsExpression, context, roots).element || unknown()
      context[variableName(c.indexVariable || 'index')] = scalar('NUMBER')
    }
    return context
  }
  // Resolve dependencies to a fixed point: loop collections may depend on values produced in their body.
  for (let pass = 0; pass < Math.min(nodes.length + 2, 100); pass++) {
    const before = JSON.stringify(environment)
    for (const node of nodes) {
      const c = node.config || {}
      const context = contextAt(node.id)
      const expression = text => inferExpressionType(text, context, roots)
      const value = item => literalType(item, context, roots)
      if (node.type === 'PARAMETERS') put(environment, c.resultVariable || 'settings', object(Object.fromEntries((c.parameters || []).map(p => [p.name, value(p.value)]))))
      if (['SET_VARIABLE', 'EXPRESSION'].includes(node.type)) put(environment, c.name, expression(c.expression))
      if (node.type === 'COUNTER') put(environment, c.name, scalar('NUMBER'))
      if (node.type === 'OPERATION') {
        const a = c.arguments || {}
        let result = definitions.get(c.operation)?.resultSchema || unknown()
        if (c.operation === 'value.set') result = value(a.value)
        if (c.operation === 'list.select') result = mergeVariableTypes(list(), value(a.items))
        if (c.operation === 'list.concat') result = mergeVariableTypes(value(a.first), value(a.second))
        if (c.operation === 'list.project') result = list(inferExpressionType(a.expression, { ...context, item: value(a.items).element || unknown() }, roots))
        if (c.operation === 'ai.decide') result = object({ ...result.fields, value: value(a.candidates).element || unknown() })
        put(environment, c.resultVariable, result)
      }
      if (node.type === 'FOR_EACH') {
        put(environment, c.itemVariable || 'item', expression(c.itemsExpression).element || unknown())
        put(environment, c.indexVariable || 'index', scalar('NUMBER'))
        if (c.resultVariable) put(environment, c.resultVariable, list(expression(c.collectExpression)))
      }
      if (node.type === 'ACTION') {
        // Commands are split only outside quotes and containers, just as in the runtime.
        for (const assignment of splitCommands(c.actionScript || '')) {
          const match = /^var\.([A-Za-z_]\w*)\s*=(?!=)\s*([\s\S]+)$/.exec(assignment.trim())
          if (match) put(environment, match[1], expression(match[2]))
        }
      }
    }
    if (JSON.stringify(environment) === before) break
  }
  const selectedContext = contextAt(selectedNodeId)
  const descriptors = []
  function flatten (name, type, depth = 0) {
    if (depth > 8 || descriptors.length >= 1000) return
    descriptors.push({ name, ...type })
    for (const [key, field] of Object.entries(type.fields || {})) flatten(name + '.' + key, field, depth + 1)
  }
  for (const [name, type] of Object.entries(selectedContext)) flatten(name, type)
  return descriptors.sort((a, b) => a.name.localeCompare(b.name))
}

function splitCommands (source) {
  if (typeof source !== 'string') return []
  const result = []
  let start = 0; let depth = 0; let quote = ''; let escaped = false
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
    } else if (char === '"' || char === "'") quote = char
    else if ('([{'.includes(char)) depth++
    else if (')]}'.includes(char)) depth--
    else if ((char === ';' || char === '\n') && depth === 0) { result.push(source.slice(start, i)); start = i + 1 }
  }
  result.push(source.slice(start))
  return result
}
