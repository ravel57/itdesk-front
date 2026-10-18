<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Журнал безопасности</div>
        <div class="settings-content-description">
          Входы и неудачные попытки, смены паролей и ролей, удаления, выгрузки, ключи API и двухфакторная аутентификация.
          События хранятся год.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn flat round dense icon="refresh" :loading="loading" @click="load">
          <q-tooltip>Обновить</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-md-5">
        <q-select
          v-model="selectedTypes"
          :options="typeOptions"
          option-value="code"
          option-label="label"
          emit-value
          map-options
          multiple
          use-chips
          outlined
          dense
          clearable
          label="События"
          @update:model-value="reload"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          v-model="search"
          outlined
          dense
          clearable
          debounce="300"
          label="Пользователь, объект, IP"
          @update:model-value="reload"
        >
          <template #prepend>
            <q-icon name="search"/>
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="period"
          :options="periodOptions"
          emit-value
          map-options
          outlined
          dense
          label="Период"
          @update:model-value="reload"
        />
      </div>
    </div>

    <q-table
      flat
      bordered
      dense
      :rows="rows"
      :columns="columns"
      row-key="id"
      :loading="loading"
      v-model:pagination="pagination"
      :rows-per-page-options="[25, 50, 100, 200]"
      rows-per-page-label="Строк на странице"
      no-data-label="Событий нет"
      @request="onRequest"
    >
      <template #body-cell-type="props">
        <q-td :props="props">
          <q-badge :color="props.row.attention ? 'deep-orange' : 'blue-grey-6'" :label="props.row.typeLabel"/>
        </q-td>
      </template>
      <template #body-cell-details="props">
        <q-td :props="props" class="security-audit__details">
          {{ props.row.details || '' }}
        </q-td>
      </template>
      <template #body-cell-ip="props">
        <q-td :props="props">
          {{ props.row.ip || '' }}
          <q-tooltip v-if="props.row.userAgent" max-width="420px">{{ props.row.userAgent }}</q-tooltip>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script>
import axios from 'axios'

const DAY_MS = 24 * 60 * 60 * 1000

export default {
  name: 'SecurityAuditPage',

  data: () => ({
    loading: false,
    rows: [],
    typeOptions: [],
    selectedTypes: [],
    search: '',
    period: 7,
    periodOptions: [
      { label: 'Сутки', value: 1 },
      { label: '7 дней', value: 7 },
      { label: '30 дней', value: 30 },
      { label: '90 дней', value: 90 },
      { label: 'Год', value: 365 }
    ],
    pagination: { page: 1, rowsPerPage: 50, rowsNumber: 0 },
    columns: [
      {
        name: 'createdAt',
        label: 'Время',
        field: 'createdAt',
        align: 'left',
        format: value => (value ? new Date(value).toLocaleString('ru-RU') : '')
      },
      { name: 'type', label: 'Событие', field: 'typeLabel', align: 'left' },
      { name: 'actor', label: 'Кто', field: 'actor', align: 'left', format: value => value || '—' },
      { name: 'target', label: 'Объект', field: 'target', align: 'left', format: value => value || '' },
      { name: 'details', label: 'Подробности', field: 'details', align: 'left' },
      { name: 'ip', label: 'IP', field: 'ip', align: 'left' }
    ]
  }),

  mounted () {
    axios.get('/api/v1/security-audit/types')
      .then(({ data }) => { this.typeOptions = Array.isArray(data) ? data : [] })
    this.load()
  },

  methods: {
    reload () {
      this.pagination.page = 1
      this.load()
    },

    onRequest ({ pagination }) {
      this.pagination.page = pagination.page
      this.pagination.rowsPerPage = pagination.rowsPerPage
      this.load()
    },

    load () {
      this.loading = true
      const params = new URLSearchParams()
      ;(this.selectedTypes || []).forEach(type => params.append('types', type))
      if (this.search) {
        params.append('search', this.search)
      }
      params.append('from', new Date(Date.now() - this.period * DAY_MS).toISOString())
      params.append('page', String(this.pagination.page - 1))
      params.append('size', String(this.pagination.rowsPerPage))
      axios.get(`/api/v1/security-audit?${params.toString()}`)
        .then(({ data }) => {
          this.rows = Array.isArray(data?.events) ? data.events : []
          this.pagination.rowsNumber = Number(data?.total || 0)
        })
        .catch(error => {
          this.rows = []
          this.$q.notify({ type: 'negative', message: error?.response?.data?.message || 'Не удалось загрузить журнал' })
        })
        .finally(() => { this.loading = false })
    }
  }
}
</script>

<style scoped>
.security-audit__details {
  white-space: normal;
  min-width: 240px;
  max-width: 420px;
}
</style>
