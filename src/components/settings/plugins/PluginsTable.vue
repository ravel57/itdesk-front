<template>
  <q-card class="plugins-card app-margin-bottom-16">
    <q-card-section class="plugins-table-header app-plugins-table-header">
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
        @click="$emit('refresh')"
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
            class="extension-points app-extension-points"
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
              @click="$emit('security', props.row)"
            />

            <q-btn
              v-if="props.row.enabled === false"
              dense
              flat
              round
              color="positive"
              icon="play_arrow"
              title="Включить"
              @click="$emit('enable', props.row)"
            />

            <q-btn
              v-else
              dense
              flat
              round
              color="warning"
              icon="pause"
              title="Отключить"
              @click="$emit('disable', props.row)"
            />

            <q-btn
              dense
              flat
              round
              color="primary"
              icon="restart_alt"
              title="Перезагрузить"
              @click="$emit('reload', props.row)"
            />

            <q-btn
              dense
              flat
              round
              color="negative"
              icon="delete"
              title="Удалить"
              @click="$emit('delete', props.row)"
            />
          </div>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script>
import {createPluginColumns} from 'src/util/settingsPlugins/pluginColumns'

// Карточка со списком установленных плагинов и кнопками действий (всё — событиями, логика на странице).
export default {
  name: 'PluginsTable',

  props: {
    plugins: {type: Array, default: () => []},
    loading: {type: Boolean, default: false}
  },

  emits: ['refresh', 'security', 'enable', 'disable', 'reload', 'delete'],

  data: () => ({
    pagination: {
      rowsPerPage: 10
    },

    columns: createPluginColumns()
  })
}
</script>

<style scoped>
.extension-point-badge {
  margin-right: 4px;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}
</style>
