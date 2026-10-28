import axios from 'axios'

// Действия со строками таблицы сервисов: диалог сервиса (открыть/закрыть/удалить) и проверка мониторинга.
// Требует на странице: this.loadAll (servicesDataMixin), this.notifyError (servicesNotifyMixin).
export default {
  data() {
    return {
      checkingId: null,
      serviceDialog: false,
      serviceEditing: null
    }
  },

  methods: {
    openService(row = null) {
      this.serviceEditing = row
      this.serviceDialog = true
    },

    closeService() {
      this.serviceDialog = false
      if (this.$route.query.serviceId) {
        const query = {...this.$route.query}
        delete query.serviceId
        this.$router.replace({query})
      }
    },

    async onServiceSaved() {
      await this.loadAll()
      this.notifyOk('Сервис сохранён')
    },

    removeService(row) {
      this.$q.dialog({
        title: 'Удалить сервис?',
        message: 'Если сервис используется, он будет деактивирован.',
        cancel: true
      }).onOk(async () => {
        try {
          await axios.delete(`/api/v1/service/${row.id}`);
          if (this.serviceDialog && this.serviceEditing?.id === row.id) this.closeService()
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    async checkMonitoring(row) {
      this.checkingId = row.id;
      try {
        const {data} = await axios.post(`/api/v1/service/${row.id}/monitoring/check`);
        await this.loadAll();
        this.$q.notify({
          type: data.status === 'OK' ? 'positive' : 'warning',
          message: data.message || 'Проверка завершена'
        })
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.checkingId = null
      }
    }
  }
}
