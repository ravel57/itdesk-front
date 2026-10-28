import axios from 'axios'

export const notificationActions = {
  normalizeUserNotification(notification) {
    if (!notification || typeof notification !== 'object') {
      return null
    }

    return {
      ...notification,
      read: Boolean(notification.read || notification.readAt),
      createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
      readAt: notification.readAt ? new Date(notification.readAt) : null
    }
  },

  receiveUserNotification(notification) {
    const normalized = this.normalizeUserNotification(notification)
    if (!normalized) {
      return
    }
    if (this.currentUser?.id && Number(normalized.userId) !== Number(this.currentUser.id)) {
      return
    }

    const existingIndex = this.userNotifications.findIndex(item => {
      return normalized.id && Number(item?.id) === Number(normalized.id)
    })
    if (existingIndex >= 0) {
      this.userNotifications.splice(existingIndex, 1, {
        ...this.userNotifications[existingIndex],
        ...normalized
      })
      return
    }

    this.userNotifications.unshift(normalized)
    if (!normalized.read) {
      this.userNotificationsUnreadCount += 1
    }
  },

  fetchUserNotifications({page = 1, size = 20, unreadOnly = false, append = false} = {}) {
    this.userNotificationsLoading = true
    return axios.get('/api/v1/user/notifications', {
      params: {page, size, unreadOnly}
    })
      .then(response => {
        const notifications = Array.isArray(response.data?.notifications)
          ? response.data.notifications
            .map(item => this.normalizeUserNotification(item))
            .filter(Boolean)
          : []

        if (append) {
          const notificationById = new Map(
            this.userNotifications
              .filter(item => item?.id !== null && item?.id !== undefined)
              .map(item => [Number(item.id), item])
          )
          notifications.forEach(item => {
            if (item?.id !== null && item?.id !== undefined) {
              notificationById.set(Number(item.id), item)
            }
          })
          this.userNotifications = Array.from(notificationById.values())
            .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
        } else {
          this.userNotifications = notifications
        }

        this.userNotificationsUnreadCount = Number(response.data?.unreadCount) || 0
        this.userNotificationsPage = Number(response.data?.page) || page
        this.userNotificationsTotalPages = Number(response.data?.totalPages) || 0
        this.userNotificationsEnd = Boolean(response.data?.end)
        return response.data
      })
      .finally(() => {
        this.userNotificationsLoading = false
      })
  },

  markUserNotificationRead(notificationId) {
    const notification = this.userNotifications.find(item => Number(item?.id) === Number(notificationId))
    const wasUnread = notification && !notification.read

    return axios.patch(`/api/v1/user/notifications/${notificationId}/read`)
      .then(response => {
        const normalized = this.normalizeUserNotification(response.data)
        const index = this.userNotifications.findIndex(item => Number(item?.id) === Number(notificationId))
        if (index >= 0 && normalized) {
          this.userNotifications.splice(index, 1, {
            ...this.userNotifications[index],
            ...normalized
          })
        }
        if (wasUnread) {
          this.userNotificationsUnreadCount = Math.max(0, this.userNotificationsUnreadCount - 1)
        }
        return normalized
      })
  },

  markAllUserNotificationsRead() {
    return axios.patch('/api/v1/user/notifications/read-all')
      .then(response => {
        const readAt = new Date()
        this.userNotifications = this.userNotifications.map(notification => ({
          ...notification,
          read: true,
          readAt: notification.readAt || readAt
        }))
        this.userNotificationsUnreadCount = Number(response.data?.unreadCount) || 0
        return response.data
      })
  }
}
