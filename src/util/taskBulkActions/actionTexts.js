// Тексты модалки массовых действий: заголовок, уведомление об успехе, склонение «Выбрано N заявок».

export function getBulkActionHeader (action) {
  switch (action) {
    case 'close':
      return 'Закрыть заявки'
    case 'open':
      return 'Открыть заявки'
    // case 'freeze':
    //   return 'Заморозить заявки'
    case 'supportLine':
      return 'Изменить линию поддержки'
    case 'executor':
      return 'Изменить исполнителя заявок'
    case 'status':
      return 'Изменить статусы заявок'
    case 'priority':
      return 'Изменить приоритеты заявок'
    case 'type':
      return 'Изменить тип заявки'
    case 'service':
      return 'Изменить сервис заявок'
    case 'tags':
      return 'Изменить теги заявок'
    case 'deadline':
      return 'Изменить дедлайны заявок'
    default :
      return ''
  }
}

export function getBulkActionNotify (action) {
  switch (action) {
    case 'close':
      return 'Заявки закрыты'
    case 'open':
      return 'Заявки открыты'
    case 'freeze':
      return 'Заявки заморожены'
    case 'supportLine':
      return 'Линия поддержки изменена'
    case 'executor':
      return 'Исполнитель изменен'
    case 'status':
      return 'Статус изменен'
    case 'priority':
      return 'Приоритет изменен'
    case 'type':
      return 'Тип заявки изменен'
    case 'service':
      return 'Сервис заявок изменен'
    case 'tags':
      return 'Теги изменены'
    case 'deadline':
      return 'Дедлайн изменен'
    default :
      return ''
  }
}

export function getDeclension (count) {
  const declensions = ['заявка', 'заявки', 'заявок']
  let form
  let selected
  if (count % 10 === 1 && count % 100 !== 11) {
    form = declensions[0]
    selected = 'Выбрана'
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    form = declensions[1]
    selected = 'Выбраны'
  } else {
    form = declensions[2]
    selected = 'Выбраны'
  }
  return `${selected} ${count} ${form}`
}
