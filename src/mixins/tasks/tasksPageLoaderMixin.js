import {buildTasksPageRequest as createTasksPageRequest} from 'src/util/tasks/taskQuery'
import {isValidFilterJoinOperator, normalizeFiltersForServer} from 'src/util/tasks/taskFilters'
import {
  buildCardTaskColumnDefinitions,
  createLazySources,
  GROUP_SOURCE_NAMES,
  pickGroupSource
} from 'src/util/tasks/taskGrouping'

// Постраничная загрузка заявок: сборка запроса, загрузка страницы таблицы, загрузка колонок карточного режима,
// сброс/перезагрузка с debounce. Прокрутку и подгрузку по скроллу ведёт tasksInfiniteScrollMixin.
// Требует на странице: this.store, фильтры/сортировку/область (tasksFiltersMixin, tasksViewMixin),
// loadSlaInfoForTasks (tasksSlaMixin), setupTasksInfiniteObserver и др. (tasksInfiniteScrollMixin).
export default {
  data: () => ({
    taskPageSize: 10,
    taskPageLoading: false,
    taskPageInitialLoaded: false,
    taskPageReloadTimer: null,
    taskPageMaxSize: 100,
    cardTaskPageByColumn: {},
    cardTaskColumnsLoading: false,
  }),

  computed: {
    taskPageIsEnd() {
      if (this.isShowTableMode) {
        return Boolean(this.store.taskPage?.isEnd)
      }
      const columns = this.getCardTaskColumnDefinitions()
      if (columns.length === 0) {
        return Boolean(this.store.taskPage?.isEnd)
      }
      return columns.every(column => this.getCardTaskColumnState(column).isEnd)
    },

    taskPageTotalElements() {
      if (this.isShowTableMode) {
        return Number(this.store.taskPage?.totalElements || 0)
      }
      const columns = this.getCardTaskColumnDefinitions()
      if (columns.length === 0) {
        return Number(this.store.taskPage?.totalElements || 0)
      }
      return columns.reduce((sum, column) => {
        return sum + Number(this.getCardTaskColumnState(column).totalElements || 0)
      }, 0)
    }
  },

  methods: {
    buildTasksPageRequest(page = 1, overrides = {}) {
      const filterJoinOperator = isValidFilterJoinOperator(this.filterJoinOperator)
        ? this.filterJoinOperator
        : 'AND'
      return createTasksPageRequest({
        page,
        size: overrides.size || this.store.taskPage?.size || this.taskPageSize || 10,
        search: this.searchRequest || '',
        includeCompleted: this.isShowCompletedTasks,
        sortSlug: this.selectedSorting?.slug || 'creating',
        ascendingSort: Boolean(this.ascendingSort),
        filterJoinOperator: overrides.filterJoinOperator || filterJoinOperator,
        filterChain: overrides.filterChain || (this.isFilterSelected ? normalizeFiltersForServer(this.filterChain || [], this.filterTypes) : []),
        requiredFilterChain: overrides.requiredFilterChain || [],
        isMyLinesScope: this.isMyLinesScope,
        isMyTasksScope: this.isMyTasksScope,
        currentExecutorLabel: this.currentExecutorLabel
      })
    },

    getCardTaskColumnDefinitions() {
      const slug = this.selectedGroupType?.slug
      const source = pickGroupSource(slug, createLazySources(this, GROUP_SOURCE_NAMES))

      return buildCardTaskColumnDefinitions(slug, this.selectedGroupType?.label, source)
    },

    getCardTaskColumnState(column) {
      return this.cardTaskPageByColumn[column.key] || {
        page: 0,
        totalElements: 0,
        totalPages: 0,
        isEnd: false
      }
    },

    setCardTaskColumnState(column, patch) {
      this.cardTaskPageByColumn = {
        ...this.cardTaskPageByColumn,
        [column.key]: {
          ...this.getCardTaskColumnState(column),
          ...patch
        }
      }
    },

    async loadCardTaskColumns(reset = false) {
      if (this.cardTaskColumnsLoading || this.taskPageLoading) {
        return
      }
      const columns = this.getCardTaskColumnDefinitions()
      if (columns.length === 0) {
        await this.loadTasksPage(reset)
        return
      }
      const columnsToLoad = reset
        ? columns
        : columns.filter(column => !this.getCardTaskColumnState(column).isEnd)
      if (columnsToLoad.length === 0) {
        return
      }
      this.cardTaskColumnsLoading = true
      this.taskPageLoading = true
      try {
        const responses = await Promise.all(
          columnsToLoad.map(column => {
            const state = this.getCardTaskColumnState(column)
            const page = reset ? 1 : state.page + 1

            return this.store.fetchTasksPage(
              this.buildTasksPageRequest(page, {
                size: this.taskPageMaxSize,
                requiredFilterChain: column.requiredFilterChain
              }),
              true
            ).then(taskPage => {
              this.setCardTaskColumnState(column, {
                page: taskPage.responsePage,
                totalElements: taskPage.responseTotalElements,
                totalPages: taskPage.responseTotalPages,
                isEnd: taskPage.responseIsEnd
              })

              return taskPage
            })
          })
        )
        const loadedTasks = responses
          .flatMap(response => response.loadedTasks || [])
          .filter(task => task && task.id)

        this.loadSlaInfoForTasks(loadedTasks)
      } catch (e) {
        this.$q.notify({
          message: e.message || 'Не удалось загрузить заявки',
          type: 'negative'
        })
      } finally {
        this.cardTaskColumnsLoading = false
        this.taskPageLoading = false
        this.taskPageInitialLoaded = true

        this.$nextTick(() => {
          this.setupTasksInfiniteObserver()
          this.loadMoreTasksIfViewportIsNotFilled()
        })
      }
    },

    async resetTasksPageAndLoad() {
      if (this.taskPageLoading || this.cardTaskColumnsLoading) {
        this.reloadTasksPageDebounced()
        return
      }

      if (this.taskPageReloadTimer) {
        clearTimeout(this.taskPageReloadTimer)
        this.taskPageReloadTimer = null
      }
      this.destroyTasksInfiniteObserver()
      this.tasksUserScrolled = false
      this.lastTasksScrollTarget = null
      this.cardTaskPageByColumn = {}
      this.store.resetTaskPage()
      this.taskPageInitialLoaded = false
      if (this.isShowTableMode) {
        await this.loadTasksPage(true)
      } else {
        await this.loadCardTaskColumns(true)
      }
      this.$nextTick(() => {
        const scrollContainer = this.$refs.tasksPageScroll
        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        }
        this.setupTasksInfiniteObserver()
        this.loadMoreTasksIfViewportIsNotFilled()
      })
    },

    reloadTasksPageDebounced() {
      if (this.taskPageReloadTimer) {
        clearTimeout(this.taskPageReloadTimer)
      }
      this.taskPageReloadTimer = setTimeout(() => {
        this.resetTasksPageAndLoad()
      }, 250)
    },

    async loadTasksPage(reset = false) {
      if (this.taskPageLoading) {
        return
      }

      if (!reset && this.taskPageIsEnd) {
        return
      }

      this.taskPageLoading = true

      const page = reset ? 1 : (this.store.taskPage.page || 0) + 1
      const beforeCount = reset ? 0 : (this.store.taskPage.tasks || []).length

      try {
        const taskPage = await this.store.fetchTasksPage(this.buildTasksPageRequest(page), !reset)

        const loadedTasks = reset
          ? (taskPage.tasks || [])
          : (taskPage.tasks || []).slice(beforeCount)

        this.loadSlaInfoForTasks(loadedTasks)
      } catch (e) {
        this.$q.notify({
          message: e.message || 'Не удалось загрузить заявки',
          type: 'negative'
        })
      } finally {
        this.taskPageLoading = false
        this.taskPageInitialLoaded = true
        this.$nextTick(() => {
          this.setupTasksInfiniteObserver()
          this.loadMoreTasksIfViewportIsNotFilled()
        })
      }
    },

    clearTasksPageReloadTimer() {
      if (this.taskPageReloadTimer) {
        clearTimeout(this.taskPageReloadTimer)
      }
    }
  }
}
