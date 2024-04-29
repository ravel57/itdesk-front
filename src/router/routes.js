const routes = [
  {
    path: '/',
    redirect: '/chats',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'my-tasks',
        component: () => import('pages/TasksPage.vue')
      },
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
        component: () => import('pages/SettingsPage.vue')
      },
      {
        path: 'users',
        component: () => import('pages/SettingsPage.vue')
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
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
