import {
  formatSlaTime,
  getSlaDeadlineMs,
  getSlaLeftSeconds,
  getSlaPercent,
  getSlaWorkdaySeconds,
  getTaskSla,
  isSlaVisibleInTable
} from 'src/util/tasks/taskSla'

// SLA на странице заявок: загрузка slaInfo по заявкам, тикающее «сейчас» (nowTs) и расчёт остатка/процента.
// Сами формулы — чистые функции в src/util/tasks/taskSla.js.
// Требует на странице: this.slaScope (setup: useSlaInfo()).
export default {
  data: () => ({
    slaInfoByTaskId: {},
    slaInfoLoadingByTaskId: {},
    nowTs: Date.now(),
    slaTimer: null,
  }),

  methods: {
    // Таймер обновления nowTs раз в секунду (вызывать из mounted / beforeUnmount страницы)
    startSlaTimer() {
      this.slaTimer = setInterval(() => {
        this.nowTs = Date.now()
      }, 1000)
    },

    stopSlaTimer() {
      clearInterval(this.slaTimer)
    },

    getSlaInfo(task) {
      if (!task?.id) {
        return null
      }
      if (Object.prototype.hasOwnProperty.call(this.slaInfoByTaskId, task.id)) {
        return this.slaInfoByTaskId[task.id]
      }
      return task?.slaInfo || null
    },

    async loadSlaInfoForTask(task) {
      const sourceSla = getTaskSla(task)
      if (
        !task?.id ||
        !sourceSla ||
        task.completed ||
        task.frozen ||
        this.slaInfoLoadingByTaskId[task.id] ||
        Object.prototype.hasOwnProperty.call(this.slaInfoByTaskId, task.id)
      ) {
        return
      }
      this.slaInfoLoadingByTaskId = {
        ...this.slaInfoLoadingByTaskId,
        [task.id]: true
      }
      try {
        const info = await this.slaScope.load(task.id)
        this.slaInfoByTaskId = {
          ...this.slaInfoByTaskId,
          [task.id]: info
        }
      } catch (e) {
        this.slaInfoByTaskId = {
          ...this.slaInfoByTaskId,
          [task.id]: null
        }
      } finally {
        const loading = {...this.slaInfoLoadingByTaskId}
        delete loading[task.id]
        this.slaInfoLoadingByTaskId = loading
      }
    },

    loadSlaInfoForTasks(tasks) {
      tasks
        .filter(task => getTaskSla(task) && !task.completed && !task.frozen)
        .forEach(task => this.loadSlaInfoForTask(task))
    },

    getSlaLeftSeconds(task) {
      return getSlaLeftSeconds(this.getSlaInfo(task), this.nowTs)
    },

    getSlaTime(task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      return formatSlaTime(secondsLeft, getSlaWorkdaySeconds(this.getSlaInfo(task)))
    },

    getSlaPercent(task) {
      return getSlaPercent(task, this.getSlaInfo(task), this.nowTs)
    },

    getSlaDeadlineMs(task) {
      return getSlaDeadlineMs(task, this.getSlaInfo(task))
    },

    isSlaExpired(task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      return secondsLeft !== null && secondsLeft <= 0
    },

    isSlaVisibleInTable(task) {
      return isSlaVisibleInTable(task, this.getSlaInfo(task))
    },

    getSlaTableValue(task) {
      if (!this.isSlaVisibleInTable(task)) {
        return ''
      }
      const slaTime = this.getSlaTime(task)
      return slaTime ? `Осталось: ${slaTime}` : ''
    },
  }
}
