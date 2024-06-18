<template>
  <q-card
    id="taskColumn"
    style="height: calc(100vh - 75px); padding: 16px;"
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
        <q-input
          v-if="showSearch"
          v-model="search"
          label="Поиск"
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
                      <th class="small-text text-grey" v-text="'Приоритет: '"/>
                      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="task.priority.name"/>
                    </tr>
                    <tr>
                      <th class="small-text text-grey" v-text="'Создана: '"/>
                      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="this.getStamp(task.createdAt)"/>
                    </tr>
                    <tr v-if="!task.completed">
                      <th class="small-text text-grey" v-text="'Статус: '"/>
                      <th class="text-body2" v-text="task.status.name"/>
                    </tr>
                    <tr>
                      <th class="small-text text-grey" v-text="'Дедлайн: '"/>
                      <th class="text-body2" v-text="this.getStamp(task.deadline)"/>
                    </tr>
                    <tr>
                      <th class="small-text text-grey" v-text="'Исполнитель: '"/>
                      <th :class="{'text-body2': true, 'text-grey': task.completed}" v-text="getName(task.executor)"/>
                    </tr>
                    <tr v-if="task.sla && task.sla.duration > 0 && !task.completed">
                      <th class="small-text text-grey" v-text="'SLA: '"/>
                      <th class="text-body2"
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

  <q-dialog
    v-model="getPossibilityToOpenDialogTask"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card
      :class="this.isMobile ? 'dialog-width' : 'large-dialog-width'"
    >
      <q-toolbar
        class="justify-end"
      >
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="this.closeDialog"
          v-close-popup
        />
      </q-toolbar>
      <q-card-section
        style="padding: 0 16px"
      >
        <div
          v-if="this.isMobile"
          class="sticky-tabs"
        >
          <q-tabs
            v-model="dialogTab"
            dense
            align="justify"
            class="bg-white text-grey no-padding"
            :breakpoint="0"
          >
            <q-tab
              name="tab1"
              icon="info"
            />
            <q-tab
              name="tab2"
              icon="forum"
            />
          </q-tabs>
        </div>
        <div
          :class="this.isMobile ? '' : 'flex-container'"
        >
          <div
            v-if="(!this.isMobile || this.dialogTab === 'tab1')"
            class="flex-item"
          >
            <q-card
              class="no-border-card"
            >
              <q-card-section
                class="no-padding"
              >
                <q-input
                  v-model="this.dialogTaskName"
                  ref="taskName"
                  label="Название *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <q-input
                  type="textarea"
                  v-model="this.dialogTaskDescription"
                  label="Описание"
                />
                <q-select
                  v-model="this.dialogTaskPriority"
                  :options="this.priorities.map(priority => priority.name)"
                  label="Приоритет *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <q-select
                  v-model="dialogTaskExecutor"
                  :options="this.users.map(user => this.getUserName(user))"
                  label="Исполнитель"
                  use-input
                />
                <q-select
                  v-model="this.dialogTaskTags"
                  :options="this.tags.map(t => t.name)"
                  multiple
                  label="Теги"
                  use-chips
                  use-input
                  dense
                  style="padding-top: 16px"
                />
                <q-input
                  v-model="dialogTaskDeadline"
                  clearable
                  label="Дедлайн"
                >
                  <template
                    v-slot:prepend
                  >
                    <q-icon
                      name="event"
                      class="cursor-pointer"
                    >
                      <q-popup-proxy
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-date
                          v-model="dialogTaskDeadline"
                          mask="DD.MM.YYYY HH:mm"
                        >
                          <div
                            class="row items-center justify-end"
                          >
                            <q-btn
                              v-close-popup
                              @click="this.closeDialog"
                              label="Закрыть"
                              color="primary"
                              flat
                            />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                  <template
                    v-slot:append
                  >
                    <q-icon
                      name="access_time"
                      class="cursor-pointer"
                    >
                      <q-popup-proxy
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-time
                          v-model="dialogTaskDeadline"
                          mask="DD.MM.YYYY HH:mm"
                          format24h
                        >
                          <div
                            class="row items-center justify-end"
                          >
                            <q-btn
                              v-close-popup
                              @click="this.closeDialog"
                              label="Закрыть"
                              color="primary"
                              flat
                            />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-select
                  v-model="this.dialogTaskStatus"
                  :options="this.statuses.map(s => s.name)"
                  label="Статус *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
              </q-card-section>
            </q-card>
          </div>
          <div
            class="flex-item"
            v-if="(!this.isMobile || this.dialogTab === 'tab2')"
            :style="this.isMobile ? 'height: 541px' : ''"
          >
            <q-card
              class="no-border-card"
            >
              <q-card-section
                class="no-padding"
              >
                <div>Здесь находится содержимое чата заявки</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
      >
        <q-btn
          v-if="!this.isNewTask && !this.dialogTaskComplete"
          label="Закрыть заявку"
          color="white"
          text-color="primary"
          @click="this.setTaskCompleted(this.getActualTasks.find(task => task.id === this.dialogTaskId))"
        />
        <q-btn
          v-if="this.dialogTaskComplete"
          label="Вернуть в работу"
          color="white"
          text-color="primary"
          @click="this.setTaskNotCompleted(this.getActualTasks.find(task => task.id === this.dialogTaskId))"
        />
        <q-btn
          color="white"
          text-color="primary"
          label="Закрыть"
          @click="this.closeDialog"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="this.saveNewOrUpdateTask"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import ChatInfo from 'components/chat/ChatClientInfo.vue'

