<template>
  <div id="task-card" class="task-card" :data-tour="this.isOnboardingDemo ? 'tasks-task-card-inner' : null">
    <slot name="chatLink"></slot>
    <div class="task-card-header">
      <div class="task-card-header-left">
        <slot name="checkBox"></slot>
        <div class="task-id" data-tour="tasks-task-id">№{{ this.task.id }}</div>
        <div id="task-card-name" class="text-body2 task-card-name" data-tour="tasks-task-title">{{ task.name }}</div>
      </div>
      <div class="task-card-status-container" style="display: flex;">
        <circle-counter
          v-if="isHaveInTaskPing(task)"
          :image="'/at.svg'"
          style="margin-right: 8px;"
        />
        <div
          id="task-card-status"
          data-tour="tasks-task-status"
          :class="taskStatusClass"
        >
          <div v-if="this.task.frozen">
            Заморожена
          </div>
          <div v-else-if="this.task.completed">
            Закрыта
          </div>
          <div v-else-if="!this.task.completed && !this.task.frozen">
            {{ task.status.name }}
          </div>
        </div>
      </div>
    </div>
    <table @click="this.$emit('onTaskClicked', this.task)">
      <tr v-if="task.description.length !== 0" data-tour="tasks-task-description">
        <th class="small-text text-grey row-label" v-text="'Описание: '"/>
        <th
          :class="descriptionClass"
          v-text="task.description"
        />
      </tr>
      <tr data-tour="tasks-task-type">
        <th class="small-text text-grey row-label" v-text="'Тип: '"/>
        <th
          :class="typeClass"
          v-text="getTaskTypeName(task)"
        />
      </tr>
      <tr
        v-if="getChecklistTotalCount(task) > 0"
        data-tour="tasks-task-checklist"
      >
        <th class="small-text text-grey row-label" v-text="'Чек-лист: '"/>
        <th :class="checklistClass">
          <div class="task-card-checklist-progress-row">
      <span>
        {{ getChecklistCompletedCount(task) }} / {{ getChecklistTotalCount(task) }}
      </span>
            <q-linear-progress
              rounded
              :value="getChecklistProgress(task)"
              color="primary"
              track-color="grey-3"
              class="task-card-checklist-progress"
              size="8px"
              :animation-speed="0"
            />
          </div>
        </th>
      </tr>
      <tr v-if="task.tags.map(tag => tag.name).length !== 0" data-tour="tasks-task-tags">
        <th class="small-text text-grey row-label" v-text="'Теги: '"/>
        <th
          :class="tagsClass"
          v-text="task.tags.map(tag => tag.name).join(', ')"
        />
      </tr>
      <tr data-tour="tasks-task-priority">
        <th
          class="small-text text-grey row-label"
          :class="{'highlighted': this.selectedSorting.slug === 'priority'}"
          v-text="'Приоритет: '"
        />
        <th
          :class="priorityClass"
          v-text="task.priority.name"
        />
      </tr>
      <tr v-if="task.executor" data-tour="tasks-task-executor">
        <th class="small-text text-grey row-label" v-text="'Исполнитель: '"/>
        <th
          :class="executorClass"
          v-text="getName(task.executor)"
        />
      </tr>
      <tr data-tour="tasks-task-created">
        <th
          class="small-text text-grey row-label"
          :class="{'highlighted': this.selectedSorting.slug === 'creating'}"
          v-text="'Создана: '"
        />
        <th
          :class="createdAtClass"
          v-text="this.getStamp(task.createdAt)"
        />
      </tr>
      <!--      <tr v-if="!task.completed">-->
      <!--        <th-->
      <!--          class="small-text text-grey"-->
      <!--          :style="this.selectedSorting.slug === 'status' ? 'color: black;font-weight: 600;': 'color:gray'"-->
      <!--          v-text="'Статус: '"-->
      <!--        />-->
      <!--        <th-->
      <!--          class="text-body2"-->
      <!--          :style="this.selectedSorting.slug === 'status' ? 'font-weight: 600;': ''"-->
      <!--          v-text="task.status.name"/>-->
      <!--      </tr>-->
      <tr v-if="task.deadline" data-tour="tasks-task-deadline">
        <th
          class="small-text text-grey row-label"
          :class="{'highlighted': this.selectedSorting.slug === 'deadline'}"
          v-text="'Дедлайн: '"
        />
        <th
          :class="deadlineClass"
          :style="deadlineStyle"
          v-text="this.getStamp(task.deadline)"
        />
      </tr>
      <tr v-if="isCloseReasonVisible(task)" data-tour="tasks-task-close-reason">
        <th class="small-text text-grey row-label" v-text="'Причина закрытия: '"/>
        <th
          :class="closeReasonClass"
          :title="getCloseReason(task)"
          v-text="getShortCloseReason(task)"
        />
      </tr>
      <tr v-if="isSlaVisible(task)" data-tour="tasks-task-sla">
        <th
          class="small-text text-grey"
          :style="this.selectedSorting.slug === 'sla' ? 'color: black;font-weight: 600;': 'color:#9e9e9e'"
          v-text="'SLA осталось:'"
        />
        <th class="text-body2"
            :style="this.selectedSorting.slug === 'sla' ? 'font-weight: 600;': ''"
            style="display: flex; flex-direction: row; flex-wrap: wrap; align-items: center">
          {{ this.getSlaTime(task) }}
          <div
            class="sla-pill"
            :class="{ 'sla-pill--expired': isSlaExpired(task) }"
          >
            <q-linear-progress
              stripe
              rounded
              :value="this.getSlaPercent(task)"
              reverse
              :color="isSlaExpired(task) ? 'negative' : getSlaColor(task)"
              :track-color="isSlaExpired(task) ? 'negative-2' : 'grey-3'"
              class="sla-bar"
              size="12px"
              :animation-speed="0"
            />
          </div>
          <div v-if="this.$route.path.includes('chat')">
            <q-btn
              v-if="slaInfo && !slaInfo.paused"
              dense
              flat
              color="grey"
              :loading="slaActionLoading"
              :disable="slaActionLoading"
              @click.stop="pauseSla()"
              icon="pause_circle"
            />
            <q-btn
              v-if="slaInfo && slaInfo.paused"
              dense
              flat
              color="grey"
              :loading="slaActionLoading"
              :disable="slaActionLoading"
              @click.stop="resumeSla()"
              icon="play_circle"
            />
          </div>
        </th>
      </tr>
      <tr data-tour="tasks-task-last-activity">
        <th class="small-text text-grey row-label" v-text="'Последнее действие: '"/>
        <th :class="lastActivityClass" v-text="getLastTaskHistoryTime(task)"/>
      </tr>
    </table>
    <slot name="taskControl"></slot>
  </div>
