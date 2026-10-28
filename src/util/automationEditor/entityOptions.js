// Опции q-select из справочников (линии, приоритеты, статусы, теги, пользователи...).

export function toOptions(items, labelGetter, valueGetter = item => item.id) {
  return (items || [])
    .filter(item => item && item.id !== undefined && item.id !== null && item.active !== false)
    .map(item => ({label: labelGetter(item), value: valueGetter(item)}))
}

export function userOptions(users) {
  return (users || [])
    .filter(user => user?.id !== undefined && user?.id !== null && user.enabled !== false)
    .map(user => ({
      value: user.id,
      label: `${user.lastname || ''} ${user.firstname || ''}`.trim() || user.username || `Пользователь ${user.id}`
    }))
}
