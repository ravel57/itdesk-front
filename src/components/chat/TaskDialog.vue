<template>
  <q-dialog
    v-model="getPossibilityToOpenDialogTask"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card
      :class="this.isMobile || !['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) || this.isNewTask ? 'dialog-width' : 'large-dialog-width'"
    >
      <q-toolbar class="justify-between">
        <!--FIXME-->
        <div v-if="this.isNewTask" class="text-h6">Новая заявка</div>
        <div v-else class="text-h6">Заявка № {{ this.task.id }}</div>
        <div class="">
          <q-btn
            v-if="!(this.$route.path.includes('chats'))"
            flat
            round
            dense
            icon="open_in_new"
            @click="this.$router.push({ path: `/chats/${this.client.id}` })"
          >
            <q-tooltip>
              Перейти в чат
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="this.closeDialog"
            v-close-popup
          />
        </div>
      </q-toolbar>
      <q-card-section
        style="padding: 0 16px"
      >
        <div
          v-if="this.isMobile && !this.isNewTask"
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
          :class="this.isMobile || this.isNewTask ? '' : 'flex-container'"
        >
          <div
            v-if="(!this.isMobile || this.dialogTab === 'tab1')"
            class="flex-item"
            style="max-height: 100%"
          >
            <q-card
              class="no-border-card"
            >
              <q-card-section
                class="no-padding"
              >
                <q-input
                  id="task-name"
                  v-model="this.dialogTaskName"
                  ref="taskName"
                  label="Название *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <q-input
                  id="task-description"
                  type="textarea"
                  v-model="this.dialogTaskDescription"
                  label="Описание"
                />
                <q-select
                  id="task-priority"
                  v-model="this.dialogTaskPriority"
                  :options="this.store.priorities.map(priority => priority.name)"
                  label="Приоритет *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <q-select
                  id="task-executor"
                  v-model="dialogTaskExecutor"
                  :options="this.store.users.filter(user => ['ADMIN', 'OPERATOR'].includes(user.authorities[0])).map(user => this.getUserName(user))"
                  label="Исполнитель"
                  use-input
                />
                <q-select
                  id="task-tags"
                  v-model="this.dialogTaskTags"
                  :options="this.store.tags.map(t => t.name)"
                  multiple
                  label="Теги"
                  use-chips
                  use-input
                  dense
                  style="padding-top: 16px"
                />
                <q-input
                  id="task-deadline"
                  v-model="this.dialogTaskDeadline"
                  clearable
                  label="Дедлайн"
                >
                  <template
                    v-slot:append
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
                          v-model="this.dialogTaskDeadline"
                          mask="DD.MM.YYYY HH:mm"
                        />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <div
                  id="task-controls"
                  class="flex"
                  style="height: 56px; flex-wrap: nowrap;margin-top: 8px;"
                >
                  <q-select
                    id="task-status"
                    v-model="this.dialogTaskStatus"
                    :options="this.isNewTask ? this.store.statuses.filter(s => s.name !== 'Закрыта' && s.name !== 'Заморожена').map(s => s.name) : this.store.statuses.map(s => s.name)"
                    label="Статус *"
                    :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                    style="width: 100%; margin-right: 8px"
                  />
                  <q-btn
                    v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
                    label="Закрыть заявку"
                    color="white"
                    text-color="primary"
                    style="font-size: 13px"
                    @click="this.setTaskCompleted(this.task)"
                  />
                  <q-btn
                    v-if="this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
                    label="Вернуть в работу"
                    color="white"
                    text-color="primary"
                    @click="this.setTaskNotCompleted(this.task)"
                  />
                  <div id="unfreeze-task-btn">
                    <q-btn
                      v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && this.task.frozen"
                      icon="ac_unit"
                      text-color="primary"
                      style="margin-left: 8px;position: relative;height: 100%"
                      @click="this.changeTaskFrozen()"
                    >
                      <q-tooltip>Заморожено до {{ this.getStamp(new Date(this.task.frozenUntil)) }}</q-tooltip>
                      <q-circular-progress
                        v-if="this.task.frozen"
                        :value="this.getPercentFrozenTask(this.task.frozenFrom, this.task.frozenUntil)"
                        reverse
                        size="40px"
                        style="
                      position: absolute;
                      font-size: 40px;
                      margin: 0;
                    "
                        :thickness="0.22"
                        color="primary"
                        track-color="grey-3"
                      />
                    </q-btn>
                  </div>
                  <div id="freeze-task-btn" style="margin-left: 8px">
                    <q-btn
                      v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && !this.task.frozen"
                      icon="ac_unit"
                      style="height: 100%;"
                      text-color="gray"
                      @click="this.freezeDialog = true"
                    >
                      <q-tooltip>Заморозить заявку</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div
            v-if="(!this.isMobile || this.dialogTab === 'tab2') && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && !this.isNewTask"
            id="chat-section"
            class="flex-item"
            style="border: 1px solid #0000001f;overflow: hidden;border-radius: 16px"
            :style="this.isMobile ? 'height: 541px' : ''"
          >
            <chat-dialog
              :is-mobile="this.isMobile"
              :messages="this.task.messages"
              :input-field="this.inputField"
              :templates="this.store.templates"
              :isSending="this.isSending"
              :current-user="this.store.currentUser"
              :linkedMessageId="this.linkedMessageId"
              :client-id="this.client.id"
              :client="this.client"
              :is-show-helper="true"
              :taskWatchingNow="[]"
              :typing="[]"
              :isDialog="true"
              :comments="false"
              @sendMessage="this.sendMessage"
              @isSending="this.isSending = true"
              @keyPressed="this.keyPressed"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        style="margin-right: 7px;margin-bottom: 8px;margin-top: 8px"
      >
        <q-btn
          color="white"
          text-color="primary"
          label="Закрыть"
          @click="this.closeDialog"
        />
        <q-btn
          id="save-task"
          color="primary"
          label="Сохранить"
          @click="this.saveNewOrUpdateTask"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog persistent v-model="this.freezeDialog">
    <div id="task-freeze-modal">
      <q-card>
        <q-card-section>
          <div class="text-h6">Заморозка заявки</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div id="freeze-time-input">
            <q-input
              v-model="this.dialogTaskFreezeUntil"
              clearable
              label="Заморозить до"
            >
              <template
                v-slot:append
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
                      v-model="this.dialogTaskFreezeUntil"
                      mask="DD.MM.YYYY HH:mm"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup />
          <div id="freeze-save-btn">
            <q-btn @click="changeTaskFrozen" label="Заморозить" color="primary" v-close-popup />
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script>
import moment from 'moment/moment'
import axios from 'axios'
import { useStore } from 'stores/store'
import ChatDialog from 'components/chat/ChatDialog.vue'

