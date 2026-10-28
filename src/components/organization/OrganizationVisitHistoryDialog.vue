<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 900px; max-width: 95vw;">
      <q-card-section>
        <div class="row items-center justify-between q-gutter-md">
          <div>
            <div class="text-h6">
              История выездов
            </div>
            <div class="text-caption text-grey-7">
              {{ getOrganizationName(organization) }}
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="refresh"
            :loading="loading"
            @click="$emit('refresh', organization)"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          flat
          bordered
          dense
          row-key="id"
          :rows="rows"
          :columns="visitHistoryColumns"
          :loading="loading"
          :pagination="visitHistoryPagination"
          :rows-per-page-options="rowsPerPageOptions"
        >
          <template #body-cell-visitDate="props">
            <q-td :props="props">
              {{ formatDateTime(props.row.visitDate) }}
            </q-td>
          </template>

          <template #body-cell-task="props">
            <q-td :props="props">
            <span v-if="props.row.taskId">
              #{{ props.row.taskId }} {{ props.row.taskTitle || '' }}
            </span>
              <span v-else class="text-grey-6">
              —
            </span>
            </q-td>
          </template>

          <template #body-cell-counted="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="props.row.countedInPackage ? props.row.overLimit ? 'negative' : 'primary' : 'grey-5'"
                text-color="white"
              >
                {{ props.row.countedInPackage ? props.row.overLimit ? 'Сверх пакета' : 'Списан' : 'Не списан' }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-price="props">
            <q-td :props="props">
              {{ formatMoney(props.row.price) }}
            </q-td>
          </template>

          <template #body-cell-comment="props">
            <q-td :props="props">
              {{ props.row.comment || '—' }}
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width text-center text-grey-7 q-pa-md">
              История выездов пока пустая
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Отмена"
          @click="$emit('update:modelValue', false)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { formatDateTime, formatMoney, getOrganizationName } from 'src/util/organizationHelpers'

export default {
  name: 'OrganizationVisitHistoryDialog',

  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    organization: {
      type: Object,
      default: null
    },
    // история выездов организации
    rows: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue', 'refresh'],

  data: () => ({
    rowsPerPageOptions: [5, 10, 15, 20, 25, 50, 0],
    visitHistoryPagination: {
      rowsPerPage: 10
    },
    visitHistoryColumns: [
      { name: 'visitDate', label: 'Дата', field: 'visitDate', align: 'left', sortable: true },
      { name: 'type', label: 'Причина', field: 'type', align: 'left', sortable: true },
      { name: 'task', label: 'Заявка', field: 'taskTitle', align: 'left' },
      { name: 'counted', label: 'Пакет', field: 'countedInPackage', align: 'left', sortable: true },
      { name: 'price', label: 'Стоимость', field: 'price', align: 'left', sortable: true },
      { name: 'comment', label: 'Комментарий', field: 'comment', align: 'left' }
    ]
  }),

  methods: {
    // чистые хелперы: src/util/organizationHelpers.js
    formatDateTime,
    formatMoney,
    getOrganizationName
  }
}
</script>
