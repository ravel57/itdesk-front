<template>
  <q-page padding>
    <div style="display: flex; width: 100%;">
      <q-input
        outlined
        dense
        v-model="this.searchRequest"
        label="Поиск"
        style="width: 100%; align-content: center; min-width: 300px; padding-right: 8px"
        :style="this.isMobile ? 'padding-right: 0;' : ''"
        clearable
        @update:model-value="this.sendSearchRequest"
      />
    </div>
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import axios from 'axios'

export default {
  name: 'PageName',

  data: () => ({
    searchRequest: ''
  }),

  methods: {
    sendSearchRequest () {
      if (this.searchRequest) {
        axios.get('/api/v1/global-search?query=' + this.searchRequest)
          .then((response) => {})
      }
    }
  },

  computed: {
    isMobile () {
      return this.$q.screen.width < 1023
    }
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
  }
}
</script>

<style scoped>

</style>
