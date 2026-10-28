import moment from 'moment/moment'
import {
  createEmptyDateRange,
  createFilterTypes,
  getFilterSelectedOptionsText,
  hydrateFilterChainOptions,
  isTaskDateInRange,
  isValidFilterJoinOperator,
  pickFilterOptions
} from 'src/util/tasks/taskFilters'
import {createLazySources} from 'src/util/tasks/taskGrouping'
import {
  ACTIVE_FILTER_STORAGE_KEY,
  base64DecodeUnicode,
  buildActiveFilterPayload,
  buildFilterChainQuery,
  hasFilterQueryParams,
  isActiveFilterPayloadEmpty,
  stripFilterQueryParams
} from 'src/util/tasks/taskQuery'
import {
  getServiceName,
  getSupportLineLevelLabel,
  getSupportLineName,
  getTaskTypeName
} from 'src/util/tasks/taskFields'

// Цепочка фильтров страницы заявок: добавление/удаление фильтров, синхронизация с URL (?filterChain=...)
// и с localStorage (активный фильтр). Чистая логика — в src/util/tasks/taskFilters.js и taskQuery.js.
// Требует на странице: this.store/$route/$router, справочники (tasksDirectoriesMixin),
// savedFilters / selectedSavedFilter (tasksSavedFiltersMixin), reloadTasksPageDebounced (tasksPageLoaderMixin),
// getExecutorName (tasksViewMixin).
export default {
  data: () => ({
    filterTypes: createFilterTypes(),
    filterChain: [],
    addNewFilterSelectorText: '',
    selectedOptions: [],
    isRestoringActiveFilter: false,
    isFilterSelected: false,
    isFilterOpen: true,
    filterJoinOperator: 'AND',
  }),

  watch: {
    filterChain: {
      handler(newVal) {
        try {
          if (this.isFilterSelected) {
            this.filterContainerHeight = document.getElementById('filter-container').scrollHeight
          }
          this.updateUrlWithFilterChain(newVal)
          this.saveActiveFilterToLocalStorage()
          const queryParams = new URLSearchParams(window.location.search)
          const filterChainFromUrl = queryParams.get('filterChain')
          try {
            const filters = JSON.parse(base64DecodeUnicode(filterChainFromUrl))
            document.getElementById(`filter_${filters[filters.length - 1].slug}`).children[0].click()
          } catch (ignored) {
          }
          this.reloadTasksPageDebounced()
        } catch (e) {
        }
      },
      deep: true
    },

    '$route.query.filterChain'() {
      this.initializeFilterChainFromUrl()
    },

    '$route.query.filterJoinOperator'() {
      this.initializeFilterChainFromUrl()
    },

    filterJoinOperator() {
      if (this.isFilterSelected && this.filterChain.length > 0) {
        this.updateUrlWithFilterChain(this.filterChain)
      }

      this.saveActiveFilterToLocalStorage()

      this.reloadTasksPageDebounced()
    }
  },

  methods: {
    // Справочники значений фильтров (читаются лениво, только нужный по slug)
    getFilterOptionSources() {
      return createLazySources(this, ['executors', 'supportLines', 'supportLineLevels', 'tags', 'organizations', 'priorities', 'statuses', 'clients', 'taskTypes', 'services'])
    },

    handleNewFilterSelection(label) {
      const slug = this.filterTypes.filter(el => el.label === label)[0].slug
      const options = pickFilterOptions(slug, this.getFilterOptionSources())
      let selectedOptions = []

      if (slug === 'createdAt' || slug === 'lastActivity') {
        selectedOptions = createEmptyDateRange()
      }

      this.filterChain.push({label, options, selectedOptions, slug})
      this.addNewFilterSelectorText = ''
      this.isFilterOpen = false
    },

    deleteFilter(index) {
      this.filterChain.splice(index, 1)
    },

    changeFilterSelection() {
      this.isFilterSelected = !this.isFilterSelected
      const {hadFilterParams, query} = stripFilterQueryParams(window.location.search)
      if (hadFilterParams) {
        this.$router.push({path: this.$route.path, query})
      }
      this.saveActiveFilterToLocalStorage()
      this.reloadTasksPageDebounced()
    },

    removeFilters() {
      this.selectedSavedFilter = ''
      this.filterJoinOperator = 'AND'
      this.filterChain = []
      this.clearActiveFilterFromLocalStorage()
    },

    updateUrlWithFilterChain(filterChain) {
      const query = buildFilterChainQuery(window.location.search, filterChain, this.filterJoinOperator)
      this.$router.push({path: this.$route.path, query})
    },

    initializeFilterChainFromUrl() {
      const queryParams = new URLSearchParams(window.location.search)
      const filterChainFromUrl = queryParams.get('filterChain')
      const filterJoinOperatorFromUrl = queryParams.get('filterJoinOperator')

      this.filterJoinOperator = isValidFilterJoinOperator(filterJoinOperatorFromUrl)
        ? filterJoinOperatorFromUrl
        : 'AND'

      if (filterChainFromUrl) {
        try {
          this.filterChain = this.hydrateFilterChainOptions(JSON.parse(base64DecodeUnicode(filterChainFromUrl)))
          this.isFilterSelected = true
          this.saveActiveFilterToLocalStorage()
        } catch (e) {
          console.error(e)
        }
      } else {
        this.filterChain = []
      }
    },

    hydrateFilterChainOptions(filterChain) {
      return hydrateFilterChainOptions(filterChain, this.filterTypes, this.getFilterOptionSources())
    },

    getActiveFilterStorageKey() {
      return ACTIVE_FILTER_STORAGE_KEY
    },

    hasFilterQueryParams() {
      return hasFilterQueryParams(window.location.search)
    },

    clearActiveFilterFromLocalStorage() {
      localStorage.removeItem(this.getActiveFilterStorageKey())
    },

    saveActiveFilterToLocalStorage() {
      if (this.isRestoringActiveFilter) {
        return
      }

      const payload = buildActiveFilterPayload({
        isFilterSelected: this.isFilterSelected,
        selectedSavedFilter: this.selectedSavedFilter,
        filterJoinOperator: this.filterJoinOperator,
        isJoinOperatorValid: isValidFilterJoinOperator(this.filterJoinOperator),
        filterChain: this.filterChain
      })

      if (isActiveFilterPayloadEmpty(payload)) {
        this.clearActiveFilterFromLocalStorage()
        return
      }

      localStorage.setItem(this.getActiveFilterStorageKey(), JSON.stringify(payload))
    },

    restoreActiveFilterFromLocalStorage() {
      if (this.hasFilterQueryParams()) {
        return
      }

      const rawValue = localStorage.getItem(this.getActiveFilterStorageKey())
      if (!rawValue) {
        return
      }

      let payload
      try {
        payload = JSON.parse(rawValue)
      } catch (e) {
        this.clearActiveFilterFromLocalStorage()
        return
      }

      this.isRestoringActiveFilter = true
      try {
        this.filterJoinOperator = isValidFilterJoinOperator(payload.filterJoinOperator)
          ? payload.filterJoinOperator
          : 'AND'

        const savedFilterKey = payload.selectedSavedFilter || ''
        const savedFilter = this.savedFilters.find(filter => String(filter.id) === String(savedFilterKey)) ||
          this.savedFilters.find(filter => filter.label === savedFilterKey)

        if (savedFilter) {
          this.selectedSavedFilter = savedFilter.id
          this.filterChain = this.hydrateFilterChainOptions(structuredClone(savedFilter.selectedOptions || []))
          this.isFilterSelected = true
          this.updateUrlWithFilterChain(this.filterChain)
          return
        }

        this.selectedSavedFilter = ''
        this.filterChain = this.hydrateFilterChainOptions(payload.filterChain || [])
        this.isFilterSelected = Boolean(payload.isFilterSelected) || this.filterChain.length > 0

        if (this.isFilterSelected && this.filterChain.length > 0) {
          this.updateUrlWithFilterChain(this.filterChain)
        }
      } finally {
        this.$nextTick(() => {
          this.isRestoringActiveFilter = false
        })
      }
    },

    updateUrlWithFilterJoinOperator() {
      this.updateUrlWithFilterChain(this.filterChain)
    },

    getFilterSelectedOptionsText(filter) {
      return getFilterSelectedOptionsText(filter)
    },

    isTaskMatchesFilter(task, filter) {
      const slug = this.filterTypes.find(ft => ft.label === filter.label)?.slug

      switch (slug) {
        case 'executor': {
          return filter.selectedOptions.includes(this.getExecutorName(task))
        }

        case 'supportLine': {
          return filter.selectedOptions.includes(getSupportLineName(task))
        }

        case 'supportLineLevel': {
          return filter.selectedOptions.includes(getSupportLineLevelLabel(task))
        }

        case 'tag': {
          const taskTags = task.tags.map(tag => tag.name)
          return filter.selectedOptions.some(selectedTag => taskTags.includes(selectedTag))
        }

        case 'priority': {
          return filter.selectedOptions.includes(task.priority.name)
        }

        case 'organization': {
          return task.client.organization != null &&
            filter.selectedOptions.includes(task.client.organization.name)
        }

        case 'status': {
          return filter.selectedOptions.includes(task.status.name)
        }

        case 'client': {
          return filter.selectedOptions.includes(task.client ? `${task.client.lastname} ${task.client.firstname}` : 'Без клиента')
        }

        case 'type': {
          return filter.selectedOptions.includes(getTaskTypeName(task))
        }

        case 'service': {
          return filter.selectedOptions.includes(getServiceName(task))
        }

        case 'deadline': {
          if (!filter.selectedOptions) {
            return true
          }

          if (filter.isBeforeDeadline) {
            return new Date(moment(filter.selectedOptions, 'DD.MM.YYYY HH:mm').format()) >= new Date(task.deadline)
          }

          return new Date(moment(filter.selectedOptions, 'DD.MM.YYYY HH:mm').format()) <= new Date(task.deadline)
        }

        case 'createdAt': {
          return isTaskDateInRange(task.createdAt, filter.selectedOptions)
        }

        case 'lastActivity': {
          return isTaskDateInRange(task.lastActivity || task.updatedAt, filter.selectedOptions)
        }

        default:
          return true
      }
    }
  }
}
