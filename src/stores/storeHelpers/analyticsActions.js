import axios from 'axios'

export const analyticsActions = {
  fetchAnalyticsSummary(params = {}) {
    const query = new URLSearchParams()

    const setParam = (name, value) => {
      if (value === undefined || value === null || value === '') {
        return
      }

      query.set(name, value)
    }

    const normalizeIds = value => {
      if (!Array.isArray(value)) {
        return []
      }

      return value
        .map(item => {
          if (item === null || item === undefined) {
            return null
          }

          if (typeof item === 'object') {
            return item.id ?? item.value ?? null
          }

          return item
        })
        .filter(item => item !== null && item !== undefined && item !== '')
    }

    const setIdListParam = (name, value) => {
      const ids = normalizeIds(value)

      if (!ids.length) {
        return
      }

      query.set(name, ids.join(','))
    }

    setParam('from', params.from)
    setParam('to', params.to)
    setParam('groupBy', params.groupBy)

    setIdListParam('typeIds', params.typeIds)
    setIdListParam('priorityIds', params.priorityIds)
    setIdListParam('executorIds', params.executorIds)
    setIdListParam('tagIds', params.tagIds)
    setIdListParam('supportLineIds', params.supportLineIds)

    const queryString = query.toString()
    const url = queryString
      ? `/api/v1/analytics/summary?${queryString}`
      : '/api/v1/analytics/summary'

    return axios.get(url)
      .then(response => {
        this.analyticsSummary = {
          from: response.data?.from ?? null,
          to: response.data?.to ?? null,
          groupBy: response.data?.groupBy ?? 'DAY',

          newAppeals: response.data?.newAppeals ?? 0,
          openTasks: response.data?.openTasks ?? 0,
          overdueSla: response.data?.overdueSla ?? 0,
          overdueOla: response.data?.overdueOla ?? 0,
          olaWarnings: response.data?.olaWarnings ?? 0,
          overdueDeadlines: response.data?.overdueDeadlines ?? 0,
          deadlineWarnings: response.data?.deadlineWarnings ?? 0,
          unansweredMessages: response.data?.unansweredMessages ?? 0,
          avgFirstResponseSeconds: response.data?.avgFirstResponseSeconds ?? 0,
          firstResponseCount: response.data?.firstResponseCount ?? response.data?.answeredAppealsCount ?? 0,
          avgCloseTimeSeconds: response.data?.avgCloseTimeSeconds ?? 0,
          avgLineTimeSeconds: response.data?.avgLineTimeSeconds ?? 0,
          unassignedTasks: response.data?.unassignedTasks ?? 0,
          closedTasks: response.data?.closedTasks ?? 0,
          reopenedTasks: response.data?.reopenedTasks ?? 0,

          closedByPeriod: Array.isArray(response.data?.closedByPeriod) ? response.data.closedByPeriod : [],
          reopenedByPeriod: Array.isArray(response.data?.reopenedByPeriod) ? response.data.reopenedByPeriod : [],
          hourlyLoad: Array.isArray(response.data?.hourlyLoad) ? response.data.hourlyLoad : [],
          operatorLoad: Array.isArray(response.data?.operatorLoad) ? response.data.operatorLoad : [],
          lineLoad: Array.isArray(response.data?.lineLoad) ? response.data.lineLoad : [],
          lineTransitions: Array.isArray(response.data?.lineTransitions) ? response.data.lineTransitions : [],

          taskTypeBreakdown: Array.isArray(response.data?.taskTypeBreakdown) ? response.data.taskTypeBreakdown : [],
          priorityBreakdown: Array.isArray(response.data?.priorityBreakdown) ? response.data.priorityBreakdown : [],
          executorBreakdown: Array.isArray(response.data?.executorBreakdown) ? response.data.executorBreakdown : [],
          tagBreakdown: Array.isArray(response.data?.tagBreakdown) ? response.data.tagBreakdown : [],
          supportLineBreakdown: Array.isArray(response.data?.supportLineBreakdown) ? response.data.supportLineBreakdown : [],

          byTypes: Array.isArray(response.data?.byTypes) ? response.data.byTypes : [],
          byPriorities: Array.isArray(response.data?.byPriorities) ? response.data.byPriorities : [],
          byExecutors: Array.isArray(response.data?.byExecutors) ? response.data.byExecutors : [],
          byTags: Array.isArray(response.data?.byTags) ? response.data.byTags : []
        }

        return this.analyticsSummary
      })
  }
}
