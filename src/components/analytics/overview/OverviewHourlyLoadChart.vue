<template>
  <q-card-section>
    <div v-if="rows.length" class="hourly-load-chart">
      <div
        v-for="row in rows"
        :key="row.hour"
        class="hourly-load-row"
      >
        <div class="hourly-load-label">
          {{ row.label }}
        </div>
        <div class="hourly-load-track">
          <div
            class="hourly-load-fill"
            :style="{ width: row.percent + '%' }"
          >
            <div
              v-for="segment in row.segments"
              :key="segment.key"
              class="hourly-load-segment"
              :class="segment.class"
              :style="{ width: segment.percent + '%' }"
            />
          </div>
        </div>
        <div class="hourly-load-value">
          {{ formatNumber(row.total) }}
        </div>
        <div class="hourly-load-breakdown">
          <q-chip dense square color="blue-1" text-color="primary">
            Вх: {{ formatNumber(row.incomingMessages) }}
          </q-chip>
          <q-chip dense square color="green-1" text-color="positive">
            Исх: {{ formatNumber(row.outgoingMessages) }}
          </q-chip>
          <q-chip dense square color="grey-2" text-color="dark">
            Созд: {{ formatNumber(row.createdTasks) }}
          </q-chip>
          <q-chip dense square color="positive" text-color="white">
            Закр: {{ formatNumber(row.closedTasks) }}
          </q-chip>
          <q-chip dense square color="warning" text-color="dark">
            Переоткр: {{ formatNumber(row.reopenedTasks) }}
          </q-chip>
        </div>
      </div>
    </div>

    <overview-empty-state
      v-else
      icon="query_stats"
      text="Нет данных по часовой нагрузке за выбранный период"
    />
  </q-card-section>
</template>

<script>
import {formatNumber} from 'src/util/analytics/analyticsFormat'
import OverviewEmptyState from './OverviewEmptyState.vue'

// График нагрузки по часам суток (тело карточки).
export default {
  name: 'OverviewHourlyLoadChart',

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
.hourly-load-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hourly-load-row {
  display: grid;
  grid-template-columns: 56px minmax(140px, 1fr) 52px minmax(280px, 1.4fr);
  gap: 10px;
  align-items: center;
}

.hourly-load-label {
  color: #616161;
  font-size: 12px;
  white-space: nowrap;
}

.hourly-load-track {
  height: 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #eeeeee;
}

.hourly-load-fill {
  display: flex;
  height: 100%;
  overflow: hidden;
  border-radius: 999px;
}

.hourly-load-segment {
  height: 100%;
}

.hourly-load-segment-incoming {
  background: #7c4dff;
}

.hourly-load-segment-outgoing {
  background: #00c853;
}

.hourly-load-segment-created {
  background: #9e9e9e;
}

.hourly-load-segment-closed {
  background: #21ba45;
}

.hourly-load-segment-reopened {
  background: #f2c037;
}

.hourly-load-value {
  text-align: right;
  font-weight: 600;
}

.hourly-load-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

@media (max-width: 900px) {
  .hourly-load-row {
    grid-template-columns: 56px 1fr 52px;
  }

  .hourly-load-breakdown {
    grid-column: 2 / 4;
  }
}
</style>
