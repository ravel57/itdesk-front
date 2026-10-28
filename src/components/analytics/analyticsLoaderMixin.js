import {api, getCsrfToken} from 'boot/axios'
import {unwrapAnalyticsResponse} from 'src/util/analytics/analyticsFormat'
import {buildAnalyticsParams} from 'src/util/analytics/analyticsFilters'

// Загрузка сводки аналитики: отложенный запуск, отмена запроса, защита от устаревших ответов.
// Требует в компоненте: fromDate, toDate, groupBy, analyticsFilterQuery (computed), this.store, this.$q,
// saveAnalyticsSettingsToLocalStorage() и applyAnalyticsAccessUi() (analyticsSettingsMixin).
export default {
  data: () => ({
    loading: false,
    analyticsSummary: {},
    analyticsLoadTimer: null,
    analyticsAbortController: null,
    analyticsRequestSeq: 0
  }),

  computed: {
    summary() {
      const localSummary = unwrapAnalyticsResponse(this.analyticsSummary)
      if (Object.keys(localSummary).length > 0) {
        return localSummary
      }
      return unwrapAnalyticsResponse(this.store.analyticsSummary)
    }
  },

  beforeUnmount() {
    this.clearAnalyticsLoadTimer(true)
    this.cancelAnalyticsRequest(true)
  },

  methods: {
    buildAnalyticsParams() {
      return buildAnalyticsParams({
        fromDate: this.fromDate,
        toDate: this.toDate,
        groupBy: this.groupBy,
        filters: this.analyticsFilterQuery
      })
    },

    clearAnalyticsLoadTimer(resetLoading = false) {
      if (this.analyticsLoadTimer) {
        clearTimeout(this.analyticsLoadTimer)
        this.analyticsLoadTimer = null
      }
      if (resetLoading && !this.analyticsAbortController) {
        this.loading = false
      }
    },

    cancelAnalyticsRequest(notifyBackend = false) {
      const hasActiveRequest = Boolean(this.analyticsAbortController)
      if (notifyBackend && hasActiveRequest) {
        this.cancelAnalyticsOnBackend()
      }
      if (this.analyticsAbortController) {
        this.analyticsAbortController.abort()
        this.analyticsAbortController = null
      }
    },

    cancelAnalyticsOnBackend() {
      if (typeof fetch === 'function') {
        fetch('/api/v1/analytics/summary/cancel', {
          method: 'POST',
          keepalive: true,
          credentials: 'include',
          headers: {
            'X-XSRF-TOKEN': getCsrfToken()
          }
        }).catch(() => {})
        return
      }
      api.post('/api/v1/analytics/summary/cancel').catch(() => {})
    },

    isAnalyticsRequestCanceled(error) {
      return error &&
        (
          error.code === 'ERR_CANCELED' ||
          error.name === 'CanceledError' ||
          error.message === 'canceled' ||
          error.__CANCEL__ === true
        )
    },

    scheduleAnalyticsLoad(delay = 350) {
      this.clearAnalyticsLoadTimer()
      this.cancelAnalyticsRequest(true)
      this.saveAnalyticsSettingsToLocalStorage()
      const requestId = ++this.analyticsRequestSeq
      this.loading = true
      this.analyticsLoadTimer = setTimeout(() => {
        this.analyticsLoadTimer = null
        this.loadAnalytics(requestId)
      }, delay)
    },

    loadAnalytics(requestId = null) {
      this.clearAnalyticsLoadTimer()
      this.cancelAnalyticsRequest(true)
      const currentRequestId = requestId || ++this.analyticsRequestSeq
      if (!this.fromDate || !this.toDate) {
        if (currentRequestId === this.analyticsRequestSeq) {
          this.loading = false
        }
        return
      }
      this.saveAnalyticsSettingsToLocalStorage()
      const requestConfig = {
        params: this.buildAnalyticsParams()
      }
      let controller = null
      if (typeof AbortController !== 'undefined') {
        controller = new AbortController()
        this.analyticsAbortController = controller
        requestConfig.signal = controller.signal
      }
      this.loading = true
      api.get('/api/v1/analytics/summary', requestConfig)
        .then(({data}) => {
          if (currentRequestId !== this.analyticsRequestSeq) {
            return
          }
          this.analyticsSummary = data || {}
          if (data?.access && typeof data.access === 'object') {
            this.store.analyticsAccess = {
              ...this.store.analyticsAccess,
              ...data.access
            }
          }
          this.applyAnalyticsAccessUi()
        })
        .catch(error => {
          if (currentRequestId !== this.analyticsRequestSeq || this.isAnalyticsRequestCanceled(error)) {
            return
          }
          console.error(error)
          this.analyticsSummary = {}
          this.$q.notify({
            type: 'negative',
            message: 'Не удалось загрузить аналитику'
          })
        })
        .finally(() => {
          if (this.analyticsAbortController === controller) {
            this.analyticsAbortController = null
          }
          if (currentRequestId === this.analyticsRequestSeq) {
            this.loading = false
          }
        })
    }
  }
}