</template>

<script>
import moment from 'moment/moment'
import { useStore } from 'stores/store'
import CircleCounter from 'components/CircleCounter.vue'
import axios from 'axios'

export default {
  name: 'TaskCard',

  props: ['task', 'selectedSorting', 'descriptionRequire', 'slaRequire', 'taskNameShort', 'isOnboardingDemo'],

  components: { CircleCounter },

  data: () => ({
    slaInfo: null,
    slaIsPause: false,
    slaActionLoading: false,
    nowTs: Date.now(),
    slaTimer: null,
    slaReloadTimer: null,
  }),

  methods: {
    getStamp (date) {
      if (!date) {
        return ''
      }
      const parsedDate = date instanceof Date ? date : new Date(date)
      if (Number.isNaN(parsedDate.getTime())) {
        return ''
      }
      return parsedDate.toLocaleTimeString('ru-RU', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getName (executor) {
      if (executor) {
        return executor.lastname + ' ' + executor.firstname
      } else {
        return ''
      }
    },

    toFiniteNumber (value) {
      const number = Number(value)
      return Number.isFinite(number) ? number : null
    },

    toTimestamp (value) {
      if (!value) {
        return null
      }
      const timestamp = new Date(value).getTime()
      return Number.isFinite(timestamp) ? timestamp : null
    },

    getSlaHours (task) {
      const deadline = this.getSlaDeadlineMoment(task)
      const now = moment()
      const duration = moment.duration(deadline.diff(now))
      return duration.days() * 24 + duration.hours() + duration.minutes() * 0.017
    },

    getSlaTime (task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      if (!Number.isFinite(secondsLeft)) {
        return '—'
      }
      if (secondsLeft <= 0) {
        return '0 ч. 0 м.'
      }
      const workdaySeconds = this.getSlaWorkdaySeconds(task)
      if (workdaySeconds > 0 && secondsLeft >= workdaySeconds) {
        const days = Math.floor(secondsLeft / workdaySeconds)
        const restSeconds = secondsLeft % workdaySeconds
        const hours = Math.floor(restSeconds / 3600)
        const minutes = Math.floor((restSeconds % 3600) / 60)
        if (hours > 0 || minutes > 0) {
          return `${days} д. ${hours} ч. ${minutes} м.`
        }
        return `${days} д.`
      }
      const hours = Math.floor(secondsLeft / 3600)
      const minutes = Math.floor((secondsLeft % 3600) / 60)
      return `${hours} ч. ${minutes} м.`
    },

    getSlaWorkdaySeconds (task) {
      const workdaySecondsFromInfo = Number(this.slaInfo?.workdaySeconds)
      if (Number.isFinite(workdaySecondsFromInfo) && workdaySecondsFromInfo > 0) {
        return workdaySecondsFromInfo
      }
      const workdaySecondsFromTask = Number(task?.slaInfo?.workdaySeconds)
      if (Number.isFinite(workdaySecondsFromTask) && workdaySecondsFromTask > 0) {
        return workdaySecondsFromTask
      }
      return 24 * 60 * 60
    },

    getSlaPercent (task) {
      const leftSeconds = this.getSlaLeftSeconds(task)
      if (!Number.isFinite(leftSeconds)) {
        return 0
      }
      let totalSeconds = this.getSlaTotalSeconds(task)
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        totalSeconds = this.getSlaTotalSecondsFromInfo()
      }
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        totalSeconds = Math.max(leftSeconds, 1)
      }
      return Math.max(0, Math.min(1, leftSeconds / totalSeconds))
    },

    getSlaTotalSecondsFromInfo () {
      const remainingSeconds = this.toFiniteNumber(this.slaInfo?.remainingSeconds)
      if (remainingSeconds === null) {
        return 0
      }
      const slaWorkingDays = this.toFiniteNumber(this.slaInfo?.slaWorkingDays)
      const workdaySeconds = this.toFiniteNumber(this.slaInfo?.workdaySeconds)
      if (slaWorkingDays !== null && slaWorkingDays > 0 && workdaySeconds !== null && workdaySeconds > 0) {
        return Math.max(remainingSeconds, Math.round(slaWorkingDays * workdaySeconds))
      }
      const deadlineMs = this.toTimestamp(this.slaInfo?.deadline)
      const createdAtMs = this.toTimestamp(this.task?.createdAt)
      if (deadlineMs === null || createdAtMs === null) {
        return Math.max(remainingSeconds, 0)
      }
      const pausedSeconds = this.toFiniteNumber(this.slaInfo?.pausedSeconds) || 0
      const nowMs = this.slaInfo.paused
          ? deadlineMs - remainingSeconds * 1000
          : this.nowTs
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000))
      return Math.max(remainingSeconds, remainingSeconds + elapsedSeconds - pausedSeconds)
    },

    getSlaTotalSeconds (task) {
      const duration = task?.sla?.duration
      if (!duration) {
        return 0
      }
      if (typeof duration.asSeconds === 'function') {
        const seconds = duration.asSeconds()
        return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
      }
      if (typeof duration === 'number') {
        return duration > 0 ? duration : 0
      }

      if (typeof duration === 'string') {
        const parsed = Number(duration)
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed
        }
        const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
        if (match) {
          const days = Number(match[1] || 0)
          const hours = Number(match[2] || 0)
          const minutes = Number(match[3] || 0)
          const seconds = Number(match[4] || 0)
          return days * 86400 + hours * 3600 + minutes * 60 + seconds
        }
        return 0
      }
      if (typeof duration === 'object') {
        if (Number.isFinite(duration.seconds)) {
          return duration.seconds
        }
        if (Number.isFinite(duration._milliseconds)) {
          return Math.floor(duration._milliseconds / 1000)
        }
        if (Number.isFinite(duration.milliseconds)) {
          return Math.floor(duration.milliseconds / 1000)
        }
      }
      return 0
    },

    getSlaColor (task) {
      if (this.getSlaPercent(task) > 0.5) {
        return 'green'
      } else if (this.getSlaPercent(task) > 0.25) {
        return 'orange'
      } else {
        return 'red'
      }
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
      if (!this.slaInfo) {
        return null
      }
      const remainingSeconds = this.toFiniteNumber(this.slaInfo.remainingSeconds)
      if (this.slaInfo.paused) {
        return remainingSeconds
      }
      const deadlineMs = this.toTimestamp(this.slaInfo.deadline)
      if (deadlineMs !== null) {
        return Math.max(0, Math.floor((deadlineMs - this.nowTs) / 1000))
      }
      return remainingSeconds
    },

    shortenLine (string) {
      if (string.length > this.taskNameShort) {
        return string.substring(0, this.taskNameShort) + '...'
      } else {
        return string
      }
    },

    isHaveInTaskPing (task) {
      if (!task.unreadPingTasksMessages) {
        return false
      }
      const currentUserId = this.store.currentUser?.id
      if (currentUserId) {
        return !!task.unreadPingTasksMessages[currentUserId]
      }
      return Object.values(task.unreadPingTasksMessages).some(Boolean)
    },

    getCloseReason (task) {
      return String(task?.statusChangeReason || '').trim()
    },

    getShortCloseReason (task) {
      const reason = this.getCloseReason(task)
      const maxLength = 50
      if (reason.length <= maxLength) {
        return reason
      }
      return `${reason.slice(0, maxLength).trim()}...`
    },

    isCloseReasonVisible (task) {
      return Boolean(task?.completed) && this.getCloseReason(task).length > 0
    },

    async loadSlaInfo () {
      if (this.task?.__onboardingDemo) {
        this.applySlaInfo(this.task.__onboardingSlaInfo || {
          deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          remainingSeconds: 2 * 60 * 60,
          pausedSeconds: 0,
          paused: false
        })
        return
      }
      if (!this.task?.id || !this.task?.sla || this.task?.completed || this.task?.frozen) {
        this.slaInfo = null
        this.slaIsPause = false
        return
      }
      try {
        const response = await axios.get(`/api/v1/task/${this.task.id}/sla/info`)
        this.applySlaInfo(response.data)
      } catch (e) {
        this.slaInfo = null
        this.slaIsPause = false
      }
    },

    scheduleReloadSlaInfo () {
      if (this.slaReloadTimer) {
        clearTimeout(this.slaReloadTimer)
      }
      this.slaReloadTimer = setTimeout(() => {
        this.nowTs = Date.now()
        this.loadSlaInfo()
      }, 150)
    },

    applySlaInfo (info) {
      if (!info) return
      this.slaInfo = {
        ...info,
        paused: Boolean(info.paused),
        remainingSeconds: this.toFiniteNumber(info.remainingSeconds),
        pausedSeconds: this.toFiniteNumber(info.pausedSeconds) || 0,
        workdaySeconds: this.toFiniteNumber(info.workdaySeconds),
        slaWorkingDays: this.toFiniteNumber(info.slaWorkingDays)
      }
      this.slaIsPause = this.slaInfo.paused
    },

    getSlaDeadlineMoment (task) {
      if (this.slaInfo?.deadline) {
        return moment(this.slaInfo.deadline)
      }
      if (!task?.sla?.startDate || !task?.sla?.duration) {
        return moment.invalid()
      }
      return moment(task.sla.startDate).add(this.getSlaDuration(task))
    },

    getSlaDuration (task) {
      const duration = task?.sla?.duration
      if (!duration) {
        return moment.duration(0)
      }
      if (typeof duration.asMilliseconds === 'function') {
        const ms = duration.asMilliseconds()
        if (Number.isFinite(ms) && ms > 0) {
          return duration
        }
        return moment.duration(0)
      }
      if (typeof duration === 'number') {
        return moment.duration(duration, 'seconds')
      }
      if (typeof duration === 'string') {
        const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
        if (match) {
          const days = Number(match[1] || 0)
          const hours = Number(match[2] || 0)
          const minutes = Number(match[3] || 0)
          const seconds = Number(match[4] || 0)
          return moment.duration({
            days,
            hours,
            minutes,
            seconds
          })
        }
      }
      return moment.duration(0)
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
        this.nowTs = Date.now()
      } catch (e) {
        this.$q.notify({
          message: e.response?.data || e.message || 'Не удалось снять SLA с паузы',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      } finally {
        this.slaActionLoading = false
      }
    },

    getTaskTypeName (task) {
      return task?.type?.type
    },

    getChecklistItems (task) {
      if (!Array.isArray(task?.checklist)) {
        return []
      }

      return task.checklist.filter(item => item && item.text !== undefined && item.text !== null)
    },

    getChecklistTotalCount (task) {
      return this.getChecklistItems(task).length
    },

    getChecklistCompletedCount (task) {
      return this.getChecklistItems(task)
        .filter(item => Boolean(item.completed))
        .length
    },

    getChecklistProgress (task) {
      const total = this.getChecklistTotalCount(task)
      if (total === 0) {
        return 0
      }
      return this.getChecklistCompletedCount(task) / total
    },

    getLastTaskHistoryTime (task) {
      const event = this.getLastTaskHistoryEvent(task)
      if (event?.createdAt) {
        return this.getStamp(new Date(event.createdAt))
      }
      if (task?.lastActivity) {
        return this.getStamp(new Date(task.lastActivity))
      }
      return '—'
    },

    getLastTaskHistoryEvent (task) {
      const history = [
        ...(Array.isArray(task?.history) ? task.history : []),
        ...(Array.isArray(task?.taskHistory) ? task.taskHistory : []),
        ...(Array.isArray(task?.events) ? task.events : [])
      ]
      return history
        .filter(event => event?.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null
    },

    getTaskPriorityId (task) {
      return task?.priority?.id || null
    },
  },

  computed: {
    taskStatusClass () {
      if (this.task.completed) {
        return 'status-completed'
      } else if (this.task.frozen) {
        return 'status-frozen'
      } else {
        return 'status-active'
      }
    },

    descriptionClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        truncate: true
      }
    },

    tagsClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        truncate: true
      }
    },

    priorityClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        highlighted: this.selectedSorting.slug === 'priority'
      }
    },

    executorClass () {
      return {
        'text-body2': true, // small size for executor text
        'text-grey': this.task.completed,
        executor: true
      }
    },

    createdAtClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        highlighted: this.selectedSorting.slug === 'creating'
      }
    },

    deadlineClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        highlighted: this.selectedSorting.slug === 'deadline'
      }
    },

    lastActivityClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed
      }
    },

    closeReasonClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        'task-close-reason': true
      }
    },

    deadlineStyle () {
      return {
        color: this.task.deadline && this.task.deadline < Date.now() ? 'red' : 'black',
        fontWeight: this.selectedSorting.slug === 'deadline' ? '600' : 'normal'
      }
    },

    typeClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed,
        truncate: true
      }
    },

    checklistClass () {
      return {
        'text-body2': true,
        'text-grey': this.task.completed
      }
    },
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
        this.scheduleReloadSlaInfo()
      }
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }

}
</script>

