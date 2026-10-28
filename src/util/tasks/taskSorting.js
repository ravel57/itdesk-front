// Чистые функции сортировки страницы заявок: каталог типов сортировки и (де)сериализация настроек.

export const SORTING_STORAGE_KEY = 'tasksPageSorting'

// Типы сортировки. Фабрика — объекты кладутся в data компонента.
export function createSortingTypes () {
  return [
    {label: 'По дедлайну', slug: 'deadline'},
    {label: 'По дате создания', slug: 'creating'},
    {label: 'Приоритету', slug: 'priority'},
    {label: 'SLA', slug: 'sla'},
    {label: 'OLA', slug: 'ola'},
    {label: 'По статусу', slug: 'status'}
  ]
}

export function serializeSortingSettings (selectedSorting, ascendingSort) {
  return JSON.stringify({
    slug: selectedSorting?.slug || '',
    ascendingSort
  })
}

// Разбирает сохранённые настройки. Бросает исключение на битом JSON (вызывающий код его игнорирует).
// Возвращает {selectedSorting, ascendingSort}; значение undefined — настройку менять не нужно.
export function parseSortingSettings (raw, sortingTypes) {
  const savedSorting = JSON.parse(raw || '{}')
  const selectedSorting = sortingTypes.find(sorting => sorting.slug === savedSorting.slug)
  return {
    selectedSorting,
    ascendingSort: typeof savedSorting.ascendingSort === 'boolean' ? savedSorting.ascendingSort : undefined
  }
}
