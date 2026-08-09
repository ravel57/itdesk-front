<template>
  <q-page class="settings-page" :style-fn="pageStyleFn">
    <div v-if="isMobile" class="settings-mobile-layout">
      <div v-if="mobileMenuOpen" class="settings-mobile-menu">
        <div class="settings-mobile-title">
          Настройки
        </div>

        <q-list class="settings-menu-list settings-mobile-list">
          <q-item
            v-for="item in visibleMenuItems"
            :key="item.link"
            clickable
            v-ripple
            :active="isCurrentMenuItem(item)"
            active-class="settings-menu-item--active"
            class="settings-menu-item"
            @click="openMobileSection(item)"
          >
            <q-item-section avatar class="settings-menu-icon-section">
              <div class="settings-menu-icon-box">
                <q-icon :name="item.icon" size="20px"/>
              </div>
            </q-item-section>
            <q-item-section>
              <q-item-label class="settings-menu-item-title">
                {{ item.title }}
              </q-item-label>
            </q-item-section>
            <q-item-section side class="settings-menu-chevron-section">
              <q-icon name="chevron_right" class="settings-menu-chevron"/>
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
          <router-view/>
        </div>
      </div>
    </div>

    <div v-else class="settings-desktop-layout row">
      <div class="settings-desktop-menu">
        <div class="settings-desktop-title">
          Настройки
        </div>

        <div class="settings-desktop-menu-scroll">
          <q-list class="settings-menu-list settings-desktop-list">
            <q-item
              v-for="item in visibleMenuItems"
              :key="item.link"
              clickable
              v-ripple
              tag="router-link"
              :to="item.link"
              :active="isCurrentMenuItem(item)"
              active-class="settings-menu-item--active"
              class="settings-menu-item"
            >
              <q-item-section avatar class="settings-menu-icon-section">
                <div class="settings-menu-icon-box">
                  <q-icon :name="item.icon" size="20px"/>
                </div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="settings-menu-item-title">
                  {{ item.title }}
                </q-item-label>
              </q-item-section>
              <q-item-section side class="settings-menu-chevron-section">
                <q-icon name="chevron_right" class="settings-menu-chevron"/>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </div>
      <div class="settings-desktop-content col">
        <div class="settings-desktop-content-scroll">
          <router-view/>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import {useStore} from 'stores/store'

