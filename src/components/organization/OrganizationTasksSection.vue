<template>
  <q-card-section>
    <div class="details-section-header app-shared-details-section-header">
      <div>
        <div class="text-subtitle1 text-weight-medium">
          Заявки по выбранной организации
        </div>
        <div class="text-caption text-grey-7">
          Открытые, закрытые, просроченные и выездные заявки
        </div>
      </div>

      <q-toggle
        :model-value="showCompleted"
        @update:model-value="$emit('update:showCompleted', $event)"
        color="primary"
        dense
        left-label
        label="Показывать закрытые"
      />
    </div>

    <q-table
      flat
      bordered
      :rows="tasks"
      :loading="loading"
      :columns="taskColumns"
      row-key="id"
      :pagination="taskPagination"
      :rows-per-page-options="rowsPerPageOptions"
      class="organization-tasks-table"
      @row-click="(_, row) => openTask(row)"
    >
      <template #body-cell-title="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ getTaskTitle(props.row) }}</div>
          <div class="text-caption text-grey-7">
            {{ getTaskTypeName(props.row) }}
            <span v-if="isVisitTask(props.row)"> · Выезд</span>
          </div>
        </q-td>
      </template>

      <template #body-cell-status="props">
        <q-td :props="props">
          <q-chip
            dense
            square
            :color="isTaskClosed(props.row) ? 'grey-5' : 'primary'"
            text-color="white"
          >
            {{ getTaskStatusName(props.row) }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-sla="props">
        <q-td :props="props">
          <span :class="isTaskSlaOverdue(props.row) ? 'text-negative text-weight-medium' : ''">
            {{ getTaskSlaLabel(props.row) }}
          </span>
        </q-td>
      </template>

      <template #body-cell-deadline="props">
        <q-td :props="props">
          {{ getTaskDeadlineLabel(props.row) }}
        </q-td>
      </template>
    </q-table>
  </q-card-section>
</template>

<script>
import {
  getTaskDeadlineLabel,
  getTaskStatusName,
  getTaskTitle,
  getTaskTypeName,
  isTaskClosed,
  isVisitTask
} from 'src/util/organizationHelpers'

export default {
  name: 'OrganizationTasksSection',

  props: {
    // видимые заявки организации (с учётом переключателя «Показывать закрытые»)
    tasks: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    showCompleted: {
      type: Boolean,
      default: false
    },
    // SLA-состояние живёт на странице (загрузка, таймер), поэтому функции приходят пропсами
    getTaskSlaLabel: {
      type: Function,
      required: true
    },
    isTaskSlaOverdue: {
      type: Function,
      required: true
    }
  },

  emits: ['update:showCompleted'],

  data: () => ({
    taskColumns: [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      { name: 'title', label: 'Название', field: row => row.title || row.name || '', align: 'left', sortable: true },
      { name: 'status', label: 'Статус', field: row => row.status?.name || '', align: 'left', sortable: true },
      { name: 'priority', label: 'Приоритет', field: row => row.priority?.name || '', align: 'left', sortable: true },
      { name: 'executor', label: 'Исполнитель', field: row => row.executor?.firstname || '', align: 'left', sortable: true },
      { name: 'sla', label: 'SLA', field: row => row.id || '', align: 'left' },
      { name: 'deadline', label: 'Дедлайн', field: row => row.deadline || '', align: 'left', sortable: true }
    ],
    rowsPerPageOptions: [5, 10, 15, 20, 25, 50, 0],
    taskPagination: {
      rowsPerPage: 10
    }
  }),

  methods: {
    // чистые хелперы: src/util/organizationHelpers.js
    getTaskDeadlineLabel,
    getTaskStatusName,
    getTaskTitle,
    getTaskTypeName,
    isTaskClosed,
    isVisitTask,

    openTask (task) {
      if (!task?.id) {
        return
      }
      this.$router.push({
        path: '/tasks',
        query: {
          task: task.id
        }
      })
    },
  }
}
</script>
