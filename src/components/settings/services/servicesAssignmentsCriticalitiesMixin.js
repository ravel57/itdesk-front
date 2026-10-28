import axios from 'axios'

// Действия с подключениями сервисов к организациям и со справочником критичностей.
// Требует на странице: this.loadAll (servicesDataMixin), this.criticalities, this.notifyError/notifyOk (servicesNotifyMixin).
export default {
  data() {
    return {
      assignmentDialog: false,
      assignmentEditing: null,
      criticalityDialog: false,
      criticalityEditing: null
    }
  },

  methods: {
    openAssignment(row = null) {
      this.assignmentEditing = row
      this.assignmentDialog = true
    },

    async onAssignmentSaved() {
      await this.loadAll()
      this.notifyOk('Подключение сохранено')
    },

    removeAssignment(row) {
      this.$q.dialog({title: 'Удалить подключение?', cancel: true}).onOk(async () => {
        try {
          await axios.delete(`/api/v1/organization-service-assignment/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    openCriticality(row = null) {
      this.criticalityEditing = row
      this.criticalityDialog = true
    },

    async resortCriticalities() {
      try {
        const {data} = await axios.patch('/api/v1/service-criticalities/resort', this.criticalities.map(item => item.id))
        if (Array.isArray(data)) this.criticalities = data
      } catch (e) {
        this.notifyError(e)
        await this.loadAll()
      }
    },

    async setDefaultCriticality(row) {
      if (row.defaultSelection) return
      try {
        await axios.patch('/api/v1/service-criticality', {...row, defaultSelection: true})
        await this.loadAll()
      } catch (e) {
        this.notifyError(e)
      }
    },

    removeCriticality(row) {
      this.$q.dialog({
        title: 'Удалить критичность?',
        message: `Критичность «${row.name}» будет снята со всех сервисов.`,
        cancel: {flat: true, noCaps: true, label: 'Отмена'},
        ok: {unelevated: true, noCaps: true, color: 'negative', label: 'Удалить'}
      }).onOk(async () => {
        try {
          await axios.delete(`/api/v1/service-criticality/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    }
  }
}
