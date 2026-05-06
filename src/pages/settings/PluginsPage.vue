<template>
  <q-page class="plugins-page">
    <div class="plugins-header">
      <div>
        <div class="text-h5">Плагины</div>
        <div class="text-caption text-grey-7">
          Загрузка, перезагрузка и управление установленными плагинами uldesk
        </div>
      </div>

      <q-btn
        color="primary"
        icon="refresh"
        label="Перезагрузить плагины"
        :loading="reloading"
        @click="reloadPlugins"
      />
    </div>

    <q-card class="plugins-card">
      <q-card-section>
        <div class="text-subtitle1">Загрузить плагин</div>
        <div class="text-caption text-grey-7">
          Загрузите ZIP-архив с manifest.yml, ui.yml и, если нужен backend-hook, plugin.groovy.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="upload-row">
          <q-file
            v-model="pluginFile"
            outlined
            dense
            clearable
            accept=".zip"
            label="Выберите ZIP-плагин"
            class="plugin-file"
          >
            <template #prepend>
              <q-icon name="extension" />
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

      <q-separator />

      <q-table
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

  mounted () {
    this.loadPlugins()
  },

  methods: {
    async loadPlugins () {
      this.loading = true

      try {
        const response = await axios.get('/api/plugins')
        this.plugins = this.normalizePlugins(response.data)
      } catch (e) {
        this.notifyNegative('Не удалось загрузить список плагинов')
      } finally {
        this.loading = false
      }
    },

    normalizePlugins (data) {
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

    resolveRuntime (plugin, manifest) {
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

    resolveExtensionPoints (plugin, manifest) {
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

    async uploadPlugin () {
      if (!this.pluginFile) {
        return
      }

      this.uploading = true

      try {
        const formData = new FormData()
        formData.append('file', this.pluginFile)

        await axios.post('/api/plugins/install', formData, {
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

    async reloadPlugins () {
      this.reloading = true

      try {
        await axios.post('/api/plugins/reload')
        this.notifyPositive('Плагины перезагружены')
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось перезагрузить плагины')
      } finally {
        this.reloading = false
      }
    },

    async reloadSinglePlugin (plugin) {
      try {
        await axios.post(`/api/plugins/${encodeURIComponent(plugin.key)}/reload`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} перезагружен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось перезагрузить плагин')
      }
    },

    async enablePlugin (plugin) {
      try {
        await axios.post(`/api/plugins/${encodeURIComponent(plugin.key)}/enable`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} включен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось включить плагин')
      }
    },

    async disablePlugin (plugin) {
      try {
        await axios.post(`/api/plugins/${encodeURIComponent(plugin.key)}/disable`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} отключен`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative('Не удалось отключить плагин')
      }
    },

    confirmDeletePlugin (plugin) {
      const pluginName = plugin.name || plugin.key
      if (!window.confirm(`Удалить плагин "${pluginName}"?`)) {
        return
      }
      this.deletePlugin(plugin)
    },

    async deletePlugin (plugin) {
      try {
        await axios.delete(`/api/plugins/${encodeURIComponent(plugin.key)}`)
        this.notifyPositive(`Плагин ${plugin.name || plugin.key} удален`)
        await this.loadPlugins()
      } catch (e) {
        this.notifyNegative(this.getErrorMessage(e, 'Не удалось удалить плагин'))
      }
    },

    getErrorMessage (e, fallback) {
      return e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        fallback
    },

    notifyPositive (message) {
      this.$q.notify({
        type: 'positive',
        message,
        position: 'top-right',
        actions: [{
          icon: 'close', color: 'white', dense: true, handler: () => undefined
        }]
      })
    },

    notifyNegative (message) {
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

@media (max-width: 700px) {
  .plugins-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .upload-row {
    align-items: stretch;
    flex-direction: column;
  }

  .plugins-table-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
