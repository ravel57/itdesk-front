import axios from 'axios'
import {
  applyLineTaskUpsert,
  buildLinesPageRequest,
  groupTasksByLine,
  isTaskInLines,
  mergeLineTasks,
  normalizeLineTask
} from 'src/util/myLines/myLinesTasks'

// Постраничная загрузка заявок выбранных линий: запрос страницы, сброс/перезагрузка с debounce,
// группировка по линиям, обновление списка после изменения заявки в диалоге.
// Требует на странице: this.searchRequest (data страницы), this.$q,
// requestLines / selectedLineId / currentUserLines (myLinesLinesMixin), userScrolled (myLinesScrollMixin).
export default {
  data: () => ({
    pagedTasks: [],
    page: 0,
    pageSize: 50,
    totalElements: 0,
    totalPages: 0,
    pageIsEnd: false,
    pageLoading: false,
    pageLoadedOnce: false,
    reloadTimer: null,
  }),

  computed: {
    displayedGroups() {
      return groupTasksByLine(this.pagedTasks, this.currentUserLines, this.requestLines)
    },

    isInitialLoading() {
      return this.pageLoading && !this.pageLoadedOnce
    }
  },

  methods: {
    normalizeTask(task) {
      return normalizeLineTask(task)
    },

    buildPageRequest(page = 1) {
      return buildLinesPageRequest(page, this.pageSize, this.searchRequest, this.requestLines)
    },

    mergeTasks(currentTasks = [], newTasks = []) {
      return mergeLineTasks(currentTasks, newTasks)
    },

    async loadPage(reset = false) {
      if (this.pageLoading || this.requestLines.length === 0) {
        if (this.requestLines.length === 0) this.pageLoadedOnce = true
        return
      }
      if (!reset && this.pageIsEnd) return

      this.pageLoading = true
      const page = reset ? 1 : this.page + 1
      const requestSearch = this.searchRequest || ''
      const requestLineId = this.selectedLineId

      try {
        const response = await axios.post('/api/v1/tasks-page', this.buildPageRequest(page))
        if ((this.searchRequest || '') !== requestSearch || this.selectedLineId !== requestLineId) return

        const loadedTasks = Array.isArray(response.data?.tasks)
          ? response.data.tasks.map(task => this.normalizeTask(task))
          : []

        this.pagedTasks = reset ? loadedTasks : this.mergeTasks(this.pagedTasks, loadedTasks)
        this.page = response.data?.page ?? page
        this.totalElements = response.data?.totalElements ?? this.pagedTasks.length
        this.totalPages = response.data?.totalPages ?? 0
        this.pageIsEnd = response.data?.isEnd ?? loadedTasks.length === 0
        this.pageLoadedOnce = true
      } catch (error) {
        this.showError(error, 'Не удалось загрузить заявки моих линий')
      } finally {
        this.pageLoading = false
      }
    },

    resetPageAndLoad() {
      if (this.reloadTimer) {
        clearTimeout(this.reloadTimer)
        this.reloadTimer = null
      }
      this.pagedTasks = []
      this.page = 0
      this.totalElements = 0
      this.totalPages = 0
      this.pageIsEnd = false
      this.pageLoadedOnce = false
      this.userScrolled = false
      this.loadPage(true)
    },

    reloadDebounced() {
      if (this.reloadTimer) clearTimeout(this.reloadTimer)
      this.reloadTimer = setTimeout(() => {
        this.reloadTimer = null
        this.resetPageAndLoad()
      }, 300)
    },

    clearReloadTimer() {
      if (this.reloadTimer) clearTimeout(this.reloadTimer)
    },

    isTaskInCurrentScope(task) {
      return isTaskInLines(task, this.requestLines)
    },

    upsertTask(task) {
      const normalizedTask = this.normalizeTask(task)
      if (!normalizedTask?.id) return

      const result = applyLineTaskUpsert(
        this.pagedTasks,
        this.totalElements,
        normalizedTask,
        this.isTaskInCurrentScope(normalizedTask)
      )
      this.pagedTasks = result.tasks
      this.totalElements = result.totalElements
    },

    showError(error, fallback) {
      this.$q.notify({
        type: 'negative',
        message: error?.response?.data?.message || error?.message || fallback
      })
    }
  }
}
