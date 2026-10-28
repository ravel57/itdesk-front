<template>
  <div class="row items-start justify-between q-gutter-md q-mb-md">
    <div>
      <div class="text-h5 text-weight-medium">
        Аналитика
      </div>
      <div class="text-grey-7">
        Обращения, заявки, линии поддержки, SLA/OLA и нагрузка команд
      </div>
      <q-chip dense square class="q-mt-xs" color="grey-2" text-color="dark" icon="shield">
        {{ scopeLabel }}
      </q-chip>
    </div>

    <div class="analytics-controls">
      <analytics-period-toggle
        :model-value="periodPreset"
        @select="$emit('select-period', $event)"
      />

      <q-input
        :model-value="fromDate"
        label="С"
        type="date"
        dense
        outlined
        class="analytics-date-input"
        @update:model-value="onDateChange('update:fromDate', $event)"
      />

      <q-input
        :model-value="toDate"
        label="По"
        type="date"
        dense
        outlined
        class="analytics-date-input"
        @update:model-value="onDateChange('update:toDate', $event)"
      />

      <q-select
        :model-value="groupBy"
        :options="groupByOptions"
        label="Группировка"
        dense
        outlined
        emit-value
        map-options
        class="analytics-group-input"
        @update:model-value="onGroupByChange"
      />

      <q-btn
        icon="refresh"
        color="primary"
        flat
        round
        :loading="loading"
        @click="$emit('refresh')"
      >
        <q-tooltip>
          Обновить
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script>
import {GROUP_BY_OPTIONS} from 'src/util/analytics/analyticsPeriod'
import AnalyticsPeriodToggle from './AnalyticsPeriodToggle.vue'

// Шапка страницы аналитики: заголовок, область данных, период, группировка, обновление.
// Состояние (даты, группировка) принадлежит странице — компонент только эмитит изменения.
export default {
  name: 'AnalyticsHeader',

  components: {AnalyticsPeriodToggle},

  props: {
    scopeLabel: {
      type: String,
      default: ''
    },
    periodPreset: {
      type: String,
      default: ''
    },
    fromDate: {
      type: String,
      default: ''
    },
    toDate: {
      type: String,
      default: ''
    },
    groupBy: {
      type: String,
      default: 'DAY'
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  emits: [
    'select-period',
    'update:fromDate',
    'update:toDate',
    'manual-period-change',
    'update:groupBy',
    'group-by-change',
    'refresh'
  ],

  data: () => ({
    groupByOptions: GROUP_BY_OPTIONS
  }),

  methods: {
    onDateChange(event, value) {
      this.$emit(event, value)
      this.$emit('manual-period-change')
    },

    onGroupByChange(value) {
      this.$emit('update:groupBy', value)
      // без аргументов: страница вызывает scheduleAnalyticsLoad, значение группировки не должно попасть в delay
      this.$emit('group-by-change')
    }
  }
}
</script>

<style scoped>
.analytics-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}

.analytics-date-input {
  width: 150px;
}

.analytics-group-input {
  width: 150px;
}
</style>
