import axios from 'axios'
import { SLA_CALENDAR_OPTIONS, SLA_UNIT_OPTIONS } from 'src/util/settingsOrganizations/organizationDefaults'
import { buildDialogPrioritySla, buildPrioritySlaPayloads } from 'src/util/settingsOrganizations/organizationPrioritySla'

// SLA организации по приоритетам: загрузка справочников и сохранение значений формы.
// Требует в компоненте: this.store, this.dialog, this.dialogVisible, this.dialogOriginalName.
export default {
  data: () => ({
    dialogPrioritySla: {},
    slaByOrganization: {},
    slaCalendarOptions: SLA_CALENDAR_OPTIONS,
    slaUnitOptions: SLA_UNIT_OPTIONS
  }),

  computed: {
    priorities() {
      return this.store.priorities || []
    }
  },

  methods: {
    loadPrioritiesIfNeeded() {
      if (this.store.priorities && this.store.priorities.length > 0) {
        this.initDialogPrioritySla(this.dialog.id ? this.dialog : null)
        return
      }

      axios.get('/api/v1/priorities')
        .then(response => {
          this.store.priorities = response.data || []
          this.initDialogPrioritySla(this.dialog.id ? this.dialog : null)
        })
        .catch(() => undefined)
    },

    loadSla() {
      axios.get('/api/v1/sla')
        .then(response => {
          this.slaByOrganization = response.data || {}
          if (this.dialogVisible) {
            this.initDialogPrioritySla(this.dialog.id ? this.dialog : null)
          }
        })
        .catch(() => undefined)
    },

    initDialogPrioritySla(organization) {
      const organizationName = organization?.name || this.dialogOriginalName || this.dialog.name
      const source = organizationName ? this.slaByOrganization[organizationName] || {} : {}

      this.dialogPrioritySla = buildDialogPrioritySla(this.priorities, source)
    },

    savePrioritySla(organization) {
      if (!organization?.id || this.priorities.length === 0) {
        return Promise.resolve(organization)
      }

      const requests = buildPrioritySlaPayloads(organization, this.priorities, this.dialogPrioritySla)
        .map(payload => axios.post('/api/v1/sla', payload))

      return Promise.all(requests)
        .then(() => this.loadSla())
        .then(() => organization)
    }
  }
}
