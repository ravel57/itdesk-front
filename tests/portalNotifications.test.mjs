import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/util/portalNotifications.js', import.meta.url), 'utf8')
const { createPortalMessageNotifier } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))

function environment () {
  const shown = [], timers = new Map()
  let focused = 0
  class BrowserNotification {
    static permission = 'granted'
    constructor (title, options) { this.title = title; this.options = options; this.closed = false; shown.push(this) }
    close () { this.closed = true }
  }
  globalThis.window = { Notification: BrowserNotification, focus: () => focused++, setTimeout: fn => { const id = timers.size + 1; timers.set(id, fn); return id }, clearTimeout: id => timers.delete(id) }
  globalThis.document = { hidden: true, hasFocus: () => false }
  return { shown, timers, BrowserNotification, focused: () => focused }
}

test('alerts require an enabled preference, browser permission and an inactive portal', () => {
  const e = environment()
  let enabled = false
  const notifier = createPortalMessageNotifier({ enabled: () => enabled, userId: () => 7 })
  const incoming = [{ id: 20, fromClient: false, text: 'Ответ' }]
  notifier.notify(incoming)
  enabled = true; e.BrowserNotification.permission = 'denied'; notifier.notify(incoming)
  e.BrowserNotification.permission = 'granted'; document.hidden = false; document.hasFocus = () => true; notifier.notify(incoming)
  assert.equal(e.shown.length, 0)
  document.hasFocus = () => false; notifier.notify(incoming)
  assert.equal(e.shown.length, 1)
  notifier.close()
})

test('only new support replies notify: own messages, edits, duplicates and comments are ignored', () => {
  const e = environment()
  const notifier = createPortalMessageNotifier({ enabled: () => true, userId: () => 7 })
  notifier.notify([
    { id: 1, fromClient: false, text: 'История' }, { id: 2, fromClient: true },
    { id: 3, fromClient: false, editedAt: '2026-10-20' }, { id: 4, fromClient: false, isComment: true },
    { id: 5, fromClient: false, deleted: true }, { id: 6, fromClient: false, text: 'Новый ответ' },
    { id: 6, fromClient: false, text: 'Повтор доставки' }
  ], [{ id: '1' }])
  assert.equal(e.shown.length, 1)
  assert.equal(e.shown[0].options.body, 'Новый ответ')
  assert.equal(e.shown[0].title, 'Новое сообщение поддержки')
  assert.equal(e.shown[0].options.tag, 'uldesk-portal-7')
  notifier.close()
})

test('attachments have a preview, clicking focuses the portal and disabling closes active alerts', () => {
  const e = environment()
  let enabled = true, clicked = 0
  const notifier = createPortalMessageNotifier({ enabled: () => enabled, userId: () => 7, onClick: () => clicked++ })
  notifier.notify([{ id: 10, fromClient: false, fileName: 'Инструкция.pdf' }])
  assert.match(e.shown[0].options.body, /Инструкция.pdf/)
  e.shown[0].onclick()
  assert.equal(e.focused(), 1); assert.equal(clicked, 1); assert.equal(e.shown[0].closed, true)
  notifier.notify([{ id: 11, fromClient: false }])
  enabled = false; notifier.close()
  assert.equal(e.shown[1].closed, true)
  assert.equal(e.timers.size, 0)
  notifier.notify([{ id: 12, fromClient: false }])
  assert.equal(e.shown.length, 2)
})
