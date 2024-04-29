<template>
  <q-page padding>
    <q-list>
      <q-item clickable v-for="(client, index) in store.clients" :key="index">
        <q-item-section>
          <router-link
            :to="`/dialogs/${client.id}`"
            style="text-decoration: none;"
            class="text-primary"
            @click="onClientSelected(client)"
          >
            <q-item-section>
              <q-item-label>{{ client.name }}</q-item-label>
              <q-item-label caption>{{ client.lastMessage }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>{{ client.lastMessageTime }}</q-item-label>
              <q-item-label caption>{{ client.tasks.length }} заявок</q-item-label>
            </q-item-section>
          </router-link>
        </q-item-section>
        <q-separator/>
      </q-item>
    </q-list>
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

  setup () {
    const store = useStore()
    return {
      store
    }
  }
}
</script>
