<template>
  <q-table class="settings-row-table" flat bordered row-key="id" :rows="assignments" :columns="assignmentColumns" :loading="loading"
           :pagination="{ rowsPerPage: 20 }">
    <template #body-cell-organization="props">
      <q-td :props="props">
        <div
          class="organization-name-ellipsis"
          style="max-width: 280px"
          :title="props.row.organization?.name || ''"
        >{{ props.row.organization?.name || '—' }}
        </div>
      </q-td>
    </template>
    <template #body-cell-service="props">
      <q-td :props="props">{{ props.row.service?.code }} · {{ props.row.service?.name }}</q-td>
    </template>
    <template #body-cell-validity="props">
      <q-td :props="props">{{ dateRange(props.row.validFrom, props.row.validTo) }}</q-td>
    </template>
    <template #body-cell-sla="props">
      <q-td :props="props">Ответ: {{ minutesLabel(props.row.firstResponseSlaMinutes) }}<br>Решение:
        {{ minutesLabel(props.row.resolutionSlaMinutes) }}
      </q-td>
    </template>
    <template #body-cell-active="props">
      <q-td :props="props">
        <q-icon :name="props.row.active ? 'check_circle' : 'pause_circle'"
                :color="props.row.active ? 'positive' : 'grey'"/>
      </q-td>
    </template>
    <template #body-cell-actions="props">
      <q-td :props="props">
        <q-btn flat round dense icon="edit" @click="$emit('edit', props.row)"/>
        <q-btn flat round dense icon="delete" color="negative" @click="$emit('remove', props.row)"/>
      </q-td>
    </template>
  </q-table>
</template>

<script>
import {createAssignmentColumns} from 'src/util/settingsServices/serviceColumns'
import {dateRange, minutesLabel} from 'src/util/settingsServices/serviceDisplay'

// Таблица подключений сервисов к организациям (вкладка «Организации и договоры»).
export default {
  name: 'AssignmentsTable',

  props: {
    assignments: {type: Array, default: () => []},
    loading: {type: Boolean, default: false}
  },

  emits: ['edit', 'remove'],

  data() {
    return {
      assignmentColumns: createAssignmentColumns()
    }
  },

  methods: {
    dateRange,
    minutesLabel
  }
}
</script>
