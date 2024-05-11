<template>
  <q-page>
    <div class="row" style="height: calc(100vh - 54px);">
      <div class="col-3" style="min-width: fit-content">
        <q-list>
          <essential-link
            v-for="(item, index) in menuItems"
            :key="index"
            v-bind="item"
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

export default {
  name: 'SettingsPage',

  components: { EssentialLink },

  data: () => ({
    menuItems: [
      { title: 'Общие', link: '/settings/common', slug: 'common' },
      { title: 'Профиль', link: '/settings/profile', slug: 'profile' },
      { title: 'Пользователи', link: '/settings/users', slug: 'users' },
      { title: 'Организации', link: '/settings/organizations', slug: 'organizations' },
      { title: 'База знаний', link: '/settings/knowledgeBase', slug: 'knowledgeBase' },
      { title: 'Теги', link: '/settings/tags', slug: 'tags' },
      { title: 'Приоритеты', link: '/settings/priorities', slug: 'priorities' },
      { title: 'Статусы', link: '/settings/statuses', slug: 'statuses' },
      { title: 'Шаблоны', link: '/settings/templates', slug: 'templates' },
      { title: 'Макросы', link: '/settings/macros', slug: 'macros' },
      { title: 'SLA', link: '/settings/sla', slug: 'sla' },
      { title: 'Уведомления', link: '/settings/notifications', slug: 'notifications' },
      { title: 'Telegram', link: '/settings/telegram', slug: 'telegram' }
    ]
  })
}
</script>
