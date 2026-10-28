import moment from 'moment/moment'
import axios from 'axios'
import { slaZone } from 'src/util/slaZones'
import {
  buildDemoSlaInfo,
  calcSlaPercent,
  formatSlaTime,
  getSlaDeadlineMoment,
  getSlaDuration,
  getSlaLeftSeconds,
  getSlaTotalSeconds,
  getSlaTotalSecondsFromInfo,
  getSlaWorkdaySeconds,
  normalizeSlaInfo,
  toFiniteNumber,
  toTimestamp
} from 'src/util/taskCard/taskCardSla'

// SLA карточки: загрузка slaInfo через батчер, тикающее «сейчас», остаток/процент/цвет, пауза и снятие с паузы.
// Требует в компоненте: props task/slaRequire, this.store, this.slaScope (setup, useSlaInfo).
export default {
  data: () => ({
    slaInfo: null,
    slaIsPause: false,
    slaActionLoading: false,
    nowTs: Date.now(),
    slaTimer: null,
    slaReloadTimer: null
  }),

  methods: {
    isFirstResponseOverdue (task) {
      if (!task || task.firstResponseAt || task.completed) return false
      const deadline = this.toTimestamp(task.firstResponseDeadline)
      return deadline !== null && this.nowTs >= deadline
    },

    toFiniteNumber (value) {
      return toFiniteNumber(value)
    },

    toTimestamp (value) {
      return toTimestamp(value)
    },

    getSlaHours (task) {
      const deadline = this.getSlaDeadlineMoment(task)
      const now = moment()
      const duration = moment.duration(deadline.diff(now))
      return duration.days() * 24 + duration.hours() + duration.minutes() * 0.017
    },

    getSlaTime (task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      return formatSlaTime(secondsLeft, this.getSlaWorkdaySeconds(task))
    },

    getSlaWorkdaySeconds (task) {
      return getSlaWorkdaySeconds(this.slaInfo, task)
    },

    getSlaPercent (task) {
      return calcSlaPercent(
        this.getSlaLeftSeconds(task),
        this.getSlaTotalSeconds(task),
        () => this.getSlaTotalSecondsFromInfo()
      )
    },

    getSlaTotalSecondsFromInfo () {
      return getSlaTotalSecondsFromInfo(this.slaInfo, this.task, this.nowTs)
    },

    getSlaTotalSeconds (task) {
      return getSlaTotalSeconds(task)
    },

    getSlaColor (task) {
      // Границы зон — общая настройка (Настройки → Общие → Зоны SLA)
      return slaZone(this.getSlaPercent(task), this.store.slaZones) || 'red'
    },

    getSlaLeftMs (task) {
      const deadline = this.getSlaDeadlineMoment(task)
      const now = moment(this.nowTs)
      return deadline.diff(now) // может быть < 0
    },

    isSlaExpired (task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      return secondsLeft !== null && secondsLeft <= 0
    },

    getSlaLeftSeconds (task) {
      return getSlaLeftSeconds(this.slaInfo, this.nowTs)
    },

    async loadSlaInfo (force = false) {
      if (this.task?.__onboardingDemo) {
        this.applySlaInfo(this.task.__onboardingSlaInfo || buildDemoSlaInfo())
        return
      }
      if (!this.task?.id || !this.task?.sla || this.task?.completed || this.task?.frozen) {
        this.slaInfo = null
        this.slaIsPause = false
        return
      }
      try {
        const info = await this.slaScope.load(this.task.id, { force })
        this.applySlaInfo(info)
      } catch (e) {
        this.slaInfo = null
        this.slaIsPause = false
      }
    },

    scheduleReloadSlaInfo (force = false) {
      if (this.slaReloadTimer) {
        clearTimeout(this.slaReloadTimer)
      }
      this.slaReloadTimer = setTimeout(() => {
        this.nowTs = Date.now()
        this.loadSlaInfo(force)
      }, 150)
    },

    applySlaInfo (info) {
      if (!info) return
      this.slaInfo = normalizeSlaInfo(info)
      this.slaIsPause = this.slaInfo.paused
    },

    getSlaDeadlineMoment (task) {
      return getSlaDeadlineMoment(this.slaInfo, task)
    },

    getSlaDuration (task) {
      return getSlaDuration(task)
    },

    isSlaVisible (task) {
      return this.slaRequire &&
        !task?.completed &&
        !task?.frozen &&
        !!task?.sla &&
        !!this.slaInfo
    },

    async pauseSla (reason = null) {
      if (this.slaActionLoading) return
      this.slaActionLoading = true

      try {
        const { data } = await axios.post(
          `/api/v1/task/${this.task.id}/sla/pause`,
          null,
          { params: reason ? { reason } : {} }
        )
        this.applySlaInfo(data)
        this.slaScope.set(this.task.id, data)
        this.nowTs = Date.now()
      } finally {
        this.slaActionLoading = false
      }
    },

    async resumeSla () {
      if (this.slaActionLoading) return
      this.slaActionLoading = true
      try {
        const { data } = await axios.post(`/api/v1/task/${this.task.id}/sla/resume`)
        this.applySlaInfo(data)
        this.slaScope.set(this.task.id, data)
        this.nowTs = Date.now()
      } catch (e) {
        this.$q.notify({
          message: e.response?.data || e.message || 'Не удалось снять SLA с паузы',
          type: 'negative'
        })
      } finally {
        this.slaActionLoading = false
      }
    }
  },

  mounted () {
    this.loadSlaInfo()
    this.slaTimer = setInterval(() => {
      if (!this.slaInfo?.paused) {
        this.nowTs = Date.now()
      }
    }, 1000)
  },

  beforeUnmount () {
    if (this.slaTimer) {
      clearInterval(this.slaTimer)
    }
    if (this.slaReloadTimer) {
      clearTimeout(this.slaReloadTimer)
    }
  },

  watch: {
    'task.id' () {
      this.scheduleReloadSlaInfo()
    },

    'task.priority.id' (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.scheduleReloadSlaInfo(true)
      }
    }
  }
}
