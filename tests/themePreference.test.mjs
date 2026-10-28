import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const require = createRequire(import.meta.url)
const { ref, readonly } = require('vue')
const preferenceSource = readFileSync(new URL('../src/util/themePreference.js', import.meta.url), 'utf8')
const preferences = await import('data:text/javascript;base64,' + Buffer.from(preferenceSource).toString('base64'))
let instance = 0

async function environment (t, saved) {
  const values = new Map(saved === undefined ? [] : [[preferences.THEME_STORAGE_KEY, saved]])
  const listeners = new Set(), calls = []
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  const originalWindow = globalThis.window
  globalThis.window = {
    localStorage: storage,
    addEventListener: (event, listener) => { assert.equal(event, 'storage'); listeners.add(listener) },
    removeEventListener: (event, listener) => listeners.delete(listener)
  }
  globalThis.themeTestAdapters = { ref, readonly, Dark: { set: mode => calls.push(mode) }, ...preferences }
  const source = readFileSync(new URL('../src/composables/useTheme.js', import.meta.url), 'utf8').replace(/^import .*$/gm, '')
  const header = `// instance ${instance++}\nconst {ref,readonly,Dark,normalizeThemeMode,quasarThemeMode,readThemeMode,THEME_STORAGE_KEY}=globalThis.themeTestAdapters;\n`
  const theme = await import('data:text/javascript;base64,' + Buffer.from(header + source).toString('base64'))
  let dispose
  t.after(() => { dispose?.(); globalThis.window = originalWindow; delete globalThis.themeTestAdapters })
  return {
    ...theme, calls, values, listeners, storage,
    initialize: () => { dispose = theme.initializeTheme() },
    storageEvent: event => { for (const listener of listeners) listener(event) }
  }
}

test('missing, invalid and inaccessible preferences default to the live system theme', async t => {
  for (const value of [undefined, null, '', 'auto', 'invalid', {}, true]) {
    assert.equal(preferences.normalizeThemeMode(value), 'system')
    assert.equal(preferences.quasarThemeMode(value), 'auto')
  }
  assert.equal(preferences.readThemeMode({ getItem: () => { throw Error('Blocked') } }), 'system')
  const theme = await environment(t)
  theme.initialize()
  assert.equal(theme.useTheme().themeMode.value, 'system')
  assert.deepEqual(theme.calls, ['auto'])
})

test('each explicit choice is applied immediately, saved and restored at startup', async t => {
  const theme = await environment(t, 'dark')
  theme.initialize()
  assert.equal(theme.useTheme().themeMode.value, 'dark')
  assert.equal(theme.calls.at(-1), true)
  for (const [mode, quasarMode] of [['light', false], ['dark', true], ['system', 'auto']]) {
    theme.setThemeMode(mode)
    assert.equal(theme.useTheme().themeMode.value, mode)
    assert.equal(theme.calls.at(-1), quasarMode)
    assert.equal(theme.values.get(preferences.THEME_STORAGE_KEY), mode)
    theme.initialize()
    assert.equal(theme.useTheme().themeMode.value, mode)
    assert.equal(theme.calls.at(-1), quasarMode)
  }
})

test('storage changes synchronize other tabs, and clearing preferences restores system mode', async t => {
  const theme = await environment(t, 'light')
  theme.initialize()
  theme.storageEvent({ key: 'another-setting', newValue: 'dark' })
  assert.equal(theme.useTheme().themeMode.value, 'light')
  theme.storageEvent({ key: preferences.THEME_STORAGE_KEY, newValue: 'dark' })
  assert.equal(theme.calls.at(-1), true)
  theme.storageEvent({ key: preferences.THEME_STORAGE_KEY, newValue: 'invalid' })
  assert.equal(theme.calls.at(-1), 'auto')
  theme.setThemeMode('dark')
  theme.storageEvent({ key: null, newValue: null })
  assert.equal(theme.useTheme().themeMode.value, 'system')
  assert.equal(theme.calls.at(-1), 'auto')
})

test('blocked storage cannot prevent switching themes or initializing the app', async t => {
  const theme = await environment(t)
  Object.defineProperty(window, 'localStorage', { get: () => { throw Error('Blocked') } })
  assert.doesNotThrow(theme.initialize)
  assert.equal(theme.calls.at(-1), 'auto')
  assert.doesNotThrow(() => theme.setThemeMode('dark'))
  assert.equal(theme.calls.at(-1), true)
  assert.equal(theme.useTheme().themeMode.value, 'dark')
})

test('reinitializing removes the old cross-tab listener', async t => {
  const theme = await environment(t)
  theme.initialize()
  theme.initialize()
  assert.equal(theme.listeners.size, 1)
  const before = theme.calls.length
  theme.storageEvent({ key: preferences.THEME_STORAGE_KEY, newValue: 'dark' })
  assert.equal(theme.calls.length, before + 1)
})
