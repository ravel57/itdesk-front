import axios from 'axios'
import {
  getMessageSortTime,
  mergePagedTasks,
  normalizeTaskMessage,
  normalizeTaskPageTask,
  sortMessagesByDateAndId,
  uniqueMessagesById
} from 'src/util/chatTasks/taskNormalize'

// Серверная постраничная загрузка заявок клиента: запрос страниц, сброс/перезагрузка,
// бесконечный скролл, upsert заявки в список и загрузка одной заявки по id (для URL).
// Требует в компоненте: props client/tasks, search, isShowCompletedTasks, selectedSorting, ascendingSort,
// canViewTasks, loadSlaInfoForTask, this.$q, $emit('tasksLoaded'), $refs.taskScroll.
export default {
  data: () => ({
    pagedTasks: [],
    taskPage: 0,
    taskPageSize: 30,
    taskPageTotalElements: 0,
    taskPageTotalPages: 0,
    taskPageIsEnd: false,
    taskPageLoading: false,
    taskPageReloadTimer: null,
    // Перезагрузка, запрошенная во время текущей загрузки: выполняется сразу после неё, а не теряется
    taskPageReloadPending: false,
    taskPageRefreshTimer: null,
    taskScrollTimer: null,
    taskPageLoadedOnce: false,
    loadedClientId: null,
  }),

  computed: {
    isDemoClient () {
      return Number(this.client?.id) < 0
    },

    getTasksTotalForHeader () {
      return this.isDemoClient
        ? this.getActualTasks.length
        : this.taskPageTotalElements
    },

    isInitialTasksLoading () {
      return !this.isDemoClient && this.taskPageLoading && !this.taskPageLoadedOnce
    },

    shouldShowNoTasksPlaceholder () {
      if (this.isDemoClient) {
        return this.getActualTasks.length === 0
      }
      return this.taskPageLoadedOnce && !this.taskPageLoading && this.getActualTasks.length === 0
    },
  },

  methods: {
    normalizeTaskPageTask (task) {
      return normalizeTaskPageTask(task)
    },

    buildTasksPageRequest(page = 1) {
      return {
        clientId: this.client?.id,
        page,
        size: this.taskPageSize,
        search: this.search || '',
        includeCompleted: this.isShowCompletedTasks,
        sortSlug: this.selectedSorting?.slug || 'creating',
        ascendingSort: Boolean(this.ascendingSort),
        filterJoinOperator: 'AND',
        filterChain: [],
        requiredFilterChain: []
      }
    },

    mergePagedTasks (currentTasks = [], newTasks = []) {
      return mergePagedTasks(currentTasks, newTasks)
    },

    async loadTasksPage(reset = false) {
      if (this.isDemoClient || !this.client?.id || !this.canViewTasks) {
        return
      }

      if (this.taskPageLoading) {
        if (reset) {
          this.taskPageReloadPending = true
        }
        return
      }

      if (!reset && this.taskPageIsEnd) {
        return
      }

      const requestClientId = Number(this.client.id)
      this.taskPageLoading = true

      const page = reset ? 1 : this.taskPage + 1

      try {
        const response = await axios.post('/api/v1/tasks-page', this.buildTasksPageRequest(page))

        if (Number(this.client?.id) !== requestClientId) {
          return
        }

        const loadedTasks = Array.isArray(response.data?.tasks)
          ? response.data.tasks.map(task => this.normalizeTaskPageTask(task))
          : []

        this.pagedTasks = reset
          ? loadedTasks
          : this.mergePagedTasks(this.pagedTasks, loadedTasks)

        this.taskPage = response.data?.page ?? page
        this.taskPageTotalElements = response.data?.totalElements ?? this.pagedTasks.length
        this.taskPageTotalPages = response.data?.totalPages ?? 0
        this.taskPageIsEnd = response.data?.isEnd ?? loadedTasks.length === 0
        this.taskPageLoadedOnce = true
        this.loadedClientId = requestClientId

        this.$emit('tasksLoaded', this.pagedTasks)

        loadedTasks
          .filter(task => task?.sla)
          .forEach(task => this.loadSlaInfoForTask(task))
      } catch (e) {
        this.$q.notify({
          message: e.message || 'Не удалось загрузить заявки',
          type: 'negative'
        })
      } finally {
        this.taskPageLoading = false
        if (this.taskPageReloadPending) {
          // ответ мог устареть (например, заявка создана автоматизацией во время запроса) — перечитываем
          this.taskPageReloadPending = false
          this.loadTasksPage(true)
        }
      }
    },

    // Перечитать первую страницу без очистки списка (без мигания) — для заявок, пришедших по WebSocket
    refreshTasksPageSoon() {
      if (this.taskPageRefreshTimer) {
        clearTimeout(this.taskPageRefreshTimer)
      }
      this.taskPageRefreshTimer = setTimeout(() => {
        this.taskPageRefreshTimer = null
        this.loadTasksPage(true)
      }, 300)
    },

    resetTasksPageAndLoad(force = false) {
      if (this.taskPageReloadTimer) {
        clearTimeout(this.taskPageReloadTimer)
        this.taskPageReloadTimer = null
      }
      const clientId = Number(this.client?.id || 0)
      if (!clientId || this.isDemoClient) {
        this.loadedClientId = null
        this.pagedTasks = []
        this.taskPage = 0
        this.taskPageTotalElements = 0
        this.taskPageTotalPages = 0
        this.taskPageIsEnd = false
        this.taskPageLoadedOnce = false
        this.taskPageLoading = false
        this.$emit('tasksLoaded', [])
        return
      }
      if (!force && this.loadedClientId === clientId && this.taskPageLoadedOnce) {
        return
      }
      this.loadedClientId = clientId
      this.pagedTasks = []
      this.taskPage = 0
      this.taskPageTotalElements = 0
      this.taskPageTotalPages = 0
      this.taskPageIsEnd = false
      this.taskPageLoadedOnce = false
      this.$emit('tasksLoaded', [])
      this.loadTasksPage(true)
    },

    reloadTasksPageDebounced(force = true) {
      if (this.taskPageReloadTimer) {
        clearTimeout(this.taskPageReloadTimer)
      }
      this.taskPageReloadTimer = setTimeout(() => {
        this.taskPageReloadTimer = null
        this.resetTasksPageAndLoad(force)
      }, 300)
    },

    onTaskScroll(event) {
      if (this.taskScrollTimer) {
        return
      }
      this.taskScrollTimer = setTimeout(() => {
        this.taskScrollTimer = null
        const target = event?.target || this.$refs.taskScroll
        if (!target || this.taskPageLoading || this.taskPageIsEnd) {
          return
        }
        const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight
        if (distanceToBottom <= 500) {
          this.loadTasksPage(false)
        }
      }, 100)
    },

    upsertPagedTask(task) {
      const normalizedTask = this.normalizeTaskPageTask(task)
      if (!normalizedTask?.id) {
        return
      }
      const shouldHide = !this.isShowCompletedTasks &&
        (Boolean(normalizedTask.completed) || Boolean(normalizedTask.frozen))
      const index = this.pagedTasks.findIndex(item => {
        return Number(item.id) === Number(normalizedTask.id)
      })
      if (shouldHide) {
        if (index !== -1) {
          // заявку закрыли или заморозили, а закрытые не показываются: убираем из списка и из счётчика
          this.pagedTasks = this.pagedTasks.filter(item => {
            return Number(item.id) !== Number(normalizedTask.id)
          })
          this.taskPageTotalElements = Math.max(0, Number(this.taskPageTotalElements || 0) - 1)
        }
        this.$emit('tasksLoaded', this.pagedTasks)
        return
      }
      if (index === -1) {
        this.pagedTasks = [
          normalizedTask,
          ...this.pagedTasks
        ]
        this.taskPageTotalElements = Number(this.taskPageTotalElements || 0) + 1
      } else {
        this.pagedTasks = this.pagedTasks.map(item => {
          return Number(item.id) === Number(normalizedTask.id)
            ? {
                ...item,
                ...normalizedTask
              }
            : item
        })
      }
      this.$emit('tasksLoaded', this.pagedTasks)
    },

    findLoadedTaskById (taskId) {
      return [...(this.pagedTasks || []), ...(this.tasks || [])]
        .find(task => String(task?.id) === String(taskId))
    },

    async loadTaskByIdForUrl (taskId) {
      if (this.isDemoClient || !this.client?.id || !this.canViewTasks) {
        return this.findLoadedTaskById(taskId)
      }
      const response = await axios.post('/api/v1/tasks-page', {
        ...this.buildTasksPageRequest(1),
        page: 1,
        size: 1,
        search: '',
        taskId,
        includeCompleted: true,
        filterChain: [],
        requiredFilterChain: []
      })
      const task = Array.isArray(response.data?.tasks)
        ? response.data.tasks
          .map(item => this.normalizeTaskPageTask(item))
          .find(item => String(item?.id) === String(taskId))
        : null
      return task || null
    },

    normalizeTaskMessage (message) {
      return normalizeTaskMessage(message)
    },

    getMessageSortTime (message) {
      return getMessageSortTime(message)
    },

    sortMessagesByDateAndId (messages) {
      return sortMessagesByDateAndId(messages)
    },

    uniqueMessagesById (messages) {
      return uniqueMessagesById(messages)
    },
  }
}
