import axios from 'axios'

// Каталог страницы «Сервисы и мониторинг»: загрузка сервисов, подключений, интеграций Zabbix и критичностей.
// Требует на странице: this.store (setup: useStore()), this.openService (servicesServiceActionsMixin),
// this.notifyError (servicesNotifyMixin).
export default {
  data() {
    return {
      loading: false,
      routeServiceOpened: false,
      services: [],
      assignments: [],
      zabbixIntegrations: [],
      criticalities: []
    }
  },

  methods: {
    async loadAll() {
      this.loading = true
      try {
        const [services, assignments, zabbix, criticalities] = await Promise.all([
          axios.get('/api/v1/services?includeInactive=true'), axios.get('/api/v1/organization-service-assignments'),
          axios.get('/api/v1/zabbix-integrations'), axios.get('/api/v1/service-criticalities')
        ])
        this.services = Array.isArray(services.data) ? services.data : []
        this.store.services = this.services.filter(item => item.active)
        this.assignments = Array.isArray(assignments.data) ? assignments.data : []
        this.zabbixIntegrations = Array.isArray(zabbix.data) ? zabbix.data : []
        this.criticalities = Array.isArray(criticalities.data) ? criticalities.data : []
        if (!this.routeServiceOpened) {
          this.routeServiceOpened = true
          const serviceId = Number(this.$route.query.serviceId)
          const service = Number.isFinite(serviceId) ? this.services.find(item => Number(item.id) === serviceId) : null
          if (service) this.openService(service)
        }
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.loading = false
      }
    }
  }
}
