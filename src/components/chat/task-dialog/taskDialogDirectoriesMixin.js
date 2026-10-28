import axios from 'axios'
import { buildSupportLineUsers } from 'src/util/taskDialog/supportLineUsers'
import { getUserName } from 'src/util/taskDialog/taskFormat'
import { filterAvailableServices, getServiceLabel } from 'src/util/taskDialog/taskServices'

// Справочники диалога заявки: типы заявок, теги, сервисы, линии поддержки и пользователи линии
// (загрузка, фильтрация для q-select, выбранные значения, подсказки по исполнителю).
// Требует в компоненте: this.store, поля формы dialogTask* (taskDialogFormMixin),
// currentTaskOrganization (taskDialogVisitMixin), isTaskDialogOperator,
// onTaskTypeChanged (taskDialogChecklistMixin).
export default {
  data: () => ({
    filteredUsers: [],
    supportLineAssignableUsers: [],
    supportLineAssignableUsersLineId: null,
    supportLineAssignableUsersRequestId: 0,
    filteredTags: [],
    filteredTaskTypes: [],

    taskTypes: []
  }),

  computed: {
    availableServices () {
      return filterAvailableServices(this.store.services, this.currentTaskOrganization)
    },

    availableServiceLabels () {
      return this.availableServices.map(service => getServiceLabel(service))
    },

    selectedDialogService () {
      return (this.store.services || []).find(service => getServiceLabel(service) === this.dialogTaskService) || null
    },

    selectedDialogSupportLine () {
      return (this.store.supportLines || []).find(line => line?.name === this.dialogTaskSupportLine) || null
    },

    executorSelectDisabled () {
      if (this.activeSupportLineNames.length === 0) {
        return false
      }
      return !this.dialogTaskSupportLine || this.getSupportLineUsers().length === 0
    },

    executorSelectionHint () {
      if (this.activeSupportLineNames.length === 0) {
        return 'Линии поддержки не настроены — используется общий список операторов'
      }
      if (!this.dialogTaskSupportLine) {
        return 'Сначала выберите линию поддержки'
      }
      const count = this.getSupportLineUsers().length
      return count > 0
        ? `Доступны только активные участники выбранной линии: ${count}`
        : 'Добавьте участников в настройках линии поддержки'
    },

    activeSupportLineNames () {
      return (this.store.supportLines || [])
        .filter(line => line.active !== false)
        .sort((a, b) => Number(a.orderNumber || 0) - Number(b.orderNumber || 0))
        .map(line => line.name)
    },

    selectedTaskType () {
      return this.taskTypes.find(taskType => taskType.type === this.dialogTaskType) || null
    }
  },

  methods: {
    getSupportLineUsers () {
      return buildSupportLineUsers({
        users: this.store.users,
        supportLines: this.store.supportLines,
        supportLineName: this.dialogTaskSupportLine,
        assignableUsers: this.supportLineAssignableUsers,
        assignableUsersLineId: this.supportLineAssignableUsersLineId
      })
    },

    refreshFilteredUsers () {
      this.filteredUsers = this.getSupportLineUsers().map(user => getUserName(user))
    },

    async loadSupportLineAssignableUsers () {
      const selectedLine = (this.store.supportLines || []).find(line => line.name === this.dialogTaskSupportLine)
      const lineId = Number(selectedLine?.id)
      const requestId = ++this.supportLineAssignableUsersRequestId

      // assignable-users доступен только поддержке: OBSERVER не назначает исполнителей.
      if (!Number.isFinite(lineId) || !this.isTaskDialogOperator) {
        this.supportLineAssignableUsers = []
        this.supportLineAssignableUsersLineId = null
        this.refreshFilteredUsers()
        return
      }

      this.supportLineAssignableUsersLineId = lineId
      try {
        const { data } = await axios.get(`/api/v1/support-lines/${lineId}/assignable-users`)
        if (requestId !== this.supportLineAssignableUsersRequestId || Number(this.supportLineAssignableUsersLineId) !== lineId) {
          return
        }
        this.supportLineAssignableUsers = Array.isArray(data) ? data : []
      } catch {
        if (requestId !== this.supportLineAssignableUsersRequestId) return
        // Оставляем локальные members как fallback для совместимости со старым backend.
        this.supportLineAssignableUsers = []
      } finally {
        if (requestId === this.supportLineAssignableUsersRequestId) {
          this.refreshFilteredUsers()
        }
      }
    },

    onSupportLineChanged () {
      this.supportLineAssignableUsers = []
      this.supportLineAssignableUsersLineId = null
      const availableUsers = this.getSupportLineUsers()
      const selectedUser = availableUsers.find(user => getUserName(user) === this.dialogTaskExecutor)
      if (this.dialogTaskExecutor && !selectedUser) {
        this.dialogTaskExecutor = ''
        this.$q.notify({
          type: 'info',
          message: 'Исполнитель снят: он не состоит в выбранной линии поддержки'
        })
      }
      this.refreshFilteredUsers()
      this.loadSupportLineAssignableUsers()
    },

    onTaskServiceChanged () {
      const service = this.selectedDialogService
      if (!service) return
      if (service.defaultPriority?.name) this.dialogTaskPriority = service.defaultPriority.name
      if (service.autoAssignDefaultLine !== false && service.defaultSupportLine?.name) {
        this.dialogTaskSupportLine = service.defaultSupportLine.name
        this.onSupportLineChanged()
      }
      const allowedTypes = Array.isArray(service.taskTypes) ? service.taskTypes : []
      if (allowedTypes.length > 0 && !allowedTypes.some(type => type.type === this.dialogTaskType)) {
        this.dialogTaskType = allowedTypes[0]?.type || ''
        this.onTaskTypeChanged()
      }
    },

    filterUsers (val, update) {
      update(() => {
        const needle = (val || '').toLowerCase()
        this.filteredUsers = this.getSupportLineUsers()
          .filter(user => !needle || getUserName(user).toLowerCase().includes(needle))
          .map(user => getUserName(user))
      })
    },

    filterTags (val, update) {
      update(() => {
        this.filteredTags = this.store.tags
          .filter(tag => tag.name.toLowerCase().includes(val.toLowerCase()))
          .map(tag => tag.name)
      })
    },

    filterTaskTypes (val, update) {
      update(() => {
        const needle = (val || '').toLowerCase().trim()
        const taskTypes = this.taskTypes
          .map(taskType => taskType.type)
          .filter(Boolean)

        this.filteredTaskTypes = needle
          ? taskTypes.filter(type => type.toLowerCase().includes(needle))
          : taskTypes
      })
    },

    getSelectedTaskType () {
      return this.taskTypes.find(taskType => taskType.type === this.dialogTaskType) || null
    },

    getDefaultTaskType () {
      return this.taskTypes.find(taskType => taskType.defaultSelection === true) ||
        this.taskTypes.find(taskType => taskType.type === 'Запрос') ||
        this.taskTypes[0] ||
        null
    },

    loadTaskTypes () {
      return axios.get('/api/v1/task-types')
        .then(response => {
          this.taskTypes = response.data || []
          this.filteredTaskTypes = this.taskTypes
            .map(taskType => taskType.type)
            .filter(Boolean)
          if (!this.dialogTaskType && this.taskTypes.length > 0) {
            this.dialogTaskType = this.getDefaultTaskType()?.type || ''
          }
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
    }
  }
}
