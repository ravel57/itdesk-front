import {boot} from 'quasar/wrappers'
import {pluginRegistry} from 'src/plugins/pluginRegistry'
import {isPublicPage} from 'src/router/publicPages'

export default boot(async () => {
  if (isPublicPage()) {
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