<style scoped>
th {
  text-align: left;
}

.truncate {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
}

.task-card-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: nowrap;
  position: relative;
  align-items: center;
  height: 23px;
}

.task-card-header-left {
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
  width: 70%;
  align-items: center;
}

.task-id {
  margin-right: 8px;
  margin-left: 3px;
  font-size: 14px; /* Увеличен размер текста для ID */
  color: grey;
}

.task-card-name {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  font-size: 14px; /* Уменьшен размер текста для названия */
}

.task-card-status-container {
  position: absolute;
  top: 0;
  right: 0;
}

#task-card-status {
  border-style: solid;
  background-color: rgba(148, 121, 255, 0.2);
  border-width: 1px;
  border-radius: 4px;
  border-color: var(--q-primary);
  color: var(--q-primary);
  padding-left: 4px;
  padding-right: 4px;
}

.status-completed {
  background-color: rgba(16, 181, 92, 0.2) !important;
  color: rgba(16, 181, 92, 1) !important;
  border-color: rgba(16, 181, 92, 1) !important;
}

.status-frozen {
  background-color: rgba(50, 173, 230, 0.2) !important;
  color: rgba(50, 173, 230, 1) !important;
  border-color: rgba(50, 173, 230, 1) !important;
}

.status-active {
  /* Default styling for active status */
}

.small-text {
  font-size: 14px; /* Восстановлен размер для small-text */
  color: grey;
}

.text-grey {
  color: grey;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.executor {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 79%;
  display: block;
}

.task-close-reason {
  display: block;
  max-width: 260px;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.35;
}

.highlighted {
  color: black;
  font-weight: 600;
}

.row-label {
  padding-right: 8px;
}

.sla-pill {
  width: 80px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;

  border: 3px solid transparent;
  border-radius: 5px;

  background: transparent;
  flex: 0 0 auto;
}

.sla-pill--expired {
  border-color: red;
}

.sla-bar {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  box-sizing: border-box;
  overflow: hidden;
}

.task-card-checklist-progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.task-card-checklist-progress {
  width: 70px;
  flex: 0 0 70px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  box-sizing: border-box;
  overflow: hidden;
}
</style>
