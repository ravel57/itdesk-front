import { boot } from 'quasar/wrappers'
import { initializeTheme } from 'src/composables/useTheme'

export default boot(() => {
  const dispose = initializeTheme()
  if (module.hot) module.hot.dispose(dispose)
})
