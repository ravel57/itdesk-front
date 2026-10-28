import axios from 'axios'
import { getTaskTitle } from 'src/util/organizationHelpers'
import { getOrganizationKey } from 'src/util/organizations/organizationIdentity'

// Выезды организаций: история выездов по организациям, диалоги выезда/истории, обработка сохранённого выезда.
// Требует в компоненте: this.store (setup), organizationDataMixin, organizationSelectionMixin.
export default {
  data: () => ({
    visitHistoryDialog: false,
    visitHistoryOrganization: null,
    addVisitDialog: false,
    visitHistoryByOrganizationId: {},
    visitHistoryLoadingByOrganizationId: {}
  }),

  computed: {
    selectedOrganizationVisitHistory () {
      const organizationId = this.selectedOrganization?.id
      if (!organizationId) {
        return []
      }
      return this.visitHistoryByOrganizationId[organizationId] || []
    },

    selectedOrganizationVisitHistoryLoading () {
      const organizationId = this.selectedOrganization?.id
      if (!organizationId) {
        return false
      }
      return Boolean(this.visitHistoryLoadingByOrganizationId[organizationId])
    },

    visitTaskOptions () {
      return this.selectedOrganizationTasks.map(task => ({
        label: `#${task.id} ${getTaskTitle(task)}`,
        value: task.id,
        taskTitle: getTaskTitle(task)
      }))
    }
  },

  methods: {
    upsertOrganizationInStore (organization) {
      if (!organization?.id) {
        return
      }
      const index = this.store.organizations.findIndex(item => Number(item.id) === Number(organization.id))
      if (index >= 0) {
        this.store.organizations.splice(index, 1, organization)
      } else {
        this.store.organizations.push(organization)
      }
    },

    loadOrganizationVisitHistory (organization) {
      if (!organization?.id) {
        return
      }

      const organizationId = organization.id

      this.visitHistoryLoadingByOrganizationId = {
        ...this.visitHistoryLoadingByOrganizationId,
        [organizationId]: true
      }

      axios.get(`/api/v1/organization/${organizationId}/visits`)
        .then(response => {
          this.visitHistoryByOrganizationId = {
            ...this.visitHistoryByOrganizationId,
            [organizationId]: response.data || []
          }
        })
        .catch(e => {
          this.$q.notify({
            message: e.response?.data?.message || e.response?.data || e.message || 'Не удалось загрузить историю выездов',
            type: 'negative'
          })
        })
        .finally(() => {
          this.visitHistoryLoadingByOrganizationId = {
            ...this.visitHistoryLoadingByOrganizationId,
            [organizationId]: false
          }
        })
    },

    onOrganizationVisitSaved ({ organization: savedOrganization, visit: savedVisit }) {
      const organization = this.selectedOrganization
      const organizationId = savedOrganization?.id || organization?.id

      if (savedOrganization) {
        this.upsertOrganizationInStore(savedOrganization)
        this.selectedOrganizationKey = getOrganizationKey(savedOrganization)
        this.selectedOrganizationModel = savedOrganization
      }

      if (savedVisit && organizationId) {
        const currentHistory = this.visitHistoryByOrganizationId[organizationId] || []
        this.visitHistoryByOrganizationId = {
          ...this.visitHistoryByOrganizationId,
          [organizationId]: [savedVisit, ...currentHistory]
        }
      } else if (organization) {
        this.loadOrganizationVisitHistory(organization)
      }
      this.refreshOrganizationTasksData()
      this.$q.notify({
        message: 'Выезд добавлен',
        type: 'positive'
      })
    },

    openVisitHistoryDialog (organization) {
      if (!organization?.id) {
        return
      }
      this.visitHistoryOrganization = organization
      this.visitHistoryDialog = true
      this.loadOrganizationVisitHistory(organization)
    }
  }
}
