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
              Перейти в чат с {{ this.getClientName }}
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="this.openSubmitModal"
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
                <div
                  id="task-controls"
                  class="flex"
                  style="display: flex;flex-wrap: nowrap;align-items: center;max-height: 40px"
                >
                  <q-select
                    id="task-status"
                    dense
                    outlined
                    v-model="this.dialogTaskStatus"
                    :options="this.isNewTask ? this.store.statuses.filter(s => s.name !== 'Закрыта' && s.name !== 'Заморожена').map(s => s.name) : this.store.statuses.map(s => s.name)"
                    label="Статус *"
                    :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                    style="width: 100%;padding: 0;"
                    :style="this.getBackgroundColor(this.dialogTaskStatus)"
                  />
                  <q-btn
                    v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
                    dense
                    outline
                    no-caps
                    label="Закрыть заявку"
                    color="white"
                    text-color="primary"
                    style="font-size: 14px;height: 40px;width: 100%; margin-left: 8px"
                    @click="this.setTaskCompleted(this.task)"
                  />
                  <q-btn
                    v-if="this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
                    dense
                    outline
                    no-caps
                    label="Вернуть в работу"
                    color="white"
                    text-color="primary"
                    style="font-size: 14px;height: 40px;width: 100%;margin-left: 8px;"
                    @click="this.setTaskNotCompleted(this.task)"
                  />
                  <div id="unfreeze-task-btn">
                    <q-btn
                      v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && this.task.frozen"
                      dense
                      outline
                      icon="ac_unit"
                      text-color="primary"
                      style="margin-left: 8px;position: relative;height: 40px;width: 40px"
                      @click="this.changeTaskFrozen()"
                    >
                      <q-tooltip>Заморожено до {{ this.getStamp(new Date(this.task.frozenUntil)) }}</q-tooltip>
                      <q-circular-progress
                        v-if="this.task.frozen"
                        :value="this.getPercentFrozenTask(this.task.frozenFrom, this.task.frozenUntil)"
                        reverse
                        size="32px"
                        style="
                      position: absolute;
                      font-size: 32px;
                      margin: 0;
                    "
                        :thickness="0.22"
                        color="primary"
                        track-color="grey-3"
                      />
                    </q-btn>
                  </div>
                  <div id="freeze-task-btn">
                    <q-btn
                      v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && !this.task.frozen"
                      dense
                      outline
                      icon="ac_unit"
                      style="height: 40px;width: 40px;margin-left: 8px"
                      text-color="gray"
                      @click="this.freezeDialog = true"
                    >
                      <q-tooltip>Заморозить заявку</q-tooltip>
                    </q-btn>
                  </div>
                </div>
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
                        ref="qDateDeadlinePopup"
                        cover
                        transition-show="scale"
                        transition-hide="scale"
                      >
                        <q-date
                          v-model="this.dialogTaskDeadline"
                          first-day-of-week="1"
                          locale="ru"
                          today-btn
                          @update:model-value="this.$refs.qDateDeadlinePopup.hide()"
                          :options="this.dateOption"
                          mask="DD.MM.YYYY HH:mm"
                        />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
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
          @click="this.openSubmitModal"
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
                    ref="qDateFreezePopup"
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date
                      v-model="this.dialogTaskFreezeUntil"
                      first-day-of-week="1"
                      locale="ru"
                      today-btn
                      :options="this.dateOption"
                      mask="DD.MM.YYYY HH:mm"
                      @update:model-value="this.$refs.qDateFreezePopup.hide()"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup/>
          <div id="freeze-save-btn">
            <q-btn @click="changeTaskFrozen" label="Заморозить" color="primary" v-close-popup/>
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
  <q-dialog
    v-model="this.isSubmitModal"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          Сохранить {{ this.isNewTask ? 'заявку?' : 'изменение в заявке №' + this.task.id + '?' }}
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />
      </q-toolbar>
      <q-card-section>
        {{ this.isNewTask ? 'Закрыть не сохраняя заявку?' : 'Соохранить изменения в заявке №' + this.task.id + '?' }}
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn
          outline
          color="primary"
          v-close-popup
        >
          Отмена
        </q-btn>
        <q-btn
          outline
          color="primary"
          v-close-popup
          @click="this.closeDialog"
        >
          Не сохранять
        </q-btn>
        <q-btn
          color="primary"
          v-close-popup
          @click="this.saveNewOrUpdateTask"
        >
          Сохранить
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import moment from 'moment/moment'
import axios from 'axios'
import { useStore } from 'stores/store'
import ChatDialog from 'components/chat/ChatDialog.vue'
import { useRoute } from 'vue-router'

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
    dialogTaskFreezeUntil: '',

    taskOnCreateProcess: false,

    isSubmitModal: false
  }),

  methods: {

    dateOption (date) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return date >= `${year}/${month}/${day}`
    },

    openSubmitModal () {
      const dialogTaskDeadline = this.dialogTaskDeadline ? this.dialogTaskDeadline : ''
      const taskDeadline = this.task.deadline ? moment(this.task.deadline, 'DD.MM.YYYY HH:mm').format('DD.MM.YYYY HH:mm') : ''
      if (this.isNewTask) {
        if (!this.dialogTaskName) {
          this.closeDialog()
        } else {
          this.isSubmitModal = true
        }
      } else if (
        this.dialogTaskName !== this.task.name || this.dialogTaskDescription !== this.task.description ||
        this.dialogTaskPriority !== this.task.priority.name ||
        this.dialogTaskExecutor !== this.getUserName(this.task.executor) ||
        JSON.stringify(this.dialogTaskTags) !== JSON.stringify(this.task.tags.map(tag => tag.name)) ||
        // this.dialogTaskTags !== this.task.tags.map(tag => tag.name) ||
        dialogTaskDeadline !== taskDeadline ||
        this.dialogTaskStatus !== this.task.status.name ||
        this.dialogTaskComplete !== this.task.completed
      ) {
        this.isSubmitModal = true
      } else {
        this.closeDialog()
      }
    },

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
        previusStatus: this.isNewTask ? this.store.statuses.find(status => status.name === this.dialogTaskStatus) : this.task.previusStatus,
        messages: this.isNewTask ? (this.getLinkedMessage ? this.getLinkedMessage : null) : this.task.messages
      }

      if (task.status.name === 'Закрыта') {
        task.completed = true
      }
      if (this.isNewTask) {
        if (this.taskOnCreateProcess) {
          return
        }
        this.taskOnCreateProcess = true
        axios.post(`/api/v1/client/${this.client.id}/task`, task)
          .then(task => {
            this.closeDialog()
            this.$emit('newTask', task)
            this.taskOnCreateProcess = false
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
    },

    getBackgroundColor (statusLabel) {
      const status = this.store.statuses.find(status => status.name === statusLabel)
      switch (status.name) {
        case 'Закрыта': {
          return 'background-color: rgba(16, 181, 92, 0.2);'
        }
        case 'Заморожена': {
          return 'background-color: #32ade633;'
        }
        default: {
          return `background-color: ${this.generateStatusColor(status.orderNumber)};`
        }
      }
    },

    generateStatusColor (index) {
      const adjustedIndex = Math.abs(index)

      function generateHSLAColor (hue) {
        return `hsla(${hue}, 70%, 50%, 0.2)`
      }

      function isGreenOrBlue (hue) {
        return (hue >= 120 && hue <= 240)
      }

      let hue = (adjustedIndex * 30) % 360
      while (isGreenOrBlue(hue)) {
        hue = (hue + 60) % 360
      }

      return generateHSLAColor(hue)
    }
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    getClientName () {
      return this.task.client.lastname + ' ' + this.task.client.firstname
    },

    getLinkedMessage () {
      const queryParams = new URLSearchParams(window.location.search)
      let message = null
      if (queryParams.get('newTaskFromMessage')) {
        const messageId = queryParams.get('newTaskFromMessage')
        const clientId = Number(this.router.params.clientId)
        const client = this.store.clients.find(client => client.id === clientId)
        message = [
          {
            id: null,
            text: client.messages.find(message => message.id === Number(messageId)).text,
            date: moment(new Date(), 'DD.MM.YYYY HH:mm'),
            client: null
          }
        ]
      }
      return message
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
    const router = useRoute()
    return { store, router }
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
