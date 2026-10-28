import axios from 'axios'
import {normalizeMyTask} from 'src/util/myTasks/myTaskNormalize'
import {applyMyTaskUpsert, buildMyTasksPageRequest, mergeMyTasks} from 'src/util/myTasks/myTasksPaging'

// Постраничная загрузка заявок исполнителя: запрос страницы, сброс/перезагрузка с debounce,
// обновление списка после изменения заявки в диалоге.
// Требует на странице: this.searchRequest (data страницы), this.$q, myTasksUserScrolled (myTasksScrollMixin),
// myTasksOnboardingActive (myTasksOnboardingMixin) и myTasksDisplayedTasks (computed страницы).
export default {
  data: () => ({
    myTasksPagedTasks: [],
    myTasksPage: 0,
    myTasksPageSize: 50,
    myTasksTotalElements: 0,
    myTasksTotalPages: 0,
    myTasksPageIsEnd: false,
    myTasksPageLoading: false,
    myTasksPageLoadedOnce: false,
    myTasksReloadTimer: null,
  }),

  computed: {
    getFilteredTasks() {
      return this.myTasksPagedTasks
    },

    isInitialMyTasksLoading() {
      return this.myTasksPageLoading && !this.myTasksPageLoadedOnce && !this.myTasksOnboardingActive
    },

    shouldShowMyTasksPlaceholder() {
      if (this.myTasksOnboardingActive) {
        return false
      }
      return this.myTasksPageLoadedOnce && !this.myTasksPageLoading && this.myTasksDisplayedTasks.length === 0
    },
  },

  methods: {
    normalizeMyTask(task) {
      return normalizeMyTask(task)
    },

    buildMyTasksPageRequest(page = 1) {
      return buildMyTasksPageRequest(page, this.myTasksPageSize, this.searchRequest)
    },

    mergeMyTasks(currentTasks = [], newTasks = []) {
      return mergeMyTasks(currentTasks, newTasks)
    },

    async loadMyTasksPage(reset = false) {
      if (this.myTasksPageLoading) {
        return
      }

      if (!reset && this.myTasksPageIsEnd) {
        return
      }

      this.myTasksPageLoading = true

      const page = reset ? 1 : this.myTasksPage + 1
      const requestSearch = this.searchRequest || ''

      try {
        const response = await axios.post('/api/v1/tasks-page', this.buildMyTasksPageRequest(page))

        if ((this.searchRequest || '') !== requestSearch) {
          return
        }

        const loadedTasks = Array.isArray(response.data?.tasks)
          ? response.data.tasks.map(task => this.normalizeMyTask(task))
          : []

        this.myTasksPagedTasks = reset
          ? loadedTasks
          : this.mergeMyTasks(this.myTasksPagedTasks, loadedTasks)

        this.myTasksPage = response.data?.page ?? page
        this.myTasksTotalElements = response.data?.totalElements ?? this.myTasksPagedTasks.length
        this.myTasksTotalPages = response.data?.totalPages ?? 0
        this.myTasksPageIsEnd = response.data?.isEnd ?? loadedTasks.length === 0
        this.myTasksPageLoadedOnce = true
      } catch (e) {
        this.$q.notify({
          message: e.message || 'Не удалось загрузить мои заявки',
          type: 'negative'
        })
      } finally {
        this.myTasksPageLoading = false
      }
    },

    resetMyTasksPageAndLoad() {
      if (this.myTasksReloadTimer) {
        clearTimeout(this.myTasksReloadTimer)
        this.myTasksReloadTimer = null
      }

      this.myTasksPagedTasks = []
      this.myTasksPage = 0
      this.myTasksTotalElements = 0
      this.myTasksTotalPages = 0
      this.myTasksPageIsEnd = false
      this.myTasksPageLoadedOnce = false
      this.myTasksUserScrolled = false

      this.loadMyTasksPage(true)
    },

    reloadMyTasksPageDebounced() {
      if (this.myTasksReloadTimer) {
        clearTimeout(this.myTasksReloadTimer)
      }

      this.myTasksReloadTimer = setTimeout(() => {
        this.myTasksReloadTimer = null
        this.resetMyTasksPageAndLoad()
      }, 300)
    },

    clearMyTasksReloadTimer() {
      if (this.myTasksReloadTimer) {
        clearTimeout(this.myTasksReloadTimer)
      }
    },

    upsertMyTask(task) {
      const normalizedTask = this.normalizeMyTask(task)
      if (!normalizedTask?.id) {
        return
      }
      const result = applyMyTaskUpsert(this.myTasksPagedTasks, this.myTasksTotalElements, normalizedTask)
      this.myTasksPagedTasks = result.tasks
      this.myTasksTotalElements = result.totalElements
    },
  }
}
