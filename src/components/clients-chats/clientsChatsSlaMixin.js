import { isSlaAlertZone, slaZone } from 'src/util/slaZones'
import {
  getSlaEndDate,
  getSlaLeftMsApprox,
  getSlaTotalMs,
  getTaskSlaTags,
  isTaskSlaExpiredByFlags,
  parseIsoDurationToMs,
  toSlaDuration
} from 'src/util/clientsChats/clientSla'

// SLA в строке клиента: данные /sla/info по заявкам, минимальный SLA клиента, цвет/процент/просрочка.
// Требует в компоненте: this.store, this.slaScope (setup), this.isOnboardingDemoClient (onboarding-миксин).
export default {
  data: () => ({
    nowTs: Date.now(),
    slaTimer: null,
    // taskId -> SlaInfoDto
    slaInfoByTaskId: {},
    // taskId -> boolean (чтобы не спамить запросами)
    slaInfoLoading: {}
  }),

  methods: {
    getActualTasks (client) {
      if (this.isOnboardingDemoClient(client)) {
        return (client.tasks || []).filter(task => !task.completed)
      }
      return []
    },

    getClientSlaPreviewTask (client) {
      if (this.isOnboardingDemoClient(client)) {
        return this.getMinimalSlaTask(this.getActualTasks(client))
      }
      if (!client?.minimalSlaTaskId || !client?.minimalSlaStartDate || !client?.minimalSlaDurationSeconds) {
        return null
      }
      return {
        id: client.minimalSlaTaskId,
        completed: false,
        frozen: false,
        sla: {
          startDate: client.minimalSlaStartDate,
          duration: Number(client.minimalSlaDurationSeconds)
        },
        slaInfo: {
          paused: client.minimalSlaPaused === true,
          deadline: client.minimalSlaDeadline
        }
      }
    },

    getSlaLeftMs (task) {
      return this.getSlaLeftMsApprox(task)
    },

    getSlaTotalMs (task) {
      return getSlaTotalMs(task, this.getTaskSlaInfo(task))
    },

    getTaskSlaInfo (task) {
      if (!task) {
        return null
      }
      return this.getSlaInfo(task) || task.slaInfo || task.slaInfoDto || task.slaStatus || null
    },

    getTaskSlaTags (task) {
      return getTaskSlaTags(task)
    },

    isTaskSlaExpiredByFlags (task) {
      return isTaskSlaExpiredByFlags(task)
    },

    hasTaskSla (task) {
      if (!task || task.completed || task.frozen) {
        return false
      }
      const totalMs = this.getSlaTotalMs(task)
      if (!Number.isFinite(totalMs) || totalMs <= 0) {
        return false
      }
      const info = this.getTaskSlaInfo(task)
      const startDate = task?.sla?.startDate || task?.slaStartDate
      return !!(
        startDate ||
        info?.deadline ||
        Number.isFinite(Number(info?.remainingSeconds)) ||
        this.isTaskSlaExpiredByFlags(task)
      )
    },

    parseIsoDurationToMs (duration) {
      return parseIsoDurationToMs(duration)
    },

    isSlaExpired (tasks) {
      const task = this.getMinimalSlaTask(tasks)
      if (!task) return false
      const leftMs = this.getSlaLeftMsApprox(task)
      return leftMs !== null && leftMs <= 0
    },

    getMinimalSlaTask (tasks) {
      const withSla = (tasks || []).filter(task => this.hasTaskSla(task))
      if (withSla.length === 0) {
        return null
      }
      // Берём самую срочную заявку — с минимальным оставшимся временем.
      // Важно учитывать данные /sla/info по каждой заявке, иначе просроченная
      // заявка может потеряться, а в строке клиента будет показан зелёный SLA
      // от другой заявки.
      return withSla.reduce((best, task) => {
        const bestLeft = this.getSlaLeftMsApprox(best)
        const taskLeft = this.getSlaLeftMsApprox(task)
        return taskLeft !== null && (bestLeft === null || taskLeft < bestLeft) ? task : best
      }, withSla[0])
    },

    getSlaPercent (tasks) {
      const task = this.getMinimalSlaTask(tasks)
      if (!task) {
        return null
      }
      const totalMs = this.getSlaTotalMs(task)
      const leftMs = this.getSlaLeftMsApprox(task)
      if (!Number.isFinite(totalMs) || totalMs <= 0 || leftMs === null) {
        return null
      }
      return Math.max(0, Math.min(1, leftMs / totalMs))
    },

    getSlaColor (tasks) {
      const p = this.getSlaPercent(tasks)
      if (p === null) return 'grey'
      // Границы зон — общая настройка (Настройки → Общие → Зоны SLA)
      return slaZone(p, this.store.slaZones) || 'red'
    },

    getSlaInfo (task) {
      if (!task?.id) return null
      return this.slaInfoByTaskId[task.id] || null
    },

    async loadSlaInfoForTaskId (taskId) {
      if (!taskId) return
      if (this.slaInfoByTaskId[taskId]) return
      if (this.slaInfoLoading[taskId]) return

      this.slaInfoLoading[taskId] = true
      try {
        this.slaInfoByTaskId[taskId] = await this.slaScope.load(taskId)
      } catch (e) {
        // игнор
      } finally {
        this.slaInfoLoading[taskId] = false
      }
    },

    async preloadSlaInfosForClients (clients) {
      const ids = []
      ;(clients || []).forEach(client => {
        if (this.isOnboardingDemoClient(client)) {
          this.getActualTasks(client).forEach(task => {
            if (task?.id && !task.completed && !task.frozen) {
              ids.push(task.id)
            }
          })
        }
      })
      const uniqIds = [...new Set(ids)]
      await Promise.all(uniqIds.map(id => this.loadSlaInfoForTaskId(id)))
    },

    getSlaLeftMsApprox (task) {
      if (!task) {
        return null
      }
      return getSlaLeftMsApprox(task, this.getTaskSlaInfo(task), this.nowTs)
    },

    getSlaDuration (duration) {
      return toSlaDuration(duration)
    },

    getSlaEndDate (task) {
      return getSlaEndDate(task)
    },

    getClientMinimalSlaLeftMs (client) {
      const task = this.getClientSlaPreviewTask(client)
      if (!task) {
        return null
      }
      return this.getSlaLeftMsApprox(task)
    },

    getClientSlaPercent (client) {
      const task = this.getClientSlaPreviewTask(client)
      return task ? this.getSlaPercent([task]) : null
    },

    hasClientSla (client) {
      return this.getClientSlaPreviewTask(client) !== null
    },

    isClientSlaExpired (client) {
      const task = this.getClientSlaPreviewTask(client)
      return task ? this.isSlaExpired([task]) : false
    },

    getClientSlaColor (client) {
      const task = this.getClientSlaPreviewTask(client)
      return task ? this.getSlaColor([task]) : 'grey'
    },

    isSlaVisible (client) {
      const task = this.getClientSlaPreviewTask(client)
      if (!task || task.completed) {
        return false
      }
      const totalMs = this.getSlaTotalMs(task)
      if (!Number.isFinite(totalMs) || totalMs <= 0) {
        return false
      }
      const leftMs = this.getSlaLeftMsApprox(task)
      // Показываем, только когда SLA вошёл в оранжевую зону (или он уже просрочен)
      return leftMs !== null && isSlaAlertZone(Math.max(0, leftMs / totalMs), this.store.slaZones)
    }
  }
}
