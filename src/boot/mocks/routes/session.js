import {withPrefix, ok, noContent, clone} from 'src/boot/mocks/helpers'

export function registerSessionMocks(mock, db) {
  // ----------------------------
  // auth / session / permissions
  // ----------------------------

  // GET /user/current
  mock.onGet(withPrefix('\\/user\\/current')).reply(() => ok(clone(db.me)))

  // GET /user/permissions
  mock.onGet(withPrefix('\\/user\\/permissions')).reply(() => ok({
    permissions: [
      'CHAT_VIEW', 'TASK_VIEW', 'TASK_EDIT', 'INCIDENT_VIEW', 'ORGANIZATION_STATS',
      'GLOBAL_SEARCH', 'ANALYTICS_VIEW', 'KB_VIEW', 'STAFF_DIRECTORY_VIEW', 'NOTIFICATIONS',
      'SETTINGS_MANAGE', 'USER_MANAGE', 'ORGANIZATION_MANAGE', 'REFERENCE_MANAGE', 'SLA_MANAGE',
      'SERVICE_MANAGE', 'INCIDENT_TEMPLATE_MANAGE', 'CHANNEL_MANAGE', 'AUTOMATION_MANAGE',
      'PLUGIN_MANAGE', 'JWT_MANAGE', 'SECURITY_AUDIT_VIEW', 'TASK_EXPORT',
      'CLIENT_EDIT', 'CLIENT_DELETE', 'CHAT_REPLY'
    ]
  }))

  // GET /session/current
  mock.onGet(withPrefix('\\/session\\/current')).reply(() => ok({sessionId: 'mock-session-1'}))

  // POST /user-online, /user-offline
  mock.onPost(withPrefix('\\/user-online')).reply(() => ok(clone(db.me)))
  mock.onPost(withPrefix('\\/user-offline')).reply(() => noContent())

  // POST /user/change-password
  mock.onPost(withPrefix('\\/user\\/change-password')).reply(() => noContent())

  // POST /user/welcome-seen
  mock.onPost(withPrefix('\\/user\\/welcome-seen')).reply(() => {
    db.me.welcomeSeen = true
    return noContent()
  })

  // PATCH /user/task-card-config
  mock.onPatch(withPrefix('\\/user\\/task-card-config')).reply(config => {
    db.me.taskCardFieldsConfig = JSON.parse(config.data)
    return ok(clone(db.me.taskCardFieldsConfig))
  })

  // PATCH /user/onboarding-progress — принимает одну или сразу несколько пар ключ тура → статус
  mock.onPatch(withPrefix('\\/user\\/onboarding-progress')).reply(config => {
    const updates = JSON.parse(config.data)
    db.me.onboardingProgress = {...(db.me.onboardingProgress || {}), ...updates}
    return ok(clone(db.me.onboardingProgress))
  })
}
