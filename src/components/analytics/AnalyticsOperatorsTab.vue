<template>
  <q-card flat bordered class="analytics-card app-shared-analytics-card">
    <q-card-section>
      <div class="text-h6">
        Нагрузка по операторам
      </div>
      <div class="text-grey-7 text-caption">
        Открытые, закрытые, просрочки и средние времена · {{ periodCaption }}
      </div>
    </q-card-section>

    <q-separator/>

    <q-table
      :rows="operatorLoadRows"
      :columns="operatorLoadColumns"
      row-key="userId"
      flat
      dense
      :loading="loading"
      :rows-per-page-options="[10, 20, 50, 0]"
      no-data-label="Нет данных по операторам"
    >
      <template v-slot:body-cell-openTasks="props">
        <q-td :props="props">
          <div class="operator-load-cell">
            <div class="operator-load-value">
              {{ formatNumber(props.row.openTasks) }}
            </div>
            <q-linear-progress
              rounded
              size="8px"
              :value="getProgressValue(props.row.openTasks, maxOperatorOpenTasks)"
              color="primary"
              track-color="grey-3"
            />
          </div>
        </q-td>
      </template>

      <template v-slot:body-cell-closedTasks="props">
        <q-td :props="props">
          <div class="operator-load-cell">
            <div class="operator-load-value">
              {{ formatNumber(props.row.closedTasks) }}
            </div>
            <q-linear-progress
              rounded
              size="8px"
              :value="getProgressValue(props.row.closedTasks, maxOperatorClosedTasks)"
              color="positive"
              track-color="grey-3"
            />
          </div>
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

      <template v-slot:body-cell-olaWarnings="props">
        <q-td :props="props">
          <q-chip
            dense
            square
            :color="Number(props.row.olaWarnings || 0) > 0 ? 'warning' : 'grey-2'"
            text-color="dark"
          >
            {{ formatNumber(props.row.olaWarnings) }}
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
</template>

<script>
import analyticsSummaryMixin from './analyticsSummaryMixin'

export default {
  name: 'AnalyticsOperatorsTab',

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
    periodCaption: {
      type: String,
      default: ''
    }
  },

  computed: {
    operatorLoadRows() {
      const rows = Array.isArray(this.summary.operatorLoad) ? this.summary.operatorLoad : []
      return rows.map(row => ({
        ...row,
        userId: row.userId || row.id || row.username || row.name,
        name: row.name || row.fullName || row.username || 'Без имени',
        openTasks: Number(row.openTasks || 0),
        closedTasks: Number(row.closedTasks || 0),
        overdueSla: Number(row.overdueSla || row.overdueSlaTasks || 0),
        overdueOla: Number(row.overdueOla || row.overdueOlaTasks || 0),
        olaWarnings: Number(row.olaWarnings || row.olaWarningTasks || 0),
        overdueDeadlines: Number(row.overdueDeadlines || row.overdueDeadlineTasks || row.deadlineOverdueTasks || 0),
        reopenedTasks: Number(row.reopenedTasks || row.reopenedTaskCount || row.returnedToWorkTasks || 0),
        avgFirstResponseSeconds: Number(row.avgFirstResponseSeconds || row.averageFirstResponseSeconds || 0),
        avgCloseTimeSeconds: Number(row.avgCloseTimeSeconds || row.averageCloseTimeSeconds || 0)
      }))
    },

    maxOperatorOpenTasks() {
      return Math.max(...this.operatorLoadRows.map(row => Number(row.openTasks || 0)), 0)
    },

    maxOperatorClosedTasks() {
      return Math.max(...this.operatorLoadRows.map(row => Number(row.closedTasks || 0)), 0)
    },

    operatorLoadColumns() {
      return [
        {
          name: 'name',
          label: 'Оператор',
          field: 'name',
          align: 'left',
          sortable: true
        },
        {
          name: 'openTasks',
          label: 'Открытые / доля',
          field: 'openTasks',
          align: 'right',
          sortable: true,
          format: value => Number(value || 0).toLocaleString('ru-RU')
        },
        {
          name: 'closedTasks',
          label: 'Закрытые / доля',
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
          name: 'olaWarnings',
          label: 'Риск OLA',
          field: 'olaWarnings',
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
          name: 'avgFirstResponseSeconds',
          label: 'Первый ответ',
          field: 'avgFirstResponseSeconds',
          align: 'right',
          sortable: true,
          format: value => this.formatDuration(value)
        },
        {
          name: 'avgCloseTimeSeconds',
          label: 'Закрытие',
          field: 'avgCloseTimeSeconds',
          align: 'right',
          sortable: true,
          format: value => this.formatDuration(value)
        }
      ]
    },
  }
}
</script>

<style scoped>
.operator-load-cell {
  display: grid;
  grid-template-columns: 52px minmax(110px, 1fr);
  gap: 10px;
  align-items: center;
  min-width: 185px;
}

.operator-load-value {
  text-align: right;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
