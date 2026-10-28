import {
  formatDuration,
  formatNumber,
  formatPeriodDate,
  getProgressValue,
  getSummaryNumber,
  getSummaryRows,
  unwrapAnalyticsResponse
} from 'src/util/analytics/analyticsFormat'

// Общие для страницы аналитики и её вкладок вычисляемые поля и форматтеры (тонкая обёртка над util/analytics/analyticsFormat).
// Требует, чтобы в компоненте был доступен this.summary (computed на странице, prop во вкладках).
export default {
  computed: {
    newAppeals() {
      return this.getSummaryNumber(['newAppeals', 'newMessages', 'incomingAppeals'])
    },

    openTasks() {
      return this.getSummaryNumber(['openTasks', 'openedTasks', 'activeTasks'])
    },

    closedTasks() {
      return this.getSummaryNumber(['closedTasks', 'closedTaskCount', 'resolvedTasks'])
    },

    overdueSla() {
      return this.getSummaryNumber(['overdueSla', 'overdueSlaTasks', 'slaOverdueTasks'])
    },

    overdueOla() {
      return this.getSummaryNumber(['overdueOla', 'overdueOlaTasks', 'olaBreachedTasks'])
    },

    olaWarnings() {
      return this.getSummaryNumber(['olaWarnings', 'olaWarningTasks', 'olaAtRiskTasks'])
    },

    overdueDeadlines() {
      return this.getSummaryNumber(['overdueDeadlines', 'overdueDeadlineTasks', 'deadlineOverdueTasks'])
    },

    deadlineWarnings() {
      return this.getSummaryNumber(['deadlineWarnings', 'deadlineWarningTasks', 'deadlineAlmostOverdueTasks'])
    },

    unassignedTasks() {
      return this.getSummaryNumber(['unassignedTasks', 'tasksWithoutAssignee'])
    },

    unansweredMessages() {
      return this.getSummaryNumber(['unansweredMessages', 'messagesAwaitingResponse', 'needAnswerMessages'])
    },

    reopenedTasks() {
      return this.getSummaryNumber(['reopenedTasks', 'reopenedTaskCount', 'returnedToWorkTasks'])
    },

    avgFirstResponseSeconds() {
      return this.getSummaryNumber(['avgFirstResponseSeconds', 'averageFirstResponseSeconds'])
    },

    firstResponseCount() {
      return this.getSummaryNumber(['firstResponseCount', 'answeredAppealsCount'])
    },

    avgCloseTimeSeconds() {
      return this.getSummaryNumber(['avgCloseTimeSeconds', 'averageCloseTimeSeconds'])
    },

    avgLineTimeSeconds() {
      return this.getSummaryNumber(['avgLineTimeSeconds', 'averageLineTimeSeconds'])
    }
  },

  methods: {
    unwrapAnalyticsResponse(value) {
      return unwrapAnalyticsResponse(value)
    },

    getSummaryNumber(keys) {
      return getSummaryNumber(this.summary, keys)
    },

    getSummaryRows(keys) {
      return getSummaryRows(this.summary, keys)
    },

    formatNumber(value) {
      return formatNumber(value)
    },

    formatDuration(seconds) {
      return formatDuration(seconds)
    },

    formatPeriodDate(value) {
      return formatPeriodDate(value)
    },

    getProgressValue(value, max) {
      return getProgressValue(value, max)
    }
  }
}
