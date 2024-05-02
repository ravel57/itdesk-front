<template>
  <q-page padding>
    <q-list v-if="this.clients.length > 0">
      <q-input
        v-model="searchQuery"
        filled
        dense
        placeholder="Поиск..."
        @input="search"
      />
      <div
        v-for="client in this.clients"
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
                <q-item-label>{{ client.firstName }} {{ client.lastName}}</q-item-label>
                <q-item-label caption>{{ client.organization }}</q-item-label>
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
      return client.tasks.filter(task => !task.completed)
    },

    search () { }
  },

  computed: {
    clients () {
      const clients = this.store.clients
      clients.forEach(client => {
        client.unreadMessagesCount = client.messages.filter(e => !e.read).length
        client.lastMessageTime = new Date(client.lastMessageTime = Math.max(...client.messages.map(e => e.date)))
          .toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      })
      return clients.sort((b, a) => {
        const maxB = Math.max(...b.messages.map(e => e.date))
        const maxA = Math.max(...a.messages.map(e => e.date))
        return maxA < maxB ? -1 : maxA > maxB ? 1 : 0
      })
    },

    searchResults () {
      if (!this.searchQuery) return []
      const regex = new RegExp(this.searchQuery.trim(), 'i')
      return this.data.filter(item => regex.test(item))
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
