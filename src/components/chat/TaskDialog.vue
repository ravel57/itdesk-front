<template>
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
                  :options="this.store.priorities.map(priority => priority.name)"
                  label="Приоритет *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <q-select
                  v-model="dialogTaskExecutor"
                  :options="this.store.users.filter(user => ['ADMIN', 'OPERATOR'].includes(user.authorities[0])).map(user => this.getUserName(user))"
                  label="Исполнитель"
                  use-input
                />
                <q-select
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
                        />
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
                        />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
                <q-select
                  v-model="this.dialogTaskStatus"
                  :options="this.store.statuses.map(s => s.name)"
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
          @click="this.setTaskCompleted(this.task)"
        />
        <q-btn
          v-if="this.dialogTaskComplete"
          label="Вернуть в работу"
          color="white"
          text-color="primary"
          @click="this.setTaskNotCompleted(this.task)"
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
import moment from 'moment/moment'
import axios from 'axios'
import { useStore } from 'stores/store'

export default {
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

    taskId: null // for update
  }),
  // created () {
  //   this.getTaskField()
  // },
  mounted () {
    this.getTaskField()
  },
  methods: {
    closeDialog () {
      this.$emit('closeDialog')
    },
    getTaskField () {
      if (!this.isNewTask) {
        console.log(this.task)
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
      } else if (this.isNewTask) {
        this.dialogTaskName = ''
        this.dialogTaskDescription = ''
        this.dialogTaskPriority = this.store.priorities.find(priority => priority.defaultSelection === true).name
        this.dialogTaskExecutor = ''
        this.dialogTaskTags = []
        this.dialogTaskDeadline = ''
        this.dialogTaskStatus = this.store.statuses.find(status => status.defaultSelection === true).name
        // setTimeout(() => this.$refs.taskName.focus(), 500)
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
        isCompleted: false,
        createdAt: this.isNewTask ? new Date() : this.taskCreatedAt,
        deadline: this.dialogTaskDeadline ? moment(this.dialogTaskDeadline, 'DD.MM.YYYY HH:mm').format() : null,
        linkedMessageId: this.linkedMessageId,
        sla: this.isNewTask ? null : this.task.sla
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
    getUserName (user) {
      if (user) {
        return user.lastname + ' ' + user.firstname
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
