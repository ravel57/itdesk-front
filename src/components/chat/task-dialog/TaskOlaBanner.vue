<template>
  <q-banner
    v-if="this.showOlaInfo"
    rounded
    dense
    class="task-ola-banner q-mt-sm"
    :class="this.olaBannerClass"
  >
    <template #avatar>
      <q-icon name="timer" />
    </template>
    <div class="text-caption text-weight-medium">{{ this.taskOlaLabel }}</div>
    <div v-if="this.task?.enteredCurrentLineAt || this.task?.supportLineEnteredAt || this.task?.olaStartedAt" class="text-caption opacity-80">
      На линии с {{ this.formatDateForOla(this.task.enteredCurrentLineAt || this.task.supportLineEnteredAt || this.task.olaStartedAt) }}
    </div>
  </q-banner>
</template>

<script>
import moment from 'moment/moment'

export default {
  props: {
    task: { type: Object, default: null },
    // Линия поддержки, выбранная в диалоге (если не выбрана — берётся линия заявки)
    selectedSupportLine: { type: Object, default: null }
  },

  computed: {
    showOlaInfo () {
      const line = this.selectedSupportLine || this.task?.supportLine
      return line?.olaEnabled === true
    },

    taskOlaLabel () {
      const info = this.task?.olaInfo || {}
      const explicitSeconds = info.remainingSeconds ?? info.secondsLeft ?? this.task?.olaSecondsLeft
      let seconds = Number(explicitSeconds)
      if (!Number.isFinite(seconds)) {
        const deadline = info.deadline || this.task?.olaDeadline
        const deadlineMs = deadline ? new Date(deadline).getTime() : NaN
        if (Number.isFinite(deadlineMs)) {
          seconds = Math.round((deadlineMs - Date.now()) / 1000)
        }
      }
      const status = String(info.status || this.task?.olaStatus || '').toUpperCase()
      if (info.breached === true || this.task?.olaBreached === true || ['BREACHED', 'OVERDUE', 'EXPIRED'].includes(status) || (Number.isFinite(seconds) && seconds <= 0)) {
        return Number.isFinite(seconds)
          ? `OLA линии нарушен на ${this.formatOlaSeconds(Math.abs(seconds))}`
          : 'OLA линии нарушен'
      }
      if (Number.isFinite(seconds)) {
        return `OLA линии: осталось ${this.formatOlaSeconds(seconds)}`
      }
      const line = this.selectedSupportLine || this.task?.supportLine
      if (line?.olaEnabled) {
        const unitLabels = {MINUTES: 'мин.', HOURS: 'ч.', WORKING_DAYS: 'раб. дн.'}
        const value = Number(line.olaValue || 0)
        const duration = value > 0 ? `${value} ${unitLabels[line.olaUnit] || line.olaUnit || ''}`.trim() : 'настроен'
        return `OLA линии: ${duration}`
      }
      return 'OLA линии настроен'
    },

    olaBannerClass () {
      const info = this.task?.olaInfo || {}
      const explicitSeconds = info.remainingSeconds ?? info.secondsLeft ?? this.task?.olaSecondsLeft
      let seconds = Number(explicitSeconds)
      if (!Number.isFinite(seconds)) {
        const deadline = info.deadline || this.task?.olaDeadline
        const deadlineMs = deadline ? new Date(deadline).getTime() : NaN
        if (Number.isFinite(deadlineMs)) {
          seconds = Math.round((deadlineMs - Date.now()) / 1000)
        }
      }
      const status = String(info.status || this.task?.olaStatus || '').toUpperCase()
      if (info.breached === true || this.task?.olaBreached === true || ['BREACHED', 'OVERDUE', 'EXPIRED'].includes(status) || (Number.isFinite(seconds) && seconds <= 0)) {
        return 'bg-red-1 text-red-10'
      }
      if (info.warning === true || this.task?.olaWarning === true || ['WARNING', 'AT_RISK', 'NEAR_BREACH'].includes(status)) {
        return 'bg-orange-1 text-orange-10'
      }
      if (['PAUSED', 'FROZEN'].includes(status)) {
        return 'bg-blue-1 text-blue-10'
      }
      return 'bg-green-1 text-green-10'
    }
  },

  methods: {
    formatOlaSeconds (value) {
      const seconds = Math.max(0, Number(value || 0))
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return [
        days > 0 ? `${days} д.` : '',
        hours > 0 ? `${hours} ч.` : '',
        minutes > 0 || (days === 0 && hours === 0) ? `${minutes} мин.` : ''
      ].filter(Boolean).join(' ')
    },

    formatDateForOla (value) {
      const parsed = moment(value)
      return parsed.isValid() ? parsed.format('DD.MM.YYYY HH:mm') : ''
    }
  }
}
</script>

<style scoped>
.task-ola-banner {
  border-left: 4px solid currentColor;
}

.opacity-80 {
  opacity: .8;
}
</style>
