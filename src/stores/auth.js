import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { appConfig } from 'src/config/appConfig'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    inited: false
  }),

  getters: {
    isAuthenticated: (s) => !!s.user
  },

  actions: {
    async init () {
      if (this.inited) return
      this.inited = true

      // DEV-режим без авторизации
      if (appConfig.disableAuth) {
        this.user = { id: 'dev-1', authorities: ['ADMIN'], name: 'Dev User' }
        return
      }

      // PROD: проверяем сессию на сервере
      try {
        const res = await api.post('/api/v1/user-online')
        this.user = res.data
      } catch (e) {
        this.user = null
      }
    }
  }
})
