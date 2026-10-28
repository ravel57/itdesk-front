import { countOrganizationClients } from 'src/util/settingsOrganizations/organizationList'
import {
  numberOrZero,
  pluralize,
  slaUnitLabel,
  visitProgressColor,
  visitsLeft,
  visitUsagePercent
} from 'src/util/settingsOrganizations/organizationFormat'

// Общие методы страницы настроек организаций, списка и диалога: форматтеры и уведомления.
// Требует в компоненте: this.store (organizationClientsCount), this.$q.
export default {
  methods: {
    organizationClientsCount(organization) {
      return countOrganizationClients(this.store.clients, organization)
    },

    numberOrZero(value) {
      return numberOrZero(value)
    },

    visitUsagePercent(organization) {
      return visitUsagePercent(organization)
    },

    visitsLeft(organization) {
      return visitsLeft(organization)
    },

    visitProgressColor(organization) {
      return visitProgressColor(organization)
    },

    slaUnitLabel(unit) {
      return slaUnitLabel(unit)
    },

    pluralize(count, words) {
      return pluralize(count, words)
    },

    notifyPositive(message) {
      this.$q.notify({
        message,
        type: 'positive'
      })
    },

    notifyNegative(message) {
      this.$q.notify({
        message,
        type: 'negative'
      })
    }
  }
}
