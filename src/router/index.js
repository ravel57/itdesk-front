import { route } from 'quasar/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'

import routes from './routes'
import { useAuthStore } from 'stores/auth'
import { appConfig } from 'src/config/appConfig'
import { isPublicPage } from './publicPages'
import { canAny } from 'src/util/access'

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach(async (to) => {
    if (appConfig.disableAuth) {
      return true
    }
    if (isPublicPage(to.path)) {
      return true
    }
    const auth = useAuthStore()
    try {
      await auth.init()
    } catch (e) {
      return '/login'
    }
    if (!auth.isAuthenticated) {
      return '/login'
    }

    const authorities = Array.isArray(auth.user?.authorities) ? auth.user.authorities : []
    const isClientPortalUser = authorities.includes('CLIENT')

    if (isClientPortalUser && !to.path.startsWith('/portal')) {
      return '/portal'
    }
    if (!isClientPortalUser && to.path.startsWith('/portal')) {
      return '/chats'
    }
    // Доступ к странице — по праву (meta.permission: строка или список «любое из»), как проверяет бэкенд
    const requiredPermissions = [].concat(to.meta?.permission || []).filter(Boolean)
    if (requiredPermissions.length > 0 && !canAny(requiredPermissions)) {
      return isClientPortalUser ? '/portal' : (canAny('CHAT_VIEW') ? '/chats' : '/settings/profile')
    }

    return true
  })

  return Router
})
