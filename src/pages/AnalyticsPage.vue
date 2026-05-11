<template>
  <q-page padding class="analytics-page">
    <div class="row items-start justify-between q-gutter-md q-mb-md">
      <div>
        <div class="text-h5 text-weight-medium">
          Аналитика
        </div>
        <div class="text-grey-7">
          Обращения, заявки, SLA и нагрузка операторов
        </div>
      </div>

      <div class="analytics-controls">
        <div class="period-toggle">
          <q-btn
            v-for="option in periodOptions"
            :key="option.value"
            :label="option.label"
            :color="periodPreset === option.value ? 'primary' : 'grey-3'"
            :text-color="periodPreset === option.value ? 'white' : 'dark'"
            unelevated
            dense
            no-caps
            class="period-toggle-btn"
            @click="selectPeriod(option.value)"
          />
        </div>

        <q-input
          v-model="fromDate"
          label="С"
          type="date"
          dense
          outlined
          class="analytics-date-input"
          @update:model-value="loadAnalytics"
        />

        <q-input
          v-model="toDate"
          label="По"
          type="date"
          dense
          outlined
          class="analytics-date-input"
          @update:model-value="loadAnalytics"
        />

        <q-select
          v-model="groupBy"
          :options="groupByOptions"
          label="Группировка"
          dense
          outlined
          emit-value
          map-options
          class="analytics-group-input"
          @update:model-value="loadAnalytics"
        />

        <q-btn
          icon="refresh"
          color="primary"
          flat
          round
          :loading="loading"
          @click="loadAnalytics"
        >
          <q-tooltip>
            Обновить
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="card in metricCards"
        :key="card.key"
        class="col-12 col-sm-6 col-md-4 col-lg-2"
      >
        <q-card flat bordered class="metric-card">
          <q-card-section>
            <div class="row items-center justify-between no-wrap">
              <div class="metric-title">
                {{ card.label }}
              </div>
              <q-icon :name="card.icon" size="22px" class="text-grey-6" />
            </div>

            <div class="metric-value">
              {{ card.value }}
            </div>

            <div class="metric-caption">
              {{ card.caption }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-5">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">
              Закрыто за период
            </div>
            <div class="text-grey-7 text-caption">
              {{ groupBy === 'WEEK' ? 'Группировка по неделям' : 'Группировка по дням' }}
            </div>
          </q-card-section>

          <q-separator />

          <q-table
            :rows="summary.closedByPeriod || []"
            :columns="closedByPeriodColumns"
            row-key="period"
            flat
            dense
            :loading="loading"
            :rows-per-page-options="[10, 20, 50, 0]"
            no-data-label="Нет закрытых заявок за выбранный период"
          >
            <template v-slot:body-cell-period="props">
              <q-td :props="props">
                {{ formatPeriodDate(props.row.period) }}
              </q-td>
            </template>
          </q-table>
        </q-card>
      </div>

      <div class="col-12 col-md-7">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6">
              Нагрузка по операторам
            </div>
            <div class="text-grey-7 text-caption">
              Открытые, закрытые и просроченные SLA
            </div>
          </q-card-section>

          <q-separator />

          <q-table
            :rows="summary.operatorLoad || []"
            :columns="operatorLoadColumns"
            row-key="userId"
            flat
            dense
            :loading="loading"
            :rows-per-page-options="[10, 20, 50, 0]"
            no-data-label="Нет данных по операторам"
          />
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import moment from 'moment'
import { useStore } from 'stores/store'

export default {
  name: 'AnalyticsPage',

  setup () {
    return {
      store: useStore()
    }
  },

  data: () => ({
    loading: false,
    periodPreset: '7',
    fromDate: '',
    toDate: '',
    groupBy: 'DAY',

    periodOptions: [
      { label: 'Сегодня', value: 'today' },
      { label: '7 дней', value: '7' },
      { label: '30 дней', value: '30' }
    ],

    groupByOptions: [
      { label: 'По дням', value: 'DAY' },
      { label: 'По неделям', value: 'WEEK' }
    ],

    closedByPeriodColumns: [
      {
        name: 'period',
        label: 'Период',
        field: 'period',
        align: 'left',
        sortable: true
      },
      {
        name: 'count',
        label: 'Закрыто',
        field: 'count',
        align: 'right',
        sortable: true
      }
    ],

    operatorLoadColumns: [
      {
        name: 'name',
        label: 'Оператор',
        field: 'name',
        align: 'left',
        sortable: true
      },
      {
        name: 'openTasks',
        label: 'Открытые',
        field: 'openTasks',
        align: 'right',
        sortable: true
      },
      {
        name: 'closedTasks',
        label: 'Закрытые',
        field: 'closedTasks',
        align: 'right',
        sortable: true
      },
      {
        name: 'overdueSla',
        label: 'Просроченные SLA',
        field: 'overdueSla',
        align: 'right',
        sortable: true
      }
    ]
  }),

  computed: {
    summary () {
      return this.store.analyticsSummary || {}
    },

    metricCards () {
      return [
        {
          key: 'newAppeals',
          label: 'Новые обращения',
          value: this.formatNumber(this.summary.newAppeals),
          caption: 'Входящие сообщения',
          icon: 'forum'
        },
        {
          key: 'openTasks',
          label: 'Открытые заявки',
          value: this.formatNumber(this.summary.openTasks),
          caption: 'Сейчас в работе',
          icon: 'task_alt'
        },
        {
          key: 'overdueSla',
          label: 'Просроченные SLA',
          value: this.formatNumber(this.summary.overdueSla),
          caption: 'По открытым заявкам',
          icon: 'warning'
        },
        {
          key: 'avgFirstResponseSeconds',
          label: 'Первый ответ',
          value: this.formatDuration(this.summary.avgFirstResponseSeconds),
          caption: 'Среднее время',
          icon: 'reply'
        },
        {
          key: 'avgCloseTimeSeconds',
          label: 'Закрытие заявки',
          value: this.formatDuration(this.summary.avgCloseTimeSeconds),
          caption: 'Среднее время',
          icon: 'done_all'
        },
        {
          key: 'unassignedTasks',
          label: 'Без исполнителя',
          value: this.formatNumber(this.summary.unassignedTasks),
          caption: 'Открытые заявки',
          icon: 'person_off'
        }
      ]
    }
  },

  created () {
    this.applyPreset(false)
    this.loadAnalytics()
  },

  methods: {
    applyPreset (needLoad = true) {
      const now = new Date()
      const from = new Date(now)
      if (this.periodPreset === 'today') {
        from.setDate(now.getDate())
      } else {
        from.setDate(now.getDate() - Number(this.periodPreset) + 1)
      }
      this.fromDate = this.formatDateInput(from)
      this.toDate = this.formatDateInput(now)
      if (needLoad) {
        this.loadAnalytics()
      }
    },

    loadAnalytics () {
      if (!this.fromDate || !this.toDate) {
        return
      }
      this.loading = true
      this.store.fetchAnalyticsSummary({
        from: this.toIsoParam(this.fromDate, false),
        to: this.toIsoParam(this.toDate, true),
        groupBy: this.groupBy
      })
        .catch(error => {
          console.error(error)
          this.$q.notify({
            type: 'negative',
            message: 'Не удалось загрузить аналитику'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },

    formatDateInput (date) {
      const year = date.getFullYear()
      const month = `${date.getMonth() + 1}`.padStart(2, '0')
      const day = `${date.getDate()}`.padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    toIsoParam (dateValue, endOfDay) {
      const time = endOfDay ? '23:59:59' : '00:00:00'
      return new Date(`${dateValue}T${time}`).toISOString()
    },

    formatNumber (value) {
      return Number(value || 0).toLocaleString('ru-RU')
    },

    formatDuration (seconds) {
      const totalSeconds = Number(seconds || 0)
      if (totalSeconds <= 0) {
        return '—'
      }
      const minutes = Math.round(totalSeconds / 60)
      if (minutes < 60) {
        return `${minutes} мин`
      }
      const hours = Math.floor(minutes / 60)
      const restMinutes = minutes % 60
      if (hours < 24) {
        return restMinutes > 0 ? `${hours} ч ${restMinutes} мин` : `${hours} ч`
      }
      const days = Math.floor(hours / 24)
      const restHours = hours % 24
      return restHours > 0 ? `${days} д ${restHours} ч` : `${days} д`
    },

    selectPeriod (value) {
      this.periodPreset = value
      this.applyPreset()
    },

    formatPeriodDate (value) {
      if (!value) {
        return '—'
      }
      const date = moment(value, 'YYYY-MM-DD', true)
      if (!date.isValid()) {
        return value
      }
      return date.format('DD.MM.YYYY')
    },
  },
}
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
}

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

.metric-card {
  height: 100%;
  border-radius: 8px;
}

.metric-title {
  color: #616161;
  font-size: 13px;
  line-height: 16px;
}

.metric-value {
  margin-top: 12px;
  font-size: 28px;
  line-height: 32px;
  font-weight: 600;
}

.metric-caption {
  margin-top: 4px;
  color: #757575;
  font-size: 12px;
}

.period-toggle {
  display: flex;
  gap: 8px;
  align-items: center;
}

.period-toggle-btn {
  border-radius: 4px;
  min-height: 32px;
  padding: 4px 10px;
}
</style>
