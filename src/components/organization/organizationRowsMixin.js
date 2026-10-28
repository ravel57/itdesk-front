import { isTaskClosed, getOrganizationName } from 'src/util/organizationHelpers'
import { getOrganizationKey } from 'src/util/organizations/organizationIdentity'
import {
  getOrganizationContractLabel,
  getOrganizationSlaAgreementLabel
} from 'src/util/organizations/organizationLabels'
import { filterOrganizationRows, sortOrganizationRows } from 'src/util/organizations/organizationRows'
import { getOrganizationVisitStats } from 'src/util/organizations/organizationVisitStats'

// Список организаций: строки, поиск, сортировка и итоговые счётчики.
// Чистые функции поиска/сортировки — src/util/organizations/organizationRows.js
// Требует в компоненте: organizationDataMixin, organizationSlaMixin.
export default {
  data: () => ({
    searchRequest: '',
    sortType: 'NAME',
    sortOptions: [
      { label: 'По названию', value: 'NAME' },
      { label: 'По открытым заявкам', value: 'OPEN_TASKS' },
      { label: 'По просроченным SLA', value: 'OVERDUE_SLA' },
      { label: 'По использованию выездов', value: 'VISITS_USAGE' },
      { label: 'По последней активности', value: 'LAST_ACTIVITY' }
    ]
  }),

  computed: {
    organizationRows () {
      return this.organizationsSource.map(organization => this.buildOrganizationRow(organization))
    },

    sortedFilteredOrganizations () {
      const rows = filterOrganizationRows(this.organizationRows, this.searchRequest)
      return sortOrganizationRows(rows, this.sortType)
    },

    totalEmployees () {
      return this.organizationRows.reduce((sum, row) => sum + row.employees, 0)
    },

    totalOpenTasks () {
      return this.organizationRows.reduce((sum, row) => sum + row.openTasks, 0)
    },

    totalOverdueSla () {
      return this.organizationRows.reduce((sum, row) => sum + row.overdueTasks, 0)
    }
  },

  methods: {
    buildOrganizationRow (organization) {
      const employeesList = this.getOrganizationClients(organization)
      const tasksList = this.getOrganizationTasks(organization)
      const openTasks = tasksList.filter(task => !isTaskClosed(task))
      const taskStats = this.getOrganizationTaskStats(organization)
      const totalTasks = Number(taskStats.totalTasks || 0)
      const openTasksCount = Number(taskStats.openTasks || 0)
      const overdueTasksCount = Number(taskStats.overdueTasks || 0)

      const slaLoading = this.hasLoadingSlaInfoForTasks(openTasks)
      const overdueTasks = openTasks.filter(task => this.isTaskSlaOverdue(task))
      const minimalSla = this.getOrganizationMinimalSla(organization)
      const visits = getOrganizationVisitStats(organization)
      const lastActivityTs = this.getOrganizationLastActivityTs(organization)

      return {
        key: getOrganizationKey(organization),
        organization,
        name: getOrganizationName(organization),
        contractLabel: getOrganizationContractLabel(organization),
        slaAgreementLabel: getOrganizationSlaAgreementLabel(organization),
        employees: employeesList.length,
        employeesList,
        tasks: totalTasks,
        tasksList,
        openTasks: openTasksCount,
        overdueTasks: overdueTasksCount || overdueTasks.length,
        slaLoading,
        visits,
        minSlaLabel: minimalSla.label,
        minSlaPercent: minimalSla.percent,
        minSlaColor: minimalSla.color,
        minSlaSortValue: minimalSla.leftMs ?? Number.MAX_SAFE_INTEGER,
        lastActivityTs
      }
    }
  }
}
