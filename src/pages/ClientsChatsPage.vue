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
              @click="onClientSelected(client)"
            >
              <q-item-section>
                <q-item-label>{{ client.firstName }} {{ client.lastName}}</q-item-label>
                <q-item-label caption>{{ client.organization }}</q-item-label>
                <q-item-label caption>{{ client.lastMessageTime }}</q-item-label>
                <q-item-label caption>Заявок: {{ getActualTasks.length }}</q-item-label>
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
    onClientSelected (client) {
      this.store.selectedClient = client
    },

    getActualTasks () {
      this.client.tasks.filter(task => !task.completed)
    },

    search () { }
  },

  computed: {
    clients () {
      this.store.clients.forEach(client => {
        client.unreadMessagesCount = client.messages.filter(e => !e.read).length
      })
      return this.store.clients
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
