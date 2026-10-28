import axios from 'axios'
import {
  isValidFilterJoinOperator,
  normalizeFiltersForSave,
  normalizeSavedFilterScope
} from 'src/util/tasks/taskFilters'

// Сохранённые фильтры страницы заявок: загрузка списка, сохранение/удаление, права редактирования,
// применение сохранённого фильтра к цепочке.
// Требует на странице: this.store, this.filterChain / filterJoinOperator (tasksFiltersMixin),
// saveActiveFilterToLocalStorage и др. методы tasksFiltersMixin, $refs.saveFilterDialog.
export default {
  data: () => ({
    savedFilters: [],
    selectedSavedFilter: '',
    dialogNewFilterName: '',
    dialogFilterScope: 'PERSONAL',
    dialogSaveFilterVisible: false,
    isDeleteSavedFilterDialogShow: false,
    isShowDelFilterPreset: false,
  }),

  computed: {
    savedFilterOptions() {
      return this.savedFilters
        .map(filter => ({
          label: filter.label,
          value: filter.id,
          scope: normalizeSavedFilterScope(filter.scope),
          ownerUserId: filter.ownerUserId
        }))
        .sort((a, b) => {
          if (a.scope !== b.scope) {
            return a.scope === 'PERSONAL' ? -1 : 1
          }
          return String(a.label || '').localeCompare(String(b.label || ''), 'ru')
        })
    },

    selectedSavedFilterObject() {
      if (this.selectedSavedFilter === '' || this.selectedSavedFilter === null) {
        return null
      }
      return this.savedFilters.find(filter => String(filter.id) === String(this.selectedSavedFilter)) || null
    },

    selectedSavedFilterLabel() {
      return this.selectedSavedFilterObject?.label || ''
    },

    selectedSavedFilterScope() {
      return this.selectedSavedFilterObject
        ? normalizeSavedFilterScope(this.selectedSavedFilterObject.scope)
        : null
    },

    canManageGlobalFilters() {
      const roles = Array.isArray(this.store.currentUser?.authorities) ? this.store.currentUser.authorities : []
      return roles.includes('ADMIN') || roles.includes('MANAGER')
    },

    canEditSelectedSavedFilter() {
      const filter = this.selectedSavedFilterObject
      if (!filter) {
        return true
      }
      const scope = normalizeSavedFilterScope(filter.scope)
      if (scope === 'GLOBAL') {
        return this.canManageGlobalFilters
      }
      return Number(filter.ownerUserId) === Number(this.store.currentUser?.id)
    },

    canSaveCurrentFilter() {
      return !this.selectedSavedFilterObject || this.canEditSelectedSavedFilter
    },

    canDeleteSelectedSavedFilter() {
      return !!this.selectedSavedFilterObject && this.canEditSelectedSavedFilter
    }
  },

  watch: {
    selectedSavedFilter: {
      handler(newVal) {
        this.isShowDelFilterPreset = newVal !== '' && newVal !== null
        this.saveActiveFilterToLocalStorage()
      },
      deep: true
    }
  },

  methods: {
    // Загружает сохранённые фильтры и восстанавливает активный фильтр из localStorage.
    // Возвращает promise (ошибка загрузки уже обработана уведомлением).
    loadSavedFilters() {
      return axios.get('/api/v1/filters')
        .then(response => {
          this.savedFilters = response.data
          this.restoreActiveFilterFromLocalStorage()
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
    },

    saveFilter() {
      const filterName = this.dialogNewFilterName.trim()
      const selectedFilter = this.selectedSavedFilterObject
      if (selectedFilter && !this.canEditSelectedSavedFilter) {
        this.$q.notify({
          message: 'У вас нет прав на изменение этого фильтра',
          type: 'negative'
        })
        return
      }
      if (filterName.length > 0) {
        const savedFilter = {
          id: selectedFilter?.id ?? null,
          label: filterName,
          filterJoinOperator: this.filterJoinOperator,
          selectedOptions: normalizeFiltersForSave(this.filterChain),
          scope: this.canManageGlobalFilters ? this.dialogFilterScope : 'PERSONAL'
        }
        axios.post('/api/v1/filter', savedFilter)
          .then(response => {
            if (selectedFilter) {
              const index = this.savedFilters.findIndex(filter => filter.id === selectedFilter.id)
              if (index !== -1) {
                this.savedFilters.splice(index, 1, response.data)
              }
            } else {
              this.savedFilters.push(response.data)
            }
            this.dialogSaveFilterClose()
            this.selectedSavedFilter = response.data.id
            this.saveActiveFilterToLocalStorage()
            this.$q.notify({
              message: selectedFilter ? 'Фильтр обновлён' : 'Фильтр сохранён',
              type: 'positive',
              timeout: 1500
            })
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative'
            }))
      } else {
        this.$q.notify({
          message: 'Необходимо задать имя фильтра',
          type: 'negative'
        })
      }
    },

    onSavedFilterSelected() {
      const filterElement = this.selectedSavedFilterObject
      if (filterElement !== null) {
        this.filterJoinOperator = isValidFilterJoinOperator(filterElement.filterJoinOperator)
          ? filterElement.filterJoinOperator
          : 'AND'
        this.filterChain = this.hydrateFilterChainOptions(structuredClone(filterElement.selectedOptions || []))
        this.isFilterSelected = true
        this.updateUrlWithFilterChain(this.filterChain)
        this.saveActiveFilterToLocalStorage()
      } else {
        this.selectedSavedFilter = ''
        this.filterChain = []
        this.saveActiveFilterToLocalStorage()
      }
    },

    dialogSaveFilter() {
      const selectedFilter = this.selectedSavedFilterObject
      if (selectedFilter && !this.canEditSelectedSavedFilter) {
        return
      }
      this.dialogNewFilterName = selectedFilter?.label || ''
      this.dialogFilterScope = selectedFilter
        ? normalizeSavedFilterScope(selectedFilter.scope)
        : 'PERSONAL'
      if (!this.canManageGlobalFilters) {
        this.dialogFilterScope = 'PERSONAL'
      }
      this.dialogSaveFilterVisible = true
      setTimeout(() => this.$refs.saveFilterDialog.focusName(), 250)
    },

    dialogSaveFilterClose() {
      this.dialogSaveFilterVisible = false
    },

    deleteSavedFilter() {
      const selectedFilter = this.selectedSavedFilterObject
      if (!selectedFilter || !this.canDeleteSelectedSavedFilter) {
        return
      }
      const filterId = selectedFilter.id
      axios.delete(`/api/v1/filter/${filterId}`)
        .then(() => {
          this.savedFilters = this.savedFilters.filter(filter => filter.id !== filterId)
          this.selectedSavedFilter = ''
          this.isDeleteSavedFilterDialogShow = false
          this.filterChain = []
          this.clearActiveFilterFromLocalStorage()
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative'
          }))
    }
  }
}
