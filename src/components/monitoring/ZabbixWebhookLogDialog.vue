<template>
  <q-dialog :model-value="modelValue" @update:model-value="value => $emit('update:modelValue', value)">
    <q-card class="zabbix-log column no-wrap">
      <q-card-section class="row items-center no-wrap q-pb-sm">
        <div class="col">
          <div class="text-h6">Журнал приёма Zabbix</div>
          <div class="text-caption text-grey-7">
            {{ integration?.name }} · события за 30 дней: что пришло и к какому сервису привязалось
          </div>
        </div>
        <q-btn flat round dense icon="refresh" :loading="loading" @click="load">
          <q-tooltip>Обновить</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="close" v-close-popup aria-label="Закрыть"/>
      </q-card-section>

      <q-card-section class="col zabbix-log__body q-pt-none">
        <q-table
          flat
          bordered
          dense
          :rows="rows"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :pagination="{ rowsPerPage: 50 }"
          no-data-label="Zabbix ещё ничего не присылал"
        >
          <template #body-cell-outcome="props">
            <q-td :props="props">
              <q-badge :color="outcomeColor(props.row)" :label="outcomeLabel(props.row)"/>
            </q-td>
          </template>
          <template #body-cell-event="props">
            <q-td :props="props" class="zabbix-log__event">
              <template v-if="props.row.kind === 'EVENT'">
                <span class="text-weight-medium">{{ statusLabel(props.row.eventStatus) }}</span>
                <span v-if="props.row.severity != null" class="text-grey-7"> · важность {{ props.row.severity }}</span>
                <div>{{ props.row.eventName || '—' }}</div>
                <div class="text-caption text-grey-7">
                  {{ [props.row.host, props.row.eventId ? `событие ${props.row.eventId}` : ''].filter(Boolean).join(' · ') }}
                </div>
              </template>
              <span v-else class="text-grey-7">Проверка связи</span>
            </q-td>
          </template>
          <template #body-cell-message="props">
            <q-td :props="props" class="zabbix-log__message">{{ props.row.message }}</q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'

const OUTCOMES = {
  ACCEPTED: { label: 'Принято', color: 'positive' },
  DUPLICATE: { label: 'Повтор', color: 'grey-7' },
  UNMAPPED: { label: 'Без сервиса', color: 'warning' },
  REJECTED: { label: 'Отклонено', color: 'negative' },
  CONNECTION_LOST: { label: 'Нет связи', color: 'deep-orange' },
  CONNECTION_RESTORED: { label: 'Связь есть', color: 'positive' }
}

const STATUSES = { PROBLEM: 'Проблема', RESOLVED: 'Устранена', UPDATE: 'Обновление' }

export default {
  name: 'ZabbixWebhookLogDialog',

  props: {
    modelValue: { type: Boolean, default: false },
    integration: { type: Object, default: null }
  },

  emits: ['update:modelValue'],

  data () {
    return {
      loading: false,
      rows: [],
      columns: [
        {
          name: 'receivedAt',
          label: 'Время',
          field: 'receivedAt',
          align: 'left',
          format: value => (value ? new Date(value).toLocaleString('ru-RU') : '')
        },
        { name: 'outcome', label: 'Итог', field: 'outcome', align: 'left' },
        { name: 'event', label: 'Событие', field: 'eventName', align: 'left' },
        { name: 'service', label: 'Сервис', field: 'serviceCode', align: 'left', format: value => value || '—' },
        { name: 'message', label: 'Подробности', field: 'message', align: 'left' },
        { name: 'remoteIp', label: 'Адрес', field: 'remoteIp', align: 'left', format: value => value || '' }
      ]
    }
  },

  watch: {
    modelValue (value) {
      if (value) this.load()
    }
  },

  methods: {
    async load () {
      if (!this.integration?.id) return
      this.loading = true
      try {
        const { data } = await axios.get(`/api/v1/zabbix-integration/${this.integration.id}/webhook-log`, { params: { limit: 300 } })
        this.rows = Array.isArray(data) ? data : []
      } catch (error) {
        this.rows = []
        this.$q.notify({ type: 'negative', message: error?.response?.data?.message || 'Не удалось загрузить журнал' })
      } finally {
        this.loading = false
      }
    },

    // Записи до появления CONNECTION_* хранили потерю и восстановление связи как REJECTED / ACCEPTED
    outcomeOf (row) {
      if (row.kind === 'HEARTBEAT' && !row.remoteIp && row.outcome === 'ACCEPTED') return 'CONNECTION_RESTORED'
      if (row.kind === 'HEARTBEAT' && !row.remoteIp && row.outcome === 'REJECTED') return 'CONNECTION_LOST'
      return row.outcome
    },

    outcomeLabel (row) {
      const outcome = this.outcomeOf(row)
      return OUTCOMES[outcome]?.label || outcome
    },

    outcomeColor (row) {
      return OUTCOMES[this.outcomeOf(row)]?.color || 'grey'
    },

    statusLabel (status) {
      return STATUSES[status] || status || '—'
    }
  }
}
</script>

<style scoped>
.zabbix-log {
  width: 1100px;
  max-width: 96vw;
  height: 80vh;
}

.zabbix-log__body {
  overflow: auto;
}

.zabbix-log__event,
.zabbix-log__message {
  white-space: normal;
  min-width: 220px;
}
</style>
