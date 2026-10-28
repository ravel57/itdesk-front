<template>
  <aside class="flow-palette">
    <div class="flow-side-title">Узлы</div>
    <div class="flow-side-caption">Выберите, что должен сделать шаг, и соедините его со следующим.</div>
    <q-input v-model="searchModel" dense outlined clearable placeholder="Найти блок" aria-label="Найти блок" class="q-mb-sm"/>
    <div v-if="operationCatalogError" class="text-negative text-caption q-mb-sm">{{ operationCatalogError }} <q-btn flat dense label="Повторить" @click="$emit('reload-catalog')"/></div>

    <div
      v-for="group in visiblePaletteGroups"
      :key="group.id"
      class="flow-palette-group"
    >
      <button
        type="button"
        class="flow-palette-group-title"
        :aria-expanded="isPaletteGroupExpanded(group)"
        @click="$emit('toggle-group', group)"
      >
        <q-icon :name="group.icon" :color="group.color" size="17px"/>
        <span class="flow-palette-group-title-label">{{ group.label }}</span>
        <q-icon :name="isPaletteGroupExpanded(group) ? 'expand_less' : 'expand_more'" size="18px"/>
      </button>

      <q-slide-transition>
        <div v-show="isPaletteGroupExpanded(group)" class="flow-palette-group-items">
          <q-btn
            v-for="item in group.items"
            :key="item.key"
            outline
            align="left"
            class="flow-palette-btn full-width"
            :icon="item.icon"
            :color="item.color"
            :label="item.label"
            :disable="item.type === 'EVENT' && hasEventNode"
            @click="$emit('add-node', item)"
          />
        </div>
      </q-slide-transition>
    </div>

    <q-separator class="q-my-md"/>

    <div class="flow-side-title">Как соединять</div>
    <div class="flow-help-step"><span>1</span> Нажмите цветной выход справа.</div>
    <div class="flow-help-step"><span>2</span> Нажмите вход слева у следующего узла.</div>
    <div class="flow-help-step"><span>3</span> Для условия соедините отдельно «ДА» и «НЕТ».</div>
  </aside>
</template>

<script>
// Палитра узлов: поиск, группы и подсказка по соединению узлов.
// Состояние (поиск, раскрытые группы) хранится в редакторе, чтобы переживать скрытие панели.
export default {
  name: 'FlowPalette',

  props: {
    search: {type: String, default: ''},
    expandedPaletteGroups: {type: Array, default: () => []},
    visiblePaletteGroups: {type: Array, default: () => []},
    operationCatalogError: {type: String, default: ''},
    hasEventNode: {type: Boolean, default: false}
  },

  emits: ['update:search', 'toggle-group', 'add-node', 'reload-catalog'],

  computed: {
    searchModel: {
      get() { return this.search },
      set(value) { this.$emit('update:search', value) }
    }
  },

  methods: {
    isPaletteGroupExpanded(group) {
      return Boolean(this.search) || this.expandedPaletteGroups.includes(group.id)
    }
  }
}
</script>

<style scoped>
.flow-palette {
  min-width: 0;
  padding: 16px;
  overflow-y: auto;
  background: #ffffff;
}

.flow-palette {
  border-right: 1px solid #dfe2e8;
}

.flow-side-title {
  font-size: 15px;
  font-weight: 700;
  color: #252a34;
}

.flow-side-caption {
  margin-top: 4px;
  margin-bottom: 14px;
  color: #7a808c;
  font-size: 12px;
  line-height: 1.45;
}

.flow-palette-group {
  margin-bottom: 10px;
}

.flow-palette-group:last-of-type {
  margin-bottom: 6px;
}

.flow-palette-group-title {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 7px;
  padding: 6px 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #646b78;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
}

.flow-palette-group-title:hover {
  background: rgba(90, 98, 112, 0.08);
}

.flow-palette-group-title-label {
  min-width: 0;
  flex: 1 1 auto;
}

.flow-palette-group-items {
  padding-top: 4px;
}

.flow-palette-btn {
  margin-bottom: 7px;
  min-height: 40px;
  padding: 8px 10px;
  font-size: 13px;
}

.flow-palette-btn:last-child {
  margin-bottom: 0;
}

.flow-palette-btn :deep(.q-btn__content) {
  width: 100%;
  flex-wrap: nowrap;
  justify-content: flex-start;
}

.flow-palette-btn :deep(.q-icon) {
  flex: 0 0 auto;
}

.flow-palette-btn :deep(.block) {
  flex: 1 1 auto;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: left;
  line-height: 1.4;
}

.flow-help-step {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  color: #676d78;
  font-size: 12px;
  line-height: 1.4;
}

.flow-help-step span {
  flex: 0 0 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ede8ff;
  color: var(--q-primary);
  font-weight: 700;
}

@media (max-width: 900px) {
  .flow-palette {
    border: none;
    border-bottom: 1px solid #dfe2e8;
  }
}
</style>
