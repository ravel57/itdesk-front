// Чистые функции чек-листа заявки: нормализация, копирование, подписи.

export function createChecklistItemId () {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function normalizeChecklist (checklist) {
  if (!Array.isArray(checklist)) {
    return []
  }
  return checklist
    .filter(item => item && item.text !== undefined && item.text !== null)
    .map(item => ({
      id: item.id || createChecklistItemId(),
      text: String(item.text).trim(),
      completed: Boolean(item.completed)
    }))
    .filter(item => item.text.length > 0)
}

// Копия шаблона для заявки: новые id и сброшенные отметки выполнения
export function copyChecklist (checklist) {
  return normalizeChecklist(checklist).map(item => ({
    id: createChecklistItemId(),
    text: item.text,
    completed: false
  }))
}

// Добавляет в конец только те пункты шаблона, текста которых ещё нет в списке (без учёта регистра)
export function appendMissingChecklistItems (checklist, template) {
  const existingTexts = new Set(
    checklist.map(item => item.text.trim().toLowerCase())
  )
  return [
    ...checklist,
    ...template.filter(item => !existingTexts.has(item.text.trim().toLowerCase()))
  ]
}

export function declineRuNumber (value, one, few, many) {
  const number = Math.abs(Number(value)) % 100
  const lastDigit = number % 10
  if (number >= 11 && number <= 19) {
    return many
  }
  if (lastDigit === 1) {
    return one
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few
  }
  return many
}

export function getChecklistItemsLabel (checklist) {
  const count = normalizeChecklist(checklist).length
  return `${count} ${declineRuNumber(count, 'пункт', 'пункта', 'пунктов')}`
}
