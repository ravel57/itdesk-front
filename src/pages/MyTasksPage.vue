<template>
  <tasks-component
    :isShowTableMode="this.isShowTableMode"
    :isMobile="this.isMobile"
    :tableRows="this.getTableRows"
    :tableColumns="this.tableColumns"
    :isFilterSelected="this.isFilterSelected"
    :groupedTasks="this.getGroupedTasks"
    :isNewTaskDialogShow="this.isNewTaskDialogShow"
    :isTaskDialogShow="this.isTaskDialogShow"
    :selectedTask="this.selectedTask"
    :selectedGroupType="this.selectedGroupType"
    @onTaskClicked="this.onTaskClicked"
    @closeDialog="this.closeDialog"
  />
</template>

<script>
import TasksComponent from 'components/tasks/TasksComponent.vue'
import moment from 'moment'
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'

export default {

  name: 'MyTasks',

  components: { TasksComponent },

  data: () => ({
    isShowTableMode: false,
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    isFilterSelected: false,
    selectedTask: {},
    selectedGroupType: { label: 'Исполнитель', slug: 'executor' },
    tableColumns: [
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
    isMobile () {
      return this.$q.screen.width < 1023
    },

    closeDialog () {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.delete('task')
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
    },

    onTaskClicked (task) {
      this.isTaskDialogShow = true
      this.selectedTask = task
      this.updateUrlWithTask(task.id)
    }
  },

  computed: {
    getTableRows () {
      try {
        return this.getFilteredTasks
      } catch (e) {
        return []
      }
    },

    getFilteredTasks () {
      return this.store.getTasks.filter(task => task.executor.id === this.store.currentUser.id)
        .filter(task => {
          let matchesSearchRequest = true
          if (this.searchRequest) {
            matchesSearchRequest = task.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.id.toString().toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.priority.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              // task.createdAt.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.status.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              (task.executor.firstname + ' ' + task.executor.lastname).toLowerCase().includes(this.searchRequest.toLowerCase())
          }
          return (!task.completed || this.isShowCompletedTasks) && matchesSearchRequest
        })
    },

    getGroupedTasks () {
      const source = this.executors
      const tasks = this.getFilteredTasks
      const groupedCards = []
      const options = Object.groupBy(tasks, ({ executor }) => {
        if (executor) {
          return executor.firstname + ' ' + executor.lastname
        } else {
          return ''
        }
      })
      source.forEach(el => {
        groupedCards.push({
          title: options[el] ? `${el} (${options[el].length})` : el,
          taskCards: options[el]
        })
      })
      return groupedCards
    },

    executors () {
      return this.store.users.filter(user => user !== null)
        .filter(user => user.roles !== 'OBSERVER')
        .map(user => user.firstname + ' ' + user.lastname)
    }
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
  }

}
</script>

<style scoped>
.board {
  white-space: nowrap;
}

.list {
  display: inline-block;
  vertical-align: top;
  width: 300px;
  margin-right: 20px;
}

.list-header {
  background-color: #f1f1f1;
  padding: 10px;
  font-weight: bold;
}

.list-cards {
  padding: 10px;
}

.card {
  background-color: #fff;
  border: 1px solid #ccc;
  margin-bottom: 10px;
  padding: 10px;
  width: 300px;
  display: inline-block;
  text-decoration: none;
  color: black;
}

.sticky-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}

.scroll-container {
  display: flex;
  overflow-x: auto;
  overflow-y: auto;
  width: 100%;
}

.scrollable-flex-container {
  margin-top: 8px;
  overscroll-behavior-x: auto;
  display: flex;
  width: 100%;
  flex-wrap: nowrap;
  height: 50%;
  overflow: auto;
}

</style>
