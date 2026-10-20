import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/util/taskTableColumns.js', import.meta.url), 'utf8')
const {
  TABLE_CUSTOMIZED_KEY,
  TABLE_SETTINGS_KEY,
  defaultTableColumns,
  resolveTableColumns,
  tableColumnsFromCardConfig
} = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))

const card = (enabledKeys) => [
  'description', 'priority', 'supportLine', 'executor', 'type', 'service', 'checklist', 'tags',
  'deadline', 'createdAt', 'sla', 'closeReason', 'lastActivity'
].map(key => ({ key, enabled: enabledKeys.includes(key) }))

const storageOf = (data = {}) => ({ getItem: key => (key in data ? data[key] : null) })
const activeNames = columns => columns.filter(column => column.active).map(column => column.name)

test('table columns follow enabled card fields plus id, name and status', () => {
  const columns = tableColumnsFromCardConfig(card(['priority', 'executor', 'checklist', 'deadline', 'sla', 'closeReason']))
  assert.deepEqual(activeNames(columns), ['id', 'name', 'checklist', 'priority', 'status', 'deadline', 'executor', 'sla'])
})

test('card fields without a table column are ignored, ola is hidden', () => {
  const columns = tableColumnsFromCardConfig(card(['description', 'closeReason', 'lastActivity']))
  assert.deepEqual(activeNames(columns), ['id', 'name', 'status'])
})

test('no saved table settings: columns come from the card config', () => {
  const resolved = resolveTableColumns(storageOf(), card(['tags']))
  assert.equal(resolved.customized, false)
  assert.deepEqual(activeNames(resolved.columns), ['id', 'name', 'tags', 'status'])
})

test('auto-saved all-active settings without a flag are not treated as customized', () => {
  const storage = storageOf({ [TABLE_SETTINGS_KEY]: JSON.stringify(defaultTableColumns()) })
  const resolved = resolveTableColumns(storage, card(['tags']))
  assert.equal(resolved.customized, false)
  assert.deepEqual(activeNames(resolved.columns), ['id', 'name', 'tags', 'status'])
})

test('legacy settings with a hidden column are kept as the user configured them', () => {
  const saved = defaultTableColumns().map(column => ({ ...column, active: column.name !== 'ola' }))
  const resolved = resolveTableColumns(storageOf({ [TABLE_SETTINGS_KEY]: JSON.stringify(saved) }), card(['tags']))
  assert.equal(resolved.customized, true)
  assert.equal(activeNames(resolved.columns).length, 13)
})

test('customized flag keeps the saved settings even when all columns are active', () => {
  const storage = storageOf({
    [TABLE_CUSTOMIZED_KEY]: 'true',
    [TABLE_SETTINGS_KEY]: JSON.stringify(defaultTableColumns())
  })
  const resolved = resolveTableColumns(storage, card(['tags']))
  assert.equal(resolved.customized, true)
  assert.equal(activeNames(resolved.columns).length, 14)
})

test('broken saved json falls back to the card config', () => {
  const resolved = resolveTableColumns(storageOf({ [TABLE_SETTINGS_KEY]: '{oops' }), card(['tags']))
  assert.equal(resolved.customized, false)
})
