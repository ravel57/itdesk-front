export function createDirectoriesDb() {
  return {
    organizations: [
      {id: 1, name: 'ООО Ромашка'},
      {id: 2, name: 'ИП Иванов'}
    ],

    tags: [
      {id: 1, name: 'Срочно'},
      {id: 2, name: 'Принтер'},
      {id: 3, name: 'Интернет'}
    ],

    statuses: [
      {id: 1, name: 'OPEN', isDefault: true},
      {id: 2, name: 'IN_PROGRESS', isDefault: false},
      {id: 3, name: 'DONE', isDefault: false}
    ],

    priorities: [
      {id: 1, name: 'LOW', isDefault: true},
      {id: 2, name: 'MEDIUM', isDefault: false},
      {id: 3, name: 'HIGH', isDefault: false}
    ],

    templates: [
      {id: 1, name: 'Приветствие', text: 'Здравствуйте! Сейчас проверю и вернусь с ответом.'},
      {id: 2, name: 'Сбор данных', text: 'Уточните, пожалуйста: ОС, ошибка, когда началось, что менялось?'}
    ],

    knowledgeBase: [
      {id: 1, title: 'Гайд: Принтер не печатает', text: '1) Проверь кабель\n2) Перезапусти очередь печати\n3) Драйвер', tags: [{id: 2, name: 'Принтер'}]},
      {id: 2, title: 'Гайд: Интернет не работает', text: '1) Проверить кабель\n2) IP\n3) DNS\n4) Перезапуск роутера', tags: [{id: 3, name: 'Интернет'}]}
    ]
  }
}
