<template>
  <q-table class="settings-row-table" flat bordered row-key="id" :rows="zabbixIntegrations" :columns="zabbixColumns" :loading="loading">
    <template #body-cell-mode="props">
      <q-td :props="props">
        <q-badge outline :color="props.row.mode === 'WEBHOOK' ? 'deep-purple-6' : 'blue-7'"
                 :label="props.row.mode === 'WEBHOOK' ? 'Веб-хук' : 'Опрос API'"/>
      </q-td>
    </template>
    <template #body-cell-auth="props">
      <q-td :props="props">
        <template v-if="props.row.mode === 'WEBHOOK'">
          {{ props.row.hasWebhookToken ? 'Токен веб-хука' : 'Токен не выпущен' }}
        </template>
        <template v-else>
          {{ props.row.hasApiToken ? 'API token' : props.row.hasPassword ? 'Логин / пароль' : 'Не настроена' }}
        </template>
      </q-td>
    </template>
    <template #body-cell-lastTest="props">
      <q-td :props="props">
        <q-icon :name="props.row.lastTestSuccess ? 'check_circle' : 'error'"
                :color="props.row.lastTestSuccess ? 'positive' : 'negative'"/>
        {{ props.row.lastTestMessage || 'Не проверялась' }}
      </q-td>
    </template>
    <template #body-cell-actions="props">
      <q-td :props="props">
        <q-btn v-if="props.row.mode === 'WEBHOOK'" flat round dense icon="receipt_long" @click="$emit('log', props.row)">
          <q-tooltip>Журнал приёма</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="network_check" :loading="testingZabbixId === props.row.id"
               @click="$emit('test', props.row)">
          <q-tooltip>{{ props.row.mode === 'WEBHOOK' ? 'Проверить связь' : 'Проверить подключение' }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="edit" @click="$emit('edit', props.row)"/>
        <q-btn flat round dense icon="delete" color="negative" @click="$emit('remove', props.row)"/>
      </q-td>
    </template>
  </q-table>
</template>

<script>
import {createZabbixColumns} from 'src/util/settingsServices/serviceColumns'

// Таблица интеграций Zabbix (вкладка «Zabbix»).
export default {
  name: 'ZabbixTable',

  props: {
    zabbixIntegrations: {type: Array, default: () => []},
    loading: {type: Boolean, default: false},
    // id интеграции, для которой сейчас идёт проверка подключения
    testingZabbixId: {type: [Number, String], default: null}
  },

  emits: ['log', 'test', 'edit', 'remove'],

  data() {
    return {
      zabbixColumns: createZabbixColumns()
    }
  }
}
</script>
