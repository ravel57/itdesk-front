const DISPLAY_TIME_MS = 5000
const BETWEEN_NOTIFICATIONS_MS = 300
const BATCH_WINDOW_MS = 1000
const MAX_BATCH_SIZE = 10
const MAX_BATCH_PREVIEW_ITEMS = 10

const notificationQueue = []
const pendingBatch = []
let activeNotification = null
let activeKey = null
let activeTimer = null
let nextTimer = null
let batchTimer = null

function isSupported () {
  return typeof window !== 'undefined' && 'Notification' in window
}

function notificationKey (title, options) {
  if (options.key != null && String(options.key).trim() !== '') {
    return String(options.key)
  }
  if (options.tag != null && String(options.tag).trim() !== '') {
    return String(options.tag)
  }
  return `${title}\u0000${options.body ?? ''}`
}

function pluralizeNotifications (count) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return 'уведомление'
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'уведомления'
  }
  return 'уведомлений'
}

function scheduleNext () {
  if (nextTimer || activeNotification || notificationQueue.length === 0) {
    return
  }

  nextTimer = window.setTimeout(() => {
    nextTimer = null
    showNextNotification()
  }, BETWEEN_NOTIFICATIONS_MS)
}

function releaseNotification (notification, closeNotification) {
  if (activeNotification !== notification) {
    return
  }

  if (activeTimer) {
    window.clearTimeout(activeTimer)
    activeTimer = null
  }

  activeNotification = null
  activeKey = null

  if (closeNotification) {
    try {
      notification.close()
    } catch (e) {
      console.debug('Unable to close browser notification', e)
    }
  }

  scheduleNext()
}

function showNextNotification () {
  if (!isSupported() || Notification.permission !== 'granted') {
    notificationQueue.length = 0
    pendingBatch.length = 0
    return
  }

  if (activeNotification || notificationQueue.length === 0) {
    return
  }

  const item = notificationQueue.shift()

  let notification
  try {
    notification = new Notification(item.title, {
      body: item.options.body ?? '',
      icon: item.options.icon ?? '/icons/icon-192.png',
      tag: item.options.tag,
      silent: item.options.silent,
      data: item.options.data
    })
  } catch (e) {
    console.error('Unable to show browser notification', e)
    scheduleNext()
    return
  }

  activeNotification = notification
  activeKey = item.key

  let released = false
  const releaseOnce = closeNotification => {
    if (released) return
    released = true
    releaseNotification(notification, closeNotification)
  }

  notification.onclick = () => {
    window.focus()
    if (typeof item.options.onClick === 'function') {
      item.options.onClick()
    }
    releaseOnce(true)
  }

  notification.onclose = () => {
    releaseOnce(false)
  }

  notification.onerror = () => {
    releaseOnce(false)
  }

  const displayTime = Number(item.options.displayTimeMs)
  const timeout = Number.isFinite(displayTime) && displayTime > 0
    ? displayTime
    : DISPLAY_TIME_MS

  activeTimer = window.setTimeout(() => {
    releaseOnce(true)
  }, timeout)
}

function buildBatchNotification (items) {
  if (items.length === 1) {
    return items[0]
  }

  const preview = items
    .map(item => String(item.options.body ?? item.title ?? '').trim())
    .filter(Boolean)
    .slice(0, MAX_BATCH_PREVIEW_ITEMS)

  const hiddenCount = items.length - preview.length
  const previewBody = preview.join('\n')
  const body = hiddenCount > 0
    ? `${previewBody}${previewBody ? '\n' : ''}Ещё ${hiddenCount}...`
    : previewBody

  return {
    key: `__uldesk-batch-${Date.now()}__`,
    title: `ULDesk — ${items.length} ${pluralizeNotifications(items.length)}`,
    options: {
      body: body || 'Получено несколько новых событий',
      icon: items.find(item => item.options.icon)?.options.icon ?? '/icons/icon-192.png',
      tag: 'uldesk-notifications-batch',
      data: {
        notificationCount: items.length,
        notifications: items.map(item => item.options.data).filter(Boolean)
      }
    }
  }
}

function flushPendingBatch () {
  if (batchTimer) {
    window.clearTimeout(batchTimer)
    batchTimer = null
  }

  if (pendingBatch.length === 0) {
    return
  }

  const items = pendingBatch.splice(0, pendingBatch.length)
  notificationQueue.push(buildBatchNotification(items))
  showNextNotification()
}

function scheduleBatchFlush () {
  if (batchTimer) {
    window.clearTimeout(batchTimer)
  }

  batchTimer = window.setTimeout(() => {
    flushPendingBatch()
  }, BATCH_WINDOW_MS)
}

function enqueueNotification (title, options) {
  const key = notificationKey(title, options)

  if (
    activeKey === key ||
    pendingBatch.some(item => item.key === key) ||
    notificationQueue.some(item => item.key === key)
  ) {
    return {
      queued: true,
      duplicate: true,
      key
    }
  }

  pendingBatch.push({title, options, key})

  if (pendingBatch.length >= MAX_BATCH_SIZE) {
    flushPendingBatch()
  } else {
    scheduleBatchFlush()
  }

  return {
    queued: true,
    batching: true,
    key
  }
}

export function useSystemNotifications () {
  const supported = () => isSupported()

  const permission = () => (supported() ? Notification.permission : 'unsupported')

  async function requestPermission () {
    if (!supported()) return 'unsupported'
    if (Notification.permission === 'granted') return 'granted'
    if (Notification.permission === 'denied') return 'denied'
    return await Notification.requestPermission()
  }

  function notify (title, options = {}) {
    if (!supported()) return null
    if (Notification.permission !== 'granted') return null

    return enqueueNotification(title, options)
  }

  return {supported, permission, requestPermission, notify}
}
