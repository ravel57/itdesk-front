const pathPattern = /\bvar\.([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)/g
const declarationKeys = new Set(['resultVariable', 'itemVariable', 'indexVariable'])
const normalizeVariable = value => String(value || '').trim().replace(/^var\./, '')

function leaves (value, path = '', result = []) {
  if (typeof value === 'string') result.push({ path, value })
  else if (Array.isArray(value)) value.forEach((item, index) => leaves(item, `${path}[${index}]`, result))
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (['id', 'testResult'].includes(key)) continue
      leaves(item, path ? `${path}.${key}` : key, result)
    }
  }
  return result
}

function references (value, key) {
  const templates = [...value.matchAll(/\{\{([\s\S]*?)\}\}/g)].map(match => match[1])
  const script = value.startsWith('=') || /expression|script|sortBy|uniqueBy|^field$/i.test(key)
  const sources = script ? [value] : templates
  return sources.flatMap(source => {
    // Quoted text is a literal, even when it mentions a variable's name.
    const code = source.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, ' ')
    return [...code.matchAll(pathPattern)].map(match => match[1])
  })
}

function variableEntries (node, fields) {
  const config = node.config || {}
  const declarations = []
  const declare = name => {
    if (name) declarations.push({ name: normalizeVariable(name), declaration: true, path: 'Переменная результата', value: `var.${normalizeVariable(name)}` })
  }
  for (const key of declarationKeys) declare(config[key])
  if (['SET_VARIABLE', 'EXPRESSION', 'COUNTER'].includes(node.type)) declare(config.name)
  if (node.type === 'PARAMETERS') {
    const root = normalizeVariable(config.resultVariable || 'settings')
    declare(root)
    for (const parameter of config.parameters || []) declare(`${root}.${parameter.name}`)
  }
  if (node.type === 'FOR_EACH') {
    declare(config.itemVariable || 'item')
    declare(config.indexVariable || 'index')
  }
  return [...declarations, ...fields.flatMap(field => references(field.value, field.path.split('.').at(-1))
    .map(name => ({ ...field, name, declaration: false })))]
}

function snippet (value, query) {
  const text = value.replace(/\s+/g, ' ').trim()
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase())
  const start = Math.max(0, index - 45)
  return `${start ? '…' : ''}${text.slice(start, start + 160)}${text.length > start + 160 ? '…' : ''}`
}

/** Search saved graph content without changing the graph or including transient test output. */
export function searchAutomationGraph (flow, query, criterion = 'text', catalog = []) {
  const term = String(query || '').trim()
  if (!term) return []
  const variable = normalizeVariable(term)
  if (criterion === 'variable' && !/^[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*$/.test(variable)) return []
  const operations = new Map(catalog.map(operation => [operation.id, operation]))
  const nodes = new Map((flow.nodes || []).map(node => [node.id, node]))
  const results = []
  for (const node of flow.nodes || []) {
    const operation = operations.get(node.config?.operation)
    const fields = leaves({ label: node.label, config: node.config, operationLabel: operation?.label })
    const match = criterion === 'variable'
      ? variableEntries(node, fields).find(item => item.name === variable || item.name.startsWith(variable + '.') ||
          (item.declaration && variable.startsWith(item.name + '.')))
      : fields.find(field => field.value.toLocaleLowerCase().includes(term.toLocaleLowerCase()))
    if (match) {
      results.push({
        kind: 'node',
        id: node.id,
        label: node.label || operation?.label || node.type,
        section: node.config?.section || '',
        detail: snippet(match.value, term)
      })
    }
  }
  for (const edge of flow.edges || []) {
    const fields = leaves({ label: edge.label, config: edge.config })
    const match = criterion === 'variable'
      ? fields.find(field => references(field.value, field.path.split('.').at(-1))
        .some(name => name === variable || name.startsWith(variable + '.')))
      : fields.find(field => field.value.toLocaleLowerCase().includes(term.toLocaleLowerCase()))
    if (match) {
      results.push({
        kind: 'edge',
        id: edge.id,
        label: `${nodes.get(edge.source)?.label || 'Узел'} → ${nodes.get(edge.target)?.label || 'Узел'}`,
        section: '',
        detail: snippet(match.value, term)
      })
    }
  }
  return results
}
