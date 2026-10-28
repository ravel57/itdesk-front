export const THEME_STORAGE_KEY = 'uldesk.theme'

export const THEME_OPTIONS = [
  { label: 'Системная', value: 'system' },
  { label: 'Светлая', value: 'light' },
  { label: 'Тёмная', value: 'dark' }
]

export function normalizeThemeMode (mode) {
  return THEME_OPTIONS.some(option => option.value === mode) ? mode : 'system'
}

export function quasarThemeMode (mode) {
  const normalized = normalizeThemeMode(mode)
  return normalized === 'system' ? 'auto' : normalized === 'dark'
}

export function readThemeMode (storage) {
  try {
    return normalizeThemeMode(storage.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'system'
  }
}
