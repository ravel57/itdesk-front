import {
  SORTING_STORAGE_KEY,
  createSortingTypes,
  parseSortingSettings,
  serializeSortingSettings
} from 'src/util/tasks/taskSorting'
import {
  GROUP_SOURCE_NAMES,
  GROUP_TYPE_STORAGE_KEY,
  buildUserLineIds,
  createLazySources,
  filterTasksByScope,
  getAvailableGroupTypes,
  groupTasks,
  resolveSavedGroupType
} from 'src/util/tasks/taskGrouping'
import {
  getChecklistCompletedCount,
  getChecklistTableValue,
  getChecklistTotalCount,
  getExecutorGroupName,
  getExecutorName,
  getServiceName,
  getSupportLineLevelLabel,
  getSupportLineName,
  getTaskTypeName,
  isCurrentUserExecutor
} from 'src/util/tasks/taskFields'
import {
  getOlaPercent,
  getOlaSecondsLeft,
  getOlaTableValue
} from 'src/util/tasks/taskSla'

// Отображение списка заявок: область (все / мои / мои линии), сортировка, группировка карточек,
// строки таблицы с рассчитанными SLA/OLA. Чистая логика — в src/util/tasks/taskSorting.js, taskGrouping.js, taskFields.js.
// Требует на странице: this.store, this.$route, справочники (tasksDirectoriesMixin), SLA-методы (tasksSlaMixin),
// isObserverUser, currentExecutorLabel / unassignedExecutorLabel.
export default {
  data: () => ({
    selectedGroupType: {label: 'Исполнитель', slug: 'executor'},
    sortingTypes: createSortingTypes(),
    selectedSorting: [],
    ascendingSort: false,
  }),

  computed: {
    isMyLinesScope() {
      return String(this.$route.query.scope || '').toLowerCase() === 'my-lines'
    },

    isMyTasksScope() {
      return String(this.$route.query.scope || '').toLowerCase() === 'my'
    },

    tasksScope() {
      if (this.isMyTasksScope) return 'my'
      return this.isMyLinesScope ? 'my-lines' : 'all'
    },

    currentUserLineIds() {
      return buildUserLineIds(this.store.supportLines, this.store.currentUser?.id)
    },

    getFilterType() {
      return getAvailableGroupTypes(this.filterTypes, this.isObserverUser, () => this.organizations.length)
    },

    getFilteredTasks() {
      const vm = this
      const tasks = Array.isArray(this.store.getTaskPageTasks) ? this.store.getTaskPageTasks : []
      return filterTasksByScope(tasks, {
        isMyTasksScope: this.isMyTasksScope,
        isMyLinesScope: this.isMyLinesScope,
        currentUser: this.store.currentUser,
        // Множество линий читаем лениво: нужно только в области «мои линии»
        get lineIds() {
          return vm.currentUserLineIds
        }
      })
    },

    getGroupedTasks() {
      return groupTasks(
        this.getFilteredTasks,
        this.selectedGroupType.slug,
        createLazySources(this, GROUP_SOURCE_NAMES),
        this.unassignedExecutorLabel
      )
    },

    getTableRows() {
      try {
        const tasks = this.getFilteredTasks
        this.loadSlaInfoForTasks(tasks)
        return tasks.map(task => {
          const slaInfo = task.frozen || task.completed
            ? null
            : this.slaInfoByTaskId[task.id] || null
          const row = {
            ...task,
            originalSla: task.sla,
            slaInfo
          }
          const isSlaVisible = this.isSlaVisibleInTable(row)
          const secondsLeft = isSlaVisible ? this.getSlaLeftSeconds(row) : null
          return {
            ...row,
            type: getTaskTypeName(row),
            serviceLabel: getServiceName(row),
            supportLine: getSupportLineName(row),
            supportLineLevel: getSupportLineLevelLabel(row),
            ola: getOlaTableValue(row),
            olaSecondsLeft: getOlaSecondsLeft(row),
            olaPercent: getOlaPercent(row),
            checklist: getChecklistTableValue(row),
            checklistCompleted: getChecklistCompletedCount(row),
            checklistTotal: getChecklistTotalCount(row),
            sla: secondsLeft !== null ? this.getSlaTime(row) : '',
            slaSecondsLeft: secondsLeft,
            slaPercent: isSlaVisible ? this.getSlaPercent(row) : null,
            slaExpired: isSlaVisible && secondsLeft !== null && secondsLeft <= 0
          }
        })
      } catch (e) {
        return []
      }
    }
  },

  watch: {
    getFilterType: {
      handler() {
        this.ensureSelectedGroupTypeAvailable()
      },
      immediate: true
    },

    selectedGroupType: {
      deep: true,
      handler(newValue, oldValue) {
        const label = newValue?.label || ''
        const slug = newValue?.slug || ''
        localStorage.setItem('GroupType', JSON.stringify({label, slug}))

        if (slug && slug !== oldValue?.slug && this.taskPageInitialLoaded) {
          this.reloadTasksPageDebounced()
        }
      }
    },

    selectedSorting: {
      deep: true,
      handler() {
        this.reloadTasksPageDebounced()
      }
    },

    ascendingSort() {
      this.reloadTasksPageDebounced()
    }
  },

  methods: {
    ensureSelectedGroupTypeAvailable() {
      const availableGroupTypes = this.getFilterType || []
      if (availableGroupTypes.some(type => type.slug === this.selectedGroupType?.slug)) {
        return
      }

      const fallback = availableGroupTypes.find(type => type.slug === 'status') || availableGroupTypes[0]
      if (fallback) {
        this.selectedGroupType = fallback
      }
    },

    // Восстановление типа группировки из localStorage (вызывать из created страницы)
    restoreSavedGroupType() {
      const savedGroupType = localStorage.getItem(GROUP_TYPE_STORAGE_KEY)
      if (savedGroupType) {
        try {
          const availableGroupType = resolveSavedGroupType(savedGroupType, this.filterTypes)
          if (availableGroupType) {
            this.selectedGroupType = availableGroupType
          } else {
            localStorage.removeItem(GROUP_TYPE_STORAGE_KEY)
          }
        } catch (error) {
          localStorage.removeItem(GROUP_TYPE_STORAGE_KEY)
        }
      }
    },

    saveSortingSettings() {
      localStorage.setItem(SORTING_STORAGE_KEY, serializeSortingSettings(this.selectedSorting, this.ascendingSort))
    },

    restoreSortingSettings() {
      try {
        const {selectedSorting, ascendingSort} = parseSortingSettings(
          localStorage.getItem(SORTING_STORAGE_KEY),
          this.sortingTypes
        )

        if (selectedSorting) {
          this.selectedSorting = selectedSorting
        }

        if (typeof ascendingSort === 'boolean') {
          this.ascendingSort = ascendingSort
        }
      } catch (ignored) {
      }
    },

    setSortVariable(sort) {
      this.selectedSorting = sort
      this.saveSortingSettings()
    },

    changeSortingAsc() {
      this.ascendingSort = !this.ascendingSort
      this.saveSortingSettings()
    },

    isCurrentUserExecutor(task) {
      return isCurrentUserExecutor(task, this.store.currentUser)
    },

    getExecutorGroupName(task) {
      return getExecutorGroupName(task, this.unassignedExecutorLabel)
    },

    getExecutorName(task) {
      return getExecutorName(task, this.store.currentUser, this.currentExecutorLabel, this.unassignedExecutorLabel)
    }
  }
}
