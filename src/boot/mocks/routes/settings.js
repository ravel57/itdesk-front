import {withPrefix, ok, clone} from 'src/boot/mocks/helpers'

export function registerSettingsMocks(mock, db) {
  // GET/PATCH /settings/general — общие настройки; GET /settings/answer-waiting — как считать «Требует ответа»
  mock.onGet(withPrefix('\\/settings\\/general')).reply(() => ok(clone(db.generalSettings)))
  mock.onPatch(withPrefix('\\/settings\\/general')).reply((config) => {
    db.generalSettings = {...db.generalSettings, ...JSON.parse(config.data || '{}')}
    return ok(clone(db.generalSettings))
  })
  mock.onGet(withPrefix('\\/settings\\/sla-zones')).reply(() => ok({
    orangeStartPercent: db.generalSettings.slaOrangeStartPercent,
    redStartPercent: db.generalSettings.slaRedStartPercent
  }))
  mock.onGet(withPrefix('\\/settings\\/answer-waiting')).reply(() => {
    const settings = db.generalSettings
    const dayFlags = [
      settings.mondayEnabled, settings.tuesdayEnabled, settings.wednesdayEnabled, settings.thursdayEnabled,
      settings.fridayEnabled, settings.saturdayEnabled, settings.sundayEnabled
    ]
    return ok({
      workingTimeUsed: !!settings.workingTimeEnabled && !!settings.answerWaitingWorkingTimeEnabled,
      timezone: settings.timezone,
      workdayStart: settings.workdayStart,
      workdayEnd: settings.workdayEnd,
      workingDays: dayFlags.map((enabled, index) => (enabled ? index + 1 : null)).filter(Boolean)
    })
  })

  // GET /license-info
  mock.onGet(withPrefix('\\/license-info')).reply(() =>
    ok({
      maxUsers: 999,
      usedUsersCount: 2,
      availableUsersCount: 997,
      licenseUntil: '2099-12-31',
      roleCounts: [
        {code: 'ADMIN', name: 'Администратор', count: 1, countsTowardsLicense: true},
        {code: 'MANAGER', name: 'Менеджер поддержки', count: 0, countsTowardsLicense: true},
        {code: 'OPERATOR', name: 'Оператор поддержки', count: 1, countsTowardsLicense: true},
        {code: 'OBSERVER', name: 'Менеджер организации', count: 0, countsTowardsLicense: false},
        {code: 'CLIENT', name: 'Клиент', count: 0, countsTowardsLicense: false}
      ]
    })
  )
}
