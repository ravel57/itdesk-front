import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { parse } = require('@vue/compiler-sfc')
const flowSource = readFileSync(new URL('../src/util/automationFlow.js', import.meta.url), 'utf8')
const flow = await import('data:text/javascript;base64,' + Buffer.from(flowSource).toString('base64'))
const { descriptor } = parse(readFileSync(new URL('../src/pages/settings/AutomatizationPage.vue', import.meta.url), 'utf8'))
const script = descriptor.script.content.replace(/^import[\s\S]*?from ['"][^'"]+['"]\s*$/gm, '').replace('export default', 'return')

function editor() {
  const dialogs = [], notifications = [], requests = []
  const axios = {
    async delete(url) { requests.push({ method: 'delete', url }); return { data: {} } },
    async post(url, body) { requests.push({ method: 'post', url, body }); return { data: url.endsWith('/validate') ? { valid: true } : { ...body, id: 23 } } },
    async patch(url, body) { requests.push({ method: 'patch', url, body }); return { data: body } }
  }
  const bindings = { ...flow, axios, localStorage: { getItem: () => 'true' }, useStore: () => ({}),
    AutomationTraceDetails: {}, AutomationTreeLevel: {}, AutomationFlowEditor: {}, AutomationExpressionInput: {}, AutomationEventSelect: {} }
  const component = new Function(...Object.keys(bindings), script)(...Object.values(bindings))
  const ctx = { ...component.data(), store: { triggers: [], supportLines: [], statuses: [], priorities: [], tags: [] },
    $refs: { dialogTriggerName: { focus() {} } },
    $q: {
      notify(value) { notifications.push(value) },
      dialog(options) {
        const dialog = { options, handlers: {}, onOk(fn) { this.handlers.ok = fn; return this }, onCancel(fn) { this.handlers.cancel = fn; return this }, onDismiss(fn) { this.handlers.dismiss = fn; return this } }
        dialogs.push(dialog); return dialog
      }
    }
  }
  for (const [name, fn] of Object.entries(component.methods)) ctx[name] = fn.bind(ctx)
  for (const [name, fn] of Object.entries(component.computed)) Object.defineProperty(ctx, name, { get: () => fn.call(ctx) })
  const row = { id: 18, name: 'Подбор статьи', description: '', triggerType: 'MESSAGE_INCOMING', automationRuleStatus: 'ENABLED', stopProcessing: false,
    workflowDefinition: JSON.stringify(flow.createDefaultWorkflow('MESSAGE_INCOMING')) }
  ctx.store.triggers.push(row); ctx.editTrigger(row)
  const answer = accepted => { const d = dialogs.at(-1); d.handlers[accepted ? 'ok' : 'cancel'](); d.handlers.dismiss() }
  return { ctx, dialogs, notifications, requests, axios, row, answer, leave: () => component.beforeRouteLeave.call(ctx) }
}

test('unchanged graph closes immediately; viewport changes and object key order are ignored', async () => {
  const { ctx, dialogs } = editor()
  ctx.zoom = .5; ctx.selectedNodeId = ctx.workflow.nodes[0].id; ctx.paletteVisible = false
  ctx.workflow.nodes[0].config = { ...ctx.workflow.nodes[0].config }
  ctx.workflow.nodes[0] = Object.fromEntries(Object.entries(ctx.workflow.nodes[0]).reverse())
  assert.equal(ctx.hasUnsavedEditorChanges, false)
  await ctx.dialogClose()
  assert.equal(ctx.dialogVisible, false); assert.equal(dialogs.length, 0)
})

test('node positions, parameters, connections, stages and metadata require confirmation; undo clears dirty state', () => {
  const changes = [c => c.workflow.nodes[1].x++, c => c.workflow.nodes[2].config.arguments = { text: 'Новый текст' },
    c => c.workflow.edges.pop(), c => c.workflow.nodes.pop(), c => c.workflow.sectionOrder = ['2. Обработка', '1. Настройки'],
    c => c.dialogTriggerName += '!', c => c.dialogTriggerDescription = 'Новое описание',
    c => c.dialogTriggerEnabled = false, c => c.dialogStopProcessing = true]
  for (const change of changes) {
    const { ctx } = editor(); const before = JSON.parse(JSON.stringify({ workflow: ctx.workflow, name: ctx.dialogTriggerName, description: ctx.dialogTriggerDescription, enabled: ctx.dialogTriggerEnabled, stop: ctx.dialogStopProcessing }))
    change(ctx); assert.equal(ctx.hasUnsavedEditorChanges, true)
    Object.assign(ctx, { workflow: before.workflow, dialogTriggerName: before.name, dialogTriggerDescription: before.description, dialogTriggerEnabled: before.enabled, dialogStopProcessing: before.stop })
    assert.equal(ctx.hasUnsavedEditorChanges, false)
  }
})

test('cancel keeps edits; repeated close attempts share one confirmation; discard closes', async () => {
  const { ctx, dialogs, answer } = editor(); ctx.workflow.nodes[1].x++
  const closing = ctx.dialogClose(), again = ctx.dialogClose()
  assert.equal(dialogs.length, 1); assert.equal(ctx.dialogVisible, true)
  answer(false); await Promise.all([closing, again])
  assert.equal(ctx.dialogVisible, true); assert.equal(ctx.hasUnsavedEditorChanges, true)
  const retry = ctx.dialogClose(); answer(true); await retry
  assert.equal(ctx.dialogVisible, false); assert.equal(ctx.hasUnsavedEditorChanges, false)
})

