import {formatNumber, formatPercent, formatPeriodDate} from './analyticsFormat'

// Чистые расчёты вкладки «Обзор»: ряды графиков, пульс очереди, показометры.

export function normalizePeriodRows(rows) {
  const normalized = rows.map(row => ({
    period: row.period,
    label: formatPeriodDate(row.period),
    count: Number(row.count || row.value || 0)
  }))
  const max = Math.max(...normalized.map(row => row.count), 0)

  return normalized
    .sort((left, right) => String(left.period).localeCompare(String(right.period)))
    .map(row => ({
      ...row,
      percent: max > 0 ? Math.max((row.count / max) * 100, row.count > 0 ? 8 : 0) : 0
    }))
}

// Объединяет ряды «закрыто» и «переоткрыто» по периоду и считает ширину полос в процентах.
export function buildPeriodActivityRows(closedTrendRows, reopenedTrendRows) {
  const map = new Map()

  closedTrendRows.forEach(row => {
    map.set(row.period, {
      period: row.period,
      label: row.label,
      closedCount: row.count,
      reopenedCount: 0
    })
  })

  reopenedTrendRows.forEach(row => {
    const current = map.get(row.period) || {
      period: row.period,
      label: row.label,
      closedCount: 0,
      reopenedCount: 0
    }
    current.reopenedCount = row.count
    map.set(row.period, current)
  })

  const rows = Array.from(map.values())
    .sort((left, right) => String(left.period).localeCompare(String(right.period)))
    .map(row => ({
      ...row,
      totalCount: Number(row.closedCount || 0) + Number(row.reopenedCount || 0)
    }))

  const max = Math.max(...rows.map(row => Math.max(row.closedCount, row.reopenedCount)), 0)

  return rows.map(row => ({
    ...row,
    closedPercent: max > 0 ? Math.max((row.closedCount / max) * 100, row.closedCount > 0 ? 8 : 0) : 0,
    reopenedPercent: max > 0 ? Math.max((row.reopenedCount / max) * 100, row.reopenedCount > 0 ? 8 : 0) : 0
  }))
}

// Строки графика нагрузки по часам (сырые строки summary → нормализованные с сегментами).
export function buildHourlyLoadRows(rows) {
  const normalized = rows.map(row => {
    const rawHour = row.hour !== undefined && row.hour !== null ? row.hour : row.hourOfDay
    const hour = Number(rawHour || 0)
    const incomingMessages = Number(row.incomingMessages || row.incoming || 0)
    const outgoingMessages = Number(row.outgoingMessages || row.outgoing || 0)
    const createdTasks = Number(row.createdTasks || row.taskCreated || 0)
    const closedTasks = Number(row.closedTasks || row.taskClosed || 0)
    const reopenedTasks = Number(row.reopenedTasks || row.reopened || row.returnedToWorkTasks || 0)
    const total = Number(row.total || row.count || incomingMessages + outgoingMessages + createdTasks + closedTasks + reopenedTasks)

    const segmentTotal = incomingMessages + outgoingMessages + createdTasks + closedTasks + reopenedTasks
    const segments = [
      {
        key: 'incoming',
        value: incomingMessages,
        class: 'hourly-load-segment-incoming'
      },
      {
        key: 'outgoing',
        value: outgoingMessages,
        class: 'hourly-load-segment-outgoing'
      },
      {
        key: 'created',
        value: createdTasks,
        class: 'hourly-load-segment-created'
      },
      {
        key: 'closed',
        value: closedTasks,
        class: 'hourly-load-segment-closed'
      },
      {
        key: 'reopened',
        value: reopenedTasks,
        class: 'hourly-load-segment-reopened'
      }
    ]
      .filter(segment => segment.value > 0)
      .map(segment => ({
        ...segment,
        percent: segmentTotal > 0 ? (segment.value / segmentTotal) * 100 : 0
      }))
    return {
      hour,
      label: row.label || `${String(hour).padStart(2, '0')}:00`,
      incomingMessages,
      outgoingMessages,
      createdTasks,
      closedTasks,
      reopenedTasks,
      total,
      segments
    }
  }).sort((left, right) => left.hour - right.hour)

  const max = Math.max(...normalized.map(row => row.total), 0)

  return normalized.map(row => ({
    ...row,
    percent: max > 0 ? Math.max((row.total / max) * 100, row.total > 0 ? 6 : 0) : 0
  }))
}

