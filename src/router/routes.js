import { useStore } from 'stores/store'

const routes = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/portal',
    component: () => import('layouts/ClientPortalLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/ClientPortalPage.vue')
      }
    ]
  },
  {
    path: '/',
    redirect: '/chats',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: 'my-tasks',
        component: () => import('pages/MyTasksPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR']}
      },
      {
        path: 'my-lines',
        component: () => import('pages/MyLinesPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR']}
      },
      {
        path: 'chat',
        component: () => import('pages/ChatPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']}
      },
      {
        path: 'chats',
        component: () => import('pages/ClientsChatsPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']}
      },
      {
        path: 'chats/:clientId(\\d+)',
        component: () => import('pages/ChatPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']},
        beforeEnter: (to, from, next) => {
          const store = useStore()
          const clientId = Number(to.params.clientId)
          const hasCurrentMessages = (
            Number(store.currentChatMessageData?.clientId) === clientId &&
            Array.isArray(store.currentChatMessageData?.messages)
          )

          const openChat = () => {
            const client = store.clients.find(item => Number(item?.id) === clientId)
            if (client) {
              const cachedMessages = store.currentChatMessageData?.messages
              if (Array.isArray(cachedMessages)) {
                client.messages = cachedMessages
              }
              store.currentClient = client
            }
            next()
          }

          if (hasCurrentMessages) {
            openChat()
            return
          }

          store.fetchClientMessages(clientId)
            .then(openChat)
            .catch(next)
        }
      },
      {
        path: 'tasks',
        component: () => import('pages/TasksPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']}
      },
      {
        path: 'incidents',
        component: () => import('pages/IncidentsPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']}
      },
      {
        path: 'incidents/:incidentId',
        name: 'incident-detail',
        component: () => import('pages/IncidentDetailPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']},
        props: route => ({ incidentId: Number(route.params.incidentId) }),
        beforeEnter: to => {
          const incidentId = Number(to.params.incidentId)
          return Number.isSafeInteger(incidentId) && incidentId > 0 ? true : '/incidents'
        }
      },
      {
        path: 'orgs',
        alias: 'organizations',
        component: () => import('pages/OrganizationsPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR']}
      },
      {
        path: 'history',
        component: () => import('pages/HistoryPage.vue')
      },
      {
        path: 'search',
        component: () => import('pages/SearchPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR']}
      },
      {
        path: 'knowledge-base',
        component: () => import('pages/KnowledgeBasePage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR']}
      },
      {
        path: 'settings',
        component: () => import('pages/settings/SettingsPage.vue'),
        children: [
          {
            path: 'profile',
            component: () => import('pages/settings/ProfileSettings.vue'),
            meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER', 'CLIENT']}
          },
          {
            path: 'general',
            component: () => import('pages/settings/GeneralSettings.vue'),
            meta: {roles: ['ADMIN']}
          },
          {
            path: 'users',
            component: () => import('pages/settings/UsersPage.vue'),
            meta: {roles: ['ADMIN']}
          },
          {
            path: 'clients',
            component: () => import('pages/settings/ClientsPage.vue'),
            meta: {roles: ['ADMIN']}
          },
          {
            path: 'organizations',
            component: () => import('pages/settings/OrganizationsPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'visit-reasons',
            component: () => import('pages/settings/VisitReasonsPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'tags',
            component: () => import('pages/settings/TagsPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'priorities',
            component: () => import('pages/settings/PriorityPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'statuses',
            component: () => import('pages/settings/StatusesPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'templates',
            component: () => import('pages/settings/TemplatesPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'macros',
            component: () => import('pages/settings/SettingsPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'sla',
            component: () => import('pages/settings/SlaPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'task-types',
            component: () => import('pages/settings/TaskTypePage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'support-lines',
            component: () => import('pages/settings/SupportLinesPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'services',
            component: () => import('pages/settings/ServicesPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'telegram',
            component: () => import('pages/settings/TelegramPage.vue'),
            meta: {roles: ['ADMIN']}
          },
          {
            path: 'whatsapp',
            component: () => import('pages/settings/WhatsappPage.vue'),
            meta: {roles: ['ADMIN']}
          },
          {
            path: 'email',
            component: () => import('pages/settings/EmailPage.vue'),
            meta: {roles: ['ADMIN']}
          },
          {
            path: 'license',
            component: () => import('pages/settings/LicensePage.vue'),
            meta: {roles: ['ADMIN']}
          },
          {
            path: 'plugins',
            component: () => import('pages/settings/PluginsPage.vue'),
            meta: {roles: ['ADMIN']}
          },
          {
            path: 'jwt',
            component: () => import('pages/settings/JwtSettingsPage.vue'),
            meta: {roles: ['ADMIN']}
          },
          // {
          //   path: 'ai-agent',
          //   component: () => import('pages/settings/AiAgent.vue'),
          //   meta: {roles: ['ADMIN']}
          // },
          {
            path: 'automatization',
            component: () => import('pages/settings/AutomatizationPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          },
          {
            path: 'export',
            component: () => import('pages/settings/ExportPage.vue'),
            meta: {roles: ['ADMIN', 'MANAGER']}
          }
        ]
      },
      {
        path: 'help',
        component: () => import('pages/HelpPage.vue')
      },
      {
        path: 'analytics',
        component: () => import('pages/AnalyticsPage.vue'),
        meta: {roles: ['ADMIN', 'MANAGER', 'OPERATOR', 'OBSERVER']}
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
