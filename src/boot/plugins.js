import { boot } from 'quasar/wrappers'
import { pluginRegistry } from 'src/plugins/pluginRegistry'

export default boot(async () => {
  await pluginRegistry.load()
})
