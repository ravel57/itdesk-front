<template>
  <div class="flow-toolbar">
    <div class="row items-center q-gutter-sm">
      <q-btn
        flat
        round
        dense
        :color="paletteVisible ? 'primary' : undefined"
        icon="view_sidebar"
        @click="$emit('toggle-palette')"
      >
        <q-tooltip>{{ paletteVisible ? 'Скрыть узлы' : 'Показать узлы' }}</q-tooltip>
      </q-btn>

      <q-separator vertical/>

      <q-btn flat round dense icon="undo" :disable="!canUndo" @click="$emit('undo')">
        <q-tooltip>Отменить</q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="redo" :disable="!canRedo" @click="$emit('redo')">
        <q-tooltip>Повторить</q-tooltip>
      </q-btn>

      <q-separator vertical/>

      <q-btn flat round dense icon="zoom_out" :disable="zoom <= 0.5" @click="$emit('change-zoom', -0.1)"/>
      <div class="flow-zoom-label">{{ Math.round(zoom * 100) }}%</div>
      <q-btn flat round dense icon="zoom_in" :disable="zoom >= 1.6" @click="$emit('change-zoom', 0.1)"/>
      <q-btn flat round dense icon="fit_screen" @click="$emit('fit-view')">
        <q-tooltip>Показать весь граф</q-tooltip>
      </q-btn>
      <q-btn flat round dense icon="search" aria-label="Поиск по графу" :color="graphSearchVisible ? 'primary' : undefined" @click="$emit('open-graph-search')">
        <q-tooltip>Поиск по графу (Ctrl/Cmd + F)</q-tooltip>
      </q-btn>

      <q-separator vertical/>

      <q-btn
        flat
        round
        dense
        icon="delete_outline"
        color="negative"
        :disable="!canDelete"
        @click="$emit('delete-selection')"
      >
        <q-tooltip>Удалить выбранное</q-tooltip>
      </q-btn>
    </div>

    <div class="row items-center q-gutter-sm">
      <q-chip
        dense
        :color="validation.errors.length ? 'negative' : validation.warnings.length ? 'warning' : 'positive'"
        text-color="white"
        :icon="validation.errors.length ? 'error' : validation.warnings.length ? 'warning' : 'check_circle'"
      >
        {{
          validation.errors.length ? `${validation.errors.length} ошибок` : validation.warnings.length ? `${validation.warnings.length} предупреждений` : 'Граф корректен'
        }}
      </q-chip>
      <q-btn
        v-if="pendingConnection"
        outline
        dense
        color="primary"
        icon="link_off"
        label="Отменить связь"
        @click="$emit('cancel-connection')"
      />
    </div>
  </div>
</template>

<script>
// Верхняя панель редактора графа: undo/redo, масштаб, поиск, удаление и статус валидации.
export default {
  name: 'FlowToolbar',

  props: {
    paletteVisible: {type: Boolean, default: true},
    canUndo: {type: Boolean, default: false},
    canRedo: {type: Boolean, default: false},
    zoom: {type: Number, required: true},
    graphSearchVisible: {type: Boolean, default: false},
    canDelete: {type: Boolean, default: false},
    validation: {type: Object, required: true},
    pendingConnection: {type: Object, default: null}
  },

  emits: [
    'toggle-palette', 'undo', 'redo', 'change-zoom', 'fit-view',
    'open-graph-search', 'delete-selection', 'cancel-connection'
  ]
}
</script>

<style scoped>
.flow-toolbar {
  min-height: 52px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--app-border, #dfe2e8);
  background: var(--app-surface, #ffffff);
}

.flow-zoom-label {
  min-width: 44px;
  text-align: center;
  color: var(--app-text-muted, #626875);
  font-size: 12px;
}
</style>
