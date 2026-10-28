import axios from 'axios'

// Действия со строками таблицы интеграций Zabbix: диалоги интеграции и журнала приёма, проверка, удаление.
// Требует на странице: this.loadAll (servicesDataMixin), this.notifyError (servicesNotifyMixin).
export default {
  data() {
    return {
      testingZabbixId: null,
      zabbixDialog: false,
      zabbixEditing: null,
      zabbixLogDialog: false
    }
  },

  methods: {
    openZabbix(row = null) {
      this.zabbixEditing = row
      this.zabbixDialog = true
    },

    openZabbixLog(row) {
      this.zabbixEditing = row
      this.zabbixLogDialog = true
    },

    async testZabbix(row) {
      this.testingZabbixId = row.id;
      try {
        const {data} = await axios.post(`/api/v1/zabbix-integration/${row.id}/test`);
        await this.loadAll();
        this.$q.notify({
          type: data.success ? 'positive' : 'negative',
          message: data.message
        })
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.testingZabbixId = null
      }
    },

    removeZabbix(row) {
      this.$q.dialog({title: 'Удалить интеграцию?', cancel: true}).onOk(async () => {
        try {
          await axios.delete(`/api/v1/zabbix-integration/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    }
  }
}
