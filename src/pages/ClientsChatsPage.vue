<template>
  <q-page padding style="min-width: 0;overflow-x: hidden;">
    <q-input
      v-if="this.store.clients.length > 0"
      v-model="searchQuery"
      dense
      placeholder="Поиск..."
      @input="search"
      clearable
      @clear="searchQuery = ''"
    >
      <template v-slot:append>
        <q-icon
          name="search"
        />
      </template>
    </q-input>
    <div v-if="this.getSortedAndFilteredClients.length > 0">
      <q-list>
        <div
          v-for="client in this.getSortedAndFilteredClients"
          :key="client.id"
        >
          <q-item clickable>
            <q-item-section style="display: flow-root">
              <router-link
                :to="`/chats/${client.id}`"
                style="text-decoration: none; display: flex; width: 100%;"
                class="text-primary"
              >
                <q-item-section side style="padding-right: 8px">
                  <div
                    :style="'background-color: ' + this.nameToPastelHex(`${client.lastname} ${client.firstname}`)"
                    style="width: 50px;height: 50px;border-radius: 100%;display: flex;justify-content: center;align-items: center;color: white;font-size: 20px"
                  >
                    {{ this.getAbbreviation(client) }}
                  </div>
                </q-item-section>
                <q-item-section class="client-info-section">
                  <q-item-label style="align-items: center;display: flex;">
                    <img
                      v-if="client.messageFrom === 'TELEGRAM'"
                      src="/telegram.png"
                      alt="tg"
                      style="width: 16px;margin-right: 8px;filter: invert(29%) sepia(65%) saturate(7267%) hue-rotate(249deg) brightness(95%) contrast(106%);"
                    >
                    <img
                      v-else-if="client.messageFrom === 'WHATSAPP'"
                      src="/whatsapp.png"
                      alt="wa"
                      style="width: 16px;margin-right: 8px;filter: invert(29%) sepia(65%) saturate(7267%) hue-rotate(249deg) brightness(95%) contrast(106%);"
                    >
                    <img
                      v-else-if="client.messageFrom === 'EMAIL'"
                      src="/email.png"
                      alt="email"
                      style="width: 16px;margin-right: 8px;filter: invert(29%) sepia(65%) saturate(7267%) hue-rotate(249deg) brightness(95%) contrast(106%);"
                    >
                    {{ client.lastname }} {{ client.firstname }}
                    <div style="color: var(--q-primary);display: flex;align-items: center;margin-left: 8px;">
                      <q-icon
                        color="primary"
                        name="description"
                      />
                      {{ this.getActualTasks(client).length }}
                    </div>
                    <div class="row items-center no-wrap">
                      <div
                        v-if="hasClientSla(client)"
                        class="sla-pill q-ml-sm"
                        :class="{ 'sla-pill--expired': isSlaExpired(this.getActualTasks(client)) }"
                      >
                        <q-linear-progress
                          :value="getClientSlaPercent(client) ?? 0"
                          :color="this.isSlaExpired(this.getActualTasks(client)) ? 'negative' : getSlaColor(this.getActualTasks(client))"
                          :track-color="isSlaExpired(this.getActualTasks(client)) ? 'negative-2' : 'grey-3'"
                          reverse
                          rounded
                          class="sla-bar"
                          style="width: 80px; border: solid 1px darkgray"
                          size="12px"
                          :animation-speed="0"
                        >
                          <q-tooltip
                            anchor="top middle"
                            self="bottom middle"
                            :offset="[10, 10]"
                          >
                            Минимальный SLA среди заявок
                          </q-tooltip>
                        </q-linear-progress>
                      </div>
                    </div>
                  </q-item-label>
                  <q-item-label
                    caption
                  >
                    <PluginExtensionPoint
                      point="CHAT_CLIENT_ROW_INFO"
                      entity-type="CLIENT"
                      :entity="client"
                      :context="{ client }"
                    />
                  </q-item-label>
                  <q-item-label
                    caption
                  >
                    {{ this.getOrganization(client) }}
                  </q-item-label>
                  <q-item-label
                    class="shorten-text"
                    caption
                  >
                    {{ this.getTimeLastMessage(client) +' : ' + this.getLastMessage(client) }}
                  </q-item-label>
                </q-item-section>
                <div
                  v-if="client.unreadMessagesCount || hasAnswerRequiredUnansweredMessages(client) || hasCriticalTasks(client) || isHavePing(client)"
                  class="client-row-alerts"
                >
                  <q-separator vertical class="client-row-alerts__separator" />

                  <div class="client-row-alerts__content">
                    <q-icon
                      v-if="hasCriticalTasks(client)"
                      name="priority_high"
                      class="text-red client-critical-icon"
                    >
                      <q-tooltip
                        anchor="center left"
                        self="center right"
                        :offset="[10, 10]"
                      >
                        Критическая заявка
                      </q-tooltip>
                    </q-icon>

                    <span
                      v-if="hasAnswerRequiredUnansweredMessages(client)"
                      class="unanswered-timer"
                    >
                      {{ getAnswerRequiredTimerText(client) }}
                    </span>

                    <circle-counter
                      v-if="client.unreadMessagesCount"
                      :counter="client.unreadMessagesCount"
                    />

                    <circle-counter
                      v-if="isHavePing(client)"
                      :image="'/at.svg'"
                      class="client-ping-counter"
                    />
                  </div>
                </div>
              </router-link>
            </q-item-section>
          </q-item>
          <q-separator/>
        </div>
      </q-list>
    </div>
    <div v-else class="absolute-center">
      <div style="text-align: center;font-size: 20px">
        Чатов нет
        <no-tasks-placeholder/>
      </div>
    </div>
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'
import CircleCounter from 'components/CircleCounter.vue'
import moment from 'moment'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'
import axios from 'axios'
import PluginExtensionPoint from 'src/plugins/PluginExtensionPoint.vue'

