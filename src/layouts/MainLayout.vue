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
        <q-item @click="this.$router.push('/')" clickable>
          <q-avatar>
            <img src="logo.png" />
          </q-avatar>
          <q-toolbar-title>ITdesk</q-toolbar-title>
        </q-item>
        <div class="q-ml-auto no-padding">
          <q-btn
            flat
            round
            dense
            side
            icon="logout"
            @click="this.logout"
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <essential-link
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
      // {
      //   title: 'Мои заявки',
      //   icon: 'task_alt',
      //   link: '/my-tasks'
      // },
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
      // {
      //   title: 'Поиск',
      //   icon: 'search',
      //   link: '/search'
      // },
      // {
      //   title: 'История',
      //   icon: 'history',
      //   link: '/history'
      // },
      // {
      //   title: 'Аналитика',
      //   icon: 'data_usage',
      //   link: '/analytics'
      // },
      // {
      //   title: 'АТС',
      //   icon: 'phone',
      //   link: '/phone'
      // },
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
      axios.get('/logout')
        .then(() => location.reload())
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
    },

    getUnreadChats (title) {
      if (title === 'Чаты') {
        try {
          return this.store.clients
            .filter(client => client.messages.filter(message => !message.read).length > 0)
            .length
        } catch (e) {
          return 0
        }
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
