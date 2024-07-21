<template>
  <div
    v-if="this.isShowTableMode"
    style="overflow: auto"
  >
    <q-table
      :rows="this.tableRows"
      :columns="this.tableColumns"
      :rows-per-page-options="[10, 20, 50, 0]"
      :sortable="true"
      row-key="id"
      bordered
      style="margin-top: 8px"
      rows-per-page-label="Строк на странице"
    >
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <div @click="this.$emit('onTaskClicked', props.row)">
            {{ this.shortenLine(props.row.name) }}
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
  <div
    v-else
    class="flex-container"
    :style="this.taskCardStyle"
  >
    <card-tasks-view
      :groupedTasks="this.groupedTasks"
      :selectedGroupType="''"
      @onTaskClicked="this.$emit('onTaskClicked', $event)"
    />
  </div>
  <task-dialog
    v-if="this.getPossibilityToOpenDialogTask"
    :client="this.selectedTask.client"
    :isMobile="this.isMobile"
    :task="this.selectedTask"
    :isNewTaskDialogShow="this.isNewTaskDialogShow"
    :isTaskDialogShow="this.isTaskDialogShow"
    :isNewTask="false"
    @closeDialog="this.$emit('closeDialog', $event)"
    @updateTask="this.$emit('updateTask', $event)"
  />
</template>

<script>
import CardTasksView from 'components/tasks/CardTasksView.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import moment from 'moment'

export default {

  components: { TaskDialog, CardTasksView },

  name: 'TasksComponent',

  props: [
    'isShowTableMode',
    'isMobile',
    'tableRows',
    'isFilterSelected',
    'groupedTasks',
    'selectedGroupType',
    'isNewTaskDialogShow',
    'isTaskDialogShow',
    'selectedTask',
    'filterContainerHeight'
  ],

  data: () => ({
    tableColumns: [
      {
        name: 'id',
        label: 'ID',
        align: 'left',
        field: row => row.id,
        sortable: true
      },
      {
        name: 'name',
        label: 'Название',
        align: 'left',
        field: row => row.name.length > 31 ? row.name.substring(0, 60) + '...' : row.name,
        sortable: true
      },
      {
        name: 'tags',
        label: 'Теги',
        align: 'left',
        field: row => row.tags.map(tag => tag.name).join(', '),
        sortable: true
      },
      {
        name: 'priority',
        label: 'Приоритет',
        align: 'left',
        field: row => row.priority.name,
        sortable: true
      },
      {
        name: 'createdAt',
        label: 'Создана',
        align: 'left',
        field: row => row.createdAt.toLocaleTimeString('ru-RU', {
          timeZone: 'Europe/Moscow',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        sortable: true
      },
      {
        name: 'status',
        label: 'Статус',
        align: 'left',
        field: row => row.status.name,
        sortable: true
      },
      {
        name: 'deadline',
        label: 'Дедлайн',
        align: 'left',
        field: row => row.deadline
          ? row.deadline.toLocaleTimeString('ru-RU', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          : '',
        sortable: true
      },
      {
        name: 'executor',
        label: 'Исполнитель',
        align: 'left',
        field: row => row.executor
          ? row.executor.firstname + ' ' + row.executor.lastname
          : '',
        sortable: true
      },
      {
        name: 'sla',
        label: 'SLA',
        align: 'left',
        field: row => {
          if (!row.sla || !row.sla.startDate || !row.sla.duration) {
            return '0 ч. 0 м.'
          }
          const endDateTime = moment(row.sla.startDate).clone().add(moment.duration(row.sla.duration))
          const now = moment()
          const duration = moment.duration(endDateTime.diff(now))
          if (duration.asMilliseconds() < 0) {
            return '0 ч. 0 м.'
          } else {
            return `${duration.days() * 24 + duration.hours()} ч. ${duration.minutes()} м.`
          }
        },
        sortable: true
      }
    ]
  }),

  methods: {
    shortenLine (string) {
      if (string.length > 31) {
        return string.substring(0, 31) + '...'
      } else {
        return string
      }
    },

    getTaskCardStyle () {
      const taskHeight = this.taskCardStyle.height
      return `${this.taskCardStyle['padding-top']} ${taskHeight}`
    }
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    taskCardStyle () {
      return {
        'padding-top': '8px',
        height: this.isMobile ? `calc(72vh - ${this.filterContainerHeight}px ${this.filterContainerHeight !== 0 ? '- 5px' : ''})` : `calc(92vh - ${this.filterContainerHeight}px ${this.filterContainerHeight !== 0 ? '- 5px' : ''})`
      }
    }
  }
}
</script>

<style scoped>

.flex-container {
  display: flex;
  width: 100%;
  flex-wrap: nowrap;
  overflow: auto;
}

</style>
