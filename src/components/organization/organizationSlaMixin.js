import { slaZone } from 'src/util/slaZones'
import { isTaskClosed } from 'src/util/organizationHelpers'
import {
  formatDurationMs,
  getSlaLeftMsFromInfo,
  getSlaSpanMsFromDeadline,
  hasTaskSlaSource,
  isSlaInfoActive,
  isSlaInfoOverdue,
  parseIsoDurationToMs
} from 'src/util/organizations/organizationSla'

// SLA страницы организаций: загруженные SLA-инфо по заявкам, таймер nowTs, расчёты остатка/просрочки.
// Чистые расчёты — src/util/organizations/organizationSla.js.
// Требует в компоненте: this.store, this.slaScope (setup), this.tasksSource, this.getOrganizationTasks
// (organizationDataMixin).
export default {
  data: () => ({
    slaInfoByTaskId: {},
    slaInfoLoadingByTaskId: {},
    slaInfoLoadFailedByTaskId: {},
    nowTs: Date.now(),
    slaTimer: null
  }),

  computed: {
    openTaskSlaPreloadKey () {
      return this.tasksSource
        .filter(task => task?.id && !isTaskClosed(task) && hasTaskSlaSource(task))
        .map(task => String(task.id))
        .sort((left, right) => Number(left) - Number(right))
        .join(',')
    }
  },

  watch: {
    openTaskSlaPreloadKey: {
      immediate: true,
      handler () {
        this.preloadSlaInfosForAllOpenTasks()
      }
    }
  },

  methods: {
    startSlaTimer () {
      this.slaTimer = setInterval(() => {
        this.nowTs = Date.now()
      }, 1000)
    },

    stopSlaTimer () {
      clearInterval(this.slaTimer)
    },

    getOrganizationMinimalSla (organization) {
      const openTasks = this.getOrganizationTasks(organization).filter(item => !isTaskClosed(item))

      if (this.hasLoadingSlaInfoForTasks(openTasks)) {
        return {
          task: null,
          label: 'Проверка SLA...',
          percent: null,
          color: 'grey',
          overdue: false,
          leftMs: null
        }
      }

      const task = this.getMinimalSlaTask(openTasks)
      if (!task) {
        return {
          task: null,
          label: 'Нет активного SLA',
          percent: null,
          color: 'grey',
          overdue: false,
          leftMs: null
        }
      }

      const leftMs = this.getSlaLeftMs(task)
      const totalMs = this.getSlaTotalMs(task)
      const percent = totalMs > 0 && leftMs !== null ? Math.max(0, Math.min(1, leftMs / totalMs)) : null
      const overdue = leftMs !== null && leftMs <= 0

      return {
        task,
        label: leftMs === null ? 'SLA задан' : overdue ? 'Просрочено' : formatDurationMs(leftMs),
        percent,
        color: overdue ? 'negative' : ({ red: 'negative', orange: 'orange', green: 'positive' }[slaZone(percent, this.store.slaZones)] || 'positive'),
        overdue,
        leftMs
      }
    },

    getMinimalSlaTask (tasks) {
      const withSla = (tasks || []).filter(task => this.hasTaskSla(task) && !this.isTaskSlaInfoLoading(task))
      if (withSla.length === 0) {
        return null
      }
      return withSla.reduce((best, task) => {
        const bestLeft = this.getSlaLeftMs(best)
        const taskLeft = this.getSlaLeftMs(task)
        return taskLeft !== null && (bestLeft === null || taskLeft < bestLeft) ? task : best
      }, withSla[0])
    },

    hasTaskSla (task) {
      if (!task) {
        return false
      }

      const loadedInfo = this.getLoadedSlaInfo(task)
      if (loadedInfo) {
        return isSlaInfoActive(loadedInfo)
      }

      return hasTaskSlaSource(task)
    },

    getLoadedSlaInfo (task) {
      if (!task?.id) {
        return null
      }
      return this.slaInfoByTaskId[task.id] || null
    },

    getSlaInfo (task) {
      return this.getLoadedSlaInfo(task) || task?.slaInfo || task?.slaStatus || null
    },

    isTaskSlaInfoLoading (task) {
      return Boolean(task?.id && hasTaskSlaSource(task) && this.slaInfoLoadingByTaskId[task.id])
    },

    hasLoadingSlaInfoForTasks (tasks) {
      return (tasks || []).some(task => this.isTaskSlaInfoLoading(task))
    },

    async preloadSlaInfosForAllOpenTasks () {
      await this.preloadSlaInfosForTasks(this.tasksSource.filter(task => !isTaskClosed(task)))
    },

    async preloadSlaInfosForOrganization (organization) {
      await this.preloadSlaInfosForTasks(this.getOrganizationTasks(organization).filter(task => !isTaskClosed(task)))
    },

    async preloadSlaInfosForTasks (tasks) {
      const taskIds = (tasks || [])
        .filter(task => task?.id && hasTaskSlaSource(task))
        .map(task => task.id)
      const uniqIds = [...new Set(taskIds)]
      await Promise.all(uniqIds.map(id => this.loadSlaInfoForTaskId(id)))
    },

    async loadSlaInfoForTaskId (taskId) {
      if (!taskId || this.slaInfoByTaskId[taskId] || this.slaInfoLoadingByTaskId[taskId]) {
        return
      }

      this.slaInfoLoadingByTaskId = {
        ...this.slaInfoLoadingByTaskId,
        [taskId]: true
      }

      try {
        const info = await this.slaScope.load(taskId)
        this.slaInfoByTaskId = {
          ...this.slaInfoByTaskId,
          [taskId]: info || {}
        }

        const failed = { ...this.slaInfoLoadFailedByTaskId }
        delete failed[taskId]
        this.slaInfoLoadFailedByTaskId = failed
      } catch (e) {
        this.slaInfoLoadFailedByTaskId = {
          ...this.slaInfoLoadFailedByTaskId,
          [taskId]: true
        }
      } finally {
        const loading = { ...this.slaInfoLoadingByTaskId }
        delete loading[taskId]
        this.slaInfoLoadingByTaskId = loading
      }
    },

    getSlaLeftMs (task) {
      if (!task) {
        return null
      }

      const loadedInfo = this.getLoadedSlaInfo(task)
      if (loadedInfo) {
        return getSlaLeftMsFromInfo(loadedInfo, this.nowTs)
      }

      const info = task.slaInfo || task.slaStatus
      if (info) {
        const leftMsFromInfo = getSlaLeftMsFromInfo(info, this.nowTs)
        if (leftMsFromInfo !== null) {
          return leftMsFromInfo
        }
      }

      if (task.id && hasTaskSlaSource(task) && this.slaInfoLoadFailedByTaskId[task.id] !== true) {
        return null
      }

      const startDate = task.sla?.startDate || task.slaStartDate || task.createdAt
      const duration = task.sla?.duration || task.slaDuration
      if (!startDate || !duration) {
        return null
      }

      const startMs = new Date(startDate).getTime()
      const durationMs = parseIsoDurationToMs(duration)
      if (!Number.isFinite(startMs) || durationMs <= 0) {
        return null
      }

      return Math.max(0, startMs + durationMs - this.nowTs)
    },

    getSlaTotalMs (task) {
      const loadedInfo = this.getLoadedSlaInfo(task)
      if (loadedInfo) {
        return getSlaSpanMsFromDeadline(loadedInfo, task)
      }

      const duration = task?.sla?.duration || task?.slaDuration
      const durationMs = parseIsoDurationToMs(duration)
      if (durationMs > 0) {
        return durationMs
      }

      return getSlaSpanMsFromDeadline(this.getSlaInfo(task), task)
    },

    isTaskSlaOverdue (task) {
      if (!task || this.isTaskSlaInfoLoading(task)) {
        return false
      }

      const loadedInfo = this.getLoadedSlaInfo(task)
      if (loadedInfo) {
        return isSlaInfoOverdue(loadedInfo, this.nowTs)
      }

      if (task.id && hasTaskSlaSource(task) && this.slaInfoLoadFailedByTaskId[task.id] !== true) {
        return false
      }

      const leftMs = this.getSlaLeftMs(task)
      if (leftMs !== null && leftMs <= 0) {
        return true
      }
      return task?.slaExpired === true || task?.slaOverdue === true || task?.slaViolated === true
    },

    getTaskSlaLabel (task) {
      if (this.isTaskSlaInfoLoading(task)) {
        return 'Проверка SLA...'
      }
      if (!this.hasTaskSla(task)) {
        return '—'
      }
      const leftMs = this.getSlaLeftMs(task)
      if (leftMs === null) {
        return 'SLA задан'
      }
      if (leftMs <= 0) {
        return 'Просрочено'
      }
      return formatDurationMs(leftMs)
    }
  }
}
