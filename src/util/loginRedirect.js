const authPaths = new Set(['/login', '/login-error', '/session-expired', '/reset-password', '/logout', '/perform_login'])
const invalidCharacters = (value, allowSpace = false) => value.includes('\\') ||
  Array.from(value).some(char => char.charCodeAt(0) <= (allowSpace ? 31 : 32) || char.charCodeAt(0) === 127)

export function safeLoginRedirect (value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || invalidCharacters(value)) return null
  try {
    const url = new URL(value, 'https://app.invalid')
    const path = decodeURIComponent(url.pathname)
    if (url.origin !== 'https://app.invalid' || path.startsWith('//') || invalidCharacters(path, true) || authPaths.has(path.replace(/\/$/, '')) || path.startsWith('/login/')) return null
    return value
  } catch {
    return null
  }
}

export function loginLocation (target, path = '/login', query = {}) {
  const redirect = safeLoginRedirect(target)
  return { path, query: { ...query, ...(redirect ? { redirect } : {}) } }
}

export function loginUrl (target, path = '/login', query = {}) {
  const location = loginLocation(target, path, query)
  const search = new URLSearchParams(location.query).toString()
  return location.path + (search ? '?' + search : '')
}

export function loginTargetFromRoute (route) {
  const target = safeLoginRedirect(route?.query?.redirect)
  // A server redirect inherits the original fragment, which the server cannot read.
  return target && !target.includes('#') && route.hash ? safeLoginRedirect(target + route.hash) : target
}
