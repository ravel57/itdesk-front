<template>
  <router-view />
</template>

<script>
import { useStore } from 'stores/store'

export default {
  name: 'App',

  setup () {
    const store = useStore()
    store.fetchData()
    return { store }
  }
}
</script>
