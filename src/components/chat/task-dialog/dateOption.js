// Ограничение q-date: нельзя выбрать дату раньше сегодняшней
export function dateOption (date) {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return date >= `${year}/${month}/${day}`
}
