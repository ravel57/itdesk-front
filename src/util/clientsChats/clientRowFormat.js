// Форматирование данных строки клиента в списке чатов: цвет аватара, «N минут назад», таймер ожидания ответа.
import { getWorkdayMinutes } from 'src/util/answerWaiting'

export function nameToPastelHex (name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  let r = (hash & 0xFF0000) >> 16
  let g = (hash & 0x00FF00) >> 8
  let b = hash & 0x0000FF

  r = Math.floor((r + 255) / 2)
  g = Math.floor((g + 255) / 2)
  b = Math.floor((b + 255) / 2)

  const pastelHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

  return pastelHex
}

// «5 минут назад» по дате последнего сообщения; undefined, если сообщения нет
export function formatTimeSinceMessage (lastMessage) {
  if (lastMessage) {
    const dateFormatted = new Date(lastMessage.date)
    const currentDate = new Date()
    const timeDifference = currentDate - dateFormatted
    const seconds = Math.floor(timeDifference / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const years = Math.floor(days / 365)

    const declension = (number, words) => {
      return words[
        (number % 10 === 1 && number % 100 !== 11) ? 0
          : (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) ? 1
              : 2
      ]
    }

    let result
    if (years > 0) {
      result = `${years} ${declension(years, ['год', 'года', 'лет'])}`
    } else if (days > 0) {
      result = `${days} ${declension(days, ['день', 'дня', 'дней'])}`
    } else if (hours > 0) {
      result = `${hours} ${declension(hours, ['час', 'часа', 'часов'])}`
    } else {
      result = `${minutes} ${declension(minutes, ['минута', 'минуты', 'минут'])}`
    }
    // назад (${dateFormatted.toLocaleTimeString('ru-RU', {
    //   timeZone: 'Europe/Moscow',
    //   year: 'numeric',
    //   month: 'numeric',
    //   day: 'numeric',
    //   hour: '2-digit',
    //   minute: '2-digit'
    // })})
    return `${result} назад`
  }
}

// Текст таймера «Требует ответа»; waitMs === null — ответа не ждут
export function formatAnswerRequiredTimer (waitMs, settings) {
  if (waitMs === null) {
    return ''
  }
  const totalMinutes = Math.floor(waitMs / 60000)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60
  if (settings.workingTimeUsed) {
    // Рабочее время: «день» — это рабочий день компании, а не 24 часа
    const workdayMinutes = getWorkdayMinutes(settings)
    const workingDays = Math.floor(totalMinutes / workdayMinutes)
    const restMinutes = totalMinutes % workdayMinutes
    if (workingDays > 0) {
      return `${workingDays}д ${Math.floor(restMinutes / 60)}ч`
    }
    return restMinutes >= 60 ? `${Math.floor(restMinutes / 60)}ч ${restMinutes % 60}м` : `${restMinutes}м`
  }
  const days = Math.floor(totalMinutes / 1440)
  if (days > 0) {
    return `${days}д ${hours}ч`
  }
  if (hours > 0) {
    return `${hours}ч ${minutes}м`
  }
  return `${minutes}м`
}

export function getAnswerRequiredTimerTitle (settings) {
  return settings.workingTimeUsed
    ? 'Требует ответа (считается только рабочее время, день — рабочий день)'
    : 'Требует ответа'
}
