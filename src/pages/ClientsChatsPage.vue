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
                style="text-decoration: none; display: flex"
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
                <q-item-section>
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
                <q-item-section
                  side
                  style="flex-direction: row;align-content: center;"
                >
                  <q-icon
                    v-if="client.tasks.filter(task => task.priority.critical && !task.completed).length > 0"
                    name="priority_high"
                    class="text-red"
                  >
                    <q-tooltip
                      anchor="center left"
                      self="center right"
                      :offset="[10, 10]"
                    >
                      Критическая заявка
                    </q-tooltip>
                  </q-icon>
                  <circle-counter
                    :counter="client.unreadMessagesCount"
                  />
                </q-item-section>
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

export default {
  name: 'DialogsPage',

  components: { NoTasksPlaceholder, CircleCounter },

  data: () => ({
    searchQuery: ''
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

      // Шаг 4: Форматируем в hex
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

    getSlaHours (task) {
      const endDateTime = task.sla.startDate.clone().add(task.sla.duration)
      const now = moment()
      const duration = moment.duration(endDateTime.diff(now))
      return duration.days() * 24 + duration.hours() + duration.minutes() * 0.017
    },

    getMinimalSlaTask (tasks) {
      return tasks.sort((b, a) => a.sla.duration < b.sla.duration ? -1 : a.sla.duration > b.sla.duration ? 1 : 0)[tasks.length - 1]
    },

    getSlaPercent (tasks) {
      const task = this.getMinimalSlaTask(tasks)
      return this.getSlaHours(task) / (task.sla.duration.days() * 24 + task.sla.duration.hours())
    },

    getSlaColor (tasks) {
      const task = this.getMinimalSlaTask(tasks)
      if (this.getSlaHours(task) / (task.sla.duration.days() * 24 + task.sla.duration.hours()) > 0.5) {
        return 'green'
      } else if (this.getSlaHours(task) / (task.sla.duration.days() * 24 + task.sla.duration.hours()) > 0.25) {
        return 'orange'
      } else {
        return 'red'
      }
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
    }
  },

  computed: {
    getSortedAndFilteredClients () {
      let clients = this.store.clients
      if (this.searchQuery !== '') {
        clients = clients.filter(client => {
          if (!client.firstname) client.firstname = ''
          if (!client.lastname) client.lastname = ''
          return (client.firstname.toLowerCase() + ' ' + client.lastname.toLowerCase()).includes(this.searchQuery.toLowerCase())
        })
      } else {
        // clients = clients.filter(client => {
        //   return this.getActualTasks(client).length > 0
        // })
      }
      try {
        clients = clients.sort((b, a) => {
          const maxB = b.lastMessage.date
          const maxA = a.lastMessage.date
          return maxA < maxB ? -1 : maxA > maxB ? 1 : 0
        })
      } catch (ignoreError) {}
      return clients
    }
  },

  mounted () {
    document.title = 'ULDESK : Чаты'
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
</style>
