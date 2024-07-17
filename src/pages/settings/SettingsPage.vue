<template>
  <q-page>
    <div class="row" style="height: 100vh;">
      <div class="col-3" style="min-width: fit-content">
        <q-list>
          <essential-link
            v-for="(item, index) in menuItems"
            :key="index"
            v-bind="item"
            :user="this.store.currentUser"
          />
        </q-list>
      </div>
      <div class="col" style="border-left: solid #e0e0e0;">
        <router-view/>
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
    menuItems: [
      // { title: 'Общие', link: '/settings/common', slug: 'common' },
      {
        title: 'Профиль',
        link: '/settings/profile',
        slug: 'profile',
        roles: ['ADMIN', 'OPERATOR', 'OBSERVER', 'CLIENT']
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
        title: 'База знаний',
        link: '/settings/knowledgeBase',
        slug: 'knowledgeBase',
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
      // { title: 'Уведомления',
      // link: '/settings/notifications', s
      // lug: 'notifications'
      // },
      {
        title: 'Telegram',
        link: '/settings/telegram',
        slug: 'telegram',
        roles: ['ADMIN']
      },
      {
        title: 'Электронная почта',
        link: '/settings/email',
        slug: 'email',
        roles: ['ADMIN']
      }
    ]
  }),

  mounted () {
    document.title = 'ULDESK настройки'
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>
