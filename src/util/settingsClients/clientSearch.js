export function normalizeSearch(value) {
  return String(value || '').trim().toLocaleLowerCase('ru-RU')
}

export function matchesSearch(values, needle) {
  return values
    .filter(value => value !== null && value !== undefined)
    .some(value => normalizeSearch(value).includes(needle))
}
