import { useStore } from 'stores/store'

const routes = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue')
  },
  // Сюда бэкенд возвращает после неудачного входа и завершённого сеанса: та же страница входа с сообщением
  {
    path: '/login-error',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/session-expired',
    component: () => import('pages/LoginPage.vue')
  },
  {
    path: '/login/mfa',
    component: () => import('pages/MfaPage.vue')
  },
  {
    path: '/reset-password',
    component: () => import('pages/ResetPasswordPage.vue')
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
        meta: {permission: 'TASK_EDIT'}
      },
      {
        path: 'my-lines',
        component: () => import('pages/MyLinesPage.vue'),
        meta: {permission: 'TASK_EDIT'}
      },
      {
        path: 'chat',
        component: () => import('pages/ChatPage.vue'),
        meta: {permission: 'CHAT_VIEW'}
      },
      {
        path: 'chats',
        component: () => import('pages/ClientsChatsPage.vue'),
        meta: {permission: 'CHAT_VIEW'}
      },
      {
        path: 'chats/:clientId(\\d+)',
        component: () => import('pages/ChatPage.vue'),
        meta: {permission: 'CHAT_VIEW'},
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
        meta: {permission: 'TASK_VIEW'}
      },
      {
        path: 'incidents',
        component: () => import('pages/IncidentsPage.vue'),
        meta: {permission: 'INCIDENT_VIEW'}
      },
      {
        path: 'incidents/:incidentId',
        name: 'incident-detail',
        component: () => import('pages/IncidentDetailPage.vue'),
        meta: {permission: 'INCIDENT_VIEW'},
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
        meta: {permission: 'ORGANIZATION_STATS'}
      },
      {
        path: 'history',
        component: () => import('pages/HistoryPage.vue')
      },
      {
        path: 'search',
        component: () => import('pages/SearchPage.vue'),
        meta: {permission: 'GLOBAL_SEARCH'}
      },
      {
        path: 'knowledge-base',
        component: () => import('pages/KnowledgeBasePage.vue'),
        meta: {permission: 'KB_VIEW'}
      },
      {
        path: 'settings',
        component: () => import('pages/settings/SettingsPage.vue'),
        children: [
          {
            path: 'profile',
            component: () => import('pages/settings/ProfileSettings.vue'),
            meta: {}
          },
          {
            path: 'general',
            component: () => import('pages/settings/GeneralSettings.vue'),
            meta: {permission: 'SETTINGS_MANAGE'}
          },
          {
            path: 'users',
            component: () => import('pages/settings/UsersPage.vue'),
            meta: {permission: 'USER_MANAGE'}
          },
          {
            path: 'clients',
            component: () => import('pages/settings/ClientsPage.vue'),
            meta: {permission: 'USER_MANAGE'}
          },
          {
            path: 'organizations',
            component: () => import('pages/settings/OrganizationsPage.vue'),
            meta: {permission: 'ORGANIZATION_MANAGE'}
          },
          {
            path: 'visit-reasons',
            component: () => import('pages/settings/VisitReasonsPage.vue'),
            meta: {permission: 'REFERENCE_MANAGE'}
          },
          {
            path: 'tags',
            component: () => import('pages/settings/TagsPage.vue'),
            meta: {permission: 'REFERENCE_MANAGE'}
          },
          {
            path: 'priorities',
            component: () => import('pages/settings/PriorityPage.vue'),
            meta: {permission: 'REFERENCE_MANAGE'}
          },
          {
            path: 'statuses',
            component: () => import('pages/settings/StatusesPage.vue'),
            meta: {permission: 'REFERENCE_MANAGE'}
          },
          {
            path: 'templates',
            component: () => import('pages/settings/TemplatesPage.vue'),
            meta: {permission: 'REFERENCE_MANAGE'}
          },
          {
            path: 'macros',
            component: () => import('pages/settings/SettingsPage.vue'),
            meta: {permission: 'REFERENCE_MANAGE'}
          },
          {
            path: 'sla',
            component: () => import('pages/settings/SlaPage.vue'),
            meta: {permission: 'SLA_MANAGE'}
          },
          {
            path: 'task-types',
            component: () => import('pages/settings/TaskTypePage.vue'),
            meta: {permission: 'REFERENCE_MANAGE'}
          },
          {
            path: 'support-lines',
            component: () => import('pages/settings/SupportLinesPage.vue'),
            meta: {permission: 'REFERENCE_MANAGE'}
          },
          {
            path: 'services',
            component: () => import('pages/settings/ServicesPage.vue'),
            meta: {permission: 'SERVICE_MANAGE'}
          },
          {
            path: 'incident-templates',
            component: () => import('pages/settings/IncidentUpdateTemplatesPage.vue'),
            meta: {permission: 'INCIDENT_TEMPLATE_MANAGE'}
          },
          {
            path: 'telegram',
            component: () => import('pages/settings/TelegramPage.vue'),
            meta: {permission: 'CHANNEL_MANAGE'}
          },
          {
            path: 'whatsapp',
            component: () => import('pages/settings/WhatsappPage.vue'),
            meta: {permission: 'CHANNEL_MANAGE'}
          },
          {
            path: 'email',
            component: () => import('pages/settings/EmailPage.vue'),
            meta: {permission: 'CHANNEL_MANAGE'}
          },
          {
            path: 'license',
            component: () => import('pages/settings/LicensePage.vue'),
            meta: {permission: 'SETTINGS_MANAGE'}
          },
          {
            path: 'plugins',
            component: () => import('pages/settings/PluginsPage.vue'),
            meta: {permission: 'PLUGIN_MANAGE'}
          },
          {
            path: 'jwt',
            component: () => import('pages/settings/JwtSettingsPage.vue'),
            meta: {permission: 'JWT_MANAGE'}
          },
          {
            path: 'security-audit',
            component: () => import('pages/settings/SecurityAuditPage.vue'),
            meta: {permission: 'SECURITY_AUDIT_VIEW'}
          },
          // {
          //   path: 'ai-agent',
          //   component: () => import('pages/settings/AiAgent.vue'),
          //   meta: {permission: 'SETTINGS_MANAGE'}
          // },
          {
            path: 'automatization',
            component: () => import('pages/settings/AutomatizationPage.vue'),
            meta: {permission: 'AUTOMATION_MANAGE'}
          },
          {
            path: 'export',
            component: () => import('pages/settings/ExportPage.vue'),
            meta: {permission: 'TASK_EXPORT'}
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
        meta: {permission: 'ANALYTICS_VIEW'}
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
