import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { useStore } from 'stores/store'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    inited: false
  }),

  getters: {
    isAuthenticated: state => !!state.user
  },

  actions: {
    async init () {
      if (this.inited && this.user) {
        return this.user
      }

      try {
        const response = await api.get('/api/v1/user/current')

        this.user = response.data
        this.inited = true

        const mainStore = useStore()
        mainStore.currentUser = response.data

        await mainStore.loadCurrentSession()

        return response.data
      } catch (e) {
        this.user = null
        this.inited = true

        const mainStore = useStore()
        mainStore.currentUser = null
        mainStore.currentSessionId = null

        if (e.response && e.response.status === 401) {
          return null
        }

        throw e
      }
    },

    reset () {
      this.user = null
      this.inited = false
    }
  }
})
