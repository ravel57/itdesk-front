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
          >
            Список заявок
          </span>
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
          label="Создать новую заявку"
        />
        <q-btn
          @click="toggleSearch"
          class="text-grey-7"
          icon="search"
        />
        <q-btn
          icon="sort"
          class="text-grey-7"
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
          label="Поиск"
          style="margin-top: 5px"
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
    <q-separator style="margin-bottom: 3px; margin-top: 3px"/>
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
                  <table>
                    <tr v-if="task.completed">
                      <th class="small-text text-grey" v-text="'ЗАЯВКА ЗАКРЫТА'" colspan="2"/>
                    </tr>
                    <tr>
                      <th class="small-text text-grey" v-text="'Название: '"/>
                      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="task.name"></th>
                    </tr>
                    <tr>
                      <th class="small-text text-grey" v-text="'Описание: '"/>
                      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="task.description"/>
                    </tr>
                    <tr>
                      <th class="small-text text-grey" v-text="'Теги: '"/>
                      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="task.tags.map(tag => tag.name).join(', ')"/>
                    </tr>
                    <tr>
                      <th
                        class="small-text"
                        :style="this.selectedSorting.slug === 'priority' ? 'color: black;font-weight: 600;': 'color:gray'"
                        v-text="'Приоритет: '"
                      />
                      <th
                        :class="{'text-body2': true, 'text-grey': task.completed}"
                        :style="this.selectedSorting.slug === 'priority' ? 'font-weight: 600;': ''"
                        v-text="task.priority.name"/>
                    </tr>
                    <tr>
                      <th
                        class="small-text"
                        :style="this.selectedSorting.slug === 'creating' ? 'color: black;font-weight: 600;': 'color:gray'"
                        v-text="'Создана: '"
                      />
                      <th
                        :class="{'text-body2': true, 'text-grey': task.completed}"
                        :style="this.selectedSorting.slug === 'creating' ? 'font-weight: 600;': ''"
                        v-text="this.getStamp(task.createdAt)"/>
                    </tr>
                    <tr v-if="!task.completed">
                      <th
                        class="small-text"
                        :style="this.selectedSorting.slug === 'status' ? 'color: black;font-weight: 600;': 'color:gray'"
                        v-text="'Статус: '"
                      />
                      <th
                        class="text-body2"
                        :style="this.selectedSorting.slug === 'status' ? 'font-weight: 600;': ''"
                        v-text="task.status.name"/>
                    </tr>
                    <tr>
                      <th
                        class="small-text"
                        :style="this.selectedSorting.slug === 'deadline' ? 'color: black;': 'color:gray'"
                        v-text="'Дедлайн: '"
                      />
                      <th
                        class="text-body2"
                        :style="`
                          color: ${task.deadline < Date.now() ? 'red' : 'black'};
                          ${selectedSorting.slug === 'deadline' ? 'font-weight: 600;' : ''}
                        `"
                        v-text="this.getStamp(task.deadline)"
                      />
                    </tr>
                    <tr>
                      <th class="small-text text-grey" v-text="'Исполнитель: '"/>
                      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="getName(task.executor)"/>
                    </tr>
                    <tr v-if="task.sla && task.sla.duration > 0 && !task.completed">
                      <th
                        class="small-text"
                        :style="this.selectedSorting.slug === 'sla' ? 'color: black;font-weight: 600;': 'color:gray'"
                        v-text="'SLA: '"
                      />
                      <th class="text-body2"
                          :style="this.selectedSorting.slug === 'sla' ? 'font-weight: 600;': ''"
                          style="display: flex; flex-direction: row; flex-wrap: wrap; align-items: center">
                        Осталось: {{ this.getSlaTime(task) }}
                        <q-linear-progress
                          stripe
                          rounded
                          :value="this.getSlaPercent(task)"
                          reverse
                          :color="this.getSlaColor(task)"
                          style="width: 80px; margin-left: 16px; margin-right: 5px; border: solid 1px darkgray"
                          size="12px"
                        />
                        <q-btn
                          v-if="!this.slaIsPause"
                          dense
                          flat
                          color="grey"
                          @click.stop="this.slaIsPause = !this.slaIsPause"
                          icon="pause_circle"
                        />
                        <q-btn
                          v-if="this.slaIsPause"
                          dense
                          flat
                          color="grey"
                          @click.stop="this.slaIsPause = !this.slaIsPause"
                          icon="play_circle"
                        />
                      </th>
                    </tr>
                  </table>
                </q-item>
                <q-separator/>
              </q-card-section>
            </q-card>
          </q-card-section>
        </div>
      </div>
    </div>
  </q-card>
  <TaskDialog
    v-if="getPossibilityToOpenDialogTask"
    :client="this.client"
    :isMobile="this.isMobile"
    :task="this.selectedTask"
    :isNewTaskDialogShow="this.isNewTaskDialogShow"
    :isTaskDialogShow="this.isTaskDialogShow"
    :isNewTask="this.isNewTask"
    @closeDialog="this.closeDialog"
  />
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import ChatInfo from 'components/chat/ChatClientInfo.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'

export default {
  name: 'ChatTasks',
  components: { TaskDialog, ChatInfo },

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

    getName (executor) {
      if (executor) {
        return executor.lastname + ' ' + executor.firstname
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

    getSlaHours (task) {
      const endDateTime = task.sla.startDate.clone().add(task.sla.duration)
      const now = moment()
      const duration = moment.duration(endDateTime.diff(now))
      return duration.days() * 24 + duration.hours() + duration.minutes() * 0.017
    },

    getSlaTime (task) {
      const endDateTime = task.sla.startDate.clone().add(task.sla.duration)
      const now = moment()
      const duration = moment.duration(endDateTime.diff(now))
      if (duration.asMilliseconds() < 0) {
        return '0 ч. 0 м.'
      } else {
        return `${duration.days() * 24 + duration.hours()} ч. ${duration.minutes()} м.`
      }
    },

    getSlaPercent (task) {
      return this.getSlaHours(task) / (task.sla.duration.days() * 24 + task.sla.duration.hours())
    },

    getSlaColor (task) {
      if (this.getSlaPercent(task) > 0.5) {
        return 'green'
      } else if (this.getSlaPercent(task) > 0.25) {
        return 'orange'
      } else {
        return 'red'
      }
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
                return b.sla.startDate.clone().add(b.sla.duration) - a.sla.startDate.clone().add(a.sla.duration)
              case 'status':
                return b.status.orderNumber - a.status.orderNumber
              default:
                return 0
            }
          })
        } else if (!this.ascendingSort) {
          filteredTasks.sort((a, b) => {
            switch (this.selectedSorting.slug) {
              case 'deadline':
                return new Date(b.deadline) - new Date(a.deadline)
              case 'creating':
                return new Date(b.createdAt) - new Date(a.createdAt)
              case 'priority':
                return a.priority.orderNumber - b.priority.orderNumber
              case 'sla':
                return a.sla.startDate.clone().add(a.sla.duration) - b.sla.startDate.clone().add(b.sla.duration)
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
