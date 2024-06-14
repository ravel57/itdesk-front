<template>
  <q-card
    style="height: calc(100vh - 75px); max-height: calc(100vh - 75px); padding: 16px;"
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
              >
                <q-item-section>{{ sorting.label }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-input
          v-if="showSearch"
          filled
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
    <q-separator style="margin-bottom: 3px; margin-top: 3px" />
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
                        <th class="text-body2" v-text="task.name"/>
                      </tr>
                      <tr>
                        <th class="small-text text-grey" v-text="'Описание: '"/>
                        <th class="text-body2" v-text="task.description"/>
                      </tr>
                      <tr>
                        <th class="small-text text-grey" v-text="'Теги: '"/>
                        <th class="text-body2" v-text="task.tags.map(tag => tag.name).join(', ')"/>
                      </tr>
                      <tr>
                        <th class="small-text text-grey" v-text="'Приоритет: '"/>
                        <th class="text-body2" v-text="task.priority.name"/>
                      </tr>
                      <tr>
                        <th class="small-text text-grey" v-text="'Создана: '"/>
                        <th class="text-body2" v-text="this.getStamp(task.createdAt)"/>
                      </tr>
                      <tr v-if="!task.completed">
                        <th class="small-text text-grey" v-text="'Статус: '"/>
                        <th class="text-body2" v-text="task.status.name"/>
                      </tr>
                      <tr>
                        <th class="small-text text-grey" v-text="'Деадлайн: '"/>
                        <th class="text-body2" v-text="this.getStamp(task.deadline)"/>
                      </tr>
                      <tr>
                        <th class="small-text text-grey" v-text="'Исполнитель: '"/>
                        <th class="text-body2" v-text="getName(task.executor)"/>
                      </tr>
                      <tr v-if="task.sla && task.sla.duration > 0">
                        <th class="small-text text-grey" v-text="'SLA: '"/>
                        <th class="text-body2" style="display: flex; flex-direction: row; flex-wrap: wrap; align-items: center">
                          Осталось: {{ this.getSlaTime(task) }}
                          <q-linear-progress
                            :value="this.getSlaPercent(task)"
                            reverse
                            :color="this.getSlaColor(task)"
                            style="width: 80px; margin-left: 16px; margin-right: 5px; border: solid 1px darkgray"
                            size="8px"
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
    v-model="this.isNewTaskDialogShow"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
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
      <q-card-actions align="right">
        <q-btn
          v-if="!this.dialogTaskComplete"
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
          @click="this.isNewTaskDialogShow = false"
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

  props: ['tasks', 'tags', 'users', 'client', 'statuses', 'priorities', 'organizations'],

  data: () => ({
    isNewTaskDialogShow: false,
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

    taskCreatedAt: '',

    isShowCompletedTasks: false,
    isNewTask: true,
    taskId: null, // for update

    showSearch: false,
    search: '',
    searchResults: [],
    isShowSearchResults: false,
    sortMenuOpened: false,

    sortingTypes: [
      { label: 'По дедлайну', slug: 'deadline' },
      { label: 'По дате создания', slug: 'creating' },
      { label: 'Приоритету', slug: 'priority' },
      { label: 'SLA', slug: 'sla' }
    ],
    slaIsPause: false
  }),

  methods: {
    updateClient (newClient) {
      this.store.clients[this.store.clients.indexOf(this.getClient)] = newClient
    },

    dialogNewTask () {
      this.isNewTask = true
      this.isNewTaskDialogShow = true
      this.dialogTaskName = ''
      this.dialogTaskDescription = ''
      this.dialogTaskPriority = this.priorities.find(priority => priority.defaultSelection === true).name
      this.dialogTaskExecutor = ''
      this.dialogTaskTags = []
      this.dialogTaskDeadline = ''
      this.dialogTaskStatus = this.statuses.find(status => status.defaultSelection === true).name
      setTimeout(() => this.$refs.taskName.focus(), 250)
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
        sla: this.isNewTask ? null : this.tasks.find(task => task.id === this.taskId).sla
      }
      if (this.isNewTask) {
        axios.post(`/api/v1/client/${this.client.id}/new-task`, task)
          .then(task => {
            this.isNewTaskDialogShow = false
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
        axios.post(`/api/v1/client/${this.client.id}/update-task`, task)
          .then(newTask => {
            this.isNewTaskDialogShow = false
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
      setTimeout(() => this.$refs.taskName.focus(), 250)
    },

    setTaskCompleted (task) {
      task.completed = true
      axios.post(`/api/v1/client/${this.client.id}/update-task`, task)
        .then(newTask => {
          this.isNewTaskDialogShow = false
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

    getUserName (user) {
      if (user) {
        return user.firstname + ' ' + user.lastname
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
        return executor.firstname + ' ' + executor.lastname
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
        this.isShowSearchResults = true
        this.searchResults = this.tasks.filter(task => {
          if (task.name) {
            return task.name.toLowerCase().includes(this.search.toLowerCase())
          } else {
            return false
          }
        })
      } else {
        this.isShowSearchResults = false
        this.searchResults = []
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
      return `${duration.days() * 24 + duration.hours()} ч. ${duration.minutes()} м.`
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
      axios.post(`/api/v1/client/${this.client.id}/update-task`, task)
        .then(newTask => {
          this.isNewTaskDialogShow = false
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
    }
  },

  computed: {
    getActualTasks () {
      return this.tasks.filter(task => !task.completed || this.isShowCompletedTasks)
    },
    isSearchNotEmpty () {
      return this.searchResults.length > 0
    }
  },

  watch: {
    search (newVal) {
      this.onSearch(newVal)
    }
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
</style>
