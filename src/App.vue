<template>
  <router-view/>
</template>

<script>
import { useStore } from 'stores/store'
import { connect, getClientsForObserver, userOnline } from 'src/util/ws'
import axios from 'axios'

export default {
  name: 'App',

  created () {
    axios.post('/api/v1/user-online')
      .then(response => {
        this.store.currentUser = response.data
        this.store.fetchData()
        connect()
        if (this.store.currentUser.authorities[0] === 'OBSERVER') {
          getClientsForObserver(this.store.currentUser)
        }
      })
    setInterval(() => userOnline(this.store.currentUser), 1000)
    window.addEventListener('beforeunload', () => axios.post('/api/v1/user-offline', this.store.currentUser))
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
</style>