export default {
  name: 'SettingsPage',

  data: () => ({
    mobileMenuOpen: false,
    menuItems: [
      {
        title: 'Профиль',
        link: '/settings/profile',
        slug: 'profile',
        icon: 'person',
        roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER', 'CLIENT']
      },
      {
        title: 'Общее',
        link: '/settings/general',
        slug: 'general',
        icon: 'tune',
        roles: ['ADMIN']
      },
      {
        title: 'Пользователи',
        link: '/settings/users',
        slug: 'users',
        icon: 'group',
        roles: ['ADMIN']
      },
      {
        title: 'Клиенты',
        link: '/settings/clients',
        slug: 'clients',
        icon: 'contacts',
        roles: ['ADMIN']
      },
      {
        title: 'Организации',
        link: '/settings/organizations',
        slug: 'organizations',
        icon: 'business',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Теги',
        link: '/settings/tags',
        slug: 'tags',
        icon: 'label',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Приоритеты',
        link: '/settings/priorities',
        slug: 'priorities',
        icon: 'flag',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Статусы',
        link: '/settings/statuses',
        slug: 'statuses',
        icon: 'check_circle',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Шаблоны',
        link: '/settings/templates',
        slug: 'templates',
        icon: 'description',
        roles: ['ADMIN', 'MANAGER']
      },
      // { title: 'Макросы',
      // link: '/settings/macros', s
      // lug: 'macros'
      // },
      {
        title: 'SLA',
        link: '/settings/sla',
        slug: 'sla',
        icon: 'timer',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Типы заявок и чек-листы',
        link: '/settings/task-types',
        slug: 'playlist_add_check',
        icon: 'playlist_add_check',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Линии поддержки',
        link: '/settings/support-lines',
        slug: 'account_tree',
        icon: 'account_tree',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Причины выездов',
        link: '/settings/visit-reasons',
        slug: 'visit-reasons',
        icon: 'directions_car',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Сервисы и мониторинг',
        link: '/settings/services',
        slug: 'dns',
        icon: 'dns',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Telegram',
        link: '/settings/telegram',
        slug: 'telegram',
        icon: 'send',
        roles: ['ADMIN']
      },
      {
        title: 'WhatsApp',
        link: '/settings/whatsapp',
        slug: 'whatsapp',
        icon: 'chat',
        roles: ['ADMIN']
      },
      {
        title: 'Электронная почта',
        link: '/settings/email',
        slug: 'email',
        icon: 'email',
        roles: ['ADMIN']
      },
      // {
      //   title: 'ИИ-агент',
      //   link: '/settings/ai-agent',
      //   slug: 'ai-agent',
      //   icon: 'smart_toy',
      //   roles: ['ADMIN']
      // },
      {
        title: 'Автоматизации',
        link: '/settings/automatization',
        slug: 'automatization',
        icon: 'autorenew',
        roles: ['ADMIN', 'MANAGER']
      },
      {
        title: 'Плагины',
        link: '/settings/plugins',
        slug: 'plugins',
        icon: 'extension',
        roles: ['ADMIN']
      },
      {
        title: 'JWT API',
        link: '/settings/jwt',
        slug: 'jwt',
        icon: 'key',
        roles: ['ADMIN']
      },
      {
        title: 'Лицензия',
        link: '/settings/license',
        slug: 'license',
        icon: 'vpn_key',
        roles: ['ADMIN']
      },
      {
        title: 'Экспорт',
        link: '/settings/export',
        slug: 'export',
        icon: 'file_download',
        roles: ['ADMIN', 'MANAGER']
      }
    ]
  }),

  computed: {
    isMobile() {
      return this.$q.screen.lt.md
    },

    visibleMenuItems() {
      return this.menuItems.filter(item => this.canShowMenuItem(item))
    },

    currentMenuItem() {
      const currentPath = this.normalizePath(this.$route.path)
      return [...this.visibleMenuItems]
        .sort((a, b) => b.link.length - a.link.length)
        .find(item => currentPath === this.normalizePath(item.link) || currentPath.startsWith(`${this.normalizePath(item.link)}/`)) || null
    },

    currentSectionTitle() {
      return this.currentMenuItem?.title || 'Настройки'
    },

    isSettingsRootRoute() {
      const currentPath = this.normalizePath(this.$route.path)
      return currentPath === '/settings'
    }
  },

  watch: {
    isMobile: {
      immediate: true,
      handler(value) {
        if (value) {
          this.mobileMenuOpen = this.isSettingsRootRoute
        }
      }
    },

    '$route.path'() {
      if (!this.isMobile) {
        return
      }
      this.mobileMenuOpen = this.isSettingsRootRoute
    }
  },

  mounted() {
    document.title = 'ULDESK : Настройки'
  },

  methods: {
    openMobileSection(item) {
      this.mobileMenuOpen = false
      if (this.normalizePath(this.$route.path) !== this.normalizePath(item.link)) {
        this.$router.push(item.link)
      }
    },

    showMobileMenu() {
      this.mobileMenuOpen = true
    },

    isCurrentMenuItem(item) {
      const currentPath = this.normalizePath(this.$route.path)
      const itemPath = this.normalizePath(item.link)
      return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
    },

    canShowMenuItem(item) {
      if (!item.roles || !item.roles.length) {
        return true
      }

      const authorities = this.store.currentUser?.authorities || this.store.currentUser?.roles || []
      return item.roles.some(role => authorities.includes(role) || authorities.includes(`ROLE_${role}`))
    },

    normalizePath(path) {
      if (!path) {
        return ''
      }
      const normalized = String(path).trim().replace(/\/+$/, '')
      return normalized || '/'
    },

    pageStyleFn(offset) {
      const pageHeight = offset ? `calc(100dvh - ${offset}px)` : '100dvh'

      if (this.isMobile) {
        return {
          minHeight: pageHeight
        }
      }

      return {
        height: pageHeight,
        minHeight: pageHeight,
        overflow: 'hidden'
      }
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.settings-page {
  background: #f5f6fa;
}

.settings-desktop-layout {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.settings-desktop-menu {
  display: flex;
  flex: 0 0 304px;
  flex-direction: column;
  width: 304px;
  min-width: 280px;
  min-height: 0;
  padding: 16px 12px 0;
  overflow: hidden;
  background: #ffffff;
}

.settings-desktop-menu-scroll {
  flex: 1 1 auto;
  min-height: 0;
  padding-bottom: 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.settings-desktop-title,
.settings-mobile-title {
  color: #252b36;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.settings-desktop-title {
  padding: 8px 12px 14px;
}

.settings-desktop-content {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid #e7eaf0;
  background: #ffffff;
}

.settings-desktop-content-scroll {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.settings-menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settings-menu-item {
  min-height: 52px;
  padding: 6px 10px;
  border: 1px solid transparent;
  border-radius: 12px;
  color: #3c4350;
  transition: background-color 0.16s ease, border-color 0.16s ease, color 0.16s ease;
}

.settings-menu-item:hover {
  background: #f6f7fb;
}

.settings-menu-icon-section {
  min-width: 44px;
  padding-right: 8px;
}

.settings-menu-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #697180;
  background: #f1f3f7;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.settings-menu-item-title {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.3;
}

.settings-menu-chevron-section {
  padding-left: 8px;
}

.settings-menu-chevron {
  color: #a3a9b3;
  font-size: 20px;
  transition: color 0.16s ease, transform 0.16s ease;
}

.settings-menu-item--active {
  color: #5138dc;
  border-color: rgba(81, 56, 220, 0.12);
  background: rgba(81, 56, 220, 0.08);
}

.settings-menu-item--active:hover {
  background: rgba(81, 56, 220, 0.11);
}

.settings-menu-item--active .settings-menu-icon-box {
  color: #ffffff;
  background: #5a35f0;
}

.settings-menu-item--active .settings-menu-item-title {
  font-weight: 700;
}

.settings-menu-item--active .settings-menu-chevron {
  color: #5a35f0;
  transform: translateX(1px);
}

.settings-mobile-layout {
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  background: #f5f6fa;
}

.settings-mobile-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.settings-mobile-title {
  padding: 22px 20px 16px;
  border-bottom: 1px solid #edf0f5;
}

.settings-mobile-list {
  flex: 1 1 auto;
  min-height: 0;
  padding: 10px 12px 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.settings-mobile-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
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
  color: #252b36;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-mobile-view {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  background: #ffffff;
}

@media (min-width: 1024px) {
  .settings-page {
    min-height: 0 !important;
    overflow: hidden;
  }

  .settings-desktop-layout {
    flex-wrap: nowrap;
    width: 100%;
    height: 100%;
  }
}

@media (max-width: 1023px) {
  .settings-menu-item {
    min-height: 56px;
  }

  .settings-menu-item-title {
    font-size: 16px;
  }
}
</style>
