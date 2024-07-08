<template>
  <q-card
    id="taskColumn"
    style="padding: 16px;"
    :style="this.isMobile ? 'height: calc(100vh - 110px)' : 'height: calc(100vh - 75px);'"
  >
    <div style="margin-bottom: 3px">
      <chat-info
        style="z-index: 1"
        :client="this.client"
        :organizations="this.organizations"
        @updateClient="this.updateClient"
      />
    </div>
    <q-separator/>
    <div class="flex">
      <div>
        <div class="flex">
          <span
            class="text-h6"
            style="margin-top: 3px"
            v-text="`Список заявок (всего: ${this.getActualTasks.length})`"
          />
          <div class="container q-pa-none q-gutter-md q-position-relative">
            <q-toggle
              v-model="isShowCompletedTasks"
              icon="add_task"
              color="primary"
              class="element q-position-absolute q-right-0"
              @mouseover="showTooltipClosedTasks = true"
              @mouseup="showTooltipClosedTasks = false"
            >
              <q-tooltip v-if="showTooltipClosedTasks">Показывать закрытые заявки</q-tooltip>
            </q-toggle>
          </div>
        </div>
        <q-btn
          class="text-grey-7 cursor-pointer"
          @click="this.dialogNewTask"
          label="Создать заявку"
          style="margin-right: 8px;"
        />
        <q-btn
          @click="toggleSearch"
          :class="showSearch ? 'text-dark' : 'text-grey-7'"
          icon="search"
          style="margin-right: 8px;"
        />
        <q-btn
          icon="sort"
          class="text-grey-7"
          style="margin-right: 8px;"
        >
          <q-tooltip>
            <div v-if="this.selectedSorting.label">
              Сортировка: {{ this.selectedSorting.label }}
            </div>
            <div v-else>
              Сортировка
            </div>
          </q-tooltip>
          <q-menu
            v-model="this.sortMenuOpened"
            content-class="menu-content"
          >
            <q-list>
              <q-item
                v-for="sorting in this.sortingTypes"
                :key="sorting.slug"
                clickable
                v-close-popup
                @click="this.setSortVariable(sorting)"
              >
                <q-item-section>
                  {{ sorting.label }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn
          v-if="this.selectedSorting.label"
          @click="this.changeSortingAsc"
          class="text-grey-7"
          :icon="this.ascendingSort ? 'arrow_upward' : 'arrow_downward'"/>
        <q-input
          v-if="showSearch"
          v-model="search"
          label="Поиск по заявкам"
          style="margin-top: 8px"
          outlined
          dense
          clearable
        >
          <template v-slot:append>
            <q-icon name="search"/>
          </template>
        </q-input>
        <q-list
          v-if="this.searchResults.length > 0"
        >
          <q-item
            v-for="task in searchResults"
            :key="task.id"
            clickable
          >
            <q-item-section
              @click="this.onTaskClick(task)"
              style="width: 100%;"
            >
              {{ task.name }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
    <q-separator style="margin-bottom: 8px; margin-top: 8px"/>
    <div style="overflow: auto; height: calc(-300px + 97vh)">
      <div class="row justify-center">
        <div style="width: 100%;">
          <q-card-section style="padding: 0">
            <q-card class="my-card">
              <q-card-section
                v-for="task in this.getActualTasks"
                :key="task.id"
                :id="`task_${task.id}`"
                style="padding: 0"
                class="shadow-2"
              >
                <div class="flex">
                  <q-btn
                    v-if="!task.completed"
                    icon="check_circle"
                    label="Закрыть заявку"
                    class="text-grey"
                    flat
                    @click="this.setTaskCompleted(task)"
                  />
                  <q-btn
                    v-if="task.linkedMessageId"
                    icon="link"
                    class="text-grey"
                    flat
                    dense
                    @click="scrollToElementById(task)"
                  />
                </div>
                <q-item
                  clickable
                  @click="this.onTaskClick(task)"
                >
                  <task-card
                    :task="task"
                    :selectedSorting="this.selectedSorting"
                    :descriptionRequire="true"
                    :slaRequire="true"
                    :taskNameShort="31"
                  />
                </q-item>
                <q-separator/>
              </q-card-section>
            </q-card>
          </q-card-section>
        </div>
      </div>
    </div>
  </q-card>
  <task-dialog
    v-if="getPossibilityToOpenDialogTask"
    :client="this.client"
    :isMobile="this.isMobile"
    :task="this.selectedTask"
    :isNewTaskDialogShow="this.isNewTaskDialogShow"
    :isTaskDialogShow="this.isTaskDialogShow"
    :isNewTask="this.isNewTask"
    @closeDialog="this.closeDialog"
    @addMessageToTask="this.addMessageToTask($event)"
    @updateTask="updateTask($event)"
  />
</template>

<script>
import axios from 'axios'
import ChatInfo from 'components/chat/ChatClientInfo.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import TaskCard from 'components/TaskCard.vue'

export default {
  name: 'ChatTasks',
  components: { TaskCard, TaskDialog, ChatInfo },

  props: ['tasks', 'tags', 'users', 'client', 'statuses', 'priorities', 'organizations', 'isMobile'],

  data: () => ({
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    showTooltipClosedTasks: false,

    dialogTaskId: '',
    dialogTaskName: '',
    dialogTaskDescription: '',
    dialogTaskPriority: '',
    dialogTaskExecutor: '',
    dialogTaskTags: [],
    dialogTaskStatus: '',
    dialogTaskDeadline: '',
    dialogTaskComplete: false,
    linkedMessageId: '',

    taskCreatedAt: '',
    selectedTask: {},

    isShowCompletedTasks: false,
    isNewTask: true,
    isNewLinkedTask: false,
    taskId: null, // for update

    showSearch: false,
    search: '',
    searchResults: [],
    isShowSearchResults: false,
    sortMenuOpened: false,
    dialogTab: 'tab1',
    selectedSorting: [],
    ascendingSort: true,

    sortingTypes: [
      { label: 'По дедлайну', slug: 'deadline' },
      { label: 'По дате создания', slug: 'creating' },
      { label: 'Приоритету', slug: 'priority' },
      { label: 'SLA', slug: 'sla' },
      { label: 'По статусу', slug: 'status' }
    ],
    slaIsPause: false
  }),

  methods: {
    updateClient (newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },

    dialogNewTask () {
      this.isNewTask = true
      this.isTaskDialogShow = true
      // setTimeout(() => this.$refs.taskName.focus(), 500)
    },

    onTaskClick (task) {
      if (!this.isNewTaskDialogShow) {
        this.selectedTask = task
        this.isNewTask = false
        this.isNewTaskDialogShow = true
        this.updateUrlWithTask(task.id)
      }
    },

    updateTask (task, newTask) {
      this.getClient.tasks[this.getClient.tasks.indexOf(task)] = newTask.data
    },

    setTaskCompleted (task) {
      task.completed = true
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.closeDialog()
          this.$emit('updateTask', task, newTask)
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
      this.$q.notify({
        message: 'Заяка закрыта',
        type: 'positive',
        position: 'top-right',
        actions: [{
          icon: 'close', color: 'white', dense: true, handler: () => undefined
        }]
      })
    },

    getStamp (date) {
      if (date) {
        return date.toLocaleTimeString('ru-RU', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } else {
        return ''
      }
    },

    scrollToElementById (task) {
      this.$emit('scrollToElementById', task.linkedMessageId)
    },

    toggleSearch () {
      this.showSearch = !this.showSearch
    },

    onSearch () {
      if (this.search) {
        this.actualTasks = this.getActualTasks.filter(task => {
          return task.name.includes(this.search)
        })
      }
    },

    goToTask (taskId) {
      this.scrollToElementById(`task_${taskId}`)
    },

    updateUrlWithTask (openedTaskId) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.set('task', openedTaskId)
      this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
    },

    initializeTaskFromUrl () {
      const queryParams = new URLSearchParams(window.location.search)
      const taskIdFromUrl = queryParams.get('task')
      const messageId = queryParams.get('newTaskFromMessage')
      if (messageId && !taskIdFromUrl && !this.isTaskDialogShow) {
        this.isNewLinkedTask = true
        this.dialogNewTask()
      } else if (!messageId && this.isNewTask && this.isNewLinkedTask) {
        this.isNewLinkedTask = false
        this.isTaskDialogShow = false
      }
      if (taskIdFromUrl) {
        const taskFromUrl = this.getActualTasks.find(task => task.id === Number(taskIdFromUrl))
        this.onTaskClick(taskFromUrl)
      } else {
        this.isNewTaskDialogShow = false
      }
    },

    closeDialog () {
      const queryParams = new URLSearchParams(window.location.search)
      if (queryParams.get('newTaskFromMessage')) {
        queryParams.delete('newTaskFromMessage')
        this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      }
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
    },

    setSortVariable (sort) {
      this.selectedSorting = sort
    },

    changeSortingAsc () {
      this.ascendingSort = !this.ascendingSort
    },

    addMessageToTask (event) {
      this.tasks.find(task => task.id === event.task.id).messages.push(event.message)
    }
  },

  computed: {
    getActualTasks () {
      const filteredTasks = this.tasks.filter(task => {
        const showCompleted = !task.completed || this.isShowCompletedTasks
        const matchSearch = !this.search || task.name.toLowerCase().includes(this.search.toLowerCase())
        return showCompleted && matchSearch
      })
      if (this.selectedSorting.slug) {
        if (this.ascendingSort) {
          filteredTasks.sort((a, b) => {
            switch (this.selectedSorting.slug) {
              case 'deadline':
                return new Date(a.deadline) - new Date(b.deadline)
              case 'creating':
                return new Date(a.createdAt) - new Date(b.createdAt)
              case 'priority':
                return b.priority.orderNumber - a.priority.orderNumber
              case 'sla':
                if (a.sla && b.sla) {
                  return b.sla.startDate.clone().add(b.sla.duration) - a.sla.startDate.clone().add(a.sla.duration)
                } else {
                  return b
                }
              case 'status':
                return b.status.orderNumber - a.status.orderNumber
              default:
                return 0
            }
          })
        } else {
          filteredTasks.sort((a, b) => {
            switch (this.selectedSorting.slug) {
              case 'deadline':
                return new Date(b.deadline) - new Date(a.deadline)
              case 'creating':
                return new Date(b.createdAt) - new Date(a.createdAt)
              case 'priority':
                return a.priority.orderNumber - b.priority.orderNumber
              case 'sla':
                if (a.sla && b.sla) {
                  return a.sla.startDate.clone().add(a.sla.duration) - b.sla.startDate.clone().add(b.sla.duration)
                } else {
                  return b
                }
              case 'status':
                return a.status.orderNumber - b.status.orderNumber
              default:
                return 0
            }
          })
        }
      }
      return filteredTasks
    },

    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    isSearchNotEmpty () {
      return this.searchResults.length > 0
    }
  },

  watch: {
    search (newVal) {
      this.onSearch(newVal)
    },

    isNewTaskDialogShow (newVal) {
      if (this.isNewTaskDialogShow === false) {
        const queryParams = new URLSearchParams(window.location.search)
        queryParams.delete('task')
        this.$router.push({ path: this.$route.path, query: Object.fromEntries(queryParams.entries()) })
      }
    }
  },

  mounted () {
    setInterval(() => this.initializeTaskFromUrl(), 500)
  }

}
</script>

<style scoped>
.small-text {
  font-size: 0.9em;
}

th {
  text-align: left;
}

.flex-container {
  display: flex;
  justify-content: space-between;
}

.flex-item {
  flex: 0 0 48%;
}

.no-border-card {
  border: none;
  box-shadow: none;
}
</style>
