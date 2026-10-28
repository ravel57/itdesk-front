<template>
  <div class="flow-graph-search" @keydown.esc.stop.prevent="$emit('close')">
    <div class="flow-graph-search-controls">
      <q-select v-model="criterionModel" :options="graphSearchCriteria" emit-value map-options dense outlined label="Искать по" class="flow-graph-search-criterion"/>
      <q-input ref="input" v-model="queryModel" clearable dense outlined class="flow-graph-search-query"
               :label="graphSearchCriterion === 'variable' ? 'Переменная' : 'Совпадение текста'"
               :placeholder="graphSearchCriterion === 'variable' ? 'Например: var.matched или matched' : 'Название, пояснение, текст или настройка блока'"
               @keydown.enter.stop.prevent="$emit('navigate', $event.shiftKey ? -1 : 1)"/>
      <span class="flow-graph-search-count" role="status">{{ graphSearchResults.length ? `${graphSearchIndex >= 0 ? graphSearchIndex + 1 : '—'} / ${graphSearchResults.length}` : graphSearchQuery?.trim() ? 'Ничего не найдено' : 'Введите запрос' }}</span>
      <q-btn flat round dense icon="keyboard_arrow_up" aria-label="Предыдущее совпадение" :disable="!graphSearchResults.length" @click="$emit('navigate', -1)"/>
      <q-btn flat round dense icon="keyboard_arrow_down" aria-label="Следующее совпадение" :disable="!graphSearchResults.length" @click="$emit('navigate', 1)"/>
      <q-btn flat round dense icon="close" aria-label="Закрыть поиск по графу" @click="$emit('close')"/>
    </div>
    <div v-if="graphSearchCriterion === 'variable'" class="text-caption text-grey-7 q-mt-xs">Объявления и обращения к переменной var, включая её поля. Имя учитывает регистр.</div>
    <q-list v-if="graphSearchResults.length" dense class="flow-graph-search-results" aria-label="Результаты поиска по графу">
      <q-item v-for="(result, index) in graphSearchResults" :key="`${result.kind}:${result.id}`" clickable
              :active="index === graphSearchIndex" active-class="bg-deep-purple-1 text-primary" @click="$emit('focus-result', result)">
        <q-item-section avatar><q-icon :name="result.kind === 'edge' ? 'arrow_right_alt' : 'crop_square'" size="18px"/></q-item-section>
        <q-item-section>
          <q-item-label>{{ result.label }}</q-item-label>
          <q-item-label caption class="flow-graph-search-detail">{{ [result.section, result.detail].filter(Boolean).join(' · ') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
// Панель поиска по графу (текст/переменная) со списком результатов.
export default {
  name: 'FlowGraphSearch',

  props: {
    graphSearchQuery: {type: String, default: ''},
    graphSearchCriterion: {type: String, default: 'text'},
    graphSearchCriteria: {type: Array, default: () => []},
    graphSearchResults: {type: Array, default: () => []},
    graphSearchIndex: {type: Number, default: -1}
  },

  emits: ['update:graphSearchQuery', 'update:graphSearchCriterion', 'navigate', 'focus-result', 'close'],

  computed: {
    criterionModel: {
      get() { return this.graphSearchCriterion },
      set(value) { this.$emit('update:graphSearchCriterion', value) }
    },
    queryModel: {
      get() { return this.graphSearchQuery },
      set(value) { this.$emit('update:graphSearchQuery', value) }
    }
  },

  methods: {
    focus() {
      this.$refs.input?.focus()
    }
  }
}
</script>

<style scoped>
.flow-graph-search {
  padding: 8px 10px;
  border-bottom: 1px solid var(--app-border, #dfe2e8);
  background: var(--app-surface, #fff);
}

.flow-graph-search-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.flow-graph-search-criterion {
  width: 185px;
}

.flow-graph-search-query {
  flex: 1 1 220px;
  min-width: 160px;
}

.flow-graph-search-count {
  color: var(--app-text-muted, #676d78);
  font-size: 12px;
}

.flow-graph-search-results {
  max-height: 145px;
  overflow: auto;
  margin-top: 6px;
}

.flow-graph-search-detail {
  overflow-wrap: anywhere;
  white-space: normal;
}
</style>
