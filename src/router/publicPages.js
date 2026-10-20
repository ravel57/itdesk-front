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

// /welcome обычно требует входа, но по ссылке-приглашению (?token=...) её открывает ещё не
// авторизованный новый пользователь — в этот момент сессии нет, и 401/guard не должны её перехватывать
function hasInviteToken () {
  try {
    return new URLSearchParams(window.location.search).has('token')
  } catch (e) {
    return false
  }
}

// The welcome page removes the secret from the address bar after reading it.
// Keep its public status until navigation leaves the page.
let welcomeInviteActive = false

export function setWelcomeInviteActive (active) {
  welcomeInviteActive = Boolean(active)
}

export function isPublicPage (path = window.location.pathname, query = null) {
  if (PUBLIC_PAGES.includes(path)) {
    return true
  }
  return path === '/welcome' && (welcomeInviteActive || Boolean(query?.token) || hasInviteToken())
}
