const routes = [
  {
    path: '/',
    redirect: '/chats',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // {
      //   path: 'my-tasks',
      //   component: () => import('pages/TasksPage.vue')
      // },
      {
        path: 'chats',
        component: () => import('pages/ClientsChatsPage.vue')
      },
      {
        path: 'chats/:clientId(\\d+)',
        component: () => import('pages/ChatPage.vue')
      },
      {
        path: 'tasks',
        component: () => import('pages/TasksPage.vue')
      },
      {
        path: 'history',
        component: () => import('pages/HistoryPage.vue')
      },
      {
        path: 'search',
        component: () => import('pages/SearchPage.vue')
      },
      {
        path: 'settings',
        component: () => import('pages/settings/SettingsPage.vue'),
        children: [
          {
            path: 'common',
            component: () => import('pages/settings/SettingsPage.vue')
          },
          {
            path: 'profile',
            component: () => import('pages/settings/SettingsPage.vue')
          },
          {
            path: 'users',
            component: () => import('pages/settings/UsersPage.vue')
          },
          {
            path: 'organizations',
            component: () => import('pages/settings/OrganizationsPage.vue')
          },
          {
            path: 'knowledgeBase',
            component: () => import('pages/settings/SettingsPage.vue')
          },
          {
            path: 'tags',
            component: () => import('pages/settings/TagsPage.vue')
          },
          {
            path: 'priorities',
            component: () => import('pages/settings/PriorityPage.vue')
          },
          {
            path: 'statuses',
            component: () => import('pages/settings/StatusesPage.vue')
          },
          {
            path: 'templates',
            component: () => import('pages/settings/TemplatesPage.vue')
          },
          {
            path: 'macros',
            component: () => import('pages/settings/SettingsPage.vue')
          },
          {
            path: 'sla',
            component: () => import('pages/settings/SettingsPage.vue')
          },
          {
            path: 'notifications',
            component: () => import('pages/settings/SettingsPage.vue')
          },
          {
            path: 'telegram',
            component: () => import('pages/settings/TelegramPage.vue')
          }
        ]
      },
      {
        path: 'analytics',
        component: () => import('pages/AnalyticsPage.vue')
      },
      {
        path: 'phone',
        component: () => import('pages/PhonePage.vue')
      }
    ]
  }, {
    path: '/:catchAll(.*)*',
    component: () => import('pages/errors/ErrorNotFound.vue')
  }
]

export default routes
