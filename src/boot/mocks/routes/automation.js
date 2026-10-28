import {withPrefix, ok, badRequest, clone} from 'src/boot/mocks/helpers'

export function registerAutomationMocks(mock, db) {
  // GET /triggers, /trigger-types/options — автоматизации (несколько демо-правил, чтобы проверять папки)
  if (!db.automationTriggers) {
    const rule = (id, name, triggerType) => ({
      id,
      name,
      description: '',
      triggerType,
      expression: 'true',
      action: 'workflow.run()',
      elseAction: null,
      workflowDefinition: null,
      workflowVersion: 1,
      orderNumber: id - 1,
      folderId: null,
      displayOrder: id - 1,
      automationRuleStatus: 'ENABLED',
      stopProcessing: false,
      matchCount: id * 3,
      lastMatchedAt: null,
      failureCount: 0,
      lastFailedAt: null,
      lastError: null
    })
    db.automationTriggers = [
      rule(1, 'Назначить линию поддержки', 'TASK_CREATED'),
      rule(2, 'Повысить приоритет VIP-клиентов', 'TASK_CREATED'),
      rule(3, 'Уведомить о нарушении SLA', 'TASK_UPDATED'),
      rule(4, 'Закрыть заявку без ответа', 'TASK_UPDATED'),
      rule(5, 'Тегировать обращения из почты', 'TASK_CREATED')
    ]
    db.automationFolders = []
    db.nextFolderId = 1
  }

  // Логика как на бэкенде: хранится только «что в чём лежит и в каком порядке»,
  // order_number выполнения пересчитывается по порядку чтения дерева.
  const applyAutomationLayout = (items, excludedFolderId = null) => {
    const folders = db.automationFolders.filter(f => f.id !== excludedFolderId)
    const triggers = db.automationTriggers
    const placedTriggers = new Set()
    const placedFolders = new Map()
    const build = list => {
      const result = []
      for (const item of list || []) {
        if (item?.type === 'FOLDER') {
          const folder = folders.find(f => f.id === item.id)
          if (!folder || placedFolders.has(folder.id)) continue
          if (typeof item.collapsed === 'boolean') folder.collapsed = item.collapsed
          const node = {folder, children: []}
          placedFolders.set(folder.id, node)
          node.children = build(item.items)
          result.push(node)
        } else {
          const trigger = triggers.find(t => t.id === item?.id)
          if (trigger && !placedTriggers.has(trigger.id)) {
            placedTriggers.add(trigger.id)
            result.push({trigger})
          }
        }
      }
      return result
    }
    const tree = build(items)
    // Не упомянутое клиентом остаётся в своём контейнере (или уходит наверх).
    folders.filter(f => !placedFolders.has(f.id)).sort((a, b) => a.displayOrder - b.displayOrder).forEach(folder => {
      const node = {folder, children: []}
      placedFolders.set(folder.id, node)
      const parent = placedFolders.get(folder.parentId)
      ;(parent ? parent.children : tree).push(node)
    })
    triggers.filter(t => !placedTriggers.has(t.id)).sort((a, b) => a.orderNumber - b.orderNumber).forEach(trigger => {
      const parent = placedFolders.get(trigger.folderId)
      ;(parent ? parent.children : tree).push({trigger})
    })
    let executionOrder = 0
    const assign = (nodes, parentId) => nodes.forEach((node, position) => {
      if (node.folder) {
        Object.assign(node.folder, {displayOrder: position, parentId})
        assign(node.children, node.folder.id)
      } else {
        Object.assign(node.trigger, {folderId: parentId, displayOrder: position, orderNumber: executionOrder++})
      }
    })
    assign(tree, null)
  }
  const automationLayoutResponse = () => ({
    folders: clone([...db.automationFolders].sort((a, b) => a.displayOrder - b.displayOrder)),
    triggers: db.automationTriggers.map(t => ({
      id: t.id, folderId: t.folderId, displayOrder: t.displayOrder, orderNumber: t.orderNumber
    }))
  })
  const currentAutomationTree = (containerId = null) => {
    const nodes = []
    db.automationFolders.filter(f => (f.parentId ?? null) === containerId).forEach(folder => nodes.push({
      folder,
      position: folder.displayOrder,
      children: currentAutomationTree(folder.id)
    }))
    db.automationTriggers.filter(t => (t.folderId ?? null) === containerId).forEach(trigger => nodes.push({trigger, position: trigger.displayOrder}))
    return nodes.sort((a, b) => a.position - b.position)
  }
  const treeToItems = (nodes, liftedId) => nodes.flatMap(node => {
    if (!node.folder) return [{type: 'TRIGGER', id: node.trigger.id}]
    if (node.folder.id === liftedId) return treeToItems(node.children, liftedId)
    return [{type: 'FOLDER', id: node.folder.id, items: treeToItems(node.children, liftedId)}]
  })

  mock.onGet(withPrefix('\\/triggers')).reply(() => ok(clone([...db.automationTriggers].sort((a, b) => a.orderNumber - b.orderNumber))))
  mock.onGet(withPrefix('\\/trigger-types/options')).reply(() => ok([]))
  mock.onPost(withPrefix('\\/trigger')).reply(config => {
    const body = JSON.parse(config.data)
    const id = Math.max(0, ...db.automationTriggers.map(t => t.id)) + 1
    const trigger = {
      matchCount: 0, lastMatchedAt: null, failureCount: 0, lastFailedAt: null, lastError: null,
      ...body, id, folderId: null, orderNumber: db.automationTriggers.length, displayOrder: db.automationTriggers.length
    }
    db.automationTriggers.push(trigger)
    return ok(clone(trigger))
  })
  mock.onPost(withPrefix('\\/automation\\/validate')).reply(() => ok({valid: true, errors: []}))

  mock.onGet(withPrefix('\\/automation\\/operations')).reply(() => ok([
    {id: 'task.query', label: 'Заявки', group: 'Получить данные', description: 'Найти заявки по фильтру', result: 'Список заявок', fields: []},
    {id: 'client.messages.query', label: 'Сообщения клиента', group: 'Получить данные', description: 'Получить сообщения клиента', result: 'Список сообщений', fields: []},
    {id: 'services.query', label: 'Доступные сервисы', group: 'Получить данные', description: 'Получить список сервисов', result: 'Список сервисов', fields: []},
    {
      id: 'list.select',
      label: 'Отобрать и упорядочить',
      group: 'Списки',
      effect: 'PURE',
      description: 'Для каждого элемента проверяется условие. В условии элемент доступен как var.item.',
      fields: [
        {key: 'items', label: 'Исходный список', type: 'expression', defaultValue: null, help: '', required: false},
        {key: 'where', label: 'Условие отбора', type: 'script', defaultValue: 'true', help: 'Условие для каждого элемента списка. Текущий элемент — var.item; доступны также переменные сценария.', required: false, contextSource: 'items'},
        {key: 'sortBy', label: 'Поле сортировки', type: 'script', defaultValue: 'var.item.id', help: 'Выберите поле текущего элемента из подсказок, например var.item.createdAt.', required: false, contextSource: 'items', legacyItemPath: true}
      ],
      result: 'Список подходящих элементов.',
      resultFields: [],
      elementFields: ['id', 'name', 'date']
    },
    {
      id: 'task.update',
      label: 'Изменить заявку',
      group: 'Изменить заявку',
      description: 'Изменить поля заявки',
      result: 'Обновлённая заявка',
      fields: [
        {key: 'fields', label: 'Поля', type: 'object', help: 'Какие поля изменить', defaultValue: {}}
      ]
    },
    {
      id: 'ai.decide',
      label: 'Решение ИИ',
      group: 'Искусственный интеллект',
      description: 'Принять решение через Jev',
      result: 'Выбранный вариант',
      effect: 'IMPURE',
      fields: [
        {key: 'kind', label: 'Тип решения', type: 'select', help: 'Выбор варианта или вероятность', defaultValue: 'choice'}
      ]
    }
  ]))

  mock.onPost(withPrefix('\\/automation\\/expression\\/suggestions')).reply(config => {
    const body = JSON.parse(config.data || '{}')
    const term = String(body.text || '').toLowerCase()
    const varSuggestions = (body.variables || []).map(name => ({
      path: 'var.' + name,
      insertText: 'var.' + name,
      label: 'var.' + name,
      description: 'Переменная сценария',
      kind: 'VARIABLE',
      type: 'Object',
      hasChildren: false,
      callable: false
    }))
    const all = [
      {path: 'task.id', insertText: 'task.id', label: 'task.id', description: 'ID заявки', kind: 'NUMBER', type: 'Long', hasChildren: false, callable: false},
      {path: 'task.name', insertText: 'task.name', label: 'task.name', description: 'Название заявки', kind: 'STRING', type: 'String', hasChildren: false, callable: false},
      {path: 'task.priority', insertText: 'task.priority', label: 'task.priority', description: 'Приоритет заявки', kind: 'OBJECT', type: 'Priority', hasChildren: true, callable: false},
      {path: 'client.id', insertText: 'client.id', label: 'client.id', description: 'ID клиента', kind: 'NUMBER', type: 'Long', hasChildren: false, callable: false},
      {path: 'var', insertText: 'var', label: 'var', description: 'Переменные сценария', kind: 'VARIABLES', type: 'Variables', hasChildren: true, callable: false},
      ...varSuggestions
    ]
    const suggestions = term ? all.filter(s => s.label.toLowerCase().includes(term)) : all
    return ok({suggestions, replaceFrom: body.cursor, replaceTo: body.cursor})
  })

  // PATCH /trigger — переключатель «Активно/Выключено»
  mock.onPatch(withPrefix('\\/trigger')).reply(config => {
    const body = JSON.parse(config.data || '{}')
    const trigger = db.automationTriggers.find(t => t.id === body.id)
    if (!trigger) return [404]
    trigger.automationRuleStatus = body.automationRuleStatus || trigger.automationRuleStatus
    trigger.name = body.name || trigger.name
    return ok(clone(trigger))
  })

  // Папки автоматизаций
  mock.onGet(withPrefix('\\/automation\\/folders')).reply(() =>
    ok(clone([...db.automationFolders].sort((a, b) => a.displayOrder - b.displayOrder))))

  mock.onPost(withPrefix('\\/automation\\/folders')).reply(config => {
    const name = String(JSON.parse(config.data || '{}').name || '').trim()
    if (!name) return badRequest('name required')
    const top = Math.min(0, ...db.automationFolders.filter(f => f.parentId == null).map(f => f.displayOrder), ...db.automationTriggers.filter(t => t.folderId == null).map(t => t.displayOrder)) - 1
    const folder = {id: db.nextFolderId++, name, collapsed: false, displayOrder: top, parentId: null}
    db.automationFolders.push(folder)
    return ok(clone(folder))
  })

  mock.onPatch(withPrefix('\\/automation\\/folders\\/(\\d+)')).reply(config => {
    const id = Number(config.url.match(/folders\/(\d+)/)?.[1])
    const folder = db.automationFolders.find(f => f.id === id)
    if (!folder) return [404]
    const body = JSON.parse(config.data || '{}')
    if (body.name != null) {
      if (!String(body.name).trim()) return badRequest('name required')
      folder.name = String(body.name).trim()
    }
    if (typeof body.collapsed === 'boolean') folder.collapsed = body.collapsed
    return ok(clone(folder))
  })

  mock.onDelete(withPrefix('\\/automation\\/folders\\/(\\d+)')).reply(config => {
    const id = Number(config.url.match(/folders\/(\d+)/)?.[1])
    if (!db.automationFolders.some(f => f.id === id)) return [404]
    const items = treeToItems(currentAutomationTree(), id)
    applyAutomationLayout(items, id)
    db.automationFolders = db.automationFolders.filter(f => f.id !== id)
    return ok(automationLayoutResponse())
  })

  mock.onPut(withPrefix('\\/automation\\/layout')).reply(config => {
    applyAutomationLayout(JSON.parse(config.data || '{}').items)
    return ok(automationLayoutResponse())
  })
}
