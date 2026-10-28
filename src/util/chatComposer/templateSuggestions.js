// Подсказки шаблонов сообщений в поле ввода (:shortcut + tab, поиск по тексту шаблона)

export const TEMPLATE_SUGGESTIONS_LIMIT = 8

function toTemplateList (templates) {
  return Array.isArray(templates) ? templates : []
}

export function normalizeTemplateSearch (value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^:/, '')
}

function normalizeShortcut (template) {
  return String(template.shortcut || '')
    .toLowerCase()
    .replace(/^:/, '')
}

// Шаблоны, подходящие под запрос, отсортированные по релевантности (не более 8)
export function getMatchingTemplates (templates, value) {
  const query = normalizeTemplateSearch(value)
  const list = toTemplateList(templates)

  if (!query) {
    return list.slice(0, TEMPLATE_SUGGESTIONS_LIMIT)
  }

  const score = template => {
    const text = String(template.text || '').toLowerCase()
    const shortcut = normalizeShortcut(template)

    if (shortcut === query) return 0
    if (shortcut.startsWith(query)) return 1
    if (text.startsWith(query)) return 2
    if (shortcut.includes(query)) return 3
    if (text.includes(query)) return 4
    return 5
  }

  return list
    .filter(template => {
      const text = String(template.text || '').toLowerCase()
      const shortcut = normalizeShortcut(template)

      return text.includes(query) || shortcut.includes(query)
    })
    .sort((left, right) => score(left) - score(right))
    .slice(0, TEMPLATE_SUGGESTIONS_LIMIT)
}

// Шаблон с точным совпадением shortcut (без ведущего «:», без учёта регистра)
export function findTemplateByShortcut (templates, shortcut) {
  return toTemplateList(templates)
    .find(item => String(item.shortcut || '').replace(/^:/, '').toLowerCase() === shortcut)
}

// Контекст поиска шаблона перед кареткой: { query, start, end } или null.
// Упоминания пользователей имеют приоритет над шаблонами (mentionsEnabled).
export function findTemplateSearchContext ({ value, caret, mentionsEnabled, templates }) {
  const before = value.slice(0, caret)

  if (mentionsEnabled && /(?:^|\s)@[^\s@]*$/.test(before)) {
    return null
  }

  const shortcutMatch = before.match(/(?:^|\s)(:([^\s:]*))$/)
  if (shortcutMatch) {
    const rawValue = shortcutMatch[1]
    return {
      query: shortcutMatch[2] || '',
      start: caret - rawValue.length,
      end: caret
    }
  }

  const lineStart = before.lastIndexOf('\n') + 1
  const currentLine = before.slice(lineStart)

  if (!currentLine.trim() || /\s$/.test(currentLine)) {
    return null
  }

  const tokens = [...currentLine.matchAll(/\S+/g)]
  if (tokens.length === 0) {
    return null
  }

  // Ищем сначала по длинному фрагменту, затем по последним словам.
  const maxTokenCount = Math.min(4, tokens.length)
  for (let count = maxTokenCount; count >= 1; count--) {
    const token = tokens[tokens.length - count]
    const relativeStart = token.index
    const rawQuery = currentLine.slice(relativeStart)
    const query = rawQuery.replace(/\s+/g, ' ').trim()

    if (query.length < 2) {
      continue
    }

    if (getMatchingTemplates(templates, query).length > 0) {
      return {
        query,
        start: lineStart + relativeStart,
        end: caret
      }
    }
  }

  return null
}
