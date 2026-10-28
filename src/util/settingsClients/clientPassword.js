export function secureRandomIndex(max) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] % max
  }
  return Math.floor(Math.random() * max)
}

export function secureRandomChar(source) {
  return source[secureRandomIndex(source.length)]
}

// Надёжный пароль из 16 символов: минимум по одному символу из каждой группы
export function generateStrongPassword() {
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const special = '!@#$%*-_'
  const all = lower + upper + digits + special
  const chars = [
    secureRandomChar(lower),
    secureRandomChar(upper),
    secureRandomChar(digits),
    secureRandomChar(special)
  ]
  while (chars.length < 16) {
    chars.push(secureRandomChar(all))
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandomIndex(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
