<template>
  <q-card-section>
    <div v-if="rows.length" class="period-activity-chart app-column-gap-14">
      <div
        v-for="row in rows"
        :key="row.period"
        class="period-activity-row"
      >
        <div class="period-activity-label app-chart-label">
          {{ row.label }}
        </div>

        <div class="period-activity-metrics app-column-gap-8">
          <div class="period-activity-metric">
            <div class="period-activity-metric-title app-shared-line-task-section__caption">
              Закрыто
            </div>
            <div class="bar-chart-track app-chart-track">
              <div class="bar-chart-fill"
                   :style="{ width: row.closedPercent + '%' }"/>
            </div>
            <div class="bar-chart-value app-chart-value">
              {{ formatNumber(row.closedCount) }}
            </div>
          </div>

          <div class="period-activity-metric">
            <div class="period-activity-metric-title app-shared-line-task-section__caption">
              Переоткрыто
            </div>
            <div class="bar-chart-track app-chart-track">
              <div class="bar-chart-fill bar-chart-fill-warning"
                   :style="{ width: row.reopenedPercent + '%' }"/>
            </div>
            <div class="bar-chart-value app-chart-value">
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
.bar-chart-fill {
  height: 100%;
  border-radius: 999px;
  background: #1976d2;
}

.bar-chart-fill-warning {
  background: #f2c037;
}

.period-activity-row {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 12px;
  align-items: start;
}

.period-activity-metric {
  display: grid;
  grid-template-columns: 92px 1fr 56px;
  gap: 10px;
  align-items: center;
}
</style>
