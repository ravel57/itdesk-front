import { boot } from 'quasar/wrappers'
import { can, canAny, isStaff } from 'src/util/access'

// В шаблонах: v-if="$can('TASK_EDIT')"
export default boot(({ app }) => {
  app.config.globalProperties.$can = can
  app.config.globalProperties.$canAny = canAny
  app.config.globalProperties.$isStaff = isStaff
})
