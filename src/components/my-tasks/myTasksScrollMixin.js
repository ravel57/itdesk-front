import {getDocumentDistanceToBottom} from 'src/util/myTasks/myTasksPaging'

// Подгрузка следующей страницы заявок по прокрутке документа: слушатели колеса/касания/клавиш/scroll,
// отложенная проверка расстояния до конца страницы.
// Слушатели вешает/снимает страница: addMyTasksScrollListeners() в mounted, removeMyTasksScrollListeners() в beforeUnmount.
// Требует на странице: myTasksPageLoadedOnce / myTasksPageLoading / myTasksPageIsEnd и loadMyTasksPage (myTasksLoaderMixin).
export default {
  data: () => ({
    myTasksScrollTimer: null,
    myTasksUserScrolled: false,
    myTasksLoadScrollThreshold: 700,
  }),

  methods: {
    addMyTasksScrollListeners() {
      window.addEventListener('wheel', this.onMyTasksScrollIntent, { passive: true })
      window.addEventListener('touchmove', this.onMyTasksScrollIntent, { passive: true })
      window.addEventListener('keydown', this.onMyTasksScrollIntent)
      document.addEventListener('scroll', this.onAnyMyTasksScroll, true)
    },

    removeMyTasksScrollListeners() {
      window.removeEventListener('wheel', this.onMyTasksScrollIntent)
      window.removeEventListener('touchmove', this.onMyTasksScrollIntent)
      window.removeEventListener('keydown', this.onMyTasksScrollIntent)
      document.removeEventListener('scroll', this.onAnyMyTasksScroll, true)
    },

    clearMyTasksScrollTimer() {
      if (this.myTasksScrollTimer) {
        clearTimeout(this.myTasksScrollTimer)
      }
    },

    onMyTasksScrollIntent(event) {
      if (event?.type === 'keydown') {
        const allowedKeys = ['PageDown', 'End', 'ArrowDown', 'Space', ' ']
        if (!allowedKeys.includes(event.key)) {
          return
        }
      }
      this.myTasksUserScrolled = true
      this.scheduleTryLoadNextMyTasksPage()
    },

    onAnyMyTasksScroll() {
      this.myTasksUserScrolled = true
      this.scheduleTryLoadNextMyTasksPage()
    },

    scheduleTryLoadNextMyTasksPage() {
      if (this.myTasksScrollTimer) {
        return
      }

      this.myTasksScrollTimer = setTimeout(() => {
        this.myTasksScrollTimer = null
        this.tryLoadNextMyTasksPage()
      }, 100)
    },

    tryLoadNextMyTasksPage() {
      if (!this.myTasksPageLoadedOnce) {
        return
      }

      if (!this.myTasksUserScrolled) {
        return
      }

      if (this.myTasksPageLoading || this.myTasksPageIsEnd) {
        return
      }

      const distanceToBottom = this.getMyTasksDistanceToBottom()

      if (distanceToBottom > this.myTasksLoadScrollThreshold) {
        return
      }

      this.myTasksUserScrolled = false
      this.loadMyTasksPage(false)
    },

    getMyTasksDistanceToBottom() {
      return getDocumentDistanceToBottom()
    },
  }
}
