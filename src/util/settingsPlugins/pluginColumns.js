// Колонки таблицы установленных плагинов (функция, чтобы у каждого экземпляра был свой массив).
export const createPluginColumns = () => [
  {
    name: 'name',
    label: 'Название',
    field: row => row.name || row.key,
    align: 'left',
    sortable: true
  },
  {
    name: 'key',
    label: 'Ключ',
    field: 'key',
    align: 'left',
    sortable: true
  },
  {
    name: 'version',
    label: 'Версия',
    field: row => row.version || '—',
    align: 'left',
    sortable: true
  },
  {
    name: 'enabled',
    label: 'Статус',
    field: 'enabled',
    align: 'left',
    sortable: true
  },
  {
    name: 'runtime',
    label: 'Runtime',
    field: 'runtime',
    align: 'left',
    sortable: true
  },
  {
    name: 'extensionPoints',
    label: 'Точки расширения',
    field: 'extensionPoints',
    align: 'left'
  },
  {
    name: 'actions',
    label: '',
    field: 'actions',
    align: 'right'
  }
]
