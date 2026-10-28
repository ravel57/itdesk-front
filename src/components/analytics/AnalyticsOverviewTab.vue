<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-lg-8">
      <q-card flat bordered class="analytics-card app-shared-analytics-card">
        <q-card-section>
          <div class="row items-start justify-between q-gutter-sm">
            <div>
              <div class="text-h6">
                Динамика заявок
              </div>
              <div class="text-grey-7 text-caption">
                Закрытые и переоткрытые заявки · {{ periodCaption }}
              </div>
            </div>
            <div class="row q-gutter-xs">
              <q-chip dense square color="grey-2" text-color="dark">
                Закрыто: {{ formatNumber(totalClosedByPeriod) }}
              </q-chip>
              <q-chip dense square color="warning" text-color="dark">
                Переоткрыто: {{ formatNumber(totalReopenedByPeriod) }}
              </q-chip>
            </div>
          </div>
        </q-card-section>

        <q-separator/>

        <overview-period-activity-chart :rows="periodActivityRows"/>
      </q-card>
    </div>

    <div class="col-12 col-lg-4">
      <q-card flat bordered class="analytics-card app-shared-analytics-card">
        <q-card-section>
          <div class="text-h6">
            Пульс очереди
          </div>
          <div class="text-grey-7 text-caption">
            Что требует внимания прямо сейчас
          </div>
        </q-card-section>

        <q-separator/>

        <overview-queue-pulse :items="queuePulseItems"/>
      </q-card>
    </div>

    <div class="col-12 col-lg-5">
      <q-card flat bordered class="analytics-card app-shared-analytics-card">
        <q-card-section>
          <div class="text-h6">
            Закрыто / переоткрыто за период
          </div>
          <div class="text-grey-7 text-caption">
            {{ groupBy === 'WEEK' ? 'Группировка по неделям' : 'Группировка по дням' }}
          </div>
        </q-card-section>

        <q-separator/>

        <overview-closed-by-period-table :rows="periodActivityTableRows" :loading="loading"/>
      </q-card>
    </div>

    <div class="col-12 col-lg-7">
      <q-card flat bordered class="analytics-card app-shared-analytics-card">
        <q-card-section>
          <div class="text-h6">
            Быстрый контроль качества
          </div>
          <div class="text-grey-7 text-caption">
            Показометры по срокам, назначению и ожиданию ответа
          </div>
        </q-card-section>

        <q-separator/>

        <overview-quality-gauges :gauges="qualityGauges"/>
      </q-card>
    </div>

    <div class="col-12">
      <q-card flat bordered class="analytics-card app-shared-analytics-card">
        <q-card-section>
          <div class="row items-start justify-between q-gutter-sm">
            <div>
              <div class="text-h6">
                График нагрузки по часам
              </div>
              <div class="text-grey-7 text-caption">
                Входящие, исходящие, созданные, закрытые и переоткрытые заявки по часам
                суток
              </div>
            </div>
            <q-chip dense square color="grey-2" text-color="dark">
              Всего действий: {{ formatNumber(totalHourlyLoad) }}
            </q-chip>
          </div>
        </q-card-section>

        <q-separator/>

        <overview-hourly-load-chart :rows="hourlyLoadRows"/>
      </q-card>
    </div>
  </div>
</template>

<script>
import {
  buildHourlyLoadRows,
  buildPeriodActivityRows,
  buildQualityGauges,
  buildQueuePulseItems,
  normalizePeriodRows
} from 'src/util/analytics/analyticsOverview'
import analyticsSummaryMixin from './analyticsSummaryMixin'
import OverviewPeriodActivityChart from './overview/OverviewPeriodActivityChart.vue'
import OverviewQueuePulse from './overview/OverviewQueuePulse.vue'
import OverviewClosedByPeriodTable from './overview/OverviewClosedByPeriodTable.vue'
import OverviewQualityGauges from './overview/OverviewQualityGauges.vue'
import OverviewHourlyLoadChart from './overview/OverviewHourlyLoadChart.vue'

export default {
  name: 'AnalyticsOverviewTab',

  components: {
    OverviewPeriodActivityChart,
    OverviewQueuePulse,
    OverviewClosedByPeriodTable,
    OverviewQualityGauges,
    OverviewHourlyLoadChart
  },

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
    groupBy: {
      type: String,
      default: 'DAY'
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

  computed: {
    totalClosedByPeriod() {
      if (this.closedTrendRows.length > 0) {
        return this.closedTrendRows.reduce((sum, row) => sum + Number(row.count || 0), 0)
      }
      return this.closedTasks
    },

    totalReopenedByPeriod() {
      const total = this.reopenedTrendRows.reduce((sum, row) => sum + row.count, 0)
      return total || this.reopenedTasks
    },

    closedTrendRows() {
      const rows = this.getSummaryRows(['closedByPeriod', 'closedTasksByPeriod'])
      return normalizePeriodRows(rows)
    },

    reopenedTrendRows() {
      const rows = this.getSummaryRows(['reopenedByPeriod', 'reopenedTasksByPeriod', 'returnedToWorkByPeriod'])
      return normalizePeriodRows(rows)
    },

    periodActivityRows() {
      return buildPeriodActivityRows(this.closedTrendRows, this.reopenedTrendRows)
    },

    periodActivityTableRows() {
      return this.periodActivityRows.map(row => ({
        period: row.period,
        closedCount: row.closedCount,
        reopenedCount: row.reopenedCount,
        totalCount: row.totalCount
      }))
    },

    hourlyLoadRows() {
      return buildHourlyLoadRows(this.getSummaryRows(['hourlyLoad', 'loadByHour', 'hourLoad']))
    },

    totalHourlyLoad() {
      return this.hourlyLoadRows.reduce((sum, row) => sum + row.total, 0)
    },

    queuePulseItems() {
      return buildQueuePulseItems({
        overdueDeadlines: this.overdueDeadlines,
        overdueSla: this.overdueSla,
        unansweredMessages: this.unansweredMessages,
        unassignedTasks: this.unassignedTasks
      }, this.canViewInternalAnalytics)
    },

    qualityGauges() {
      return buildQualityGauges({
        openTasks: this.openTasks,
        overdueSla: this.overdueSla,
        overdueDeadlines: this.overdueDeadlines,
        unassignedTasks: this.unassignedTasks,
        newAppeals: this.newAppeals,
        unansweredMessages: this.unansweredMessages
      }, this.canViewInternalAnalytics)
    }
  }
}
</script>
