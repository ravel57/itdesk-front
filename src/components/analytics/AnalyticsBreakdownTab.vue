<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card flat bordered class="analytics-card app-shared-analytics-card">
        <q-card-section>
          <div class="row items-start justify-between q-gutter-sm">
            <div>
              <div class="text-h6">
                Разбивка заявок
              </div>
              <div class="text-grey-7 text-caption">
                {{ currentBreakdownTitle }} · {{ periodCaption }} · применяются все выбранные фильтры
              </div>
            </div>

            <q-select
              :model-value="breakdownBy"
              :options="availableBreakdownByOptions"
              label="Группировать по"
              dense
              outlined
              emit-value
              map-options
              class="breakdown-select"
              @update:model-value="onBreakdownByChange"
            />
          </div>
        </q-card-section>

        <q-separator/>

        <q-table
          class="breakdown-table"
          :rows="currentBreakdownRows"
          :columns="visibleBreakdownColumns"
          row-key="key"
          flat
          dense
          :loading="loading"
          :rows-per-page-options="[10, 20, 50, 0]"
          no-data-label="Нет данных для выбранной разбивки"
        >
          <template v-slot:body-cell-totalTasks="props">
            <q-td :props="props" class="breakdown-progress-cell">
              <div class="breakdown-progress-value">
                {{ formatNumber(props.row.totalTasks) }}
              </div>
              <q-linear-progress
                rounded
                size="8px"
                color="primary"
                track-color="grey-3"
                :value="Math.max(0, Math.min(1, Number(props.row.percent || 0) / 100))"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-overdueSla="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="Number(props.row.overdueSla || 0) > 0 ? 'negative' : 'grey-2'"
                :text-color="Number(props.row.overdueSla || 0) > 0 ? 'white' : 'dark'"
              >
                {{ formatNumber(props.row.overdueSla) }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-overdueOla="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="Number(props.row.overdueOla || 0) > 0 ? 'negative' : 'grey-2'"
                :text-color="Number(props.row.overdueOla || 0) > 0 ? 'white' : 'dark'"
              >
                {{ formatNumber(props.row.overdueOla) }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-overdueDeadlines="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="Number(props.row.overdueDeadlines || 0) > 0 ? 'warning' : 'grey-2'"
                text-color="dark"
              >
                {{ formatNumber(props.row.overdueDeadlines) }}
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>
  </div>
</template>

<script>
import analyticsSummaryMixin from './analyticsSummaryMixin'

export default {
  name: 'AnalyticsBreakdownTab',

  mixins: [analyticsSummaryMixin],

  props: {
    summary: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    },
    breakdownBy: {
      type: String,
      default: 'type'
    },
    availableBreakdownByOptions: {
      type: Array,
      default: () => []
    },
    periodCaption: {
      type: String,
      default: ''
    },
    canViewInternalAnalytics: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:breakdownBy', 'breakdown-changed'],

  data: () => ({
    breakdownColumns: [
      {
        name: 'name',
        label: 'Группа',
        field: 'name',
        align: 'left',
        sortable: true
      },
      {
        name: 'totalTasks',
        label: 'Всего / доля',
        field: 'totalTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'createdTasks',
        label: 'Создано',
        field: 'createdTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'openTasks',
        label: 'Открытые',
        field: 'openTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'closedTasks',
        label: 'Закрытые',
        field: 'closedTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'reopenedTasks',
        label: 'Переоткрытые',
        field: 'reopenedTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'overdueSla',
        label: 'Просроч. SLA',
        field: 'overdueSla',
        align: 'right',
        sortable: true
      },
      {
        name: 'overdueOla',
        label: 'Просроч. OLA',
        field: 'overdueOla',
        align: 'right',
        sortable: true
      },
      {
        name: 'overdueDeadlines',
        label: 'Просроч. дедлайны',
        field: 'overdueDeadlines',
        align: 'right',
        sortable: true
      },
      {
        name: 'unassignedTasks',
        label: 'Без исполнителя',
        field: 'unassignedTasks',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      }
    ],
  }),

  computed: {
    visibleBreakdownColumns() {
      if (this.canViewInternalAnalytics) {
        return this.breakdownColumns
      }
      const internalColumns = new Set(['overdueOla', 'olaWarnings', 'unassignedTasks'])
      return this.breakdownColumns.filter(column => !internalColumns.has(column.name))
    },

    currentBreakdownTitle() {
      const option = this.availableBreakdownByOptions.find(item => item.value === this.breakdownBy)
      return option ? option.label : 'Разбивка'
    },

    currentBreakdownRows() {
      const keyMap = {
        type: ['taskTypeBreakdown', 'typeBreakdown', 'tasksByType'],
        service: ['serviceBreakdown', 'tasksByService'],
        priority: ['priorityBreakdown', 'tasksByPriority'],
        executor: ['executorBreakdown', 'tasksByExecutor'],
        tag: ['tagBreakdown', 'tasksByTag'],
        supportLine: ['supportLineBreakdown', 'lineBreakdown', 'tasksBySupportLine'],
      }
      const rows = this.getSummaryRows(keyMap[this.breakdownBy] || [])
      return this.normalizeBreakdownRows(rows)
    },
  },

  methods: {
    onBreakdownByChange(value) {
      this.$emit('update:breakdownBy', value)
      this.$emit('breakdown-changed')
    },

    normalizeBreakdownRows(rows) {
      const normalized = (rows || []).map(row => ({
        ...row,
        key: row.key || `${row.id !== undefined && row.id !== null ? row.id : row.name}`,
        id: row.id,
        name: row.name || row.label || 'Без значения',
        totalTasks: Number(row.totalTasks || row.total || row.count || 0),
        createdTasks: Number(row.createdTasks || row.created || 0),
        openTasks: Number(row.openTasks || row.open || 0),
        closedTasks: Number(row.closedTasks || row.closed || 0),
        reopenedTasks: Number(row.reopenedTasks || row.reopened || 0),
        overdueSla: Number(row.overdueSla || row.overdueSlaTasks || 0),
        olaWarnings: Number(row.olaWarnings || row.olaWarningTasks || 0),
        overdueOla: Number(row.overdueOla || row.overdueOlaTasks || row.olaBreachedTasks || 0),
        overdueDeadlines: Number(row.overdueDeadlines || row.overdueDeadlineTasks || 0),
        unassignedTasks: Number(row.unassignedTasks || 0)
      }))
      const max = Math.max(...normalized.map(row => row.totalTasks), 0)
      return normalized
        .sort((left, right) => right.totalTasks - left.totalTasks)
        .map(row => ({
          ...row,
          percent: max > 0 ? Math.max((row.totalTasks / max) * 100, row.totalTasks > 0 ? 6 : 0) : 0
        }))
    },
  }
}
</script>

<style scoped>
.breakdown-select {
  width: 220px;
}

.breakdown-table :deep(.q-table__middle) {
  overflow-x: auto;
}

.breakdown-table :deep(th) {
  white-space: nowrap;
}

.breakdown-progress-cell {
  min-width: 180px;
  width: 220px;
}

.breakdown-progress-value {
  margin-bottom: 5px;
  text-align: right;
  font-weight: 600;
}
@media (max-width: 900px) {
  .breakdown-progress-cell {
    min-width: 150px;
    width: 170px;
  }
}
</style>
