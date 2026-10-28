<template>
  <q-table
    class="settings-row-table"
    flat bordered row-key="id" :rows="services" :columns="serviceColumns"
    :filter="serviceFilter" :loading="loading" :pagination="{ rowsPerPage: 20 }"
  >
    <template #top-left>
      <q-input v-model="serviceFilter" dense outlined clearable debounce="250"
               placeholder="Поиск по коду, названию или организации">
        <template #prepend>
          <q-icon name="search"/>
        </template>
      </q-input>
    </template>
    <template #body-cell-name="props">
      <q-td :props="props">
        <div class="text-weight-medium">{{ props.row.code }} · {{ props.row.name }}</div>
        <div class="text-caption text-grey-7 ellipsis app-inline app-max-width-420">{{ props.row.description }}</div>
      </q-td>
    </template>
    <template #body-cell-organizations="props">
      <q-td :props="props">
        <template v-if="serviceOrganizationNames(props.row).length">
          <q-chip v-for="name in serviceOrganizationNames(props.row).slice(0, 3)" :key="name" dense square
                  class="service-organization-chip app-shared-service-organization-chip" :label="name"/>
          <q-chip v-if="serviceOrganizationNames(props.row).length > 3" dense square outline
                  :label="`+${serviceOrganizationNames(props.row).length - 3}`">
            <q-tooltip>{{ serviceOrganizationNames(props.row).slice(3).join(', ') }}</q-tooltip>
          </q-chip>
        </template>
        <span v-else class="text-grey-7">Все организации</span>
      </q-td>
    </template>
    <template #body-cell-criticality="props">
      <q-td :props="props">{{ props.row.criticality?.name || '—' }}</q-td>
    </template>
    <template #body-cell-monitoring="props">
      <q-td :props="props">
        <q-chip dense :color="monitoringColor(props.row.monitoringStatus)" text-color="white">
          {{ monitoringLabel(props.row.monitoringStatus) }}
        </q-chip>
        <div class="text-caption text-grey-7">{{ props.row.lastMonitoringMessage || '' }}</div>
      </q-td>
    </template>
    <template #body-cell-active="props">
      <q-td :props="props">
        <q-icon :name="props.row.active ? 'check_circle' : 'pause_circle'"
                :color="props.row.active ? 'positive' : 'grey'" size="sm"/>
      </q-td>
    </template>
    <template #body-cell-actions="props">
      <q-td :props="props" class="q-gutter-xs">
        <q-btn flat round dense icon="monitor_heart" :loading="checkingId === props.row.id"
               @click="$emit('check-monitoring', props.row)">
          <q-tooltip>Проверить Zabbix</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="edit" @click="$emit('edit', props.row)"/>
        <q-btn flat round dense icon="delete" color="negative" @click="$emit('remove', props.row)"/>
      </q-td>
    </template>
  </q-table>
</template>

<script>
import {serviceOrganizationNames} from 'src/util/serviceOrganizations'
import {createServiceColumns} from 'src/util/settingsServices/serviceColumns'
import {monitoringColor, monitoringLabel} from 'src/util/settingsServices/serviceDisplay'

// Таблица сервисов (вкладка «Сервисы»). Поиск по таблице — локальное состояние компонента.
export default {
  name: 'ServicesTable',

  props: {
    services: {type: Array, default: () => []},
    loading: {type: Boolean, default: false},
    // id сервиса, для которого сейчас идёт проверка мониторинга
    checkingId: {type: [Number, String], default: null}
  },

  emits: ['check-monitoring', 'edit', 'remove'],

  data() {
    return {
      serviceFilter: '',
      serviceColumns: createServiceColumns()
    }
  },

  methods: {
    serviceOrganizationNames(service) {
      return serviceOrganizationNames(service, this.services)
    },

    monitoringColor,
    monitoringLabel
  }
}
</script>
