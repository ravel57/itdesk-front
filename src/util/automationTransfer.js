// Перенос автоматизаций между установками и копирование: формат файла экспорта и разбор импорта.
// Ссылки на справочники (id сервисов, линий, пользователей, тегов) внутри графа не переписываются —
// они остаются теми же, что в исходной системе.

export const EXPORT_FORMAT = 'ULDESK-automation'
export const EXPORT_VERSION = 1

const TRANSFER_FIELDS = ['name', 'description', 'triggerType', 'expression', 'action', 'elseAction', 'workflowVersion', 'stopProcessing']

function parseWorkflow (value) {
  if (value == null || value === '') return null
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch (e) {
    return value
  }
}

/** Поля автоматизации, которые уходят в бэкенд при создании (клонирование, импорт). */
export function triggerPayload (source, overrides = {}) {
  const workflow = parseWorkflow(source.workflowDefinition)
  const payload = {
    name: source.name,
    description: source.description ?? '',
    triggerType: source.triggerType,
    expression: source.expression ?? null,
    action: source.action ?? null,
    elseAction: source.elseAction ?? null,
    workflowDefinition: workflow == null ? null : (typeof workflow === 'string' ? workflow : JSON.stringify(workflow)),
    workflowVersion: source.workflowVersion ?? 1,
    stopProcessing: Boolean(source.stopProcessing),
    automationRuleStatus: source.automationRuleStatus || 'ENABLED'
  }
  return { ...payload, ...overrides }
}

/** Содержимое файла экспорта. Граф кладём объектом, а не строкой, чтобы файл можно было читать и править. */
export function buildExport (triggers) {
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    automations: triggers.map(trigger => {
      const item = {}
      TRANSFER_FIELDS.forEach(field => { item[field] = trigger[field] ?? null })
      item.automationRuleStatus = trigger.automationRuleStatus || 'ENABLED'
      item.workflowDefinition = parseWorkflow(trigger.workflowDefinition)
      return item
    })
  }
}

/** Свободное имя среди существующих: «Имя (копия)», «Имя (копия 2)»… */
export function uniqueName (baseName, existingNames, suffix = 'копия') {
  const taken = new Set(existingNames.map(name => String(name || '').trim().toLowerCase()))
  const base = String(baseName || '').trim()
  let candidate = `${base} (${suffix})`
  for (let index = 2; taken.has(candidate.toLowerCase()); index++) {
    candidate = `${base} (${suffix} ${index})`
  }
  return candidate
}

/**
 * Разбор загруженного JSON. Принимает файл экспорта, один объект автоматизации, массив объектов
 * или ответ GET /api/v1/triggers. Возвращает { items, errors }: items — готовые к созданию автоматизации,
 * errors — по одной строке на пропущенную запись или на файл целиком.
 */
export function parseImport (text, knownTriggerTypes = []) {
  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    return { items: [], errors: ['Файл не похож на JSON: ' + e.message] }
  }

  let list
  if (Array.isArray(data)) list = data
  else if (data && Array.isArray(data.automations)) list = data.automations
  else if (data && typeof data === 'object' && (data.name || data.triggerType)) list = [data]
  else return { items: [], errors: ['В файле не найдено ни одной автоматизации'] }

  if (data && !Array.isArray(data) && data.format && data.format !== EXPORT_FORMAT) {
    return { items: [], errors: [`Неизвестный формат файла: ${data.format}`] }
  }

  if (!list.length) return { items: [], errors: ['В файле не найдено ни одной автоматизации'] }

  const items = []
  const errors = []
  list.forEach((entry, index) => {
    const label = entry && entry.name ? `«${entry.name}»` : `№${index + 1}`
    if (!entry || typeof entry !== 'object') {
      errors.push(`Запись ${label}: ожидался объект`)
      return
    }
    if (!String(entry.name || '').trim()) {
      errors.push(`Запись ${label}: не указано название`)
      return
    }
    if (!entry.triggerType) {
      errors.push(`Автоматизация ${label}: не указано событие (triggerType)`)
      return
    }
    if (knownTriggerTypes.length && !knownTriggerTypes.includes(entry.triggerType)) {
      errors.push(`Автоматизация ${label}: неизвестное событие ${entry.triggerType}`)
      return
    }
    const hasWorkflow = parseWorkflow(entry.workflowDefinition) != null
    if (!hasWorkflow && (!entry.expression || !entry.action)) {
      errors.push(`Автоматизация ${label}: нет ни графа (workflowDefinition), ни условия с действием`)
      return
    }
    items.push(triggerPayload(entry))
  })
  return { items, errors }
}
