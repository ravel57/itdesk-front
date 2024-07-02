<template>
  <q-layout>
    <q-header elevated>
      <q-toolbar class="bg-primary text-white">
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-item @click="this.$router.push('/')" clickable>
          <q-avatar>
            <img src="/logo.png" alt=""/>
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
          :user="this.store.currentUser"
        />
        <q-item
          v-if="['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
        >
          <q-item-section avatar>
            <q-icon style="align-items: start" name="group"/>
          </q-item-section>
          <q-item-section>
            <q-item-label>Пользователи онлайн:</q-item-label>
            <q-item-label caption style="white-space: pre-wrap;">{{ this.getUsersOnline() }}</q-item-label>
          </q-item-section>
        </q-item>
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
        link: '/chats',
        roles: ['ADMIN', 'OPERATOR', 'OBSERVER']
      },
      {
        title: 'Чат',
        icon: 'forum',
        link: '/chats',
        roles: ['CLIENT']
      },
      {
        title: 'Заявки',
        icon: 'task',
        link: '/tasks',
        roles: ['ADMIN', 'OPERATOR', 'OBSERVER']
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
        link: '/settings',
        roles: ['ADMIN', 'OPERATOR', 'OBSERVER', 'CLIENT']
      },
      {
        title: 'Помощь',
        icon: 'contact_support',
        link: '/help',
        roles: ['ADMIN', 'OPERATOR']
      }
    ]
  }),

  methods: {
    logout () {
      axios.get('/logout')
        .then(() => {
          location.reload()
        })
        .catch(() => {
          location.reload()
        })
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
    },

    getUsersOnline () {
      return this.store.usersOnline.map(user => user.firstname + ' ' + user.lastname).join('\n')
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
