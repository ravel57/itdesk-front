<template>
  <div class="row q-col-gutter-md q-mb-md">
    <div class="col-12 col-sm-6 col-lg-3" v-for="card in lineMetricCards" :key="card.key">
      <q-card flat bordered class="analytics-card line-summary-card">
        <q-card-section>
          <div class="row items-center justify-between no-wrap">
            <div class="text-grey-7 text-caption">{{ card.label }}</div>
            <q-icon :name="card.icon" :color="card.color" size="22px"/>
          </div>
          <div class="text-h5 text-weight-medium q-mt-sm">{{ card.value }}</div>
          <div class="text-caption text-grey-7 q-mt-xs">{{ card.caption }}</div>
        </q-card-section>
      </q-card>
    </div>
  </div>

  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card flat bordered class="analytics-card">
        <q-card-section>
          <div class="text-h6">Нагрузка и OLA по линиям</div>
          <div class="text-grey-7 text-caption">
            Открытые заявки, назначения, внутренние сроки и среднее время нахождения на линии
          </div>
        </q-card-section>
        <q-separator/>
        <q-table
          :rows="lineLoadRows"
          :columns="lineLoadColumns"
          row-key="supportLineId"
          flat
          dense
          :loading="loading"
          :rows-per-page-options="[10, 20, 50, 0]"
          no-data-label="Нет данных по линиям поддержки"
        >
          <template v-slot:body-cell-openTasks="props">
            <q-td :props="props">
              <div class="line-load-cell">
                <span>{{ formatNumber(props.row.openTasks) }}</span>
                <q-linear-progress
                  rounded
                  size="7px"
                  :value="getProgressValue(props.row.openTasks, maxLineOpenTasks)"
                  color="primary"
                  track-color="grey-3"
                />
              </div>
            </q-td>
          </template>
          <template v-slot:body-cell-overdueOla="props">
            <q-td :props="props">
              <q-chip dense square :color="Number(props.row.overdueOla || 0) > 0 ? 'negative' : 'grey-2'"
                      :text-color="Number(props.row.overdueOla || 0) > 0 ? 'white' : 'dark'">
                {{ formatNumber(props.row.overdueOla) }}
              </q-chip>
            </q-td>
          </template>
          <template v-slot:body-cell-olaWarnings="props">
            <q-td :props="props">
              <q-chip dense square :color="Number(props.row.olaWarnings || 0) > 0 ? 'warning' : 'grey-2'" text-color="dark">
                {{ formatNumber(props.row.olaWarnings) }}
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <div class="col-12 q-mt-md">
      <q-card flat bordered class="analytics-card">
        <q-card-section>
          <div class="text-h6">Переходы между линиями</div>
          <div class="text-grey-7 text-caption">
            Маршрутизация остается в разделе «Автоматизации»; здесь отображается фактический поток заявок
          </div>
        </q-card-section>
        <q-separator/>
        <q-table
          :rows="lineTransitionRows"
          :columns="lineTransitionColumns"
          row-key="key"
          flat
          dense
          :loading="loading"
          :rows-per-page-options="[10, 20, 50, 0]"
          no-data-label="Переходов между линиями за период нет"
        />
      </q-card>
    </div>
  </div>
</template>

<script>
import analyticsSummaryMixin from './analyticsSummaryMixin'

