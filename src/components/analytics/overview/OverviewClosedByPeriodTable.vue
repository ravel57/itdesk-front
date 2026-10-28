<template>
  <q-table
    :rows="rows"
    :columns="columns"
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
</template>

<script>
import {formatPeriodDate} from 'src/util/analytics/analyticsFormat'

// Таблица «Закрыто / переоткрыто за период».
export default {
  name: 'OverviewClosedByPeriodTable',

  props: {
    rows: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  data: () => ({
    columns: [
      {
        name: 'period',
        label: 'Период',
        field: 'period',
        align: 'left',
        sortable: true
      },
      {
        name: 'closedCount',
        label: 'Закрыто',
        field: 'closedCount',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      },
      {
        name: 'reopenedCount',
        label: 'Переоткрыто',
        field: 'reopenedCount',
        align: 'right',
        sortable: true,
        format: value => Number(value || 0).toLocaleString('ru-RU')
      }
    ]
  }),

  methods: {
    formatPeriodDate(value) {
      return formatPeriodDate(value)
    }
  }
}
</script>