export default {

  components: { ChatDialog },

  props: [
    'isMobile',
    'task',
    'isNewTaskDialogShow',
    'isTaskDialogShow',
    'isNewTask',
    'client'
  ],

  data: () => ({
    dialogTab: 'tab1',

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

    taskId: null, // for update
    inputField: '',
    isSending: false,
    freezeDialog: false,
    dialogTaskFreezeUntil: ''
  }),

  methods: {
    closeDialog () {
      this.$emit('closeDialog')
    },

    getTaskField () {
      if (this.isNewTask) {
        this.dialogTaskName = ''
        this.dialogTaskDescription = ''
        this.dialogTaskPriority = this.store.priorities.find(priority => priority.defaultSelection === true).name
        this.dialogTaskExecutor = ''
        this.dialogTaskTags = []
        this.dialogTaskDeadline = ''
        this.dialogTaskStatus = this.store.statuses.find(status => status.defaultSelection === true).name
        setTimeout(() => this.$refs.taskName.focus(), 300)
      } else {
        this.dialogTaskId = this.task.id
        this.dialogTaskName = this.task.name
        this.dialogTaskDescription = this.task.description
        this.dialogTaskPriority = this.task.priority.name
        this.dialogTaskExecutor = this.getUserName(this.task.executor)
        this.dialogTaskTags = this.task.tags.map(tag => tag.name)
        this.dialogTaskDeadline = this.task.deadline ? moment(this.task.deadline, 'DD.MM.YYYY HH:mm').format('DD.MM.YYYY HH:mm') : ''
        this.taskId = this.task.id
        this.dialogTaskStatus = this.task.status.name
        this.taskCreatedAt = this.task.createdAt
        this.dialogTaskComplete = this.task.completed
        this.linkedMessageId = this.task.linkedMessageId
      }
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
      this.dialogTaskTags.forEach(tagName => tags.push(this.store.tags.find(tag => tag.name === tagName)))
      const task = {
        id: this.isNewTask ? null : this.taskId,
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        status: this.store.statuses.find(status => status.name === this.dialogTaskStatus),
        priority: this.store.priorities.find(priority => priority.name === this.dialogTaskPriority),
        executor: this.store.users.find(user => this.getUserName(user) === this.dialogTaskExecutor),
        tags,
        completed: false,
        createdAt: this.isNewTask ? new Date() : this.taskCreatedAt,
        deadline: this.dialogTaskDeadline ? moment(this.dialogTaskDeadline, 'DD.MM.YYYY HH:mm').format() : null,
        linkedMessageId: this.linkedMessageId,
        sla: this.isNewTask ? null : this.task.sla,
        previusStatus: this.isNewTask ? this.store.statuses.find(status => status.name === this.dialogTaskStatus) : this.task.previusStatus
      }

      if (task.status.name === 'Закрыта') {
        task.completed = true
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

    setTaskCompleted (task) {
      task.completed = true
      task = Object.keys(task).filter(objKey => objKey !== 'client').reduce((newObj, client) => {
        newObj[client] = task[client]
        return newObj
      }, {})
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

    setTaskNotCompleted (task) {
      task.completed = false
      task = Object.keys(task).filter(objKey => objKey !== 'client').reduce((newObj, client) => {
        newObj[client] = task[client]
        return newObj
      }, {})
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

    changeTaskFrozen () {
      const tags = []
      this.dialogTaskTags.forEach(tagName => tags.push(this.store.tags.find(tag => tag.name === tagName)))
      if (!this.task.frozen) {
        if (this.dialogTaskFreezeUntil.length === 0) {
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
      }
      const task = {
        id: this.isNewTask ? null : this.taskId,
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        status: this.store.statuses.find(status => status.name === this.dialogTaskStatus),
        priority: this.store.priorities.find(priority => priority.name === this.dialogTaskPriority),
        executor: this.store.users.find(user => this.getUserName(user) === this.dialogTaskExecutor),
        tags,
        completed: false,
        createdAt: this.isNewTask ? new Date() : this.taskCreatedAt,
        deadline: this.dialogTaskDeadline ? moment(this.dialogTaskDeadline, 'DD.MM.YYYY HH:mm').format() : null,
        linkedMessageId: this.linkedMessageId,
        sla: this.isNewTask ? null : this.task.sla,
        frozen: !this.task.frozen,
        frozenFrom: this.task.frozen ? null : new Date(),
        frozenUntil: this.task.frozen ? null : moment(this.dialogTaskFreezeUntil, 'DD.MM.YYYY HH:mm').format(),
        previusStatus: this.task.previusStatus
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.closeDialog()
          this.$emit('updateTask', task, newTask.data)
          this.$q.notify({
            message: task.frozen ? 'Заявка заморожена' : 'Заявка разморожена',
            type: 'positive',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
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
        return user.lastname + ' ' + user.firstname
      } else {
        return ''
      }
    },

    sendMessage (event) {
      if (event.attachedFile) {
        const data = new FormData()
        data.append('file', event.attachedFile)
        axios.post('/files/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then(response => {
            event.message.fileUuid = response.data
            event.message.fileName = event.attachedFile.name
            event.message.fileType = event.attachedFile.type
            this.sendTextMessage(event)
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
        this.sendTextMessage(event)
      }
    },

    sendTextMessage (event) {
      axios.post(`/api/v1/client/${event.clientId}/task/${this.task.id}/message`, event.message)
        .then(() => {
          this.inputField = ''
          this.isSending = false
          this.$emit('addMessageToTask', { task: this.task, message: event.message, client: this.client })
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

    keyPressed (text) {
      this.inputField = text
    },

    getPercentFrozenTask (date, endDate) {
      const startDate = new Date(date).getTime()
      const targetDate = new Date(endDate).getTime()
      const now = new Date().getTime()
      const totalInterval = targetDate - startDate
      const timeRemaining = now - startDate
      return (1 - (timeRemaining / totalInterval)) * 100
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
    }
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    }
  },

  watch: {
    dialogTaskStatus: {
      deep: true,
      handler (oldVal, newVal) {
        if (oldVal !== '' && newVal !== '') {
          if (this.dialogTaskStatus === 'Заморожена') {
            this.freezeDialog = true
          }
        }
      }
    }
  },

  mounted () {
    this.getTaskField()
  },

  setup () {
    const store = useStore()
    return { store }
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
