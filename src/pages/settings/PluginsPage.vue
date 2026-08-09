<template>
  <q-page class="plugins-page">
    <div class="plugins-header settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Плагины</div>
        <div class="settings-content-description">
          Загружайте, обновляйте и управляйте установленными плагинами ULDesk.
        </div>
      </div>

      <div class="settings-content-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="refresh"
          label="Перезагрузить плагины"
          :loading="reloading"
          @click="reloadPlugins"
        />
      </div>
    </div>

    <q-card class="plugins-card">
      <q-card-section>
        <div class="text-subtitle1">Загрузить плагин</div>
        <div class="text-caption text-grey-7">
          Загрузите ZIP-архив с manifest.yml, ui.yml и, если нужен backend-hook, plugin.groovy.
        </div>
      </q-card-section>

      <q-separator/>

      <q-card-section>
        <div class="upload-row">
          <q-file
            v-model="pluginFile"
            outlined
            dense
            clearable
            accept=".zip"
            label="Выберите ZIP-плагин *"
            class="plugin-file"
          >
            <template #prepend>
              <q-icon name="extension"/>
            </template>
          </q-file>

          <q-btn
            color="primary"
            icon="upload"
            label="Загрузить"
            :disable="!pluginFile"
            :loading="uploading"
            @click="uploadPlugin"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card class="plugins-card">
      <q-card-section class="plugins-table-header">
        <div>
          <div class="text-subtitle1">Установленные плагины</div>
          <div class="text-caption text-grey-7">
            Плагины хранятся на backend в постоянной папке plugins.
          </div>
        </div>

        <q-btn
          flat
          dense
          icon="refresh"
          label="Обновить"
          :loading="loading"
          @click="loadPlugins"
        />
      </q-card-section>

      <q-separator/>

      <q-table
        class="settings-row-table"
        flat
        :rows="plugins"
        :columns="columns"
        row-key="key"
        :loading="loading"
        :pagination="pagination"
        no-data-label="Плагины не установлены"
        loading-label="Загрузка плагинов..."
      >
        <template #body-cell-enabled="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.enabled === false ? 'grey' : 'positive'"
              :label="props.row.enabled === false ? 'Отключен' : 'Включен'"
            />
          </q-td>
        </template>

        <template #body-cell-runtime="props">
          <q-td :props="props">
            <q-badge
              outline
              color="primary"
              :label="props.row.runtime || 'frontend-only'"
            />
          </q-td>
        </template>

        <template #body-cell-extensionPoints="props">
          <q-td :props="props">
            <div
              v-if="props.row.extensionPoints && props.row.extensionPoints.length"
              class="extension-points"
            >
              <q-badge
                v-for="point in props.row.extensionPoints"
                :key="point"
                outline
                color="secondary"
                class="extension-point-badge"
                :label="point"
              />
            </div>

            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <div class="row-actions">
              <q-btn
                dense
                flat
                round
                color="primary"
                icon="admin_panel_settings"
                title="Доступы и секреты"
                @click="openPluginSecurity(props.row)"
              />

              <q-btn
                v-if="props.row.enabled === false"
                dense
                flat
                round
                color="positive"
                icon="play_arrow"
                title="Включить"
                @click="enablePlugin(props.row)"
              />

              <q-btn
                v-else
                dense
                flat
                round
                color="warning"
                icon="pause"
                title="Отключить"
                @click="disablePlugin(props.row)"
              />

              <q-btn
                dense
                flat
                round
                color="primary"
                icon="restart_alt"
                title="Перезагрузить"
                @click="reloadSinglePlugin(props.row)"
              />

              <q-btn
                dense
                flat
                round
                color="negative"
                icon="delete"
                title="Удалить"
                @click="confirmDeletePlugin(props.row)"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-dialog
      v-model="securityDialogOpen"
      @hide="clearSecurityDialogState"
    >
      <q-card class="plugin-security-dialog">
        <q-card-section class="plugin-security-header">
          <div>
            <div class="text-h6">Доступы и секреты</div>
            <div class="text-caption text-grey-7">
              {{ securityPlugin?.name || securityPlugin?.key }}
              <span v-if="securityPlugin?.key">({{ securityPlugin.key }})</span>
            </div>
          </div>

          <div class="row items-center q-gutter-xs">
            <q-btn
              flat
              round
              dense
              icon="refresh"
              title="Обновить доступы и секреты"
              :loading="securityLoading"
              @click="loadPluginSecurity"
            />
            <q-btn flat round dense icon="close" v-close-popup/>
          </div>
        </q-card-section>

        <q-linear-progress v-if="securityLoading" indeterminate color="primary"/>
        <q-separator/>

        <q-card-section class="plugin-security-section">
          <div class="plugin-security-section-header">
            <div>
              <div class="text-subtitle1">Разрешения</div>
              <div class="text-caption text-grey-7">
                Манифест только запрашивает доступ. Каждое разрешение одобряется администратором отдельно.
              </div>
            </div>
          </div>

          <q-banner
            v-if="pendingPermissions.length"
            dense
            rounded
            class="bg-amber-1 text-amber-10 q-mb-md"
          >
            Есть разрешения, ожидающие решения администратора: {{ pendingPermissions.length }}.
          </q-banner>

          <q-list
            v-if="pluginPermissions.length"
            bordered
            separator
            class="rounded-borders"
          >
            <q-item
              v-for="permission in pluginPermissions"
              :key="permission.permission"
              class="plugin-permission-row"
            >
              <q-item-section>
                <q-item-label>{{ permission.description || permission.permission }}</q-item-label>
                <q-item-label caption class="plugin-code">
                  {{ permission.permission }}
                </q-item-label>
                <q-item-label
                  v-if="permission.approved && (permission.approvedBy || permission.approvedAt)"
                  caption
                  class="q-mt-xs"
                >
                  Одобрено
                  <span v-if="permission.approvedBy">: {{ permission.approvedBy }}</span>
                  <span v-if="permission.approvedAt"> · {{ permission.approvedAt }}</span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="plugin-permission-actions">
                  <q-badge
                    :color="permission.approved ? 'positive' : 'warning'"
                    :label="permission.approved ? 'Одобрено' : 'Ожидает'"
                  />

                  <q-btn
                    v-if="permission.approved"
                    dense
                    outline
                    no-caps
                    color="negative"
                    label="Отозвать"
                    :loading="isPermissionBusy(permission.permission)"
                    :disable="hasAnyPermissionAction"
                    @click="revokePermission(permission)"
                  />
                  <q-btn
                    v-else
                    dense
                    unelevated
                    no-caps
                    color="positive"
                    label="Одобрить"
                    :loading="isPermissionBusy(permission.permission)"
                    :disable="hasAnyPermissionAction"
                    @click="approvePermission(permission)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <div v-else-if="!securityLoading" class="text-grey-6 q-py-sm">
            Плагин не запросил дополнительных разрешений.
          </div>
        </q-card-section>

        <q-separator/>

        <q-card-section class="plugin-security-section">
          <div class="text-subtitle1">Секреты</div>
          <div class="text-caption text-grey-7 q-mb-md">
            Значение никогда не читается обратно из backend. Поле всегда пустое; сохранение заменяет текущее значение.
          </div>

          <q-banner
            v-if="pluginSecrets.length"
            dense
            rounded
            class="bg-blue-1 text-blue-9 q-mb-md"
          >
            Секрет хранится зашифрованно и используется broker'ом только для адресов, объявленных плагином.
          </q-banner>

          <div v-if="pluginSecrets.length" class="plugin-secrets-list">
            <q-card
              v-for="secret in pluginSecrets"
              :key="secret.name"
              flat
              bordered
              class="plugin-secret-card"
            >
              <q-card-section>
                <div class="plugin-secret-heading">
                  <div>
                    <div class="text-subtitle2">{{ secret.title || secret.name }}</div>
                    <div class="text-caption plugin-code">{{ secret.name }}</div>
                  </div>
                  <q-badge
                    :color="secret.configured ? 'positive' : 'grey'"
                    :label="secret.configured ? 'Настроен' : 'Не задан'"
                  />
                </div>

                <div v-if="secret.description" class="text-caption text-grey-7 q-mt-sm">
                  {{ secret.description }}
                </div>

                <div v-if="secret.sendTo.length" class="q-mt-sm">
                  <div class="text-caption text-grey-7 q-mb-xs">Разрешённые назначения:</div>
                  <div class="secret-destinations">
                    <q-badge
                      v-for="destination in secret.sendTo"
                      :key="destination"
                      outline
                      color="primary"
                      :label="destination"
                    />
                  </div>
                </div>

                <div class="plugin-secret-editor q-mt-md">
                  <q-input
                    v-model="secretValues[secret.name]"
                    outlined
                    dense
                    :type="isSecretVisible(secret.name) ? 'text' : 'password'"
                    :label="secret.configured ? 'Новое значение' : 'Значение *'"
                    autocomplete="new-password"
                    spellcheck="false"
                    :disable="isSecretBusy(secret.name)"
                    @keyup.enter="savePluginSecret(secret)"
                  >
                    <template #append>
                      <q-icon
                        :name="isSecretVisible(secret.name) ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer"
                        @click="toggleSecretVisibility(secret.name)"
                      />
                    </template>
                  </q-input>

                  <div class="plugin-secret-actions">
                    <q-btn
                      unelevated
                      no-caps
                      color="primary"
                      icon="save"
                      :label="secret.configured ? 'Заменить' : 'Сохранить'"
                      :loading="isSecretBusy(secret.name)"
                      :disable="!hasSecretValue(secret.name) || hasAnySecretAction"
                      @click="savePluginSecret(secret)"
                    />
                    <q-btn
                      v-if="secret.configured"
                      outline
                      no-caps
                      color="negative"
                      icon="delete_outline"
                      label="Удалить значение"
                      :loading="isSecretBusy(secret.name)"
                      :disable="hasAnySecretAction"
                      @click="deletePluginSecret(secret)"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div v-else-if="!securityLoading" class="text-grey-6 q-py-sm">
            Плагин не объявил настраиваемых секретов.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import axios from 'axios'

