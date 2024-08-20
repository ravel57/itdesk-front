<template>
  <q-page style="padding: 16px">
    <q-btn icon="upgrade" color="primary" @click="this.sendExportRequest">Экспорт</q-btn>
  </q-page>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ExportPage',
  data: () => ({

  }),
  methods: {
    sendExportRequest () {
      axios.post('/api/v1/export/to-excel')
    }
  }
}
</script>

<style scoped>

</style>
