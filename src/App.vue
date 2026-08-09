<template>
  <router-view/>
</template>

<script>
import { useStore } from 'stores/store'
import { useAuthStore } from 'stores/auth'
import { connect, disconnect, userOnline } from 'src/util/ws'
import axios from 'axios'

export default {
  name: 'App',

  data: () => ({
    onlineTimer: null,
    beforeUnloadHandler: null
  }),

  async created () {
    try {
      const auth = useAuthStore()
      const currentUser = await auth.init()
      if (!currentUser) {
        return
      }
      this.store.currentUser = currentUser
      const authorities = Array.isArray(currentUser?.authorities) ? currentUser.authorities : []

      // Клиентский портал использует только собственные REST-эндпоинты и не
      // подключается к общим операторским websocket-топикам.
      if (authorities.includes('CLIENT')) {
        return
      }

      const response = await axios.post('/api/v1/user-online')
      this.store.currentUser = response.data
      this.store.fetchData()
      connect()
      this.onlineTimer = window.setInterval(() => userOnline(this.store.currentUser), 1000)
      this.beforeUnloadHandler = () => axios.post('/api/v1/user-offline', this.store.currentUser)
      window.addEventListener('beforeunload', this.beforeUnloadHandler)
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Не удалось инициализировать приложение', error)
      }
    }
  },

  beforeUnmount () {
    disconnect()
    if (this.onlineTimer) {
      window.clearInterval(this.onlineTimer)
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler)
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style>
.circle {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: #1976D2;
  display: flex;
  color: white;
  align-items: center;
  justify-content: center;
  align-content: center;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 6px;
}

::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--q-primary);
}
</style>