test('dialog model close requests are guarded and do not discard edits on cancel', async () => {
  const { ctx, dialogs, answer } = editor(); ctx.dialogTriggerName += '!'
  ctx.onEditorVisibilityChange(false)
  assert.equal(dialogs.length, 1); assert.equal(ctx.dialogVisible, true)
  const pending = ctx.discardConfirmation; answer(false); await pending
  assert.equal(ctx.dialogVisible, true)
})

test('route changes are cancelled until discarding is confirmed', async () => {
  const { ctx, leave, answer } = editor(); ctx.workflow.nodes[1].label = 'Изменённый шаг'
  const cancelled = leave(); answer(false)
  assert.equal(await cancelled, false); assert.equal(ctx.dialogVisible, true)
  const accepted = leave(); answer(true)
  assert.equal(await accepted, true); assert.equal(ctx.dialogVisible, false)
})

test('browser reload is prevented only while unsaved edits exist', () => {
  const { ctx } = editor(); let prevented = 0
  const event = { preventDefault() { prevented++ } }
  ctx.onEditorBeforeUnload(event); assert.equal(prevented, 0)
  ctx.workflow.nodes[1].x++; ctx.onEditorBeforeUnload(event)
  assert.equal(prevented, 1); assert.equal(event.returnValue, '')
})

test('successful save closes without a discard question', async () => {
  const { ctx, dialogs, requests } = editor(); ctx.workflow.nodes[1].x++
  await ctx.dialogSaveNewOrUpdateTrigger()
  assert.equal(requests.at(-1).method, 'patch'); assert.equal(ctx.dialogVisible, false)
  assert.equal(ctx.hasUnsavedEditorChanges, false); assert.equal(dialogs.length, 0)
})

test('failed save keeps edits and the close confirmation', async () => {
  const { ctx, axios, answer, dialogs } = editor(); ctx.workflow.nodes[1].x++
  axios.patch = async () => { throw Error('Сеть недоступна') }
  await ctx.dialogSaveNewOrUpdateTrigger()
  assert.equal(ctx.dialogVisible, true); assert.equal(ctx.hasUnsavedEditorChanges, true)
  const closing = ctx.dialogClose(); assert.equal(dialogs.length, 1); answer(false); await closing
  assert.equal(ctx.dialogVisible, true)
})

test('edits made during save are preserved and closing or navigating during save is blocked', async () => {
  const { ctx, axios, leave, dialogs } = editor(); ctx.workflow.nodes[1].x++
  let finish, started; const entered = new Promise(resolve => { started = resolve })
  axios.patch = () => new Promise(resolve => { finish = resolve; started() })
  const saving = ctx.dialogSaveNewOrUpdateTrigger(); await entered
  ctx.workflow.nodes[1].x++
  await ctx.dialogClose(); assert.equal(ctx.dialogVisible, true); assert.equal(dialogs.length, 0)
  assert.equal(await leave(), false)
  finish({ data: { id: 18 } }); await saving
  assert.equal(ctx.dialogVisible, true); assert.equal(ctx.hasUnsavedEditorChanges, true); assert.equal(ctx.saving, false)
})

test('new untouched graph closes without confirmation; a changed new graph asks', async () => {
  const { ctx, dialogs, answer } = editor(); ctx.newTrigger()
  assert.equal(ctx.hasUnsavedEditorChanges, false); await ctx.dialogClose(); assert.equal(dialogs.length, 0)
  ctx.newTrigger(); ctx.workflow.nodes[1].x++
  const closing = ctx.dialogClose(); answer(false); await closing
  assert.equal(ctx.dialogVisible, true)
})


test('deleting a modified graph requires confirmation and cancel preserves it', async () => {
  const { ctx, answer, dialogs, requests } = editor(); ctx.workflow.nodes[1].x++
  const cancelled = ctx.dialogDeleteTrigger()
  assert.equal(dialogs.at(-1).options.ok.label, 'Удалить сценарий')
  answer(false); await cancelled
  assert.equal(requests.length, 0); assert.equal(ctx.dialogVisible, true)
  const deleted = ctx.dialogDeleteTrigger(); answer(true); await deleted
  assert.equal(requests.at(-1).method, 'delete'); assert.equal(ctx.dialogVisible, false)
})

test('creating while editing in flight keeps the new ID and next save updates instead of duplicating', async () => {
  const { ctx, axios, requests } = editor(); ctx.newTrigger(); ctx.dialogTriggerName='Новый сценарий'
  let finish, started; const entered = new Promise(resolve => { started=resolve })
  const post = axios.post.bind(axios)
  axios.post = (url, body) => url.endsWith('/validate') ? post(url, body) : new Promise(resolve => { finish=resolve; started() })
  const saving = ctx.dialogSaveNewOrUpdateTrigger(); await entered
  ctx.dialogTriggerDescription='Правка во время сохранения'
  finish({data:{id:23,name:'Новый сценарий'}}); await saving
  assert.equal(ctx.isNewTrigger, false); assert.equal(ctx.triggerId, 23); assert.equal(ctx.hasUnsavedEditorChanges, true)
  await ctx.dialogSaveNewOrUpdateTrigger()
  assert.equal(requests.at(-1).method, 'patch'); assert.equal(requests.at(-1).body.id, 23)
  assert.equal(ctx.dialogVisible, false)
})
