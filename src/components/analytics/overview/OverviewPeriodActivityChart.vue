<template>
  <q-card-section>
    <div v-if="rows.length" class="period-activity-chart">
      <div
        v-for="row in rows"
        :key="row.period"
        class="period-activity-row"
      >
        <div class="period-activity-label">
          {{ row.label }}
        </div>

        <div class="period-activity-metrics">
          <div class="period-activity-metric">
            <div class="period-activity-metric-title">
              Закрыто
            </div>
            <div class="bar-chart-track">
              <div class="bar-chart-fill"
                   :style="{ width: row.closedPercent + '%' }"/>
            </div>
            <div class="bar-chart-value">
              {{ formatNumber(row.closedCount) }}
            </div>
          </div>

          <div class="period-activity-metric">
            <div class="period-activity-metric-title">
              Переоткрыто
            </div>
            <div class="bar-chart-track">
              <div class="bar-chart-fill bar-chart-fill-warning"
                   :style="{ width: row.reopenedPercent + '%' }"/>
            </div>
            <div class="bar-chart-value">
              {{ formatNumber(row.reopenedCount) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <overview-empty-state
      v-else
      icon="insights"
      text="Нет закрытых или переоткрытых заявок за выбранный период"
    />
  </q-card-section>
</template>

<script>
import {formatNumber} from 'src/util/analytics/analyticsFormat'
import OverviewEmptyState from './OverviewEmptyState.vue'

// Полосы «закрыто / переоткрыто» по периодам (тело карточки «Динамика заявок»).
export default {
  name: 'OverviewPeriodActivityChart',

  components: {OverviewEmptyState},

  props: {
    rows: {
      type: Array,
      default: () => []
    }
  },

  methods: {
    formatNumber(value) {
      return formatNumber(value)
    }
  }
}
</script>

<style scoped>
.bar-chart-track {
  height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #eeeeee;
}

.bar-chart-fill {
  height: 100%;
  border-radius: 999px;
  background: #1976d2;
}

.bar-chart-fill-warning {
  background: #f2c037;
}

.period-activity-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.period-activity-row {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: start;
}

.period-activity-label {
  color: #616161;
  font-size: 12px;
  white-space: nowrap;
}

.period-activity-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.period-activity-metric {
  display: grid;
  grid-template-columns: 92px 1fr 56px;
  gap: 10px;
  align-items: center;
}

.period-activity-metric-title {
  color: #757575;
  font-size: 12px;
}

.bar-chart-value {
  text-align: right;
  font-weight: 600;
}
</style>