// counts: {overdueDeadlines, overdueSla, unansweredMessages, unassignedTasks}
export function buildQueuePulseItems(counts, canViewInternalAnalytics) {
  const items = [
    {
      key: 'overdueDeadlines',
      label: 'Дедлайн нарушен',
      value: formatNumber(counts.overdueDeadlines),
      caption: 'Сначала закрывать эти заявки',
      icon: 'event_busy',
      color: counts.overdueDeadlines > 0 ? 'negative' : 'grey-2',
      textColor: counts.overdueDeadlines > 0 ? 'white' : 'dark'
    },
    {
      key: 'overdueSla',
      label: 'SLA нарушен',
      value: formatNumber(counts.overdueSla),
      caption: 'Клиент ждет реакции дольше нормы',
      icon: 'timer_off',
      color: counts.overdueSla > 0 ? 'negative' : 'grey-2',
      textColor: counts.overdueSla > 0 ? 'white' : 'dark'
    },
    {
      key: 'unansweredMessages',
      label: 'Сообщения без ответа',
      value: formatNumber(counts.unansweredMessages),
      caption: 'Очередь клиентских сообщений',
      icon: 'mark_chat_unread',
      color: counts.unansweredMessages > 0 ? 'warning' : 'grey-2',
      textColor: 'dark'
    },
    {
      key: 'unassignedTasks',
      label: 'Без исполнителя',
      value: formatNumber(counts.unassignedTasks),
      caption: 'Нужно назначить ответственного',
      icon: 'person_off',
      color: counts.unassignedTasks > 0 ? 'warning' : 'grey-2',
      textColor: 'dark'
    }
  ]
  return canViewInternalAnalytics
    ? items
    : items.filter(item => item.key !== 'unassignedTasks')
}

export function calculateHealthPercent(total, badCount) {
  const safeTotal = Number(total || 0)
  const safeBadCount = Number(badCount || 0)
  if (safeTotal <= 0) {
    return 100
  }
  return Math.max(0, Math.min(100, ((safeTotal - safeBadCount) / safeTotal) * 100))
}

export function getGaugeColor(value) {
  const percent = Number(value || 0)
  if (percent >= 85) {
    return 'positive'
  }
  if (percent >= 60) {
    return 'warning'
  }
  return 'negative'
}

function buildGauge(key, label, caption, total, badCount) {
  const value = calculateHealthPercent(total, badCount)
  return {
    key,
    label,
    value,
    valueLabel: formatPercent(value),
    caption,
    color: getGaugeColor(value)
  }
}

// counts: {openTasks, overdueSla, overdueDeadlines, unassignedTasks, newAppeals, unansweredMessages}
export function buildQualityGauges(counts, canViewInternalAnalytics) {
  const gauges = [
    buildGauge('slaHealth', 'SLA без просрочки', 'Доля открытых заявок без нарушения SLA',
      counts.openTasks, counts.overdueSla),
    buildGauge('deadlineHealth', 'Дедлайны в норме', 'Доля открытых заявок без просрочки дедлайна',
      counts.openTasks, counts.overdueDeadlines),
    buildGauge('assignmentHealth', 'Назначены исполнители', 'Доля открытых заявок с ответственным',
      counts.openTasks, counts.unassignedTasks),
    buildGauge('responseHealth', 'Очередь без ожидания', 'Чем выше, тем меньше сообщений без ответа',
      counts.newAppeals || counts.unansweredMessages, counts.unansweredMessages)
  ]
  return canViewInternalAnalytics
    ? gauges
    : gauges.filter(gauge => gauge.key !== 'assignmentHealth')
}
