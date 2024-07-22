<template>
  <div
    v-if="this.isShowTableMode"
    style="overflow: auto"
  >
    <div style="position: relative">
      <q-btn
        style="
          font-size: 8px;
          position: absolute;
          right: 20px;
          z-index: 25;
          top: 15px;"
        size="xs"
        dense
        icon="edit"
        @click="this.isShowTableSettings = true"
      >
        <q-tooltip>Настроить таблицу</q-tooltip>
      </q-btn>
      <q-table
        :rows="this.tableRows"
        :columns="this.filterTableColumns"
        :rows-per-page-options="[10, 20, 50, 0]"
        :sortable="true"
        row-key="id"
        bordered
        style="margin-top: 8px"
        selection="multiple"
        v-model:selected="this.selectedTasks"
        :selected-rows-label="(numberOfRows) => `Строк: ${ numberOfRows } выбрано`"
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
  <q-dialog v-model="this.isShowTableSettings" persistent>
    <q-card style="width: 500px">
      <q-card-section class="row items-center q-pb-none text-h6">
        Настройка колонок таблицы
      </q-card-section>
      <q-card-section class="row items-center">
        <draggable
          :list="this.activeColumns"
          item-key="id"
          class="list-group"
          ghost-class="ghost"
          style="width: 100%"
          @start="dragging = true"
          @end="dragging = false"
        >
          <template #item="{ element }">
            <q-item
              class="list-group-item"
              :class="{ 'not-draggable': true }"
              style="cursor: grab;"
            >
              <q-item-section
                top
                style="justify-content: center"
              >
                {{ element.label }}
              </q-item-section>
              <q-item-section
                top
                side
              >
                <q-btn
                  :text-color="element.active ? 'primary' : 'grey'"
                  dense
                  flat
                  icon="check_box"
                  @click="element.active = !element.active"
                >
                  <q-tooltip>
                    {{ element.active ? 'Скрыть колонку' : 'Отобразить колонку' }}
                  </q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import CardTasksView from 'components/tasks/CardTasksView.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import moment from 'moment'
import draggable from 'vuedraggable'

export default {

  components: { draggable, TaskDialog, CardTasksView },

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
    isShowTableSettings: false,
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
    ],
    activeColumns: [
      { name: 'id', label: 'ID', active: true },
      { name: 'name', label: 'Название', active: true },
      { name: 'tags', label: 'Теги', active: true },
      { name: 'priority', label: 'Приоритет', active: true },
      { name: 'createdAt', label: 'Создана', active: true },
      { name: 'status', label: 'Статус', active: true },
      { name: 'deadline', label: 'Дедлайн', active: true },
      { name: 'executor', label: 'Исполнитель', active: true },
      { name: 'sla', label: 'SLA', active: true }
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
    }
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    taskCardStyle () {
      return {
        'padding-top': '8px',
        height: this.isMobile ? `calc(77vh - ${this.filterContainerHeight}px ${this.filterContainerHeight !== 0 ? '- 5px' : ''})` : `calc(92vh - ${this.filterContainerHeight}px ${this.filterContainerHeight !== 0 ? '- 5px' : ''})`
      }
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

  watch: {
    activeColumns: {
      deep: true,
      handler () {
        localStorage.setItem('taskTableSettings', JSON.stringify(this.activeColumns))
      }
    }
  },

  created () {
    if (localStorage.getItem('taskTableSettings')) {
      this.activeColumns = JSON.parse(localStorage.getItem('taskTableSettings'))
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
