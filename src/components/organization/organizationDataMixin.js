import axios from 'axios'
import { getLastActivityTs } from 'src/util/organizations/organizationRows'
import {
  getTaskOrganization,
  isSameOrganization,
  normalizeOrganizations,
  uniqueTasksById
} from 'src/util/organizations/organizationIdentity'

// Данные страницы организаций: источники из стора, загрузка заявок и статистики организаций.
// Требует в компоненте: this.store (setup).
export default {
  data: () => ({
    organizationTaskStatsById: {},
    organizationTasks: [],
    organizationTasksLoading: false,
    organizationTasksLoadedOnce: false,
    organizationTasksLoadSeq: 0,
    organizationTasksPageSize: 100
  }),

  computed: {
    organizationsSource () {
      return normalizeOrganizations(this.store.organizations || [], this.clientsSource)
    },

    clientsSource () {
      return this.store.clients || []
    },

    tasksSource () {
      if (this.organizationTasksLoadedOnce) {
        return this.organizationTasks
      }
      return this.store.getTasks || []
    }
  },

  methods: {
    getOrganizationClients (organization) {
      if (!organization) {
        return []
      }
      return this.clientsSource.filter(client => isSameOrganization(client?.organization, organization))
    },

    getOrganizationTasks (organization) {
      if (!organization) {
        return []
      }
      return this.tasksSource.filter(task => isSameOrganization(getTaskOrganization(task), organization))
    },

    getOrganizationLastActivityTs (organization) {
      const employees = this.getOrganizationClients(organization)
      const tasks = this.getOrganizationTasks(organization)
      return getLastActivityTs(employees, tasks)
    },

    getOrganizationTaskStats (organization) {
      if (!organization || !organization.id) {
        return {
          openTasks: 0,
          totalTasks: 0
        }
      }
      return this.organizationTaskStatsById[organization.id] || {
        openTasks: 0,
        totalTasks: 0
      }
    },

    loadOrganizationTaskStats () {
      return axios.get('/api/v1/organizations/task-stats')
        .then(response => {
          this.organizationTaskStatsById = response.data || {}
        })
        .catch(e => {
          this.$q.notify({
            message: e.message || 'Не удалось загрузить статистику организаций',
            type: 'negative'
          })
        })
    },

    refreshOrganizationTasksData () {
      this.loadOrganizationTaskStats()
      if (typeof this.loadOrganizationTasksForPage === 'function') {
        this.loadOrganizationTasksForPage(true)
      }
    },

    async loadOrganizationTasksForPage (reset = false) {
      const requestSeq = ++this.organizationTasksLoadSeq
      if (reset) {
        this.organizationTasks = []
        this.organizationTasksLoadedOnce = false
      }
      this.organizationTasksLoading = true
      const loadedTasks = []
      let page = 1
      let isEnd = false

      try {
        while (!isEnd && requestSeq === this.organizationTasksLoadSeq) {
          const response = await axios.post('/api/v1/tasks-page', {
            page,
            size: this.organizationTasksPageSize,
            includeCompleted: true,
            search: '',
            filterJoinOperator: 'AND',
            filterChain: [],
            requiredFilterChain: [],
            sortSlug: 'creating',
            ascendingSort: false
          })
          const data = response.data || {}
          const tasks = Array.isArray(data.tasks) ? data.tasks : []
          loadedTasks.push(
            ...tasks.map(task => this.normalizeOrganizationTask(task))
          )
          isEnd = Boolean(data.isEnd) || tasks.length === 0
          page += 1
        }
        if (requestSeq !== this.organizationTasksLoadSeq) {
          return
        }
        this.organizationTasks = uniqueTasksById(loadedTasks)
        this.organizationTasksLoadedOnce = true
      } catch (e) {
        this.$q.notify({
          message: e.message || 'Не удалось загрузить заявки организаций',
          type: 'negative'
        })
      } finally {
        if (requestSeq === this.organizationTasksLoadSeq) {
          this.organizationTasksLoading = false
        }
      }
    },

    normalizeOrganizationTask (task) {
      if (!task) {
        return task
      }
      if (this.store && typeof this.store.normalizeTaskPageTask === 'function') {
        return this.store.normalizeTaskPageTask(task)
      }
      return task
    }
  }
}
