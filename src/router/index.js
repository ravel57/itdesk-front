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
    const publicPages = [
      '/login',
      '/login-error',
      '/session-expired'
    ]
    if (publicPages.includes(to.path)) {
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
    return true
  })

  return Router
})
