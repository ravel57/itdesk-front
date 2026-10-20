import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/util/automationGraphSearch.js', import.meta.url), 'utf8')
const { searchAutomationGraph: search } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
const node = (id, type, config, label = id) => ({ id, type, config, label })

test('text search includes labels, sections and nested settings without duplicate results', () => {
  const flow = { nodes: [node('first', 'OPERATION', { section: 'Оценка', arguments: { prompt: 'Найти проблему', text: 'Проблему' } }, 'Найти проблему'),
    node('second', 'NOTE', { text: 'ПРОБЛЕМУ решить' })] }
  const before = JSON.stringify(flow)
  assert.deepEqual(search(flow, 'проблему').map(r => r.id), ['first', 'second'])
  assert.equal(search(flow, 'оценка')[0].section, 'Оценка')
  assert.equal(JSON.stringify(flow), before)
  assert.deepEqual(search(flow, '  '), [])
})

test('catalog labels are searchable and internal IDs and transient test output are excluded', () => {
  const flow = { nodes: [node('technical-id', 'OPERATION', { operation: 'ai.generate', testResult: { text: 'Отладка' } })] }
  assert.equal(search(flow, 'Сформулировать', 'text', [{ id: 'ai.generate', label: 'Сформулировать ответ' }]).length, 1)
  assert.equal(search(flow, 'technical-id').length, 1) // The node's visible label is searchable.
  flow.nodes[0].label = 'Ответ'
  assert.equal(search(flow, 'technical-id').length, 0)
  assert.equal(search(flow, 'Отладка').length, 0)
})

test('variable search finds declarations and references including templates and structured conditions', () => {
  const flow = { nodes: [
    node('write', 'OPERATION', { resultVariable: 'var.matched' }),
    node('read', 'CONDITION', { rule: { children: [{ value: '=var.matched.size()' }] } }),
    node('message', 'OPERATION', { arguments: { text: 'Найдено: {{ var.matched.size() }}' } }),
    node('script', 'ACTION', { actionScript: 'var.other = var.matched.first().id' }),
    node('wrong', 'CONDITION', { expression: 'var.matchedOther.size() > 0' }),
    node('constant', 'OPERATION', { arguments: { text: 'var.matched' } }),
    node('quoted', 'CONDITION', { expression: "message.text = 'var.matched'" })
  ] }
  assert.deepEqual(search(flow, 'matched', 'variable').map(r => r.id), ['write', 'read', 'message', 'script'])
  assert.deepEqual(search(flow, 'var.matched', 'variable').map(r => r.id), ['write', 'read', 'message', 'script'])
  assert.equal(search(flow, 'Matched', 'variable').length, 0)
  assert.equal(search(flow, 'var.', 'variable').length, 0)
})

test('settings fields, loop defaults and legacy variable blocks can be found', () => {
  const flow = { nodes: [
    node('settings', 'PARAMETERS', { parameters: [{ name: 'threshold', value: 0.7 }] }),
    node('read', 'CONDITION', { expression: 'var.settings.threshold > 0' }),
    node('loop', 'FOR_EACH', { itemsExpression: 'var.items' }),
    node('legacy', 'SET_VARIABLE', { name: 'var.result', expression: 'var.item.id' }),
    node('counter', 'COUNTER', { name: 'count' })
  ] }
  assert.deepEqual(search(flow, 'settings.threshold', 'variable').map(r => r.id), ['settings', 'read'])
  assert.deepEqual(search(flow, 'item', 'variable').map(r => r.id), ['loop', 'legacy'])
  assert.deepEqual(search(flow, 'result', 'variable').map(r => r.id), ['legacy'])
  assert.deepEqual(search(flow, 'count', 'variable').map(r => r.id), ['counter'])
})

test('edge text and expressions return a separate navigable result', () => {
  const flow = { nodes: [node('a', 'EVENT', {}, 'Начало'), node('b', 'END', {}, 'Конец')],
    edges: [{ id: 'edge', source: 'a', target: 'b', label: 'Согласовано', config: { expression: 'var.approved' } }] }
  assert.deepEqual(search(flow, 'согласовано')[0], { kind: 'edge', id: 'edge', label: 'Начало → Конец', section: '', detail: 'Согласовано' })
  assert.equal(search(flow, 'approved', 'variable')[0].kind, 'edge')
})
