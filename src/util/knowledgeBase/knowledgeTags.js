import { normalizeSearchValue } from 'src/util/knowledgeBase/knowledgeContent'

// Варианты тегов для выбора в диалоге статьи (чистые функции).

// Уникальные имена тегов, отсортированные по алфавиту.
export function getAllTagOptions (tags) {
  return (tags || [])
    .filter(tag => tag && tag.name)
    .map(tag => tag.name)
    .filter((name, index, array) => array.indexOf(name) === index)
    .sort((left, right) => left.localeCompare(right, 'ru'))
}

export function filterTagOptions (options, value) {
  const search = normalizeSearchValue(value)
  return search
    ? options.filter(tagName => normalizeSearchValue(tagName).includes(search))
    : options
}
