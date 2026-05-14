import { boot } from 'quasar/wrappers'
import { pluginRegistry } from 'src/plugins/pluginRegistry'

export default boot(async () => {
  const publicPages = [
    '/login',
    '/login-error',
    '/session-expired'
  ]
  if (publicPages.includes(window.location.pathname)) {
    return
  }
  try {
    await pluginRegistry.load()
  } catch (e) {
    if (e.response && e.response.status === 401) {
      return
    }
    console.error('[plugins] load failed', e)
  }
})
