import {
  BREAKDOWN_BY_OPTIONS,
  filterBreakdownOptions,
  getAnalyticsScopeLabel,
  resolveAnalyticsAccess
} from 'src/util/analytics/analyticsAccess'

// Права доступа страницы аналитики (canView*/canFilter*) и зависящие от них списки.
// Требует в компоненте: this.summary (computed), this.store.
export default {
  data: () => ({
    breakdownByOptions: BREAKDOWN_BY_OPTIONS
  }),

  computed: {
    analyticsAccess() {
      return resolveAnalyticsAccess(this.summary, this.store.analyticsAccess, this.store.currentUser)
    },

    canViewInternalAnalytics() {
      return this.analyticsAccess.canViewInternalData === true
    },

    canViewOperators() {
      return this.analyticsAccess.canViewOperators === true
    },

    canViewSupportLines() {
      return this.analyticsAccess.canViewSupportLines === true
    },

    canFilterExecutors() {
      return this.analyticsAccess.canFilterExecutors === true
    },

    canFilterSupportLines() {
      return this.analyticsAccess.canFilterSupportLines === true
    },

    analyticsScopeLabel() {
      return getAnalyticsScopeLabel(this.analyticsAccess.role)
    },

    availableBreakdownByOptions() {
      return filterBreakdownOptions(this.breakdownByOptions, {
        canViewOperators: this.canViewOperators,
        canViewSupportLines: this.canViewSupportLines
      })
    }
  }
}
