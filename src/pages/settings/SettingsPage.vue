<template>
  <q-page class="settings-page" :style-fn="pageStyleFn">
    <!-- Один общий router-view: при смене ширины окна страница раздела не пересоздаётся и не теряет состояние. -->
    <div :class="isMobile ? 'settings-mobile-layout' : 'settings-desktop-layout row'">
      <div v-if="isMobile && mobileMenuOpen" class="settings-mobile-menu app-settings-mobile-menu">
        <div class="settings-mobile-title">
          Настройки
        </div>

        <q-list class="settings-menu-list settings-mobile-list app-flex-column">
          <template v-for="group in groupedVisibleMenuItems" :key="group.key">
            <q-item-label header class="settings-menu-group-label">
              {{ group.label }}
            </q-item-label>
            <q-item
              v-for="item in group.items"
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
                  <span
                    v-if="item.brandImage"
                    class="settings-menu-brand-icon app-brand-icon"
                    :style="{ '--brand-icon': `url(${item.brandImage})` }"
                  />
                  <q-icon v-else :name="item.icon" size="24px"/>
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
          </template>
        </q-list>
      </div>

      <div v-if="!isMobile" class="settings-desktop-menu">
        <div class="settings-desktop-title">
          Настройки
        </div>

        <div class="settings-desktop-menu-scroll">
          <q-list class="settings-menu-list settings-desktop-list app-flex-column">
            <template v-for="group in groupedVisibleMenuItems" :key="group.key">
              <q-item-label header class="settings-menu-group-label">
                {{ group.label }}
              </q-item-label>
              <q-item
                v-for="item in group.items"
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
                    <span
                    v-if="item.brandImage"
                    class="settings-menu-brand-icon app-brand-icon"
                    :style="{ '--brand-icon': `url(${item.brandImage})` }"
                  />
                  <q-icon v-else :name="item.icon" size="24px"/>
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
            </template>
          </q-list>
        </div>
      </div>
      <div
        v-show="!isMobile || !mobileMenuOpen"
        :class="isMobile ? 'settings-mobile-content app-settings-mobile-content' : 'settings-desktop-content col'"
      >
        <div v-if="isMobile" class="settings-mobile-header">
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

        <div :class="isMobile ? 'settings-mobile-view' : 'settings-desktop-content-scroll'">
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
    groupOrder: ['profile', 'workflow', 'access', 'channels', 'automation', 'system'],
    groupLabels: {
      profile: 'Мой профиль',
      workflow: 'Рабочий процесс',
      access: 'Пользователи и доступ',
      channels: 'Каналы и интеграции',
      automation: 'Автоматизация',
      system: 'Система'
    },
    menuItems: [
      {
        title: 'Профиль',
        link: '/settings/profile',
        slug: 'profile',
        icon: 'person',
        permission: null,
        group: 'profile'
      },
      {
        title: 'Карточка заявки',
        link: '/settings/task-card',
        slug: 'task-card',
        icon: 'view_agenda',
        permission: null,
        group: 'profile'
      },
      {
        title: 'Общее',
        link: '/settings/general',
        slug: 'general',
        icon: 'tune',
        permission: 'SETTINGS_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Пользователи',
        link: '/settings/users',
        slug: 'users',
        icon: 'group',
        permission: 'USER_MANAGE',
        group: 'access'
      },
      {
        title: 'Клиенты портала',
        link: '/settings/clients',
        slug: 'clients',
        icon: 'contacts',
        permission: 'USER_MANAGE',
        group: 'access'
      },
      {
        title: 'Организации',
        link: '/settings/organizations',
        slug: 'organizations',
        icon: 'business',
        permission: 'ORGANIZATION_MANAGE',
        group: 'access'
      },
      {
        title: 'Теги',
        link: '/settings/tags',
        slug: 'tags',
        icon: 'label',
        permission: 'REFERENCE_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Приоритеты',
        link: '/settings/priorities',
        slug: 'priorities',
        icon: 'flag',
        permission: 'REFERENCE_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Статусы',
        link: '/settings/statuses',
        slug: 'statuses',
        icon: 'check_circle',
        permission: 'REFERENCE_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Шаблоны',
        link: '/settings/templates',
        slug: 'templates',
        icon: 'description',
        permission: 'REFERENCE_MANAGE',
        group: 'workflow'
      },
      // { title: 'Макросы',
      // link: '/settings/macros', s
      // lug: 'macros'
      // },
      {
        title: 'SLA и OLA',
        link: '/settings/sla',
        slug: 'sla',
        icon: 'timer',
        permission: 'SLA_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Типы заявок и чек-листы',
        link: '/settings/task-types',
        slug: 'playlist_add_check',
        icon: 'playlist_add_check',
        permission: 'REFERENCE_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Линии поддержки',
        link: '/settings/support-lines',
        slug: 'account_tree',
        icon: 'account_tree',
        permission: 'REFERENCE_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Причины выездов',
        link: '/settings/visit-reasons',
        slug: 'visit-reasons',
        icon: 'directions_car',
        permission: 'REFERENCE_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Сервисы и мониторинг',
        link: '/settings/services',
        slug: 'dns',
        icon: 'dns',
        permission: 'SERVICE_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Шаблоны обновлений инцидентов',
        link: '/settings/incident-templates',
        slug: 'incident-templates',
        icon: 'campaign',
        permission: 'INCIDENT_TEMPLATE_MANAGE',
        group: 'workflow'
      },
      {
        title: 'Telegram',
        link: '/settings/telegram',
        slug: 'telegram',
        icon: 'send',
        brandImage: '/telegram.png',
        permission: 'CHANNEL_MANAGE',
        group: 'channels'
      },
      {
        title: 'WhatsApp',
        link: '/settings/whatsapp',
        slug: 'whatsapp',
        icon: 'chat',
        brandImage: '/whatsapp.png',
        permission: 'CHANNEL_MANAGE',
        group: 'channels'
      },
      {
        title: 'Электронная почта',
        link: '/settings/email',
        slug: 'email',
        icon: 'email',
        permission: 'CHANNEL_MANAGE',
        group: 'channels'
      },
      // {
      //   title: 'ИИ-агент',
      //   link: '/settings/ai-agent',
      //   slug: 'ai-agent',
      //   icon: 'smart_toy',
      //   permission: 'SETTINGS_MANAGE'
      // },
      {
        title: 'Jev (ИИ-решения)',
        link: '/settings/jev',
        slug: 'jev',
        icon: 'psychology',
        roles: ['ADMIN'],
        group: 'channels'
      },
      {
        title: 'Автоматизации',
        link: '/settings/automatization',
        slug: 'automatization',
        icon: 'sym_o_flowchart',
        permission: 'AUTOMATION_MANAGE',
        group: 'automation'
      },
      {
        title: 'Плагины',
        link: '/settings/plugins',
        slug: 'plugins',
        icon: 'extension',
        permission: 'PLUGIN_MANAGE',
        group: 'channels'
      },
      {
        title: 'JWT API',
        link: '/settings/jwt',
        slug: 'jwt',
        icon: 'key',
        permission: 'JWT_MANAGE',
        group: 'channels'
      },
      {
        title: 'Журнал безопасности',
        link: '/settings/security-audit',
        slug: 'security-audit',
        icon: 'policy',
        permission: 'SECURITY_AUDIT_VIEW',
        group: 'access'
      },
      {
        title: 'Лицензия',
        link: '/settings/license',
        slug: 'license',
        icon: 'vpn_key',
        permission: 'SETTINGS_MANAGE',
        group: 'system'
      },
      {
        title: 'Экспорт',
        link: '/settings/export',
        slug: 'export',
        icon: 'file_download',
        permission: 'TASK_EXPORT',
        group: 'system'
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

    groupedVisibleMenuItems() {
      const itemsByGroup = {}
      this.visibleMenuItems.forEach(item => {
        const key = item.group || 'system'
        if (!itemsByGroup[key]) {
          itemsByGroup[key] = []
        }
        itemsByGroup[key].push(item)
      })
      return this.groupOrder
        .filter(key => itemsByGroup[key]?.length)
        .map(key => ({key, label: this.groupLabels[key], items: itemsByGroup[key]}))
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
      return !item.permission || this.$can(item.permission)
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
  background: var(--app-surface, #f5f6fa);
}

.settings-desktop-layout {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--app-surface, #ffffff);
}

.settings-desktop-menu {
  display: flex;
  flex: 0 0 304px;
  flex-direction: column;
  width: 304px;
  min-width: 280px;
  min-height: 0;
  padding: 16px 0 0;
  overflow: hidden;
  background: var(--app-surface, #ffffff);
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
  color: var(--app-text, #252b36);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.settings-desktop-title {
  padding: 8px 16px 14px;
}

.settings-desktop-content {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-left: 1px solid var(--app-border, #e7eaf0);
  background: var(--app-surface, #ffffff);
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

/* Пункты — как в левом меню приложения: без скруглений и подложек, чёрные текст и иконки */
.settings-menu-item {
  min-height: 48px;
  padding: 8px 16px;
  border-radius: 0;
  color: var(--app-text, #000000);
  transition: background-color 0.16s ease, color 0.16s ease;
}

.settings-menu-item:hover {
  background: var(--app-surface-hover, #e8e8e8);
}

.settings-menu-icon-section {
  min-width: 40px;
  padding-right: 16px;
}

.settings-menu-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.settings-menu-item-title {
  font-family: inherit;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.2;
}

.settings-menu-group-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--app-text-muted, #a3a9b3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 14px 16px 6px;
  min-height: auto;
}

.settings-menu-group-label:first-child {
  padding-top: 4px;
}

.settings-menu-chevron-section {
  padding-left: 8px;
}

.settings-menu-chevron {
  color: var(--app-text-muted, #a3a9b3);
  font-size: 20px;
  transition: color 0.16s ease, transform 0.16s ease;
}

.settings-menu-item--active {
  color: var(--app-accent-text, #5a35f0);
}

/* При наведении активный пункт подсвечивается фиолетовым, как активный пункт левого меню */
.settings-menu-item--active:hover {
  background: rgba(92, 53, 249, 0.1);
}

.settings-menu-brand-icon {
  width: 24px;
  height: 24px;
}

.settings-menu-item--active .settings-menu-icon-box {
  color: var(--app-accent-text, #5a35f0);
}

.settings-menu-item--active .settings-menu-chevron {
  color: var(--app-accent-text, #5a35f0);
  transform: translateX(1px);
}

.settings-mobile-layout {
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  background: var(--app-surface, #f5f6fa);
}

.settings-mobile-title {
  padding: 22px 20px 16px;
  border-bottom: 1px solid var(--app-border, #edf0f5);
}

.settings-mobile-list {
  flex: 1 1 auto;
  min-height: 0;
  padding: 10px 0 24px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
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
  background: var(--app-surface, #ffffff);
  border-bottom: 1px solid var(--app-border, #e6e9ef);
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.settings-mobile-back {
  color: var(--app-accent-text, #5a35f0);
}

.settings-mobile-header-title {
  min-width: 0;
  overflow: hidden;
  color: var(--app-text, #252b36);
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
  background: var(--app-surface, #ffffff);
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
}
</style>
