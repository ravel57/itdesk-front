<template>
  <div :class="{'notification-bell--drawer': drawer}">
    <q-item
      v-if="drawer"
      clickable
      class="notification-drawer-item"
      @click.stop="toggleMenu"
    >
      <q-item-section avatar>
        <div class="notification-icon-wrap">
          <q-icon name="notifications" size="24px"/>
          <q-badge
            v-if="unreadCount > 0"
            color="negative"
            rounded
            floating
            class="notification-badge notification-badge--drawer"
          >
            {{ badgeText }}
          </q-badge>
        </div>
      </q-item-section>
      <q-item-section v-if="!mini">
        <q-item-label>Уведомления</q-item-label>
        <q-item-label caption>
          {{ unreadCount > 0 ? `Непрочитанных: ${unreadCount}` : 'Новых нет' }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-btn
      v-else
      flat
      round
      dense
      :color="buttonColor"
      icon="notifications"
      aria-label="Уведомления"
      @click.stop="toggleMenu"
    >
      <q-badge
        v-if="unreadCount > 0"
        color="negative"
        rounded
        floating
        class="notification-badge"
      >
        {{ badgeText }}
      </q-badge>
      <q-tooltip>Уведомления</q-tooltip>
    </q-btn>

    <q-menu
      v-model="menuOpen"
      no-parent-event
      :anchor="drawer ? 'top right' : 'bottom right'"
      :self="drawer ? 'top left' : 'top right'"
      :offset="drawer ? [8, 0] : [0, 8]"
      class="notification-menu"
      @show="reload"
    >
      <q-card class="notification-card">
        <q-card-section class="notification-header row items-center no-wrap">
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">Уведомления</div>
            <div class="text-caption text-grey-7">История уведомлений</div>
          </div>
          <q-btn
            v-if="unreadCount > 0"
            flat
            dense
            no-caps
            color="primary"
            label="Прочитать все"
            :loading="markingAll"
            @click.stop="markAllRead"
          />
        </q-card-section>

        <q-separator/>

        <q-tabs
          v-model="filter"
          dense
          align="left"
          active-color="primary"
          indicator-color="primary"
          narrow-indicator
          class="text-grey-7"
        >
          <q-tab name="all" label="Все" no-caps/>
          <q-tab name="unread" :label="`Непрочитанные${unreadCount ? ` (${unreadCount})` : ''}`" no-caps/>
        </q-tabs>

        <q-separator/>

        <q-scroll-area class="notification-list-scroll">
          <q-list separator>
            <q-item
              v-for="notification in visibleNotifications"
              :key="notification.id || `${notification.event}-${notification.createdAt}`"
              clickable
              v-ripple
              :class="{'notification-item--unread': !notification.read}"
              @click="openNotification(notification)"
            >
              <q-item-section avatar top>
                <q-avatar
                  size="38px"
                  :color="eventColor(notification.event)"
                  text-color="white"
                  :icon="eventIcon(notification.event)"
                />
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ eventLabel(notification.event) }}
                </q-item-label>
                <q-item-label caption class="notification-body">
                  {{ notification.body || notification.message || 'Новое уведомление' }}
                </q-item-label>
                <q-item-label caption class="q-mt-xs text-grey-6">
                  {{ formatDate(notification.createdAt) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side top class="notification-item-side">
                <div v-if="!notification.read" class="unread-dot"/>
                <q-icon
                  name="chevron_right"
                  size="20px"
                  color="grey-6"
                  class="q-mt-xs"
                />
              </q-item-section>
            </q-item>
          </q-list>

          <div
            v-if="!loading && visibleNotifications.length === 0"
            class="notification-empty"
          >
            <q-icon name="notifications_none" size="42px" color="grey-5"/>
            <div class="text-body2 text-grey-7 q-mt-sm">
              {{ filter === 'unread' ? 'Непрочитанных уведомлений нет' : 'История уведомлений пока пуста' }}
            </div>
          </div>

          <div v-if="loading" class="notification-loading">
            <q-spinner color="primary" size="28px"/>
          </div>
        </q-scroll-area>

        <template v-if="!loading && !endReached && visibleNotifications.length > 0">
          <q-separator/>
          <q-card-actions align="center">
            <q-btn
              flat
              no-caps
              color="primary"
              label="Показать ещё"
              @click="loadMore"
            />
          </q-card-actions>
        </template>
      </q-card>
    </q-menu>
  </div>
</template>

<script>
import {useStore} from 'stores/store'

export default {
  name: 'NotificationBell',

  props: {
    drawer: {
      type: Boolean,
      default: false
    },
    mini: {
      type: Boolean,
      default: false
    },
    buttonColor: {
      type: String,
      default: 'white'
    }
  },

  data: () => ({
    menuOpen: false,
    filter: 'all',
    markingAll: false,
    pageSize: 20
  }),

  computed: {
    unreadCount () {
      return Number(this.store.userNotificationsUnreadCount) || 0
    },

    badgeText () {
      return this.unreadCount > 99 ? '99+' : String(this.unreadCount)
    },

    loading () {
      return Boolean(this.store.userNotificationsLoading)
    },

    endReached () {
      return Boolean(this.store.userNotificationsEnd)
    },

    visibleNotifications () {
      const notifications = Array.isArray(this.store.userNotifications)
        ? this.store.userNotifications
        : []
      if (this.filter === 'unread') {
        return notifications.filter(notification => !notification.read)
      }
      return notifications
    }
  },

  watch: {
    filter () {
      if (this.menuOpen) {
        this.reload()
      }
    }
  },

  mounted () {
    this.reload()
  },

  methods: {
    toggleMenu () {
      this.menuOpen = !this.menuOpen
    },

    reload () {
      return this.store.fetchUserNotifications({
        page: 1,
        size: this.pageSize,
        unreadOnly: this.filter === 'unread',
        append: false
      }).catch(error => {
        console.error('Не удалось загрузить уведомления', error)
      })
    },

    loadMore () {
      if (this.loading || this.endReached) {
        return
      }
      return this.store.fetchUserNotifications({
        page: (Number(this.store.userNotificationsPage) || 1) + 1,
        size: this.pageSize,
        unreadOnly: this.filter === 'unread',
        append: true
      }).catch(error => {
        console.error('Не удалось загрузить следующую страницу уведомлений', error)
      })
    },

    markRead (notification) {
      if (!notification?.id || notification.read) {
        return Promise.resolve()
      }
      return this.store.markUserNotificationRead(notification.id)
        .catch(error => {
          console.error('Не удалось отметить уведомление прочитанным', error)
        })
    },

    async openNotification (notification) {
      await this.markRead(notification)

      const route = this.notificationRoute(notification)
      this.menuOpen = false
      if (!route) {
        return
      }

      const resolved = this.$router.resolve(route)
      if (resolved.fullPath === this.$route.fullPath) {
        return
      }
      this.$router.push(route).catch(() => {})
    },

    notificationRoute (notification) {
      switch (notification?.event) {
        case 'MENTIONED_USER':
        case 'CHAT_UNANSWERED_TOO_LONG':
          return {path: '/chats'}
        case 'NEW_TASK':
          return {path: '/my-tasks'}
        case 'MENTIONED_USER_IN_TASK_CHAT':
        case 'NEW_CHAT_MESSAGE':
        case 'SLA_HALF_TIME_PASSED':
        case 'SLA_OVERDUE':
        case 'DEADLINE_SOON':
        case 'DEADLINE_OVERDUE':
          return {path: '/tasks'}
        case 'INCIDENT_UPDATE_OVERDUE':
          return {path: '/incidents'}
        default:
          return null
      }
    },

    markAllRead () {
      this.markingAll = true
      this.store.markAllUserNotificationsRead()
        .then(() => {
          if (this.filter === 'unread') {
            return this.reload()
          }
          return null
        })
        .catch(error => {
          console.error('Не удалось отметить уведомления прочитанными', error)
        })
        .finally(() => {
          this.markingAll = false
        })
    },

    eventLabel (event) {
      return {
        MENTIONED_USER: 'Упоминание в чате',
        MENTIONED_USER_IN_TASK_CHAT: 'Упоминание в заявке',
        NEW_TASK: 'Новая заявка',
        NEW_CHAT_MESSAGE: 'Новое сообщение',
        SLA_HALF_TIME_PASSED: 'Риск нарушения SLA',
        SLA_OVERDUE: 'SLA нарушен',
        CHAT_UNANSWERED_TOO_LONG: 'Чат без ответа',
        DEADLINE_SOON: 'Приближается дедлайн',
        DEADLINE_OVERDUE: 'Дедлайн нарушен',
        INCIDENT_UPDATE_OVERDUE: 'Обновление инцидента просрочено'
      }[event] || 'Уведомление'
    },

    eventIcon (event) {
      return {
        MENTIONED_USER: 'alternate_email',
        MENTIONED_USER_IN_TASK_CHAT: 'alternate_email',
        NEW_TASK: 'assignment_turned_in',
        NEW_CHAT_MESSAGE: 'chat',
        SLA_HALF_TIME_PASSED: 'timer',
        SLA_OVERDUE: 'timer_off',
        CHAT_UNANSWERED_TOO_LONG: 'mark_chat_unread',
        DEADLINE_SOON: 'event',
        DEADLINE_OVERDUE: 'event_busy',
        INCIDENT_UPDATE_OVERDUE: 'crisis_alert'
      }[event] || 'notifications'
    },

    eventColor (event) {
      if (['SLA_OVERDUE', 'DEADLINE_OVERDUE', 'INCIDENT_UPDATE_OVERDUE'].includes(event)) {
        return 'negative'
      }
      if (['SLA_HALF_TIME_PASSED', 'DEADLINE_SOON', 'CHAT_UNANSWERED_TOO_LONG'].includes(event)) {
        return 'warning'
      }
      return 'primary'
    },

    formatDate (value) {
      if (!value) {
        return ''
      }
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) {
        return ''
      }

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const notificationDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayDiff = Math.round((today - notificationDay) / 86400000)
      const time = new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)

      if (dayDiff === 0) {
        return `Сегодня, ${time}`
      }
      if (dayDiff === 1) {
        return `Вчера, ${time}`
      }
      return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    }
  },

  setup () {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.notification-bell--drawer {
  width: 100%;
}

.notification-drawer-item {
  min-height: 50px;
  overflow: visible;
}

.notification-icon-wrap {
  position: relative;
  width: 24px;
  height: 24px;
}

.notification-badge {
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 17px;
}

.notification-badge--drawer {
  top: -8px;
  right: -12px;
}

.notification-card {
  width: 390px;
  max-width: calc(100vw - 24px);
}

.notification-header {
  min-height: 68px;
}

.notification-list-scroll {
  height: min(480px, calc(100vh - 210px));
}

.notification-item--unread {
  background: rgba(92, 53, 249, 0.06);
}

.notification-item-side {
  min-width: 24px;
  align-items: center;
}

.notification-body {
  white-space: normal;
  line-height: 1.35;
  color: #4d4d4d;
}

.unread-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--q-primary);
  margin-top: 6px;
}

.notification-empty,
.notification-loading {
  min-height: 230px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}

@media (max-width: 600px) {
  .notification-card {
    width: calc(100vw - 16px);
  }

  .notification-list-scroll {
    height: calc(100vh - 210px);
  }
}
</style>
