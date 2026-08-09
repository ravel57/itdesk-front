<template>
  <div
    ref="globalAlert"
    v-if="this.globalAlert"
    class="global-alert"
    @click="this.isShowGlobalAlert = true"
  >
    <div
      style="display: flex; flex-direction: row"
    >
      <div
        class="text-h7"
        style="color: white; margin: 8px;width: 100%;"
        v-html="this.globalAlertMessage"
      />
      <q-btn
        v-if="this.isShowGlobalAlert"
        style="padding: 8px; color: white; width: 24px; height: 24px;"
        flat
        round
        dense
        icon="close"
        @click.stop="this.isShowGlobalAlert = false"
      />
    </div>
  </div>
  <q-layout>
    <q-header
      elevated
    >
      <q-toolbar
        v-if="this.$q.screen.width < 1023"
        class="bg-primary text-white"
      >
        <q-btn
          flat
          round
          dense
          icon="menu"
          class="q-mr-sm"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-item
          style="padding: 0"
          @click="this.$router.push('/')"
          clickable
        >
          <q-toolbar-title
            style="padding: 5px 0 0;"
          >
            <logo-component
              style="height: 35px"
            />
          </q-toolbar-title>
        </q-item>
        <q-space/>
        <notification-bell v-if="canUseNotifications" button-color="white"/>
      </q-toolbar>
    </q-header>
    <div
      style="position: fixed; height: 100%; z-index: 6000;"
    >
      <q-drawer
        v-model="leftDrawerOpen"
        show-if-above
        bordered
        style="position: relative"
        :mini="miniState"
        :width="300"
        :breakpoint="500"
      >
        <div
          class="main-navigation"
          :class="{ 'main-navigation--mini': miniState }"
        >
          <q-list
            v-if="this.$q.screen.width > 1023"
            class="main-navigation__header"
          >
            <q-item
              clickable
              style="overflow-x: hidden"
              @click="toggleLeftDrawer"
            >
              <q-item-section
                avatar
              >
                <q-icon
                  style="align-items: start;"
                  name="menu"/>
                <div
                  style="width: 71%;
                  position: absolute;
                  margin-left: 55px;
                  background-color: #5c35f9;
                  border-radius: 4px;
                  justify-items: center;
                  display: flex;
                  justify-content: center;
                  align-items: center;"
                  @click.stop="this.$router.push({ path: `/chats` })"
                >
                  <logo-component style="height: 35px;padding: 5px;"/>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
          <q-list class="main-navigation__scroll">
          <essential-link
            v-for="link in linksList"
            :key="link.title"
            v-bind="link"
            :counter="this.getLinkCounter(link.title)"
            :user="this.store.currentUser"
            :miniState="this.miniState"
          />
          <q-item
            v-if="canSeeOnlineUsers"
          >
            <q-item-section avatar>
              <q-icon
                style="align-items:start"
                name="group"
              />
              <circle-counter
                v-if="this.miniState"
                :counter="this.operatorUsersOnline.length"
                class="mini-counter"
              />
            </q-item-section>
            <q-item-section style="position: absolute;margin-left: 55px;">
              <q-item-label>Операторы онлайн:</q-item-label>
              <q-item-label caption style="white-space: pre-wrap;">{{ this.formatUsersOnline(this.operatorUsersOnline) }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item
            v-if="canSeeOnlineUsers && this.observerUsersOnline.length > 0"
          >
            <q-item-section avatar>
              <q-icon
                style="align-items:start"
                name="visibility"
              />
              <circle-counter
                v-if="this.miniState"
                :counter="this.observerUsersOnline.length"
                class="mini-counter"
              />
            </q-item-section>
            <q-item-section style="position: absolute;margin-left: 55px;">
              <q-item-label>Менеджеры организаций онлайн:</q-item-label>
              <q-item-label caption style="white-space: pre-wrap;">{{ this.formatUsersOnline(this.observerUsersOnline) }}</q-item-label>
            </q-item-section>
          </q-item>
          </q-list>
          <q-list class="main-navigation__footer">
            <q-item v-if="this.store.currentUser.lastname">
              <q-item-section avatar>
                <div
                  style="background-color: var(--q-primary);
                      border-radius: 100%;
                      color: white;
                      width: 25px;
                      height: 25px;
                      align-content: center !important;
                      position: relative;
                  "
                >
                  <q-item-label style="position: absolute;top: 5px;right: 8px; display: flex !important;">{{ (this.store.currentUser.lastname).slice(0, 1).toUpperCase() }}</q-item-label>
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label style="white-space: pre-wrap;">{{ this.store.currentUser.lastname + ' ' + this.store.currentUser.firstname}}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item
              clickable
              @click="this.logout"
            >
              <q-item-section avatar>
                <q-icon style="align-items: start" name="logout"/>
              </q-item-section>
              <q-item-section>
                <q-item-label>Выход</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-drawer>
    </div>
    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script>
import EssentialLink from 'components/EssentialLink.vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useStore } from 'stores/store'
import CircleCounter from 'components/CircleCounter.vue'
import LogoComponent from 'components/Logo.vue'
import NotificationBell from 'components/notifications/NotificationBell.vue'
import { onTaskUpdated } from 'src/util/ws'

export default {
  name: 'MainLayout',

  components: {
    NotificationBell,
    CircleCounter,
    LogoComponent,
    EssentialLink
  },

  data: () => ({
    linksList: [
      {
        title: 'Чаты',
        icon: 'forum',
        link: '/chats',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']
      },
      {
        title: 'Мои заявки',
        icon: 'task',
        link: '/my-tasks',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR']
      },
      {
        title: 'Заявки моих линий',
        icon: 'support_agent',
        link: '/my-lines',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR']
      },
      {
        title: 'Чат',
        icon: 'forum',
        link: '/chats',
        roles: ['CLIENT']
      },
      {
        title: 'Список заявок',
        icon: 'find_in_page',
        link: '/tasks',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']
      },
      {
        title: 'Инциденты',
        icon: 'crisis_alert',
        link: '/incidents',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']
      },
      {
        title: 'Организации',
        icon: 'store',
        link: '/orgs',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR']
      },
      {
        title: 'Поиск',
        icon: 'search',
        link: '/search',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR']
      },
      // {
      //   title: 'История',
      //   icon: 'history',
      //   link: '/history',
      //   roles: ['ADMIN', 'MANAGER', 'OPERATOR']
      // },
      {
        title: 'Аналитика',
        icon: 'data_usage',
        link: '/analytics',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']
      },
      // {
      //   title: 'Телефония',
      //   icon: 'phone',
      //   link: '/phone'
      // },
      {
        title: 'База знаний',
        icon: 'menu_book',
        link: '/knowledge-base',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR']
      },
      {
        title: 'Настройки',
        icon: 'settings',
        link: '/settings',
        roles: ['ADMIN', 'OPERATOR', 'MANAGER', 'OBSERVER', 'CLIENT']
      },
      // {
      //   title: 'Помощь',
      //   icon: 'contact_support',
      //   link: '/help',
      //   roles: ['ADMIN', 'MANAGER', 'OPERATOR']
      // }
    ],
    globalAlert: false,
    isShowGlobalAlert: false,
    globalAlertMessage: '',
    leftDrawerOpen: false,
    miniState: true,
    myTasksCounter: 0,
    incidentsCounter: 0,
    myTasksCounterInterval: null,
    myTasksCounterReloadTimer: null,
    taskUpdatedUnsubscribe: null,
  }),

  computed: {
    canUseNotifications () {
      const authorities = Array.isArray(this.store.currentUser?.authorities)
        ? this.store.currentUser.authorities
        : []
      return ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']
        .some(role => authorities.includes(role))
    },

    canSeeOnlineUsers () {
      const authorities = Array.isArray(this.store.currentUser?.authorities)
        ? this.store.currentUser.authorities
        : []
      return ['ADMIN', 'MANAGER', 'OPERATOR']
        .some(role => authorities.includes(role))
    },

    operatorUsersOnline () {
      return (this.store.usersOnline || [])
        .filter(user => !this.isObserverUser(user))
    },

    observerUsersOnline () {
      return (this.store.usersOnline || [])
        .filter(user => this.isObserverUser(user))
    }
  },

  methods: {
    logout () {
      axios.post('/api/v1/user-offline', this.store.currentUser)
        .then(() => {
          axios.get('/logout')
            .then(() => location.reload())
            .catch(() => location.reload())
        })
        .catch(() => {
          axios.get('/logout')
            .then(() => location.reload())
            .catch(() => location.reload())
        })
    },

    getLinkCounter (title) {
      if (title === 'Чаты') {
        try {
          const messageCounter = this.store.clients
            .filter(client => client.unreadMessagesCount > 0)
            .length
          return this.formatCounter(messageCounter)
        } catch (e) {
          return 0
        }
      }

      if (title === 'Мои заявки') {
        return this.formatCounter(this.myTasksCounter)
      }

      if (title === 'Инциденты') {
        return this.formatCounter(this.incidentsCounter)
      }

      return 0
    },

    formatCounter (counter) {
      const normalizedCounter = Number(counter) || 0
      return this.miniState && normalizedCounter > 9 ? '9+' : normalizedCounter
    },

    async loadMyTasksCounter () {
      try {
        const response = await axios.post('/api/v1/tasks-page', {
          page: 1,
          size: 1,
          search: '',
          includeCompleted: false,
          sortSlug: 'creating',
          ascendingSort: false,
          filterJoinOperator: 'AND',
          filterChain: [{
            label: 'Исполнитель',
            slug: 'executor',
            selectedOptions: ['Вы'],
            isBeforeDeadline: false
          }],
          requiredFilterChain: []
        })

        this.myTasksCounter = Number(response.data?.totalElements) || 0
      } catch (e) {
        this.myTasksCounter = 0
      }
    },

    scheduleMyTasksCounterReload () {
      if (this.myTasksCounterReloadTimer) {
        clearTimeout(this.myTasksCounterReloadTimer)
      }

      this.myTasksCounterReloadTimer = setTimeout(() => {
        this.myTasksCounterReloadTimer = null
        this.loadMyTasksCounter()
      }, 150)
    },

    async loadIncidentsCounter () {
      try {
        const response = await axios.post('/api/v1/incidents-page', {
          page: 1,
          size: 1,
          search: '',
          includeClosed: false
        })
        this.incidentsCounter = Number(response.data?.totalElements) || 0
      } catch (e) {
        this.incidentsCounter = 0
      }
    },

    isObserverUser (user) {
      const authorities = Array.isArray(user?.authorities) ? user.authorities : []
      return authorities.includes('OBSERVER')
    },

    formatUsersOnline (users) {
      return (users || [])
        .map(user => `${user?.lastname || ''} ${user?.firstname || ''}`.trim())
        .filter(Boolean)
        .join('\n')
    },

    isMobile () {
      return this.$q.screen.width < 1023
    },

    toggleLeftDrawer () {
      if (this.isMobile()) {
        this.leftDrawerOpen = !this.leftDrawerOpen
      } else {
        this.miniState = !this.miniState
        localStorage.setItem('miniState', this.miniState.toString())
      }
    }
  },

  watch: {
    '$route.path' (newPath, oldPath) {
      if (newPath !== oldPath && this.store.checkedTasks.length > 0) {
        this.store.checkedTasks = []
      }
    },
    miniState: {
      deep: true,
      handler () {
        this.store.miniState = this.miniState
      }
    },
    isShowGlobalAlert: {
      immediate: true,
      deep: true,
      handler () {
        if (this.globalAlert) {
          if (this.isShowGlobalAlert) {
            this.$refs.globalAlert.style.height = 'min-content'
            this.$refs.globalAlert.style.cursor = 'unset'
          } else {
            this.$refs.globalAlert.style.height = '8px'
            this.$refs.globalAlert.style.cursor = 'pointer'
          }
        }
      }
    }
  },

  mounted () {
    this.miniState = localStorage.getItem('miniState') !== 'false'
    this.loadMyTasksCounter()
    this.loadIncidentsCounter()
    this.taskUpdatedUnsubscribe = onTaskUpdated(() => {
      this.scheduleMyTasksCounterReload()
    })
    this.myTasksCounterInterval = setInterval(() => {
      this.loadMyTasksCounter()
      this.loadIncidentsCounter()
    }, 30000)

    setInterval(() => {
      this.globalAlertMessage = this.store.globalAlertMessage.text
      if (this.globalAlertMessage) {
        this.globalAlert = true
      }
    }, 5000)
  },

  beforeUnmount () {
    if (this.myTasksCounterInterval) {
      clearInterval(this.myTasksCounterInterval)
    }
    if (this.myTasksCounterReloadTimer) {
      clearTimeout(this.myTasksCounterReloadTimer)
    }
    if (this.taskUpdatedUnsubscribe) {
      this.taskUpdatedUnsubscribe()
      this.taskUpdatedUnsubscribe = null
    }
  },

  setup () {
    const router = useRoute()
    const store = useStore()
    return {
      router,
      store
    }
  }
}
</script>

<style scoped>

.main-navigation {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.main-navigation__header {
  flex: 0 0 auto;
  position: relative;
  z-index: 1;
  background: white;
}

.main-navigation__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.main-navigation--mini .main-navigation__scroll {
  scrollbar-gutter: auto;
  scrollbar-width: none;
}

.main-navigation--mini .main-navigation__scroll::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.main-navigation__footer {
  flex: 0 0 auto;
  background: white;
}

.global-alert {
  cursor: pointer;
  overflow: hidden;
  z-index: 6001;
  top: 0;
  position: absolute;
  min-height: 8px;
  height: 8px;
  min-width: 100%;
  width: 100%;
  background-color: rgba(236, 8, 8, 1);
}

.mini-counter {
  position: absolute !important;
  height: 12px !important;
  width: 12px !important;
  font-size: 9px !important;
  margin-left: 15px !important;
  background-color: var(--q-primary) !important;
  top: 8px !important;
}
</style>
