<template>
  <div
    class="flex-container"
    style="padding-top: 8px"
  >
    <q-table
      v-if="this.isShowTableMode"
      virtual-scroll
      :rows="this.tableRows"
      :columns="this.filterTableColumns"
      :rows-per-page-options="[10, 20, 40, 60, 100]"
      :sortable="true"
      row-key="id"
      bordered
      style="margin-top: 8px;margin-bottom: 16px;width: 100%;"
      selection="multiple"
      v-model:selected="this.store.checkedTasks"
      :selected-rows-label="(numberOfRows) => `Строк: ${ numberOfRows } выбрано`"
      rows-per-page-label="Строк на странице"
    >
      <template v-slot:header="props">
        <tr>
          <q-th
            :style="{'position': 'sticky', 'top': '0', 'z-index': '1', 'background-color': 'white', 'color': 'var(--q-dark)'}"
          >
            <q-checkbox
              v-model="props.selected"
              @click.stop
            />
          </q-th>
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :style="{'position': 'sticky', 'top': '0', 'z-index': '1', 'background-color': 'white', 'color': 'var(--q-dark)'}"
            :props="props"
          >
            {{ col.label }}
          </q-th>
        </tr>
      </template>
      <template v-slot:body="props">
        <q-tr style="cursor: pointer" :props="props" @click="this.$emit('onTaskClicked', props.row)">
          <q-td>
            <q-checkbox
              v-model="props.selected"
              @click.stop
            />
          </q-td>
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <div
              v-if="col.name === 'deadline'"
              :style="`color: ${this.parseStrToDate(col.value) < Date.now() ? 'red' : 'black'}`"
            >
              {{ col.value }}
            </div>
            <div
              v-else-if="col.name === 'status'"
              :style="`color: ${col.value === 'Заморожена' ? 'rgba(50, 173, 230, 1)' : (col.value === 'Закрыта'? 'rgba(16, 181, 92, 1)' : '')}`"
            >
              {{ col.value }}
            </div>
            <div v-else>
              {{ col.value }}
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <card-tasks-view
      v-else
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
    @addMessageToTask="this.addMessageToTask"
  />
</template>

<script>
import CardTasksView from 'components/tasks/CardTasksView.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import moment from 'moment/moment'
import { useStore } from 'stores/store'

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
    'activeColumns'
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
        field: row => row.name.length > 40 ? row.name.substring(0, 40) + '...' : row.name,
        sortable: true
      },
      {
        name: 'tags',
        label: 'Теги',
        align: 'left',
        field: row => row.tags.map(tag => tag.name).join(', ').length > 21
          ? row.tags.map(tag => tag.name).join(', ').substring(0, 21) + '...'
          : row.tags.map(tag => tag.name).join(', '),
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
        sortable: true,
        sort: (a, b, rowA, rowB) => {
          const dateA = new Date(rowA.deadline)
          const dateB = new Date(rowB.deadline)
          return dateA - dateB
        }
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
        sortable: true,
        sort: (a, b, rowA, rowB) => {
          const dateA = new Date(rowA.deadline)
          const dateB = new Date(rowB.deadline)
          return dateA - dateB
        }
      },
      {
        name: 'executor',
        label: 'Исполнитель',
        align: 'left',
        field: row => row.executor
          ? row.executor.firstname + ' ' + row.executor.lastname
          : '',
        sortable: true
      }
      // {
      //   name: 'sla',
      //   label: 'SLA',
      //   align: 'left',
      //   field: row => {
      //     if (!row.sla || !row.sla.startDate || !row.sla.duration) {
      //       return '0 ч. 0 м.'
      //     }
      //     const endDateTime = moment(row.sla.startDate).clone().add(moment.duration(row.sla.duration))
      //     const now = moment()
      //     const duration = moment.duration(endDateTime.diff(now))
      //     if (duration.asMilliseconds() < 0) {
      //       return '0 ч. 0 м.'
      //     } else {
      //       return `${duration.days() * 24 + duration.hours()} ч. ${duration.minutes()} м.`
      //     }
      //   },
      //   sortable: true
      // }
    ],
    selectedTasks: [],
    dragging: true
  }),

  methods: {
    shortenLine (string) {
      if (string.length > 31) {
        return string.substring(0, 31) + '...'
      } else {
        return string
      }
    },

    parseStrToDate (str) {
      return moment(str, 'DD.MM.YYYY, HH:mm')
    },

    addMessageToTask (event) {
      this.$emit('addMessageToTask', event)
    }
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    filterTableColumns () {
      return this.activeColumns
        .map(activeCol => {
          const col = this.tableColumns.find(tableCol => tableCol.name === activeCol.name && activeCol.active !== false)
          if (col) {
            return { ...col, label: activeCol.label }
          }
          return null
        })
        .filter(col => col !== null)
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style lang="scss" scoped>

.flex-container {
  display: flex;
  width: 100%;
  flex-wrap: nowrap;
  overflow: auto;
}

.my-sticky-header-table {
  height: calc(100vh - 80px);

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    background-color: var(--q-primary);
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  thead tr:first-child th {
    top: 0;
  }

  &.q-table--loading thead tr:last-child th {
    top: 48px;
  }

  tbody {
    scroll-margin-top: 48px;
  }
}
</style>
