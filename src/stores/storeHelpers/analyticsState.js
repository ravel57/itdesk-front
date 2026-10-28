export function createAnalyticsState() {
  return {
    analyticsAccess: {
      role: null,
      scope: 'NONE',
      organizationIds: [],
      canViewInternalData: false,
      canViewOperators: false,
      canViewSupportLines: false,
      canFilterExecutors: false,
      canFilterSupportLines: false
    },
    analyticsSummary: {
      from: null,
      to: null,
      groupBy: 'DAY',

      newAppeals: 0,
      openTasks: 0,
      overdueSla: 0,
      overdueOla: 0,
      olaWarnings: 0,
      overdueDeadlines: 0,
      deadlineWarnings: 0,
      unansweredMessages: 0,
      avgFirstResponseSeconds: 0,
      firstResponseCount: 0,
      avgCloseTimeSeconds: 0,
      avgLineTimeSeconds: 0,
      unassignedTasks: 0,
      closedTasks: 0,
      reopenedTasks: 0,
      closedByPeriod: [],
      reopenedByPeriod: [],
      hourlyLoad: [],
      operatorLoad: [],
      lineLoad: [],
      lineTransitions: [],

      taskTypeBreakdown: [],
      priorityBreakdown: [],
      executorBreakdown: [],
      tagBreakdown: [],
      serviceBreakdown: [],
      supportLineBreakdown: [],

      byTypes: [],
      byPriorities: [],
      byExecutors: [],
      byTags: []
    }
  }
}
