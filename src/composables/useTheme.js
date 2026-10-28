import { readonly, ref } from 'vue'
import { Dark } from 'quasar'
import { normalizeThemeMode, quasarThemeMode, readThemeMode, THEME_STORAGE_KEY } from 'src/util/themePreference'

const themeMode = ref('system')
let stopListening

function applyThemeMode (mode) {
  themeMode.value = normalizeThemeMode(mode)
  Dark.set(quasarThemeMode(themeMode.value))
}

export function setThemeMode (mode) {
  applyThemeMode(mode)
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode.value)
  } catch {
    // Тема продолжает работать, даже если браузер запрещает хранение настроек.
  }
}

export function initializeTheme () {
  stopListening?.()
  // Доступ к localStorage сам по себе может быть запрещён настройками браузера.
  try {
    applyThemeMode(readThemeMode(window.localStorage))
  } catch {
    applyThemeMode('system')
  }
  const onStorage = event => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      applyThemeMode(event.newValue)
    }
  }
  window.addEventListener('storage', onStorage)
  stopListening = () => window.removeEventListener('storage', onStorage)
  return stopListening
}

export function useTheme () {
  return { themeMode: readonly(themeMode), setThemeMode }
}
