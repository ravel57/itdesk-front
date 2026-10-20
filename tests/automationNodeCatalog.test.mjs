import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const source=readFileSync(new URL('../src/util/automationNodeCatalog.js',import.meta.url),'utf8')
const { buildAutomationPalette, operationConfig }=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
const catalog=[
 {id:'client.message',label:'Отправить сообщение клиенту',group:'Сообщения и уведомления',fields:[{key:'text',valueType:'text',defaultValue:''}]},
 {id:'task.create',label:'Создать заявку',group:'Заявки',defaultResultVariable:'createdTask',fields:[{key:'clientId',defaultValue:'=client.id'},{key:'serviceId',entityCatalog:'services',defaultValue:null},{key:'priorityId',valueType:'number',defaultValue:null}]},
 {id:'task.update',label:'Изменить заявку',group:'Заявки',fields:[{key:'fields',defaultValue:{}}]},
 {id:'ai.generate',label:'Сформулировать текст',group:'Решения ИИ',fields:[]},
 {id:'list.select',label:'Отобрать список',group:'Значения и списки',fields:[{key:'sortBy',type:'script'}]},
 {id:'ai.decide',label:'Оценить через Jev',group:'Решения ИИ',fields:[{key:'kind',options:[{value:'choice'},{value:'noul'}]}]}
]

test('every catalog action has exactly one themed palette entry and obsolete alternatives are absent',()=>{
 const groups=buildAutomationPalette(catalog),items=groups.flatMap(g=>g.items),actions=items.filter(i=>i.operation)
 assert.equal(new Set(actions.map(i=>i.operation)).size,catalog.length)
 assert.equal(actions.length,catalog.length)
 assert.equal(new Set(items.map(i=>i.key)).size,items.length)
 assert.ok(!items.some(i=>['CREATE_TASK','ESCALATE','NOTIFY','SET_VARIABLE','EXPRESSION'].includes(i.type)))
 assert.ok(!items.some(i=>i.type==='OPERATION'&&!i.operation))
 assert.equal(groups.find(g=>g.items.some(i=>i.operation==='client.message')).label,'Сообщения и уведомления')
 assert.equal(groups.find(g=>g.items.some(i=>i.operation==='task.create')).label,'Заявки')
 assert.equal(groups.find(g=>g.items.some(i=>i.type==='ACTION')).label,'Дополнительно: скрипты')
})

test('new steps have usable defaults and do not share mutable state with the catalog or other nodes',()=>{
 const reactive=require('vue').reactive
 const spec=reactive(catalog.find(o=>o.id==='task.update'))
 const first=operationConfig(spec),second=operationConfig(spec)
 first.arguments.fields.name='Changed'
 assert.deepEqual(second.arguments.fields,{})
 assert.deepEqual(spec.fields.find(f=>f.key==='fields').defaultValue,{})
 const create=operationConfig(catalog.find(o=>o.id==='task.create'))
 assert.equal(create.arguments.clientId,'=client.id');assert.equal(create.resultVariable,'createdTask')
 assert.equal(operationConfig(catalog.find(o=>o.id==='ai.generate')).background,true)
})

