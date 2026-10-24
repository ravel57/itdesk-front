/** Browser alerts are separate from the socket updates that keep the chat current. */
export function createPortalMessageNotifier ({ enabled, userId, onClick }) {
  let active = null
  let timer = null

  function close () {
    if (timer) window.clearTimeout(timer)
    timer = null
    const notification = active
    active = null
    notification?.close()
  }

  function notify (incoming, knownMessages = []) {
    if (!enabled() || typeof window === 'undefined' || !('Notification' in window) ||
        window.Notification.permission !== 'granted' || (!document.hidden && document.hasFocus())) return

    const known = new Set(knownMessages.filter(message => message.id != null).map(message => String(message.id)))
    const fresh = []
    for (const message of incoming || []) {
      if (!message || message.id == null || known.has(String(message.id))) continue
      known.add(String(message.id))
      if (message.fromClient !== false || message.editedAt || message.deleted || message.isComment) continue
      fresh.push(message)
    }
    if (!fresh.length) return
    const latest = fresh.at(-1)
    const body = String(latest.text || (latest.fileName ? `Прикреплён файл: ${latest.fileName}` : 'Новое сообщение поддержки')).slice(0, 300)
    close()
    try {
      const notification = new window.Notification(fresh.length > 1 ? `Поддержка: ${fresh.length} новых сообщений` : 'Новое сообщение поддержки', {
        body, icon: '/icons/icon-192.png', tag: `uldesk-portal-${userId()}`
      })
      active = notification
      notification.onclick = () => {
        window.focus()
        onClick?.()
        close()
      }
      timer = window.setTimeout(close, 5000)
    } catch (error) {
      console.debug('Не удалось показать уведомление клиентского портала', error)
    }
  }

  return { notify, close }
}
