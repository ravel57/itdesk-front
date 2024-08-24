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
      axios.post('/api/v1/export/to-excel', null, {
        responseType: 'blob'
      })
        .then(response => {
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', 'data.xlsx')
          document.body.appendChild(link)
          link.click()
          link.parentNode.removeChild(link)
          window.URL.revokeObjectURL(url)
        })
    }
  }
}
</script>

<style scoped>

</style>
