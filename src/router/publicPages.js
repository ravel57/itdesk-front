// Страницы, доступные без входа. Общий список для роутера, загрузки плагинов и обработчика 401:
// на них нельзя запрашивать данные пользователя и перебрасывать на /login
export const PUBLIC_PAGES = [
  '/login',
  '/login-error',
  '/session-expired',
  '/reset-password',
  // Второй фактор: сессия уже есть, но до ввода кода остальные запросы получают 401
  '/login/mfa'
]

export function isPublicPage (path = window.location.pathname) {
  return PUBLIC_PAGES.includes(path)
}