export default {
  name: 'DialogsPage',

  components: { NoTasksPlaceholder, CircleCounter, PluginExtensionPoint },

  data: () => ({
    searchQuery: '',
    nowTs: Date.now(),
    slaTimer: null,
    // taskId -> SlaInfoDto
    slaInfoByTaskId: {},
    // taskId -> boolean (чтобы не спамить запросами)
    slaInfoLoading: {}
  }),

  methods: {
    nameToPastelHex (name) {
      let hash = 0
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
      }

      let r = (hash & 0xFF0000) >> 16
      let g = (hash & 0x00FF00) >> 8
      let b = hash & 0x0000FF

      r = Math.floor((r + 255) / 2)
      g = Math.floor((g + 255) / 2)
      b = Math.floor((b + 255) / 2)

      const pastelHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

      return pastelHex
    },

    getActualTasks (client) {
      if (client.tasks) {
        return client.tasks.filter(task => !task.completed)
      } else {
        return []
      }
    },

    search () {
    },

    getOrganization (client) {
      if (client.organization) {
        return client.organization.name
      } else {
        return ''
      }
    },

    getSlaLeftMs (task) {
      if (!task?.id) return null
      const info = this.getSlaInfo(task)
      if (info) {
        if (info.paused && typeof info.remainingSeconds === 'number') {
          return Math.max(0, info.remainingSeconds * 1000)
        }
        if (info.deadline) {
          const now = moment(this.nowTs)
          return Math.max(0, moment(info.deadline).diff(now))
        }
      }
      return null
    },

    getSlaTotalMs (task) {
      if (!task?.sla?.duration) {
        return 0
      }
      return this.parseIsoDurationToMs(task.sla.duration)
    },

    parseIsoDurationToMs (duration) {
      if (!duration) {
        return 0
      }

      if (typeof duration.asMilliseconds === 'function') {
        const ms = duration.asMilliseconds()
        return Number.isFinite(ms) && ms > 0 ? ms : 0
      }

      if (typeof duration === 'number') {
        return duration * 1000
      }
      if (typeof duration === 'object') {
        if (Number.isFinite(duration.seconds)) {
          return duration.seconds * 1000
        }
        if (Number.isFinite(duration._milliseconds)) {
          return duration._milliseconds
        }
        if (Number.isFinite(duration.milliseconds)) {
          return duration.milliseconds
        }
      }
      if (typeof duration === 'string') {
        const parsed = Number(duration)
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed * 1000
        }
        const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
        if (match) {
          const days = Number(match[1] || 0)
          const hours = Number(match[2] || 0)
          const minutes = Number(match[3] || 0)
          const seconds = Number(match[4] || 0)
          return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000
        }
      }
      return 0
    },

    isSlaExpired (tasks) {
      const task = this.getMinimalSlaTask(tasks)
      if (!task) return false
      const leftMs = this.getSlaLeftMsApprox(task)
      return leftMs !== null && leftMs <= 0
    },

    getMinimalSlaTask (tasks) {
      const withSla = (tasks || []).filter(t => t?.sla?.startDate && t?.sla?.duration)
      if (withSla.length === 0) {
        return null
      }
      // Берём самую “срочную” — с минимальным оставшимся временем
      return withSla.reduce((best, t) => {
        const bestLeft = this.getSlaLeftMsApprox(best)
        const tLeft = this.getSlaLeftMsApprox(t)
        return (tLeft !== null && (bestLeft === null || tLeft < bestLeft)) ? t : best
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
      if (p > 0.5) return 'green'
      else if (p > 0.25) return 'orange'
      else return 'red'
    },

    getTimeLastMessage (client) {
      if (client.lastMessage) {
        const dateFormatted = new Date(client.lastMessage.date)
        const currentDate = new Date()
        const timeDifference = currentDate - dateFormatted
        const seconds = Math.floor(timeDifference / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const years = Math.floor(days / 365)

        const declension = (number, words) => {
          return words[
            (number % 10 === 1 && number % 100 !== 11) ? 0
              : (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) ? 1
                  : 2
          ]
        }

        let result
        if (years > 0) {
          result = `${years} ${declension(years, ['год', 'года', 'лет'])}`
        } else if (days > 0) {
          result = `${days} ${declension(days, ['день', 'дня', 'дней'])}`
        } else if (hours > 0) {
          result = `${hours} ${declension(hours, ['час', 'часа', 'часов'])}`
        } else {
          result = `${minutes} ${declension(minutes, ['минута', 'минуты', 'минут'])}`
        }
        // назад (${dateFormatted.toLocaleTimeString('ru-RU', {
        //   timeZone: 'Europe/Moscow',
        //   year: 'numeric',
        //   month: 'numeric',
        //   day: 'numeric',
        //   hour: '2-digit',
        //   minute: '2-digit'
        // })})
        return `${result} назад`
      }
    },

    hasAnswerRequiredUnansweredMessages (client) {
      return !!this.getLastAnswerRequiredUnansweredMessageDate(client)
    },

    getAnswerRequiredTimerText (client) {
      const date = this.getLastAnswerRequiredUnansweredMessageDate(client)
      if (!date) {
        return ''
      }
      const startMs = new Date(date).getTime()
      if (!Number.isFinite(startMs)) {
        return ''
      }
      const diffMs = Math.max(0, this.nowTs - startMs)
      const totalMinutes = Math.floor(diffMs / 60000)
      const days = Math.floor(totalMinutes / 1440)
      const hours = Math.floor((totalMinutes % 1440) / 60)
      const minutes = totalMinutes % 60
      if (days > 0) {
        return `${days}д ${hours}ч`
      }
      if (hours > 0) {
        return `${hours}ч ${minutes}м`
      }
      return `${minutes}м`
    },

    getClientMessages (client) {
      return client?.messages || client?.clientMessages || []
    },

    isIncomingMessage (message) {
      return message &&
        message.isSent === false &&
        message.isComment !== true &&
        message.deleted !== true
    },

    isOutgoingOperatorMessage (message) {
      return message &&
        message.isSent === true &&
        message.isComment !== true &&
        message.deleted !== true
    },

    getLastAnswerRequiredUnansweredMessageDate (client) {
      const messages = [...this.getClientMessages(client)]
        .filter(message => message?.date && message.deleted !== true)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      if (messages.length === 0) {
        return client.firstUnansweredMessageDate || null
      }
      let lastOperatorAnswerMs = 0
      messages.forEach(message => {
        if (this.isOutgoingOperatorMessage(message)) {
          const dateMs = new Date(message.date).getTime()
          if (Number.isFinite(dateMs)) {
            lastOperatorAnswerMs = Math.max(lastOperatorAnswerMs, dateMs)
          }
        }
      })
      const unansweredIncomingMessages = messages.filter(message => {
        const dateMs = new Date(message.date).getTime()
        return this.isIncomingMessage(message) &&
          Number.isFinite(dateMs) &&
          dateMs > lastOperatorAnswerMs
      })
      if (unansweredIncomingMessages.length === 0) {
        return null
      }
      const lastMarkedMessage = [...unansweredIncomingMessages]
        .reverse()
        .find(message =>
          message.answerRequired === 'ANSWER_REQUIRED' ||
          message.answerRequired === 'ANSWER_NOT_REQUIRED'
        )
      if (!lastMarkedMessage || lastMarkedMessage.answerRequired !== 'ANSWER_REQUIRED') {
        return null
      }
      return unansweredIncomingMessages[0].date
    },

    getAnswerRequiredWaitMs (client) {
      const date = this.getLastAnswerRequiredUnansweredMessageDate(client)
      if (!date) {
        return 0
      }
      const startMs = new Date(date).getTime()
      if (!Number.isFinite(startMs)) {
        return 0
      }
      return Math.max(0, this.nowTs - startMs)
    },

    getLastMessage (client) {
      if (client.lastMessage) {
        if (client.lastMessage.text) {
          return client.lastMessage.text
        } else {
          if (client.lastMessage.fileType === null) {
            return 'Неизвестный формат файла'
          } else if (client.lastMessage.fileType.startsWith('video/')) {
            return 'Видео'
          } else if (client.lastMessage.fileType.startsWith('image/')) {
            return 'Изображение'
          } else if (client.lastMessage.fileType.startsWith('audio/')) {
            return 'Аудио'
          } else {
            return 'Файл'
          }
        }
      } else {
        return ''
      }
    },

    getAbbreviation (client) {
      const lastname = client.lastname ? client.lastname[0].toUpperCase() : ''
      const firstname = client.firstname ? client.firstname[0].toUpperCase() : ''
      return `${lastname}${firstname}`
    },

    isHavePing (client) {
      const userId = this.store.currentUser?.id
      if (!userId || !client) {
        return false
      }
      const hasClientPing = Boolean(client.unreadPingMessages?.[userId])
      const hasTaskPing = (client.tasks || []).some(task =>
        Boolean(task.unreadPingTasksMessages?.[userId])
      )
      return hasClientPing || hasTaskPing
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
        const { data } = await axios.get(`/api/v1/task/${taskId}/sla/info`)
        this.slaInfoByTaskId[taskId] = data
      } catch (e) {
        // игнор
      } finally {
        this.slaInfoLoading[taskId] = false
      }
    },

    async preloadSlaInfosForClients (clients) {
      const ids = []
      ;(clients || []).forEach(client => {
        const minTask = this.getMinimalSlaTask(this.getActualTasks(client))
        if (minTask?.id) {
          ids.push(minTask.id)
        }
      })
      const uniqIds = [...new Set(ids)]
      await Promise.all(uniqIds.map(id => this.loadSlaInfoForTaskId(id)))
    },

    getSlaLeftMsApprox (task) {
      if (!task?.sla?.startDate || !task?.sla?.duration) {
        return null
      }
      const info = this.getSlaInfo(task)
      if (info) {
        const remainingSeconds = Number(info.remainingSeconds)
        if (info.paused && Number.isFinite(remainingSeconds)) {
          return Math.max(0, remainingSeconds * 1000)
        }
        if (info.deadline) {
          const deadlineMs = new Date(info.deadline).getTime()
          if (Number.isFinite(deadlineMs)) {
            return Math.max(0, deadlineMs - this.nowTs)
          }
        }
      }
      const startMs = new Date(task.sla.startDate).getTime()
      const durationMs = this.parseIsoDurationToMs(task.sla.duration)
      if (!Number.isFinite(startMs) || durationMs <= 0) {
        return null
      }
      const deadlineMs = startMs + durationMs
      return Math.max(0, deadlineMs - this.nowTs)
    },

    getSlaDuration (duration) {
      if (!duration) {
        return moment.duration(0)
      }
      if (typeof duration.asMilliseconds === 'function') {
        return duration
      }
      if (typeof duration === 'number') {
        return moment.duration(duration, 'seconds')
      }
      if (typeof duration === 'object') {
        if (Number.isFinite(duration.seconds)) {
          return moment.duration(duration.seconds, 'seconds')
        }
        if (Number.isFinite(duration._milliseconds)) {
          return moment.duration(duration._milliseconds, 'milliseconds')
        }
      }
      return moment.duration(duration)
    },

    getSlaEndDate (task) {
      if (!task?.sla?.startDate || !task?.sla?.duration) {
        return null
      }
      return moment(task.sla.startDate).add(this.getSlaDuration(task.sla.duration))
    },

    getClientSlaPercent (client) {
      const tasks = this.getActualTasks(client)
      return this.getSlaPercent(tasks) // вернёт number или null
    },

    hasClientSla (client) {
      return this.getActualTasks(client).some(task =>
        !!task?.sla?.startDate &&
        !!task?.sla?.duration
      )
    },

    hasCriticalTasks (client) {
      return client.tasks?.some(task => task.priority?.critical && !task.completed) === true
    },
  },

  computed: {
    getSortedAndFilteredClients () {
      let clients = this.store.clients || []

      if (this.searchQuery !== '') {
        const query = this.searchQuery.toLowerCase()
        clients = clients.filter(client => {
          const firstname = client.firstname || ''
          const lastname = client.lastname || ''
          const organization = client.organization?.name || ''
          const sourceChannel = client.sourceChannel || ''
          return `${firstname} ${lastname} ${organization} ${sourceChannel}`
            .toLowerCase()
            .includes(query)
        })
      }
      clients = [...clients].sort((a, b) => {
        const waitA = this.getAnswerRequiredWaitMs(a)
        const waitB = this.getAnswerRequiredWaitMs(b)
        const hasRequiredA = waitA > 0
        const hasRequiredB = waitB > 0
        if (hasRequiredA !== hasRequiredB) {
          return hasRequiredB ? 1 : -1
        }
        if (waitA !== waitB) {
          return waitB - waitA
        }
        const lastA = new Date(a.lastMessage?.date || 0).getTime()
        const lastB = new Date(b.lastMessage?.date || 0).getTime()
        return lastB - lastA
      })
      return clients
    },
  },

  watch: {
    searchQuery () {
      this.preloadSlaInfosForClients(this.getSortedAndFilteredClients)
    },

    'store.clients': {
      handler () {
        this.preloadSlaInfosForClients(this.getSortedAndFilteredClients)
      },
      deep: true
    }
  },

  mounted () {
    document.title = 'ULDESK : Чаты'
    this.preloadSlaInfosForClients(this.getSortedAndFilteredClients)
    this.slaTimer = setInterval(() => {
      this.nowTs = Date.now()
    }, 1000)
  },

  beforeUnmount () {
    clearInterval(this.slaTimer)
  },

  setup () {
    const store = useStore()
    return {
      store
    }
  }
}
</script>

<style scoped>
.shorten-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.client-row-alerts {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  flex: 0 0 auto;
  margin-left: 0;
  margin-right: auto;
}

.client-row-alerts__separator {
  align-self: stretch;
  height: auto;
  margin-right: 12px;
}

.client-row-alerts__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.client-info-section {
  flex: 0 0 300px;
  width: 300px;
  min-width: 0;
  max-width: 300px;
}

.client-critical-icon {
  font-size: 20px;
}

.unanswered-timer {
  font-size: 12px;
  line-height: 1;
  color: var(--q-primary);
  white-space: nowrap;
  font-weight: 600;
}

.client-ping-counter {
  margin-right: 0;
}
</style>
