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
        component: () => import('pages/SettingsPage.vue'),
        children: [
          {
            path: 'common',
            component: () => import('pages/SettingsPage.vue')
          },
          {
            path: 'profile',
            component: () => import('pages/SettingsPage.vue')
          },
          {
            path: 'users',
            component: () => import('components/settings/UsersPage.vue')
          },
          {
            path: 'organizations',
            component: () => import('components/settings/OrganizationsPage.vue')
          },
          {
            path: 'knowledgeBase',
            component: () => import('pages/SettingsPage.vue')
          },
          {
            path: 'tags',
            component: () => import('components/settings/TagsPage.vue')
          },
          {
            path: 'priorities',
            component: () => import('pages/SettingsPage.vue')
          },
          {
            path: 'status',
            component: () => import('pages/SettingsPage.vue')
          },
          {
            path: 'templates',
            component: () => import('pages/SettingsPage.vue')
          },
          {
            path: 'macros',
            component: () => import('pages/SettingsPage.vue')
          },
          {
            path: 'sla',
            component: () => import('pages/SettingsPage.vue')
          },
          {
            path: 'notifications',
            component: () => import('pages/SettingsPage.vue')
          }
        ]
      },
      {
        path: 'users',
        component: () => import('pages/UsersPage.vue')
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
