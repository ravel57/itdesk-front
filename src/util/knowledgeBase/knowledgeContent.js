// Чистые функции разбора статьи базы знаний: черновики, тексты, теги, превью, поиск.

export function isDraft (knowledge) {
  return knowledge?.status === 'DRAFT'
}

export function getTaskLink (knowledge) {
  return { path: '/tasks', query: { task: knowledge.sourceTaskId } }
}

export function getKnowledgeTexts (knowledge) {
  if (!knowledge || !Array.isArray(knowledge.texts)) {
    return []
  }

  return knowledge.texts
    .map(text => String(text || '').trim())
    .filter(text => text.length > 0)
}

export function getKnowledgeTags (knowledge) {
  if (!knowledge || !Array.isArray(knowledge.tags)) {
    return []
  }

  return knowledge.tags.filter(tag => tag && tag.name)
}

export function getKnowledgePreview (knowledge) {
  const text = getKnowledgeTexts(knowledge).join(' ')
  if (!text) {
    return 'Без описания'
  }

  return text.length > 220 ? `${text.slice(0, 220)}...` : text
}

export function normalizeSearchValue (value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll('ё', 'е')
}

export function getKnowledgeSearchText (knowledge) {
  const title = knowledge?.title || ''
  const texts = getKnowledgeTexts(knowledge).join(' ')
  const tags = getKnowledgeTags(knowledge).map(tag => tag.name).join(' ')

  return normalizeSearchValue([
    title,
    texts,
    tags
  ].join(' '))
}
