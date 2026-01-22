export function useSystemNotifications () {
  const supported = () => 'Notification' in window

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

    const n = new Notification(title, {
      body: options.body ?? '',
      icon: options.icon ?? '/icons/icon-192.png',
      tag: options.tag,
      silent: options.silent,
      data: options.data
    })

    n.onclick = () => {
      window.focus()
      n.close()
      if (typeof options.onClick === 'function') options.onClick()
    }

    return n
  }

  return { supported, permission, requestPermission, notify }
}
