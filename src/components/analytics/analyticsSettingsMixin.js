import {
  normalizeStoredAnalyticsSettings,
  readAnalyticsSettings,
  saveAnalyticsSettings
} from 'src/util/analytics/analyticsSettings'

// Сохранение/восстановление настроек страницы в localStorage и применение прав доступа к UI.
// Требует в компоненте: состояние (periodPreset, fromDate, toDate, groupBy, breakdownBy,
// analyticsFilters, activeTab), this.store, applyPreset(), computed из analyticsAccessMixin.
export default {
  methods: {
    saveAnalyticsSettingsToLocalStorage() {
      saveAnalyticsSettings({
        periodPreset: this.periodPreset,
        fromDate: this.fromDate,
        toDate: this.toDate,
        groupBy: this.groupBy,
        breakdownBy: this.breakdownBy,
        analyticsFilters: this.analyticsFilters
      })
    },

    restoreAnalyticsSettingsFromLocalStorage() {
      const settings = readAnalyticsSettings()
      if (!settings) {
        return false
      }
      const normalized = normalizeStoredAnalyticsSettings(settings)
      this.periodPreset = normalized.periodPreset
      this.groupBy = normalized.groupBy
      this.breakdownBy = normalized.breakdownBy
      this.analyticsFilters = normalized.analyticsFilters
      if (this.periodPreset === 'custom') {
        this.fromDate = settings.fromDate || ''
        this.toDate = settings.toDate || ''

        if (!this.fromDate || !this.toDate) {
          this.periodPreset = '7'
          this.applyPreset(false)
        }

        return true
      }
      this.applyPreset(false)
      return true
    },

    loadAnalyticsDictionaries() {
      if (typeof this.store.fetchAnalyticsDictionaries !== 'function') {
        return
      }
      this.store.fetchAnalyticsDictionaries()
        .then(() => this.applyAnalyticsAccessUi())
        .catch(error => console.error(error))
    },

    applyAnalyticsAccessUi() {
      if (!this.canFilterExecutors) {
        this.analyticsFilters.executorIds = []
      }
      if (!this.canFilterSupportLines) {
        this.analyticsFilters.supportLineIds = []
      }
      if (!this.availableBreakdownByOptions.some(option => option.value === this.breakdownBy)) {
        this.breakdownBy = 'type'
      }
      if ((!this.canViewOperators && this.activeTab === 'operators') ||
        (!this.canViewSupportLines && this.activeTab === 'lines')) {
        this.activeTab = 'overview'
      }
      this.saveAnalyticsSettingsToLocalStorage()
    }
  }
}
