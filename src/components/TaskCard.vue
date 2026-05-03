<template>
  <div id="task-card" class="task-card">
    <slot name="chatLink"></slot>
    <div class="task-card-header">
      <div class="task-card-header-left">
        <slot name="checkBox"></slot>
        <div class="task-id">№{{ this.task.id }}</div>
        <div id="task-card-name" class="text-body2 task-card-name">{{ task.name }}</div>
      </div>
      <div class="task-card-status-container" style="display: flex;">
        <circle-counter
          v-if="isHaveInTaskPing(task)"
          :image="'/at.svg'"
          style="margin-right: 8px;"
        />
        <div
          id="task-card-status"
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
      <tr v-if="task.description.length !== 0">
        <th class="small-text text-grey row-label" v-text="'Описание: '" />
        <th
          :class="descriptionClass"
          v-text="task.description"
        />
      </tr>
      <tr v-if="task.tags.map(tag => tag.name).length !== 0">
        <th class="small-text text-grey row-label" v-text="'Теги: '" />
        <th
          :class="tagsClass"
          v-text="task.tags.map(tag => tag.name).join(', ')"
        />
      </tr>
      <tr>
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
      <tr v-if="task.executor">
        <th class="small-text text-grey row-label" v-text="'Исполнитель: '" />
        <th
          :class="executorClass"
          v-text="getName(task.executor)"
        />
      </tr>
      <tr>
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
      <tr v-if="task.deadline">
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
      <tr v-if="isSlaVisible(task)">
        <th
          class="small-text text-grey"
          :style="this.selectedSorting.slug === 'sla' ? 'color: black;font-weight: 600;': 'color:#9e9e9e'"
          v-text="'SLA: '"
        />
        <th class="text-body2"
            :style="this.selectedSorting.slug === 'sla' ? 'font-weight: 600;': ''"
            style="display: flex; flex-direction: row; flex-wrap: wrap; align-items: center">
          Осталось: {{ this.getSlaTime(task) }}
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
      <tr v-if="!this.$route.path.includes('chat')"> <!--TODO может быть сделать везде, не помню почему ограничели отображение-->
        <th class="small-text text-grey row-label" v-text="'Последняя активность: '" />
        <th :class="lastActivityClass" v-text="this.getStamp(new Date(task.client.lastMessage.date))" />
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

  props: ['task', 'selectedSorting', 'descriptionRequire', 'slaRequire', 'taskNameShort'],

  components: { CircleCounter },

  data: () => ({
    slaInfo: null,
    slaIsPause: false,
    slaActionLoading: false,
    nowTs: Date.now(),
    slaTimer: null
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

    getSlaHours (task) {
      const deadline = this.getSlaDeadlineMoment(task)
      const now = moment()
      const duration = moment.duration(deadline.diff(now))
      return duration.days() * 24 + duration.hours() + duration.minutes() * 0.017
    },

    getSlaTime (task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      if (secondsLeft === null) {
        return ''
      }
      if (secondsLeft <= 0) {
        return '0 ч. 0 м.'
      }
      const hours = Math.floor(secondsLeft / 3600)
      const minutes = Math.floor((secondsLeft % 3600) / 60)
      return `${hours} ч. ${minutes} м.`
    },

    getSlaPercent (task) {
      const leftSeconds = this.getSlaLeftSeconds(task)
      if (leftSeconds === null) {
        return 0
      }
      let totalSeconds = this.getSlaTotalSeconds(task)
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        totalSeconds = this.getSlaTotalSecondsFromInfo()
      }
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        return 0
      }
      return Math.max(0, Math.min(1, leftSeconds / totalSeconds))
    },

    getSlaTotalSecondsFromInfo () {
      if (!this.slaInfo?.remainingSeconds || !this.slaInfo?.deadline) {
        return 0
      }
      const deadlineMs = new Date(this.slaInfo.deadline).getTime()
      if (!Number.isFinite(deadlineMs)) {
        return 0
      }
      const remainingSeconds = Number(this.slaInfo.remainingSeconds)
      const pausedSeconds = Number(this.slaInfo.pausedSeconds || 0)
      if (!Number.isFinite(remainingSeconds)) {
        return 0
      }
      const nowMs = this.slaInfo.paused
        ? deadlineMs - remainingSeconds * 1000
        : this.nowTs
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - new Date(this.task.createdAt).getTime()) / 1000))
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
      if (this.slaInfo) {
        if (this.slaInfo.paused) {
          return this.slaInfo.remainingSeconds
        }

        if (this.slaInfo.deadline) {
          return Math.max(0, Math.floor((new Date(this.slaInfo.deadline).getTime() - this.nowTs) / 1000))
        }

        return this.slaInfo.remainingSeconds ?? null
      }

      return null
    },

    shortenLine (string) {
      if (string.length > this.taskNameShort) {
        return string.substring(0, this.taskNameShort) + '...'
      } else {
        return string
      }
    },

    isHaveInTaskPing (task) {
      if (task.unreadPingTasksMessages) {
        return task.unreadPingTasksMessages[this.store.currentUser.id]
      } else {
        return false
      }
    },

    async loadSlaInfo () {
      if (!this.task?.id || !this.task?.sla) {
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

    applySlaInfo (info) {
      if (!info) return
      this.slaInfo = info
      this.slaIsPause = !!info.paused
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
        this.nowTs = Date.now() // ✅ возобновили тик
      } finally {
        this.slaActionLoading = false
      }
    }
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
    deadlineStyle () {
      return {
        color: this.task.deadline && this.task.deadline < Date.now() ? 'red' : 'black',
        fontWeight: this.selectedSorting.slug === 'deadline' ? '600' : 'normal'
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
    clearInterval(this.slaTimer)
  },

  watch: {
    'task.id' () {
      this.loadSlaInfo()
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
}

</style>
