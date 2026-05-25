import { useStore } from 'stores/store'

const routes = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/',
    redirect: '/chats',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'my-tasks',
        component: () => import('pages/MyTasksPage.vue')
      },
      {
        path: 'chat',
        component: () => import('pages/ChatPage.vue')
      },
      {
        path: 'chats',
        component: () => import('pages/ClientsChatsPage.vue')
      },
      {
        path: 'chats/:clientId(\\d+)',
        component: () => import('pages/ChatPage.vue'),
        beforeEnter: (to, from, next) => {
          const store = useStore()
          const clientId = to.params.clientId

          if (!store.currentChatMessageData.length || store.currentClient.id !== parseInt(clientId)) {
            store.fetchClientMessages(clientId)
              .then(() => {
                store.currentClient = store.clients.find(client => client.id === parseInt(clientId)) || {}
                next()
              })
          } else {
            next()
          }
        }
      },
      {
        path: 'tasks',
        component: () => import('pages/TasksPage.vue')
      },
      {
        path: 'orgs',
        alias: 'organizations',
        component: () => import('pages/OrganizationsPage.vue')
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
        path: 'knowledge-base',
        component: () => import('pages/KnowledgeBasePage.vue')
      },
      {
        path: 'settings',
        component: () => import('pages/settings/SettingsPage.vue'),
        children: [
          {
            path: 'profile',
            component: () => import('pages/settings/ProfileSettings.vue')
          },
          {
            path: 'general',
            component: () => import('pages/settings/GeneralSettings.vue')
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
            component: () => import('pages/settings/SlaPage.vue')
          },
          {
            path: 'task-types',
            component: () => import('pages/settings/TaskTypePage.vue')
          },
          {
            path: 'telegram',
            component: () => import('pages/settings/TelegramPage.vue')
          },
          {
            path: 'whatsapp',
            component: () => import('pages/settings/WhatsappPage.vue')
          },
          {
            path: 'email',
            component: () => import('pages/settings/EmailPage.vue')
          },
          {
            path: 'license',
            component: () => import('pages/settings/LicensePage.vue')
          },
          {
            path: 'plugins',
            component: () => import('pages/settings/PluginsPage.vue')
          },
          {
            path: 'ai-agent',
            component: () => import('pages/settings/AiAgent.vue')
          },
          {
            path: 'automatization',
            component: () => import('pages/settings/AutomatizationPage.vue')
          },
          {
            path: 'export',
            component: () => import('pages/settings/ExportPage.vue')
          }
        ]
      },
      {
        path: 'help',
        component: () => import('pages/HelpPage.vue')
      },
      {
        path: 'analytics',
        component: () => import('pages/AnalyticsPage.vue')
      }
      // {
      //   path: 'phone',
      //   component: () => import('pages/PhonePage.vue')
      // }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/errors/ErrorNotFound.vue')
  }
]

export default routes
