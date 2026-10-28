import axios from 'axios'
import { filterOrganizationsBySearch, sortByOrderNumber } from 'src/util/settingsOrganizations/organizationList'

// Список организаций страницы: локальная копия для drag-and-drop, поиск и пересортировка.
// Требует в компоненте: this.store, notifyNegative (settingsOrganizationHelpersMixin).
export default {
  data: () => ({
    dragging: false,
    search: '',
    visitsUpdatingIds: {},
    localOrganizations: []
  }),

  computed: {
    filteredOrganizations() {
      return filterOrganizationsBySearch(this.localOrganizations, this.search)
    }
  },

  watch: {
    'store.organizations': {
      deep: true,
      handler() {
        if (!this.dragging) {
          this.syncLocalOrganizations()
        }
      }
    }
  },

  methods: {
    onOrganizationDragEnd() {
      this.dragging = false
      if (this.search) {
        this.syncLocalOrganizations()
        return
      }
      const organizations = this.localOrganizations
        .filter(organization => organization.id)
        .map((organization, index) => ({
          ...organization,
          orderNumber: index
        }))
      axios.patch('/api/v1/organizations/resort', organizations)
        .then(response => {
          const savedOrganizations = response.data || organizations
          this.store.organizations = sortByOrderNumber(savedOrganizations)
          this.syncLocalOrganizations()
        })
        .catch(e => {
          this.syncLocalOrganizations()
          this.notifyNegative(e.response?.data?.message || e.response?.data || e.message)
        })
    },

    syncLocalOrganizations() {
      this.localOrganizations = sortByOrderNumber(this.store.organizations || [])
    }
  }
}
