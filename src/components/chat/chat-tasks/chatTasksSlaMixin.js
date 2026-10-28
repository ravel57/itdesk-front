import { getSlaDuration, normalizeSlaSeconds, parseIsoDurationToMs } from 'src/util/chatTasks/slaTime'
import moment from 'moment'

// SLA заявок списка: загрузка информации по заявке, оставшееся время, текст, сравнение для сортировки.
// Требует в компоненте: this.slaScope (useSlaInfo), pagedTasks, isDemoClient, ascendingSort.
// Таймер nowTs запускается/останавливается в mounted/beforeUnmount компонента.
export default {
  data: () => ({
    slaIsPause: false,

    slaInfoByTaskId: {},
    slaInfoLoadingByTaskId: {},
    nowTs: Date.now(),
    slaTimer: null,
  }),

  methods: {
    getSlaDuration (duration) {
      return getSlaDuration(duration)
    },

    getSlaEndDate (task) {
      if (!task?.sla?.startDate || !task?.sla?.duration) {
        return null
      }
      return moment(task.sla.startDate).add(this.getSlaDuration(task.sla.duration))
    },

    async loadSlaInfoForTask (task, force = false) {
      if (!task?.id) return
      if (!task?.sla || task?.completed || task?.frozen) {
        const slaInfoByTaskId = { ...this.slaInfoByTaskId }
        delete slaInfoByTaskId[task.id]
        this.slaInfoByTaskId = slaInfoByTaskId
        return
      }
      if (!force && this.slaInfoByTaskId[task.id]) return
      if (this.slaInfoLoadingByTaskId[task.id]) return
      this.slaInfoLoadingByTaskId = {
        ...this.slaInfoLoadingByTaskId,
        [task.id]: true
      }
      try {
        const info = await this.slaScope.load(task.id, { force })
        this.slaInfoByTaskId = {
          ...this.slaInfoByTaskId,
          [task.id]: info
        }
      } catch (e) {
        console.warn('SLA info load failed', task.id, e)
      } finally {
        this.slaInfoLoadingByTaskId = {
          ...this.slaInfoLoadingByTaskId,
          [task.id]: false
        }
      }
    },

    loadSlaInfosForTasks () {
      if (this.isDemoClient) {
        return
      }
      this.pagedTasks
        .filter(task => task?.sla)
        .forEach(task => this.loadSlaInfoForTask(task))
    },

    getSlaInfo (task) {
      return this.slaInfoByTaskId[task.id] || null
    },

    normalizeSlaSeconds (value) {
      return normalizeSlaSeconds(value)
    },

    isTaskSlaSortable (task) {
      return !!task?.sla && !task.completed && !task.frozen
    },

    getSlaLeftSeconds (task) {
      if (!this.isTaskSlaSortable(task)) {
        return null
      }

      const info = this.getSlaInfo(task)

      if (info) {
        const remainingSeconds = this.normalizeSlaSeconds(info.remainingSeconds)

        if (info.paused) {
          return remainingSeconds
        }

        if (remainingSeconds !== null && !info.deadline) {
          return Math.max(0, remainingSeconds)
        }

        if (info.deadline) {
          const deadlineMs = new Date(info.deadline).getTime()
          if (Number.isFinite(deadlineMs)) {
            return Math.max(0, Math.floor((deadlineMs - this.nowTs) / 1000))
          }
        }

        return remainingSeconds === null ? null : Math.max(0, remainingSeconds)
      }

      if (!task?.sla?.startDate || !task?.sla?.duration) {
        return null
      }

      const startMs = new Date(task.sla.startDate).getTime()
      const durationMs = this.parseIsoDurationToMs(task.sla.duration)

      if (!Number.isFinite(startMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
        return null
      }

      const deadlineMs = startMs + durationMs

      return Math.max(0, Math.floor((deadlineMs - this.nowTs) / 1000))
    },

    parseIsoDurationToMs (duration) {
      return parseIsoDurationToMs(duration)
    },

    getSlaText (task) {
      if (!task?.sla) {
        return ''
      }
      const secondsLeft = this.getSlaLeftSeconds(task)
      if (secondsLeft === null) {
        return ''
      }
      if (secondsLeft <= 0) {
        return 'SLA просрочен'
      }
      const hours = Math.floor(secondsLeft / 3600)
      const minutes = Math.floor((secondsLeft % 3600) / 60)
      return `SLA: ${hours} ч ${minutes} мин`
    },

    isSlaExpired (task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      return secondsLeft !== null && secondsLeft <= 0
    },

    getSlaDeadlineMs (task) {
      const info = this.getSlaInfo(task)
      if (info?.deadline) {
        const deadlineMs = new Date(info.deadline).getTime()
        return Number.isFinite(deadlineMs) ? deadlineMs : Number.MAX_SAFE_INTEGER
      }
      if (!task?.sla?.startDate || !task?.sla?.duration) {
        return Number.MAX_SAFE_INTEGER
      }

      const startMs = new Date(task.sla.startDate).getTime()
      const durationMs = this.parseIsoDurationToMs(task.sla.duration)

      if (!Number.isFinite(startMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
        return Number.MAX_SAFE_INTEGER
      }

      return startMs + durationMs
    },

    getSlaSortValue (task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      return secondsLeft === null ? Number.POSITIVE_INFINITY : secondsLeft
    },

    compareTasksBySla (a, b) {
      const aValue = this.getSlaSortValue(a)
      const bValue = this.getSlaSortValue(b)
      const aEmpty = !Number.isFinite(aValue)
      const bEmpty = !Number.isFinite(bValue)

      if (aEmpty && bEmpty) {
        return 0
      }

      if (aEmpty) {
        return 1
      }

      if (bEmpty) {
        return -1
      }

      return this.ascendingSort ? aValue - bValue : bValue - aValue
    },
  }
}
