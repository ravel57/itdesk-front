<template>
  <q-page padding>
    <div v-if="this.getSortedAndFilteredClients.length > 0">
    <q-input
      v-model="searchQuery"
      dense
      placeholder="Поиск..."
      @input="search"
    >
      <template v-slot:append>
        <q-icon name="close" @click="searchQuery = ''" class="cursor-pointer"/>
      </template>
    </q-input>
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
                <q-item-label caption>{{ getOrganization(client) }}</q-item-label>
                <q-item-label caption>{{ client.lastMessageTime }}</q-item-label>
                <q-item-label caption>Заявок: {{ getActualTasks(client).length }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <circle-counter :counter="client.unreadMessagesCount"/>
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
