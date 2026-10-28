import axios from 'axios'
import {SLA_PERIOD_OPTIONS} from 'src/util/settingsSla/slaOptions'
import {createEmptySlaTable, fillSlaTable} from 'src/util/settingsSla/slaCells'
import {getSlaErrorMessage} from 'src/util/settingsSla/slaErrors'

// Данные таблицы SLA (организации x приоритеты): список строк и загрузка значений с сервера.
// Требует в компоненте: this.store (setup: useStore()).
export default {
  data: () => ({
    tableData: [],
    isPopulatingSla: false,
    lastSent: {},
    periodOptions: SLA_PERIOD_OPTIONS
  }),

  computed: {
    getOrganizations() {
      return [
        {
          id: null,
          name: 'Стандартный SLA',
          isDefaultSla: true
        },
        ...(this.store.organizations || [])
      ]
    },

    isSlaReady() {
      return this.store.priorities.length > 0
    }
  },

  methods: {
    notifyError(e) {
      this.$q.notify({
        message: getSlaErrorMessage(e),
        type: 'negative'
      })
    },

    async loadSla() {
      if (!this.isSlaReady) {
        return
      }
      this.isPopulatingSla = true
      try {
        const organizations = this.getOrganizations
        const priorities = this.store.priorities

        const emptyTable = createEmptySlaTable(organizations.length, priorities.length)
        const {data} = await axios.get('/api/v1/sla')
        fillSlaTable(emptyTable, data, organizations, priorities)
        this.tableData = emptyTable
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.isPopulatingSla = false
      }
    }
  }
}
