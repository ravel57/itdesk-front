import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/util/automationVariableTypes.js', import.meta.url), 'utf8')
const { analyzeAutomationVariables: analyze, inferExpressionType: infer } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
const number = { type: 'NUMBER' }
const string = { type: 'STRING' }
const task = { type: 'OBJECT', fields: { id: number, name: string, createdAt: { type: 'DATE_TIME' } } }
const catalog = [{ id: 'data.tasks', resultSchema: { type: 'LIST', element: task } }, { id: 'list.select', resultSchema: { type: 'LIST' } }]
const operation = (id, operation, resultVariable, args = {}) => ({ id, type: 'OPERATION', config: { operation, resultVariable, arguments: args } })
const types = (nodes, edges = [], selected) => Object.fromEntries(analyze({ nodes, edges }, catalog, selected).map(({ name, ...type }) => [name, type]))

test('types flow through aliases, filters, projections and concatenation', () => {
  const nodes = [operation('read', 'data.tasks', 'tasks')]
  for (let i = 8; i >= 1; i--) nodes.push(operation('alias' + i, 'value.set', 'alias' + i, { value: '=var.' + (i === 1 ? 'tasks' : 'alias' + (i - 1)) }))
  nodes.push(operation('filter', 'list.select', 'matched', { items: '=var.alias8' }))
  nodes.push(operation('project', 'list.project', 'names', { items: '=var.matched', expression: 'var.item.name' }))
  nodes.push(operation('concat', 'list.concat', 'allNames', { first: '=var.names', second: ['other'] }))
  const result = types(nodes)
  assert.equal(result.matched.type, 'LIST')
  assert.equal(result.matched.element.fields.createdAt.type, 'DATE_TIME')
  assert.equal(result.allNames.element.type, 'STRING')
  assert.equal(infer('var.matched.size()', result).type, 'NUMBER')
  assert.equal(infer('var.matched.first().name.trim()', result).type, 'STRING')
})

test('loop collections preserve object fields, including different scopes with the same alias', () => {
  const nodes = [operation('read', 'data.tasks', 'tasks'),
    { id: 'loop', type: 'FOR_EACH', config: { itemsExpression: 'var.tasks', itemVariable: 'item', endNodeId: 'end', collectExpression: 'var.record', resultVariable: 'matches' } },
    operation('record', 'value.set', 'record', { value: { task: '=var.item', confidence: 0.9 } }),
    { id: 'end', type: 'LOOP_END', config: {} },
    { id: 'otherLoop', type: 'FOR_EACH', config: { itemsExpression: "['text']", itemVariable: 'item', endNodeId: 'otherEnd', collectExpression: 'var.item', resultVariable: 'texts' } },
    operation('otherBody', 'value.set', 'text', { value: '=var.item' }),
    { id: 'otherEnd', type: 'LOOP_END', config: {} },
    operation('filter', 'list.select', 'matched', { items: '=var.matches' })]
  const edges = [{ source: 'loop', target: 'record', sourceHandle: 'body' }, { source: 'record', target: 'end' },
    { source: 'otherLoop', target: 'otherBody', sourceHandle: 'body' }, { source: 'otherBody', target: 'otherEnd' }]
  const result = types(nodes, edges, 'record')
  assert.equal(result.matched.element.fields.task.fields.name.type, 'STRING')
  assert.equal(result.matched.element.fields.confidence.type, 'NUMBER')
  assert.equal(result.item.fields.id.type, 'NUMBER')
  assert.equal(types(nodes, edges, 'otherBody').item.type, 'STRING')
})

test('literal objects, expressions and action assignments are analysed without executing actions', () => {
  const result = types([{ id: 'action', type: 'ACTION', config: { actionScript: "var.values = [1, 2]; client.sendMessage('never execute');\nvar.count = var.values.size()\nvar.label = 'Count: ' + var.count" } }])
  assert.equal(result.values.element.type, 'NUMBER')
  assert.equal(result.count.type, 'NUMBER')
  assert.equal(result.label.type, 'STRING')
  assert.equal(infer("{'items': [true], 'name': 'ok'}").fields.items.element.type, 'BOOLEAN')
  assert.equal(infer('var.unknown.first().name').type, 'UNKNOWN')
  assert.equal(infer('var.incomplete +').type, 'UNKNOWN')
})

test('conflicting definitions stay unknown and editing a source updates dependent types', () => {
  const nodes = [operation('a', 'value.set', 'value', { value: [] }), operation('b', 'value.set', 'value', { value: 3 })]
  assert.equal(types(nodes).value.type, 'UNKNOWN')
  nodes[0].config.arguments.value = 2
  assert.equal(types(nodes).value.type, 'NUMBER')
})

test('self references and unsafe property names stay bounded', () => {
  const nodes = [operation('self', 'value.set', 'self', { value: '=var' }), operation('unsafe', 'value.set', '__proto__.polluted', { value: true })]
  const result = types(nodes)
  assert.equal({}.polluted, undefined)
  assert.ok(JSON.stringify(result).length < 10000)
})
