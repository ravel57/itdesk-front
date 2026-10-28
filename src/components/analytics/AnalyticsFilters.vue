<template>
  <q-card flat bordered class="analytics-filter-card q-mb-md">
    <q-card-section>
      <div class="row items-center justify-between q-gutter-sm q-mb-md">
        <div>
          <div class="text-subtitle1 text-weight-medium">
            Фильтры и группировка аналитики
          </div>
          <div class="text-grey-7 text-caption">
            Фильтрует заявки и связанные с ними показатели. Теги работают по принципу «любой из
            выбранных».
          </div>
        </div>

        <div class="row q-gutter-xs items-center">
          <q-chip v-if="activeFilterCount > 0" dense square color="primary" text-color="white">
            Фильтров: {{ activeFilterCount }}
          </q-chip>
          <q-btn
            label="Сбросить"
            icon="filter_alt_off"
            dense
            flat
            :disable="activeFilterCount === 0"
            @click="$emit('reset')"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div
          v-for="select in visibleSelects"
          :key="select.kind"
          class="col-12 col-sm-6 col-md-3"
        >
          <q-select
            :model-value="filters[select.field]"
            :options="select.options"
            use-input
            input-debounce="0"
            @filter="(val, update) => filterSelect(select.kind, val, update)"
            @popup-hide="resetSearch(select.kind)"
            :label="select.label"
            dense
            outlined
            multiple
            clearable
            use-chips
            emit-value
            map-options
            option-value="value"
            option-label="label"
            @update:model-value="onSelectChange(select, $event)"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import {filterOptionsBySearch} from 'src/util/analytics/analyticsFilters'

// Панель фильтров аналитики (типы, приоритеты, исполнители, теги, линии поддержки).
// Значения фильтров принадлежат странице; здесь живёт только поисковая строка селектов.
export default {
  name: 'AnalyticsFilters',

  props: {
    filters: {
      type: Object,
      required: true
    },
    typeOptions: {
      type: Array,
      default: () => []
    },
    priorityOptions: {
      type: Array,
      default: () => []
    },
    executorOptions: {
      type: Array,
      default: () => []
    },
    tagOptions: {
      type: Array,
      default: () => []
    },
    supportLineOptions: {
      type: Array,
      default: () => []
    },
    activeFilterCount: {
      type: Number,
      default: 0
    },
    canFilterExecutors: {
      type: Boolean,
      default: false
    },
    canFilterSupportLines: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update-filter', 'change', 'reset'],

  data: () => ({
    analyticsFilterSearch: {
      type: '',
      priority: '',
      executor: '',
      tag: '',
      supportLine: '',
    }
  }),

  computed: {
    visibleSelects() {
      const search = this.analyticsFilterSearch
      return [
        {
          kind: 'type',
          field: 'typeIds',
          label: 'Типы заявок',
          options: filterOptionsBySearch(this.typeOptions, search.type),
          visible: true
        },
        {
          kind: 'priority',
          field: 'priorityIds',
          label: 'Приоритеты',
          options: filterOptionsBySearch(this.priorityOptions, search.priority),
          visible: true
        },
        {
          kind: 'executor',
          field: 'executorIds',
          label: 'Исполнители',
          options: filterOptionsBySearch(this.executorOptions, search.executor),
          visible: this.canFilterExecutors
        },
        {
          kind: 'tag',
          field: 'tagIds',
          label: 'Теги',
          options: filterOptionsBySearch(this.tagOptions, search.tag),
          visible: true
        },
        {
          kind: 'supportLine',
          field: 'supportLineIds',
          label: 'Линии поддержки',
          options: filterOptionsBySearch(this.supportLineOptions, search.supportLine),
          visible: this.canFilterSupportLines
        }
      ].filter(select => select.visible)
    }
  },

  methods: {
    filterSelect(kind, val, update) {
      update(() => {
        this.analyticsFilterSearch = {
          ...this.analyticsFilterSearch,
          [kind]: val || ''
        }
      })
    },

    resetSearch(kind) {
      this.analyticsFilterSearch = {
        ...this.analyticsFilterSearch,
        [kind]: ''
      }
    },

    onSelectChange(select, value) {
      this.$emit('update-filter', select.field, value)
      this.resetSearch(select.kind)
      this.$emit('change')
    }
  }
}
</script>

<style scoped>
.analytics-filter-card {
  border-radius: 8px;
}
</style>
