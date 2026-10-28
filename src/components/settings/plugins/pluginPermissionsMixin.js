import axios from 'axios'
import {getErrorMessage, normalizePluginPermissions} from 'src/util/settingsPlugins/pluginNormalizers'

// Разрешения плагина в диалоге «Доступы и секреты»: список, одобрение и отзыв.
// Требует в компоненте: this.securityPlugin, this.notifyPositive / notifyNegative (pluginsNotifyMixin).
export default {
  data: () => ({
    pluginPermissions: [],
    permissionActions: {}
  }),

  computed: {
    pendingPermissions() {
      return this.pluginPermissions.filter(permission => !permission.approved)
    },

    hasAnyPermissionAction() {
      return Object.values(this.permissionActions).some(Boolean)
    }
  },

  methods: {
    async refreshPluginPermissions() {
      const pluginKey = this.securityPlugin?.key
      if (!pluginKey) {
        return
      }

      const response = await axios.get(`/api/v1/plugins/${encodeURIComponent(pluginKey)}/permissions`)
      this.pluginPermissions = normalizePluginPermissions(response.data)
    },

    isPermissionBusy(permission) {
      return this.permissionActions[permission] === true
    },

    setPermissionBusy(permission, busy) {
      this.permissionActions = {
        ...this.permissionActions,
        [permission]: busy
      }
    },

    async changePluginPermissions(action, permissions) {
      const pluginKey = this.securityPlugin?.key
      const requested = [...new Set((permissions || []).filter(Boolean))]
      if (!pluginKey || !requested.length) {
        return
      }

      const actionKey = requested.length > 1 ? '__batch' : requested[0]
      this.setPermissionBusy(actionKey, true)

      try {
        await axios.post(
          `/api/v1/plugins/${encodeURIComponent(pluginKey)}/permissions/${action}`,
          { permissions: requested }
        )
        await this.refreshPluginPermissions()
        this.notifyPositive(action === 'approve' ? 'Разрешение одобрено' : 'Разрешение отозвано')
      } catch (e) {
        this.notifyNegative(getErrorMessage(
          e,
          action === 'approve' ? 'Не удалось одобрить разрешение' : 'Не удалось отозвать разрешение'
        ))
      } finally {
        this.setPermissionBusy(actionKey, false)
      }
    },

    approvePermission(permission) {
      return this.changePluginPermissions('approve', [permission.permission])
    },

    revokePermission(permission) {
      return this.changePluginPermissions('revoke', [permission.permission])
    }
  }
}
