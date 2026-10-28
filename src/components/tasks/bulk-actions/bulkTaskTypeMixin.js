import axios from 'axios'
import {
  buildTaskTypeOptions,
  collectTaskTypesFromTasks,
  getMixedTaskTypeOption,
  getTaskTypeKey,
  getTaskTypeName,
  isValidTaskTypeSelection,
  normalizeTaskTypeOption
} from 'src/util/taskBulkActions/taskTypes'

// Типы заявок: справочник (с запасным вариантом из загруженных заявок), нормализация и валидация выбора.
// Требует в компоненте: this.store.
export default {
  data: () => ({
    taskTypes: []
  }),

  methods: {
    getMixedTaskTypeOption () {
      return getMixedTaskTypeOption()
    },

    getTaskTypeName (taskType) {
      return getTaskTypeName(taskType)
    },

    getTaskTypeKey (taskType) {
      return getTaskTypeKey(taskType)
    },

    normalizeTaskTypeOption (taskType) {
      return normalizeTaskTypeOption(taskType)
    },

    isValidTaskTypeSelection (taskType) {
      return isValidTaskTypeSelection(taskType)
    },

    async loadTaskTypes () {
      try {
        const response = await axios.get('/api/v1/task-types')
        this.taskTypes = Array.isArray(response.data) ? response.data : []
      } catch (e) {
        this.taskTypes = collectTaskTypesFromTasks(this.store.getTasks)
      }
    }
  },

  computed: {
    taskTypeOptions () {
      return buildTaskTypeOptions(this.taskTypes)
    }
  }
}
