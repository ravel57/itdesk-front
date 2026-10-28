export function createSettingsDb() {
  return {
    // Общие настройки (Настройки → Общее); по умолчанию «Требует ответа» считается календарно
    generalSettings: {
      timezone: 'Europe/Moscow',
      workingTimeEnabled: true,
      workdayStart: '09:00',
      workdayEnd: '18:00',
      mondayEnabled: true,
      tuesdayEnabled: true,
      wednesdayEnabled: true,
      thursdayEnabled: true,
      fridayEnabled: true,
      saturdayEnabled: false,
      sundayEnabled: false,
      supportLineAccessMode: 'HYBRID',
      answerWaitingWorkingTimeEnabled: false,
      slaOrangeStartPercent: 50,
      slaRedStartPercent: 25
    },

    supportLines: [
      {
        id: 1,
        name: '1-я линия',
        level: 1,
        responsible: {id: 1, firstname: 'Dev', lastname: 'User'},
        members: [{id: 1, firstname: 'Dev', lastname: 'User'}, {id: 2, firstname: 'Олег', lastname: 'Оператор'}],
        observers: []
      },
      {
        id: 2,
        name: '2-я линия',
        level: 2,
        responsible: {id: 2, firstname: 'Олег', lastname: 'Оператор'},
        members: [{id: 2, firstname: 'Олег', lastname: 'Оператор'}],
        observers: []
      }
    ],

    taskTypes: [
      {id: 1, name: 'Инцидент'},
      {id: 2, name: 'Запрос на обслуживание'}
    ],

    services: [
      {id: 1, code: 'PRINT', name: 'Печать и сканирование', active: true, assignments: [
        {id: 1, organization: {id: 1, name: 'ООО Ромашка'}, active: true},
        {id: 2, organization: {id: 2, name: 'ИП Иванов'}, active: true},
        {id: 5, organization: {id: 3, name: 'АО Вектор'}, active: true}
      ]},
      {id: 2, code: 'NET', name: 'Сеть и интернет', active: true, assignments: [
        {id: 3, organization: {id: 1, name: 'ООО Ромашка'}, active: true}
      ]},
      {id: 3, code: 'MAIL', name: 'Почта', active: true, assignments: []}
    ]
  }
}