export default {
  name: 'AnalyticsLinesTab',

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
    supportLineFilterOptions: {
      type: Array,
      default: () => []
    }
  },

  data: () => ({
    lineLoadColumns: [
      {name: 'name', label: 'Линия', field: 'name', align: 'left', sortable: true},
      {name: 'level', label: 'Уровень', field: 'level', align: 'left', sortable: true},
      {name: 'openTasks', label: 'Открытые / доля', field: 'openTasks', align: 'right', sortable: true},
      {name: 'unassignedTasks', label: 'Без исполнителя', field: 'unassignedTasks', align: 'right', sortable: true},
      {name: 'closedTasks', label: 'Закрыто', field: 'closedTasks', align: 'right', sortable: true},
      {name: 'olaWarnings', label: 'Риск OLA', field: 'olaWarnings', align: 'right', sortable: true},
      {name: 'overdueOla', label: 'Нарушен OLA', field: 'overdueOla', align: 'right', sortable: true},
      {name: 'avgLineTimeSeconds', label: 'Среднее время на линии', field: 'avgLineTimeSeconds', align: 'right', sortable: true, format: value => {
        const seconds = Number(value || 0)
        if (seconds <= 0) return '—'
        const minutes = Math.round(seconds / 60)
        if (minutes < 60) return `${minutes} мин`
        const hours = Math.floor(minutes / 60)
        const rest = minutes % 60
        return rest ? `${hours} ч ${rest} мин` : `${hours} ч`
      }}
    ],

    lineTransitionColumns: [
      {name: 'fromLine', label: 'Откуда', field: 'fromLine', align: 'left', sortable: true},
      {name: 'toLine', label: 'Куда', field: 'toLine', align: 'left', sortable: true},
      {name: 'count', label: 'Переходов', field: 'count', align: 'right', sortable: true, format: value => Number(value || 0).toLocaleString('ru-RU')},
      {name: 'avgTransitionSeconds', label: 'Среднее время до перехода', field: 'avgTransitionSeconds', align: 'right', sortable: true, format: value => {
        const seconds = Number(value || 0)
        if (seconds <= 0) return '—'
        const minutes = Math.round(seconds / 60)
        if (minutes < 60) return `${minutes} мин`
        const hours = Math.floor(minutes / 60)
        return `${hours} ч ${minutes % 60} мин`
      }}
    ],
  }),

  computed: {
    lineLoadRows() {
      const source = this.getSummaryRows(['lineLoad', 'supportLineLoad', 'supportLineBreakdown'])
      return source.map((row, index) => ({
        ...row,
        supportLineId: row.supportLineId ?? row.id ?? row.key ?? index,
        name: row.name || row.supportLineName || row.label || 'Без линии',
        level: row.levelLabel || (Number(row.level) > 0 ? `L${Number(row.level)}` : '—'),
        openTasks: Number(row.openTasks || row.open || 0),
        closedTasks: Number(row.closedTasks || row.closed || 0),
        unassignedTasks: Number(row.unassignedTasks || row.withoutAssignee || 0),
        olaWarnings: Number(row.olaWarnings || row.olaWarningTasks || 0),
        overdueOla: Number(row.overdueOla || row.overdueOlaTasks || 0),
        avgLineTimeSeconds: Number(row.avgLineTimeSeconds || row.averageLineTimeSeconds || 0)
      })).sort((a, b) => b.openTasks - a.openTasks)
    },

    lineTransitionRows() {
      const rows = this.getSummaryRows(['lineTransitions', 'supportLineTransitions'])
      return rows.map((row, index) => ({
        ...row,
        key: row.key || `${row.fromLineId || row.fromLine || 'none'}:${row.toLineId || row.toLine || 'none'}:${index}`,
        fromLine: row.fromLine || row.fromLineName || 'Без линии',
        toLine: row.toLine || row.toLineName || 'Без линии',
        count: Number(row.count || row.transitions || 0),
        avgTransitionSeconds: Number(row.avgTransitionSeconds || row.averageTransitionSeconds || 0)
      })).sort((a, b) => b.count - a.count)
    },

    maxLineOpenTasks() {
      return Math.max(...this.lineLoadRows.map(row => Number(row.openTasks || 0)), 0)
    },

    lineMetricCards() {
      return [
        {key: 'lines', label: 'Активные линии', value: this.formatNumber(this.supportLineFilterOptions.length), caption: 'Настроенные активные линии', icon: 'support_agent', color: 'primary'},
        {key: 'olaWarnings', label: 'Риск OLA', value: this.formatNumber(this.olaWarnings), caption: 'Срок линии скоро будет нарушен', icon: 'notification_important', color: this.olaWarnings > 0 ? 'warning' : 'positive'},
        {key: 'overdueOla', label: 'Нарушен OLA', value: this.formatNumber(this.overdueOla), caption: 'Внутренние сроки команд', icon: 'timer_off', color: this.overdueOla > 0 ? 'negative' : 'positive'},
        {key: 'avgLineTime', label: 'Время на линии', value: this.formatDuration(this.avgLineTimeSeconds), caption: 'Среднее за выбранный период', icon: 'schedule', color: 'info'}
      ]
    },
  }
}
</script>

<style scoped>
.analytics-card {
  height: 100%;
  border-radius: 8px;
}

.line-summary-card {
  height: 100%;
}

.line-load-cell {
  display: grid;
  grid-template-columns: minmax(28px, auto) minmax(80px, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 130px;
}
</style>
