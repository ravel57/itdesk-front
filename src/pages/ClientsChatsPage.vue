<template>
  <q-page padding>
    <q-list v-if="this.clients.length > 0">
      <div v-for="(client, index) in this.clients" :key="index">
        <q-item clickable>
          <q-item-section>
            <router-link
              :to="`/chats/${client.id}`"
              style="text-decoration: none;"
              class="text-primary"
              @click="onClientSelected(client)"
            >
              <q-item-section>
                  <q-item-label>{{ client.firstName }} {{ client.lastName}}</q-item-label>
                <q-item-label caption>{{ client.organization }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption side>{{ client.lastMessageTime }}</q-item-label>
                <q-item-label caption>Заявок: {{ client.tasks.length }}</q-item-label>
              </q-item-section>
            </router-link>
          </q-item-section>
        </q-item>
        <q-separator/>
      </div>
    </q-list>
    <div v-else class="text-h3 absolute-center text-primary" v-text="'Чатов нет'"/>
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'

export default {
  name: 'DialogsPage',

  methods: {
    onClientSelected (client) {
      this.store.selectedClient = client
    }
  },

  computed: {
    clients () {
      return this.store.clients
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
