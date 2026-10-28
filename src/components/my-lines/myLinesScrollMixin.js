import {getDocumentDistanceToBottom} from 'src/util/myLines/myLinesTasks'

// Подгрузка следующей страницы заявок по прокрутке документа: слушатели колеса/касания/клавиш/scroll,
// отложенная проверка расстояния до конца страницы.
// Слушатели вешает/снимает страница: addScrollListeners() в mounted, removeScrollListeners() в beforeUnmount.
// Требует на странице: pageLoadedOnce / pageLoading / pageIsEnd и loadPage (myLinesLoaderMixin).
export default {
  data: () => ({
    scrollTimer: null,
    userScrolled: false,
    loadScrollThreshold: 700
  }),

  methods: {
    addScrollListeners() {
      window.addEventListener('wheel', this.onScrollIntent, {passive: true})
      window.addEventListener('touchmove', this.onScrollIntent, {passive: true})
      window.addEventListener('keydown', this.onScrollIntent)
      document.addEventListener('scroll', this.onAnyScroll, true)
    },

    removeScrollListeners() {
      window.removeEventListener('wheel', this.onScrollIntent)
      window.removeEventListener('touchmove', this.onScrollIntent)
      window.removeEventListener('keydown', this.onScrollIntent)
      document.removeEventListener('scroll', this.onAnyScroll, true)
    },

    clearScrollTimer() {
      if (this.scrollTimer) clearTimeout(this.scrollTimer)
    },

    onScrollIntent(event) {
      if (event?.type === 'keydown') {
        const allowedKeys = ['PageDown', 'End', 'ArrowDown', 'Space', ' ']
        if (!allowedKeys.includes(event.key)) return
      }
      this.userScrolled = true
      this.scheduleTryLoadNextPage()
    },

    onAnyScroll() {
      this.userScrolled = true
      this.scheduleTryLoadNextPage()
    },

    scheduleTryLoadNextPage() {
      if (this.scrollTimer) return
      this.scrollTimer = setTimeout(() => {
        this.scrollTimer = null
        this.tryLoadNextPage()
      }, 100)
    },

    tryLoadNextPage() {
      if (!this.pageLoadedOnce || !this.userScrolled || this.pageLoading || this.pageIsEnd) return
      if (this.getDistanceToBottom() > this.loadScrollThreshold) return
      this.userScrolled = false
      this.loadPage(false)
    },

    getDistanceToBottom() {
      return getDocumentDistanceToBottom()
    }
  }
}
