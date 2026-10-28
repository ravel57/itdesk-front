import {
  getExecutorSearchText,
  getUserName,
  isAssignableExecutor,
  isExecutorInSupportLine,
  normalizeExecutorSearchValue
} from 'src/util/taskBulkActions/executors'
import { isMixedBulkValue } from 'src/util/taskBulkActions/selectionValues'

// Выбор исполнителя: список назначаемых пользователей, фильтр q-select, проверка выбранного значения.
// Требует в компоненте: this.store, поле формы tasksExecutor.
export default {
  data: () => ({
    executorFilter: '',
    executorInputValue: ''
  }),

  methods: {
    getUserName (user) {
      return getUserName(user)
    },

    updateExecutorInputValue (value) {
      this.executorInputValue = value || ''
      if (!this.normalizeExecutorSearchValue(value)) {
        this.tasksExecutor = ''
        this.executorFilter = ''
      }
    },

    onExecutorSelected (value) {
      this.executorInputValue = value || ''
      this.executorFilter = ''
    },

    normalizeExecutorSearchValue (value) {
      return normalizeExecutorSearchValue(value)
    },

    isAssignableExecutor (user) {
      return isAssignableExecutor(user)
    },

    getAssignableExecutorUsers () {
      return (this.store.users || [])
        .filter(user => user !== null)
        .filter(user => this.isAssignableExecutor(user))
    },

    getExecutorSearchText (user) {
      return getExecutorSearchText(user)
    },

    filterExecutorOptions (val, update) {
      update(() => {
        this.executorFilter = val || ''
      })
    },

    clearExecutorFilter () {
      this.executorFilter = ''
    },

    findExecutorBySelectedValue (value) {
      const normalizedValue = this.normalizeExecutorSearchValue(value)
      if (!normalizedValue || isMixedBulkValue(value)) {
        return null
      }
      return this.getAssignableExecutorUsers()
        .find(user => this.normalizeExecutorSearchValue(this.getUserName(user)) === normalizedValue) || null
    },

    isValidExecutorSelection (value) {
      const normalizedValue = this.normalizeExecutorSearchValue(value)
      if (!normalizedValue) {
        return false
      }
      return !!this.findExecutorBySelectedValue(value)
    },

    isExecutorInSupportLine (executor, supportLine) {
      return isExecutorInSupportLine(executor, supportLine)
    }
  },

  computed: {
    filteredExecutorOptions () {
      const needle = this.normalizeExecutorSearchValue(this.executorFilter)
      const users = this.getAssignableExecutorUsers()

      return users
        .filter(user => !needle || this.getExecutorSearchText(user).includes(needle))
        .map(user => this.getUserName(user))
        .filter(Boolean)
    }
  }
}
