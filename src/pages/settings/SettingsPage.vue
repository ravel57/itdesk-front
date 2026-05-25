<template>
  <q-page class="settings-page">
    <div v-if="isMobile" class="settings-mobile-layout">
      <div v-if="mobileMenuOpen" class="settings-mobile-menu">
        <div class="settings-mobile-title">
          Настройки
        </div>

        <q-list class="settings-mobile-list">
          <q-item
            v-for="item in visibleMenuItems"
            :key="item.link"
            clickable
            v-ripple
            :active="isCurrentMenuItem(item)"
            active-class="settings-mobile-item--active"
            class="settings-mobile-item"
            @click="openMobileSection(item)"
          >
            <q-item-section>
              <q-item-label class="settings-mobile-item-title">
                {{ item.title }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" class="settings-mobile-item-icon" />
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div v-else class="settings-mobile-content">
        <div class="settings-mobile-header">
          <q-btn
            flat
            round
            dense
            icon="arrow_back"
            class="settings-mobile-back"
            @click="showMobileMenu"
          />
          <div class="settings-mobile-header-title">
            {{ currentSectionTitle }}
          </div>
        </div>

        <div class="settings-mobile-view">
          <router-view />
        </div>
      </div>
    </div>

    <div v-else class="settings-desktop-layout row">
      <div class="settings-desktop-menu col-3">
        <q-list>
          <essential-link
            v-for="(item, index) in menuItems"
            :key="index"
            v-bind="item"
            :user="this.store.currentUser"
          />
        </q-list>
      </div>
      <div class="settings-desktop-content col">
        <router-view />
      </div>
    </div>
  </q-page>
</template>

<script>
import EssentialLink from 'components/EssentialLink.vue'
import { useStore } from 'stores/store'

export default {
  name: 'SettingsPage',

  components: { EssentialLink },

  data: () => ({
    mobileMenuOpen: false,
    menuItems: [
      {
        title: 'Профиль',
        link: '/settings/profile',
        slug: 'profile',
        roles: ['ADMIN', 'OPERATOR', 'OBSERVER', 'CLIENT']
      },
      {
        title: 'Общее',
        link: '/settings/general',
        slug: 'general',
        roles: ['ADMIN']
      },
      {
        title: 'Пользователи',
        link: '/settings/users',
        slug: 'users',
        roles: ['ADMIN']
      },
      {
        title: 'Организации',
        link: '/settings/organizations',
        slug: 'organizations',
        roles: ['ADMIN']
      },
      {
        title: 'Теги',
        link: '/settings/tags',
        slug: 'tags',
        roles: ['ADMIN']
      },
      {
        title: 'Приоритеты',
        link: '/settings/priorities',
        slug: 'priorities',
        roles: ['ADMIN']
      },
      {
        title: 'Статусы',
        link: '/settings/statuses',
        slug: 'statuses',
        roles: ['ADMIN']
      },
      {
        title: 'Шаблоны',
        link: '/settings/templates',
        slug: 'templates',
        roles: ['ADMIN']
      },
      // { title: 'Макросы',
      // link: '/settings/macros', s
      // lug: 'macros'
      // },
      {
        title: 'SLA',
        link: '/settings/sla',
        slug: 'sla',
        roles: ['ADMIN']
      },
      {
        title: 'Типы заявок и чек-листы',
        link: '/settings/task-types',
        slug: 'playlist_add_check',
        roles: ['ADMIN']
      },
      {
        title: 'Telegram',
        link: '/settings/telegram',
        slug: 'telegram',
        roles: ['ADMIN']
      },
      {
        title: 'WhatsApp',
        link: '/settings/whatsapp',
        slug: 'whatsapp',
        roles: ['ADMIN']
      },
      {
        title: 'Электронная почта',
        link: '/settings/email',
        slug: 'email',
        roles: ['ADMIN']
      },
      // {
      //   title: 'ИИ-агент',
      //   link: '/settings/ai-agent',
      //   slug: 'ai-agent',
      //   roles: ['ADMIN']
      // },
      {
        title: 'Автоматизации',
        link: '/settings/automatization',
        slug: 'automatization',
        roles: ['ADMIN']
      },
      {
        title: 'Плагины',
        link: '/settings/plugins',
        slug: 'plugins',
        roles: ['ADMIN']
      },
      {
        title: 'Лицензия',
        link: '/settings/license',
        slug: 'license',
        roles: ['ADMIN']
      },
      {
        title: 'Экспорт',
        link: '/settings/export',
        slug: 'export',
        roles: ['ADMIN']
      }
    ]
  }),

  computed: {
    isMobile () {
      return this.$q.screen.lt.md
    },

    visibleMenuItems () {
      return this.menuItems.filter(item => this.canShowMenuItem(item))
    },

    currentMenuItem () {
      const currentPath = this.normalizePath(this.$route.path)
      return [...this.visibleMenuItems]
        .sort((a, b) => b.link.length - a.link.length)
        .find(item => currentPath === this.normalizePath(item.link) || currentPath.startsWith(`${this.normalizePath(item.link)}/`)) || null
    },

    currentSectionTitle () {
      return this.currentMenuItem?.title || 'Настройки'
    },

    isSettingsRootRoute () {
      const currentPath = this.normalizePath(this.$route.path)
      return currentPath === '/settings'
    }
  },

  watch: {
    isMobile: {
      immediate: true,
      handler (value) {
        if (value) {
          this.mobileMenuOpen = this.isSettingsRootRoute
        }
      }
    },

    '$route.path' () {
      if (!this.isMobile) {
        return
      }
      this.mobileMenuOpen = this.isSettingsRootRoute
    }
  },

  mounted () {
    document.title = 'ULDESK : Настройки'
  },

  methods: {
    openMobileSection (item) {
      this.mobileMenuOpen = false
      if (this.normalizePath(this.$route.path) !== this.normalizePath(item.link)) {
        this.$router.push(item.link)
      }
    },

    showMobileMenu () {
      this.mobileMenuOpen = true
    },

    isCurrentMenuItem (item) {
      const currentPath = this.normalizePath(this.$route.path)
      const itemPath = this.normalizePath(item.link)
      return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
    },

    canShowMenuItem (item) {
      if (!item.roles || !item.roles.length) {
        return true
      }

      const authorities = this.store.currentUser?.authorities || this.store.currentUser?.roles || []
      return item.roles.some(role => authorities.includes(role) || authorities.includes(`ROLE_${role}`))
    },

    normalizePath (path) {
      if (!path) {
        return ''
      }
      const normalized = String(path).trim().replace(/\/+$/, '')
      return normalized || '/'
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style scoped>
.settings-page {
  background: #f5f6fa;
}

.settings-desktop-layout {
  min-height: 100vh;
  background: #ffffff;
}

.settings-desktop-menu {
  min-width: fit-content;
  background: #ffffff;
}

.settings-desktop-content {
  min-width: 0;
  border-left: solid #e0e0e0;
  background: #ffffff;
}

.settings-mobile-layout {
  min-height: 100vh;
  background: #f5f6fa;
}

.settings-mobile-menu {
  min-height: 100vh;
  background: #ffffff;
}

.settings-mobile-title {
  padding: 22px 20px 14px;
  font-size: 24px;
  font-weight: 700;
  color: #252b36;
  border-bottom: 1px solid #edf0f5;
}

.settings-mobile-list {
  padding: 8px 0 24px;
}

.settings-mobile-item {
  min-height: 56px;
  padding: 0 18px 0 20px;
  border-bottom: 1px solid #f0f2f6;
  color: #252b36;
}

.settings-mobile-item-title {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.25;
}

.settings-mobile-item-icon {
  color: #9aa2ad;
}

.settings-mobile-item--active {
  color: #5a35f0;
  background: rgba(90, 53, 240, 0.08);
}

.settings-mobile-item--active .settings-mobile-item-title {
  font-weight: 700;
}

.settings-mobile-item--active .settings-mobile-item-icon {
  color: #5a35f0;
}

.settings-mobile-content {
  min-height: 100vh;
  background: #ffffff;
}

.settings-mobile-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 8px 12px;
  background: #ffffff;
  border-bottom: 1px solid #e6e9ef;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.settings-mobile-back {
  color: #5a35f0;
}

.settings-mobile-header-title {
  min-width: 0;
  overflow: hidden;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  color: #252b36;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-mobile-view {
  min-width: 0;
  overflow-x: hidden;
  background: #ffffff;
}
</style>
