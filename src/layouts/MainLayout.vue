<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar class="bg-primary text-white">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          @click="toggleLeftDrawer"
        />
        <q-avatar>
          <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
        </q-avatar>
        <q-toolbar-title>ITdesk</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="logout"
          @click="this.logout"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
          :counter="this.getUnreadChats(link.title)"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useStore } from 'stores/store'

export default {
  name: 'MainLayout',

  components: {
    EssentialLink
  },

  data: () => ({
    linksList: [
      {
        title: 'Мои заявки',
        icon: 'task_alt',
        link: '/my-tasks'
      },
      {
        title: 'Чаты',
        icon: 'forum',
        link: '/chats'
      },
      {
        title: 'Заявки',
        icon: 'task',
        link: '/tasks'
      },
      {
        title: 'Поиск',
        icon: 'search',
        link: '/search'
      },
      {
        title: 'История',
        icon: 'history',
        link: '/history'
      },
      {
        title: 'Аналитика',
        icon: 'data_usage',
        link: '/analytics'
      },
      {
        title: 'АТС',
        icon: 'phone',
        link: '/phone'
      },
      {
        title: 'Настройки',
        icon: 'settings',
        link: '/settings'
      },
      {
        title: 'Пользователи онлайн',
        icon: 'group',
        link: '/users'
      }
    ]
  }),

  methods: {
    logout () {
      axios.get('/logout').then(() => location.reload())
    },

    getUnreadChats (title) {
      if (title === 'Чаты') {
        return this.store.clients
          .filter(client => client.messages.filter(message => !message.read).length > 0)
          .length
      } else {
        return 0
      }
    }
  },

  setup () {
    const leftDrawerOpen = ref(false)

    const router = useRoute()

    const store = useStore()

    return {
      leftDrawerOpen,
      router,
      store,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value
      }
    }
  }
}
</script>
