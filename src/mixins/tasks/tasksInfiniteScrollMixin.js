// Бесконечная прокрутка страницы заявок: слушатели прокрутки/клавиш/колеса, IntersectionObserver на «сентинеле»,
// дозагрузка, пока область прокрутки не заполнена.
// Требует на странице: $refs.tasksPageScroll и $refs.tasksInfiniteSentinel (шаблон),
// loadTasksPage / loadCardTaskColumns / taskPageIsEnd (tasksPageLoaderMixin), isShowTableMode.
export default {
  data: () => ({
    taskPageScrollTimer: null,
    taskPageAutoFillTimer: null,
    tasksUserScrolled: false,
    tasksInfiniteObserver: null,
    lastTasksScrollTarget: null,
    // Расстояние до конца области прокрутки (px), при котором прокрутка пользователя подгружает следующую страницу.
    // Как myTasksLoadScrollThreshold / loadScrollThreshold на MyTasksPage / MyLinesPage.
    tasksLoadScrollThreshold: 700,
  }),

  methods: {
    // Слушатели намерения прокрутки (вызывать из mounted страницы)
    addTasksScrollIntentListeners() {
      window.addEventListener('wheel', this.onTasksScrollIntent, {passive: true})
      window.addEventListener('touchmove', this.onTasksScrollIntent, {passive: true})
      window.addEventListener('keydown', this.onTasksKeydownIntent)
    },

    addTasksScrollCaptureListeners() {
      document.addEventListener('scroll', this.onAnyTasksScroll, true)
      document.addEventListener('mousedown', this.onTasksPointerIntent, true)
      document.addEventListener('auxclick', this.onTasksPointerIntent, true)
    },

    // Снимает все слушатели прокрутки и observer, чистит таймеры (вызывать из beforeUnmount страницы)
    removeTasksScrollListeners() {
      window.removeEventListener('wheel', this.onTasksScrollIntent)
      window.removeEventListener('touchmove', this.onTasksScrollIntent)
      window.removeEventListener('keydown', this.onTasksKeydownIntent)
      document.removeEventListener('scroll', this.onAnyTasksScroll, true)
      document.removeEventListener('mousedown', this.onTasksPointerIntent, true)
      document.removeEventListener('auxclick', this.onTasksPointerIntent, true)
      this.destroyTasksInfiniteObserver()
    },

    clearTasksScrollTimers() {
      if (this.taskPageScrollTimer) {
        clearTimeout(this.taskPageScrollTimer)
      }
      if (this.taskPageAutoFillTimer) {
        clearTimeout(this.taskPageAutoFillTimer)
      }
    },

    onTasksScroll(event) {
      if (!this.isTasksPageScrollEvent(event)) {
        return
      }
      this.tasksUserScrolled = true
      this.lastTasksScrollTarget = this.resolveTasksScrollTarget(event?.target)
      this.scheduleTryLoadNextTasksPage()
    },

    onTasksScrollIntent(event) {
      if (!this.isTasksPageInteractionTarget(event?.target)) {
        return
      }
      this.tasksUserScrolled = true
      this.lastTasksScrollTarget = this.resolveTasksScrollTarget(event?.target)
      this.scheduleTryLoadNextTasksPage()
    },

    onTasksPointerIntent(event) {
      if (event?.button !== 1) {
        return
      }
      if (!this.isTasksPageInteractionTarget(event?.target)) {
        return
      }
      this.tasksUserScrolled = true
      this.lastTasksScrollTarget = this.resolveTasksScrollTarget(event?.target)
    },

    onTasksKeydownIntent(event) {
      const keys = ['PageDown', 'End', 'ArrowDown', 'Space', ' ']
      if (!keys.includes(event?.key)) {
        return
      }
      this.tasksUserScrolled = true
      this.lastTasksScrollTarget = this.resolveTasksScrollTarget(document.activeElement)
      this.scheduleTryLoadNextTasksPage()
    },

    onAnyTasksScroll(event) {
      if (!this.isTasksPageScrollEvent(event)) {
        return
      }
      this.tasksUserScrolled = true
      this.lastTasksScrollTarget = this.resolveTasksScrollTarget(event?.target)
      this.scheduleTryLoadNextTasksPage()
    },

    onTasksTableNeedMore() {
      this.tasksUserScrolled = true
      this.scheduleTryLoadNextTasksPage(true)
    },

    scheduleTryLoadNextTasksPage(force = false) {
      if (force && this.taskPageScrollTimer) {
        clearTimeout(this.taskPageScrollTimer)
        this.taskPageScrollTimer = null
      }
      if (this.taskPageScrollTimer) {
        return
      }
      this.taskPageScrollTimer = setTimeout(() => {
        this.taskPageScrollTimer = null
        this.tryLoadNextTasksPage(force)
      }, 100)
    },

    isTasksPageScrollEvent(event) {
      const root = this.$refs.tasksPageScroll
      const target = event?.target
      if (!root || !target) {
        return false
      }
      if (target === document || target === window || target === document.documentElement || target === document.body) {
        return document.body.contains(root)
      }
      return target === root || root.contains(target)
    },

    isTasksPageInteractionTarget(target) {
      const root = this.$refs.tasksPageScroll
      if (!root) {
        return false
      }
      if (!target || target === document || target === window || target === document.documentElement || target === document.body) {
        return document.body.contains(root)
      }
      return target === root || root.contains(target)
    },

    resolveTasksScrollTarget(target) {
      const root = this.$refs.tasksPageScroll
      if (!root) {
        return null
      }
      if (!target || target === document || target === window || target === document.documentElement || target === document.body) {
        return root
      }
      let node = target
      while (node && node !== document.body) {
        if (node === root) {
          return root
        }
        if (root.contains(node)) {
          const style = window.getComputedStyle(node)
          const canScrollY = ['auto', 'scroll', 'overlay'].includes(style.overflowY)
          if (canScrollY && node.scrollHeight > node.clientHeight + 5) {
            return node
          }
        }
        node = node.parentElement
      }
      return root
    },

    getTasksDistanceToBottom() {
      const target = this.lastTasksScrollTarget || this.$refs.tasksPageScroll
      if (!target) {
        return Number.POSITIVE_INFINITY
      }
      return target.scrollHeight - target.scrollTop - target.clientHeight
    },

    setupTasksInfiniteObserver() {
      this.destroyTasksInfiniteObserver()

      const sentinel = this.$refs.tasksInfiniteSentinel
      const root = this.$refs.tasksPageScroll || null

      if (!sentinel) {
        return
      }

      this.tasksInfiniteObserver = new IntersectionObserver(
        entries => {
          const entry = entries[0]
          if (!entry || !entry.isIntersecting) {
            return
          }

          this.tryLoadNextTasksPage(true)
        },
        {
          root,
          rootMargin: '300px 0px 300px 0px',
          threshold: 0.01
        }
      )

      this.tasksInfiniteObserver.observe(sentinel)
    },

    destroyTasksInfiniteObserver() {
      if (this.tasksInfiniteObserver) {
        this.tasksInfiniteObserver.disconnect()
        this.tasksInfiniteObserver = null
      }
    },

    tryLoadNextTasksPage(force = false) {
      if (!this.taskPageInitialLoaded) {
        return
      }
      if (!force && !this.tasksUserScrolled) {
        return
      }
      if (this.taskPageLoading || this.taskPageIsEnd) {
        return
      }
      const distanceToBottom = this.getTasksDistanceToBottom()
      if (!force && distanceToBottom > this.tasksLoadScrollThreshold) {
        return
      }
      this.tasksUserScrolled = false
      if (this.isShowTableMode) {
        this.loadTasksPage(false)
      } else {
        this.loadCardTaskColumns(false)
      }
    },

    loadMoreTasksIfViewportIsNotFilled(attempt = 0) {
      if (attempt > 8) {
        return
      }
      if (this.taskPageLoading || this.taskPageIsEnd) {
        return
      }
      if (this.taskPageAutoFillTimer) {
        clearTimeout(this.taskPageAutoFillTimer)
      }
      this.taskPageAutoFillTimer = setTimeout(async () => {
        this.taskPageAutoFillTimer = null
        const root = this.$refs.tasksPageScroll
        if (!root || this.taskPageLoading || this.taskPageIsEnd) {
          return
        }
        const viewportIsNotFilled = root.scrollHeight <= root.clientHeight + 80
        if (!viewportIsNotFilled) {
          return
        }
        if (this.isShowTableMode) {
          await this.loadTasksPage(false)
        } else {
          await this.loadCardTaskColumns(false)
        }
        this.$nextTick(() => {
          this.loadMoreTasksIfViewportIsNotFilled(attempt + 1)
        })
      }, 80)
    }
  }
}
