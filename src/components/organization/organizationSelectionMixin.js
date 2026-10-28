import { formatDateTime, getOrganizationName, isTaskClosed } from 'src/util/organizationHelpers'
import { getOrganizationKey } from 'src/util/organizations/organizationIdentity'
import { getOrganizationContractLabel } from 'src/util/organizations/organizationLabels'
import {
  buildClosedOrganizationQuery,
  buildSelectedOrganizationQuery,
  findOrganizationByRouteValue,
  getOrganizationQueryValue,
  getOrganizationRouteValue,
  replaceRouteQuery
} from 'src/util/organizations/organizationRoute'
import { getOrganizationVisitStats } from 'src/util/organizations/organizationVisitStats'

// Выбранная организация: состояние выбора, синхронизация с роутом (?organization=...)
// и производные поля для диалога деталей.
// Требует в компоненте: this.$route, this.$router, organizationDataMixin, organizationSlaMixin.
export default {
  data: () => ({
    selectedOrganizationKey: null,
    selectedOrganizationModel: null,
    organizationDialog: false,
    showCompletedTasks: false
  }),

  computed: {
    selectedOrganization () {
      if (this.selectedOrganizationModel) {
        return this.selectedOrganizationModel
      }
      return this.organizationsSource.find(organization => getOrganizationKey(organization) === this.selectedOrganizationKey) || null
    },

    selectedOrganizationName () {
      return getOrganizationName(this.selectedOrganization)
    },

    selectedOrganizationEmployees () {
      return this.getOrganizationClients(this.selectedOrganization)
    },

    selectedOrganizationTasks () {
      return this.getOrganizationTasks(this.selectedOrganization)
    },

    selectedOrganizationOpenTasks () {
      return this.selectedOrganizationTasks.filter(task => !isTaskClosed(task))
    },

    selectedOrganizationTaskStats () {
      return this.getOrganizationTaskStats(this.selectedOrganization)
    },

    selectedOrganizationOpenTasksCount () {
      return Number(this.selectedOrganizationTaskStats.openTasks || 0)
    },

    selectedOrganizationVisibleTasks () {
      if (this.showCompletedTasks) {
        return this.selectedOrganizationTasks
      }
      return this.selectedOrganizationOpenTasks
    },

    selectedOrganizationOverdueTasks () {
      return this.selectedOrganizationOpenTasks.filter(task => this.isTaskSlaOverdue(task))
    },

    selectedOrganizationContractLabel () {
      return getOrganizationContractLabel(this.selectedOrganization)
    },

    selectedOrganizationVisitStats () {
      return getOrganizationVisitStats(this.selectedOrganization)
    },

    // сейчас в шаблонах не используется: нужен закомментированному (FIXME) блоку SLA в OrganizationInfoSection.vue
    selectedOrganizationMinimalSla () {
      return this.getOrganizationMinimalSla(this.selectedOrganization)
    },

    selectedOrganizationLastActivity () {
      return formatDateTime(this.getOrganizationLastActivityTs(this.selectedOrganization))
    }
  },

  methods: {
    selectInitialOrganization () {
      const organizationFromUrl = getOrganizationQueryValue(this.$route?.query)

      if (!organizationFromUrl) {
        return
      }

      const found = findOrganizationByRouteValue(this.organizationsSource, organizationFromUrl)

      if (found) {
        this.openOrganizationDialog(found, true)
      }
    },

    selectOrganization (organization, updateRoute = true) {
      if (!organization) {
        this.selectedOrganizationKey = null
        this.selectedOrganizationModel = null
        return
      }

      const organizationKey = getOrganizationKey(organization)
      const organizationRouteValue = getOrganizationRouteValue(organization)

      this.selectedOrganizationKey = organizationKey
      this.selectedOrganizationModel = organization

      if (updateRoute && String(this.$route?.query?.organization || '') !== organizationRouteValue) {
        replaceRouteQuery(
          this.$router,
          this.$route.path,
          buildSelectedOrganizationQuery(this.$route.query, organizationRouteValue)
        )
      }
    },

    openOrganizationDialog (organization, updateRoute = true) {
      if (!organization) {
        return
      }

      this.selectOrganization(organization, updateRoute)

      this.$nextTick(() => {
        this.organizationDialog = true
      })
    },

    closeOrganizationDialog () {
      this.organizationDialog = false
      this.selectedOrganizationKey = null
      this.selectedOrganizationModel = null

      if (!this.$route?.query?.organization) {
        return
      }

      replaceRouteQuery(
        this.$router,
        this.$route.path,
        buildClosedOrganizationQuery(this.$route.query)
      )
    }
  }
}
