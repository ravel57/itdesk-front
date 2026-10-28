// Упоминания пользователей (@) в поле ввода

// Совпадение триггера @ перед кареткой: @ в начале строки или после пробела
export function matchMentionTrigger (before) {
  return before.match(/(?:^|\s)@([^\s@]*)$/)
}

export function filterMentionUsers (users, query) {
  const list = Array.isArray(users) ? users : []
  const q = (query || '').trim().toLowerCase()
  const toSearchString = (u) => (
    `${u.firstname || ''} ${u.lastname || ''} ${u.username || ''} ${u.email || ''}`
  ).toLowerCase()
  return q.length === 0
    ? list
    : list.filter(u => toSearchString(u).includes(q))
}

// Текст упоминания, вставляемый в сообщение: «@[Фамилия Имя] »
export function buildMentionText (user) {
  const fullName = `${user.lastname || ''} ${user.firstname || ''}`.trim()
  const handle = fullName
    ? `[${fullName}]`
    : (user.username || (user.email ? user.email.split('@')[0] : null) || 'user')
  return `@${handle} `
}