export default {
  name: 'ChatTasks',
  components: { ChatInfo },

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
      this.dialogTaskName = ''
      this.dialogTaskDescription = ''
      this.dialogTaskPriority = this.priorities.find(priority => priority.defaultSelection === true).name
      this.dialogTaskExecutor = ''
      this.dialogTaskTags = []
      this.dialogTaskDeadline = ''
      this.dialogTaskStatus = this.statuses.find(status => status.defaultSelection === true).name
      setTimeout(() => this.$refs.taskName.focus(), 500)
    },

    saveNewOrUpdateTask () {
      if (!this.dialogTaskName || !this.dialogTaskPriority || !this.dialogTaskStatus) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      const queryParams = new URLSearchParams(window.location.search)
      const messageId = queryParams.get('newTaskFromMessage')
      if (!this.linkedMessageId) {
        this.linkedMessageId = messageId
      }
      const tags = []
      this.dialogTaskTags.forEach(tagName => tags.push(this.tags.find(tag => tag.name === tagName)))
      const task = {
        id: this.isNewTask ? null : this.taskId,
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        status: this.statuses.find(status => status.name === this.dialogTaskStatus),
        priority: this.priorities.find(priority => priority.name === this.dialogTaskPriority),
        executor: this.users.find(user => this.getUserName(user) === this.dialogTaskExecutor),
        tags,
        isCompleted: false,
        createdAt: this.isNewTask ? new Date() : this.taskCreatedAt,
        deadline: new Date(moment(this.dialogTaskDeadline, 'DD.MM.YYYY HH:mm').format()),
        linkedMessageId: this.linkedMessageId,
        sla: this.isNewTask ? null : this.tasks.find(task => task.id === this.taskId).sla
      }
      if (this.isNewTask) {
        axios.post(`/api/v1/client/${this.client.id}/task`, task)
          .then(task => {
            this.closeDialog()
            this.$emit('newTask', task)
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
      } else {
        axios.patch(`/api/v1/client/${this.client.id}/task`, task)
          .then(newTask => {
            this.closeDialog()
            this.$emit('updateTask', task, newTask.data)
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
      }
      this.taskId = null
    },

    onTaskClick (task) {
      if (!this.isNewTaskDialogShow) {
        this.isNewTask = false
        this.isNewTaskDialogShow = true
        this.dialogTaskId = task.id
        this.dialogTaskName = task.name
        this.dialogTaskDescription = task.description
        this.dialogTaskPriority = task.priority.name
        this.dialogTaskExecutor = this.getUserName(task.executor)
        this.dialogTaskTags = task.tags.map(tag => tag.name)
        this.dialogTaskDeadline = task.deadline ? moment(task.deadline, 'DD.MM.YYYY HH:mm') : ''
        this.taskId = task.id
        this.dialogTaskStatus = task.status.name
        this.taskCreatedAt = task.createdAt
        this.dialogTaskComplete = task.completed
        this.linkedMessageId = task.linkedMessageId
        this.updateUrlWithTask(this.dialogTaskId)
        setTimeout(() => this.$refs.taskName.focus(), 100)
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

    getUserName (user) {
      if (user) {
        return user.lastname + ' ' + user.firstname
      } else {
        return ''
      }
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
    setTaskNotCompleted (task) {
      task.completed = false
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
        filteredTasks.sort((a, b) => {
          switch (this.selectedSorting.slug) {
            case 'deadline':
              return new Date(a.deadline) - new Date(b.deadline)
            case 'creating':
              return new Date(a.createdAt) - new Date(b.createdAt)
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
    if (this.isMobile) {
      document.getElementById('taskColumn').style.height = 'calc(-110px + 100vh);'
    }
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