export default {
  name: 'PluginsPage',

  data: () => ({
    pluginFile: null,
    plugins: [],
    loading: false,
    uploading: false,
    reloading: false,

    securityDialogOpen: false,
    securityPlugin: null,
    securityLoading: false,
    pluginPermissions: [],
    pluginSecrets: [],
    permissionActions: {},
    secretActions: {},
    secretValues: {},
    secretVisibility: {},

    pagination: {
      rowsPerPage: 10
    },

    columns: [
      {
        name: 'name',
        label: 'Название',
        field: row => row.name || row.key,
        align: 'left',
        sortable: true
      },
      {
        name: 'key',
        label: 'Ключ',
        field: 'key',
        align: 'left',
        sortable: true
      },
      {
        name: 'version',
        label: 'Версия',
        field: row => row.version || '—',
        align: 'left',
        sortable: true
      },
      {
        name: 'enabled',
        label: 'Статус',
        field: 'enabled',
        align: 'left',
        sortable: true
      },
      {
        name: 'runtime',
        label: 'Runtime',
        field: 'runtime',
        align: 'left',
        sortable: true
      },
      {
        name: 'extensionPoints',
        label: 'Точки расширения',
        field: 'extensionPoints',
        align: 'left'
      },
      {
        name: 'actions',
        label: '',
        field: 'actions',
        align: 'right'
      }
    ]
  }),

  computed: {
    pendingPermissions() {
      return this.pluginPermissions.filter(permission => !permission.approved)
    },

    hasAnyPermissionAction() {
      return Object.values(this.permissionActions).some(Boolean)
    },

    hasAnySecretAction() {
      return Object.values(this.secretActions).some(Boolean)
    }
  },

  mounted() {
    this.loadPlugins()
  },

  methods: {
    async loadPlugins() {
      this.loading = true

      try {
        const response = await axios.get('/api/v1/plugins')
        this.plugins = this.normalizePlugins(response.data)
      } catch (e) {
        this.notifyNegative('Не удалось загрузить список плагинов')
      } finally {
        this.loading = false
      }
    },

    async openPluginSecurity(plugin) {
      this.securityPlugin = plugin
      this.securityDialogOpen = true
      this.pluginPermissions = []
      this.pluginSecrets = []
      this.permissionActions = {}
      this.secretActions = {}
      this.secretValues = {}
      this.secretVisibility = {}
      await this.loadPluginSecurity()
    },

    clearSecurityDialogState() {
      // Не держим введённые секреты в памяти дольше открытого диалога.
      this.secretValues = {}
      this.secretVisibility = {}
      this.permissionActions = {}
      this.secretActions = {}
      this.pluginPermissions = []
      this.pluginSecrets = []
      this.securityPlugin = null
      this.securityLoading = false
    },

    async loadPluginSecurity() {
      const pluginKey = this.securityPlugin?.key
      if (!pluginKey) {
        return
      }

      this.securityLoading = true
      const encodedKey = encodeURIComponent(pluginKey)

      try {
        const [permissionsResult, secretsResult] = await Promise.allSettled([
          axios.get(`/api/v1/plugins/${encodedKey}/permissions`),
          axios.get(`/api/v1/plugins/${encodedKey}/secrets`)
        ])

        if (permissionsResult.status === 'fulfilled') {
          this.pluginPermissions = this.normalizePluginPermissions(permissionsResult.value.data)
        } else {
          this.pluginPermissions = []
          this.notifyNegative(this.getErrorMessage(permissionsResult.reason, 'Не удалось загрузить разрешения плагина'))
        }

        if (secretsResult.status === 'fulfilled') {
          this.pluginSecrets = this.normalizePluginSecrets(secretsResult.value.data)
          this.secretValues = Object.fromEntries(this.pluginSecrets.map(secret => [secret.name, '']))
          this.secretVisibility = {}
        } else {
          this.pluginSecrets = []
          this.secretValues = {}
          this.notifyNegative(this.getErrorMessage(secretsResult.reason, 'Не удалось загрузить секреты плагина'))
        }
      } finally {
        this.securityLoading = false
      }
    },

    normalizePluginPermissions(data) {
      const source = Array.isArray(data) ? data : data?.permissions || []

      return source.map(item => {
        if (typeof item === 'string') {
          return {
            permission: item,
            description: item,
            approved: false,
            approvedAt: null,
            approvedBy: null
          }
        }

        return {
          permission: item?.permission || item?.name || '',
          description: this.cleanBackendString(item?.description),
          approved: item?.approved === true,
          approvedAt: this.cleanBackendString(item?.approvedAt),
          approvedBy: this.cleanBackendString(item?.approvedBy)
        }
      }).filter(item => item.permission)
    },

    normalizePluginSecrets(data) {
      const source = Array.isArray(data) ? data : data?.secrets || []

      return source.map(secret => ({
        name: this.cleanBackendString(secret?.name) || '',
        title: this.cleanBackendString(secret?.title),
        description: this.cleanBackendString(secret?.description),
        sendTo: Array.isArray(secret?.sendTo) ? secret.sendTo.filter(Boolean) : [],
        configured: secret?.configured === true
      })).filter(secret => secret.name)
    },

    cleanBackendString(value) {
      if (value === null || value === undefined) {
        return null
      }

      const normalized = String(value).trim()
      if (!normalized || normalized.toLowerCase() === 'null') {
        return null
      }

      return normalized
    },

    async refreshPluginPermissions() {
      const pluginKey = this.securityPlugin?.key
      if (!pluginKey) {
        return
      }

      const response = await axios.get(`/api/v1/plugins/${encodeURIComponent(pluginKey)}/permissions`)
      this.pluginPermissions = this.normalizePluginPermissions(response.data)
    },

    async refreshPluginSecrets() {
      const pluginKey = this.securityPlugin?.key
      if (!pluginKey) {
        return
      }

      const response = await axios.get(`/api/v1/plugins/${encodeURIComponent(pluginKey)}/secrets`)
      this.pluginSecrets = this.normalizePluginSecrets(response.data)

      const nextValues = {}
      this.pluginSecrets.forEach(secret => {
        nextValues[secret.name] = this.secretValues[secret.name] || ''
      })
      this.secretValues = nextValues
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
        this.notifyNegative(this.getErrorMessage(
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
    },

    isSecretBusy(name) {
      return this.secretActions[name] === true
    },

    setSecretBusy(name, busy) {
      this.secretActions = {
        ...this.secretActions,
        [name]: busy
      }
    },

    hasSecretValue(name) {
      const value = this.secretValues[name]
      return typeof value === 'string' && value.trim().length > 0
    },

    isSecretVisible(name) {
      return this.secretVisibility[name] === true
    },

    toggleSecretVisibility(name) {
      this.secretVisibility = {
        ...this.secretVisibility,
        [name]: !this.secretVisibility[name]
      }
    },

    async savePluginSecret(secret) {
      const pluginKey = this.securityPlugin?.key
      const value = this.secretValues[secret.name]
      if (!pluginKey || typeof value !== 'string' || !value.trim()) {
        return
      }

      this.setSecretBusy(secret.name, true)
      try {
        await axios.put(
          `/api/v1/plugins/${encodeURIComponent(pluginKey)}/secrets/${encodeURIComponent(secret.name)}`,
          { value }
        )

        // Значение намеренно не сохраняем и не перечитываем после запроса.
        this.secretValues = {
          ...this.secretValues,
          [secret.name]: ''
        }
        this.secretVisibility = {
          ...this.secretVisibility,
          [secret.name]: false
        }

        await this.refreshPluginSecrets()
        this.notifyPositive(`Секрет ${secret.title || secret.name} сохранён`)
      } catch (e) {
        this.notifyNegative(this.getErrorMessage(e, 'Не удалось сохранить секрет'))
      } finally {
        this.setSecretBusy(secret.name, false)
      }
    },

    async deletePluginSecret(secret) {
      const pluginKey = this.securityPlugin?.key
      if (!pluginKey) {
        return
      }

      if (!window.confirm(`Удалить сохранённое значение секрета "${secret.title || secret.name}"?`)) {
        return
      }

      this.setSecretBusy(secret.name, true)
      try {
        await axios.delete(
          `/api/v1/plugins/${encodeURIComponent(pluginKey)}/secrets/${encodeURIComponent(secret.name)}`
        )
        this.secretValues = {
          ...this.secretValues,
          [secret.name]: ''
        }
        this.secretVisibility = {
          ...this.secretVisibility,
          [secret.name]: false
        }
        await this.refreshPluginSecrets()
        this.notifyPositive(`Значение секрета ${secret.title || secret.name} удалено`)
      } catch (e) {
        this.notifyNegative(this.getErrorMessage(e, 'Не удалось удалить секрет'))
      } finally {
        this.setSecretBusy(secret.name, false)
      }
    },

    normalizePlugins(data) {
      const source = Array.isArray(data)
        ? data
        : data?.plugins || data?.items || []

      return source.map(plugin => {
        const manifest = plugin.manifest || plugin
        const pluginInfo = manifest.plugin || plugin.plugin || {}

        const extensionPoints = this.resolveExtensionPoints(plugin, manifest)

        return {
          key: plugin.key || pluginInfo.key || manifest.key,
          name: plugin.name || pluginInfo.name || manifest.name,
          description: plugin.description || pluginInfo.description || manifest.description,
          version: plugin.version || pluginInfo.version || manifest.version,
          author: plugin.author || pluginInfo.author || manifest.author,
          enabled: plugin.enabled !== false,
          runtime: this.resolveRuntime(plugin, manifest),
          extensionPoints
        }
      }).filter(plugin => plugin.key)
    },

    resolveRuntime(plugin, manifest) {
      if (plugin.runtime && typeof plugin.runtime === 'string') {
        return plugin.runtime
      }

      if (plugin.runtime?.type) {
        return plugin.runtime.type
      }

      if (manifest.runtime?.type) {
        return manifest.runtime.type
      }

      return 'frontend-only'
    },

    resolveExtensionPoints(plugin, manifest) {
      const points = []

      const fromPlugin = plugin.extensionPoints || []
      const fromManifest = manifest.extensionPoints || []

      ;[...fromPlugin, ...fromManifest].forEach(point => {
        if (typeof point === 'string') {
          points.push(point)
        } else if (point?.point) {
          points.push(point.point)
        }
      })

      return [...new Set(points)]
    },

    async uploadPlugin() {
      if (!this.pluginFile) {
        return
      }

      this.uploading = true

      try {
        const formData = new FormData()
        formData.append('file', this.pluginFile)

        await axios.post('/api/v1/plugins/install', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        this.pluginFile = null
        this.notifyPositive('Плагин загружен')
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative(this.getErrorMessage(e, 'Не удалось загрузить плагин'))
      } finally {
        this.uploading = false
      }
    },

    async reloadPlugins() {
      this.reloading = true

      try {
        await axios.post('/api/v1/plugins/reload')
        this.notifyPositive('Плагины перезагружены')
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось перезагрузить плагины')
      } finally {
        this.reloading = false
      }
    },

    async reloadSinglePlugin(plugin) {
      try {
        await axios.post(`/api/v1/plugins/${encodeURIComponent(plugin.key)}/reload`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} перезагружен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось перезагрузить плагин')
      }
    },

    async enablePlugin(plugin) {
      try {
        await axios.post(`/api/v1/plugins/${encodeURIComponent(plugin.key)}/enable`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} включен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось включить плагин')
      }
    },

    async disablePlugin(plugin) {
      try {
        await axios.post(`/api/v1/plugins/${encodeURIComponent(plugin.key)}/disable`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} отключен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось отключить плагин')
      }
    },

    confirmDeletePlugin(plugin) {
      const pluginName = plugin.name || plugin.key
      if (!window.confirm(`Удалить плагин "${pluginName}"?`)) {
        return
      }
      this.deletePlugin(plugin)
    },

    async deletePlugin(plugin) {
      try {
        await axios.delete(`/api/v1/plugins/${encodeURIComponent(plugin.key)}`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} удален`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative(this.getErrorMessage(e, 'Не удалось удалить плагин'))
      }
    },

    getErrorMessage(e, fallback) {
      return e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        fallback
    },

    notifyPositive(message) {
      this.$q.notify({
        type: 'positive',
        message,
        position: 'top-right',
        actions: [{
          icon: 'close', color: 'white', dense: true, handler: () => undefined
        }]
      })
    },

    notifyNegative(message) {
      this.$q.notify({
        type: 'negative',
        message,
        position: 'top-right',
        actions: [{
          icon: 'close', color: 'white', dense: true, handler: () => undefined
        }]
      })
    }
  }
}
</script>

<style scoped>
.plugins-page {
  padding: 16px;
}

.plugins-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.plugins-card {
  margin-bottom: 16px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plugin-file {
  flex: 1;
}

.plugins-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.extension-points {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.extension-point-badge {
  margin-right: 4px;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.plugin-security-dialog {
  width: min(920px, 96vw);
  max-width: 96vw;
  max-height: 92vh;
  overflow-y: auto;
}

.plugin-security-header,
.plugin-security-section-header,
.plugin-secret-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.plugin-security-section {
  padding-top: 18px;
  padding-bottom: 18px;
}

.plugin-security-section-actions,
.plugin-permission-actions,
.plugin-secret-actions,
.secret-destinations {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.plugin-permission-row {
  min-height: 78px;
}

.plugin-permission-actions {
  justify-content: flex-end;
}

.plugin-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  overflow-wrap: anywhere;
}

.plugin-secrets-list {
  display: grid;
  gap: 12px;
}

.plugin-secret-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

@media (max-width: 700px) {
  .plugins-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .upload-row {
    align-items: stretch;
    flex-direction: column;
  }

  .plugins-table-header,
  .plugin-security-section-header,
  .plugin-secret-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .plugin-permission-actions,
  .plugin-secret-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .plugin-secret-editor {
    grid-template-columns: 1fr;
  }
}
</style>
