<template>
  <q-page padding>
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
            <q-item-section>
              <router-link
                :to="`/chats/${client.id}`"
                style="text-decoration: none; display: flex"
                class="text-primary"
              >
                <q-item-section>
                  <q-item-label>{{ client.firstname }} {{ client.lastname }}</q-item-label>
                  <q-item-label caption>{{ this.getOrganization(client) }}</q-item-label>
                  <q-item-label caption>{{ client.lastMessageTime }}</q-item-label>
                  <div class="flex items-end">
                    <q-item-label caption>
                      Заявок: {{ this.getActualTasks(client).length }}
                    </q-item-label>
                    <q-linear-progress
                      v-if="this.getActualTasks(client).length > 0 && this.getActualTasks(client).filter(task => task.sla !== null).length > 0"
                      :value="this.getSlaPercent(this.getActualTasks(client))"
                      reverse
                      class="q-mt-sm"
                      style="width: 80px; margin-left: 16px; border: solid 1px darkgray"
                      size="8px"
                      :color="this.getSlaColor(this.getActualTasks(client))"
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
                </q-item-section>
                <q-item-section
                  side
                  style="display: flex; flex-direction: row; align-content: center;"
                >
                  <q-icon
                    v-if="client.tasks.filter(task => task.priority.critical && !task.completed).length > 0"
                    name="priority_high"
                    class="text-red"
                  />
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
    <div
      v-else
      class="text-h3 absolute-center text-primary"
      v-text="'Чатов нет'"
    />
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'
import CircleCounter from 'components/CircleCounter.vue'
import moment from 'moment'
// import moment from 'moment/moment'

export default {
  name: 'DialogsPage',

  components: { CircleCounter },

  data: () => ({
    searchQuery: ''
  }),

  methods: {
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

    getSlaPercent (tasks) {
      const task = tasks.sort((b, a) => a.sla.duration < b.sla.duration ? -1 : a.sla.duration > b.sla.duration ? 1 : 0)[tasks.length - 1]
      return this.getSlaHours(task) / (task.sla.duration.days() * 24 + task.sla.duration.hours())
    },

    getSlaColor (tasks) {
      const task = tasks.sort((b, a) => a.sla.duration < b.sla.duration ? -1 : a.sla.duration > b.sla.duration ? 1 : 0)[tasks.length - 1]
      if (this.getSlaHours(task) / (task.sla.duration.days() * 24 + task.sla.duration.hours()) > 0.5) {
        return 'green'
      } else if (this.getSlaHours(task) / (task.sla.duration.days() * 24 + task.sla.duration.hours()) > 0.25) {
        return 'orange'
      } else {
        return 'red'
      }
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
      clients = clients.sort((b, a) => {
        const maxB = Math.max(...b.messages.map(e => e.date))
        const maxA = Math.max(...a.messages.map(e => e.date))
        return maxA < maxB ? -1 : maxA > maxB ? 1 : 0
      })
      clients.forEach(client => {
        client.unreadMessagesCount = client.messages.filter(e => !e.read).length
        client.lastMessageTime = new Date(Math.max(...client.messages.map(e => e.date)))
          .toLocaleTimeString('ru-RU', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
      })
      return clients
    }
  },

  setup () {
    const store = useStore()
    return {
      store
    }
  }
}
</script>
