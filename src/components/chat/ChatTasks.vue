<template>
  <q-card
    style="height: calc(100vh - 175px); padding: 16px;"
  >
    <div class="flex">
      <div>
        <div class="text-h6">Список заявок</div>
        <div
          class="text-grey-7 cursor-pointer"
          @click="this.onNewTaskCreate"
          v-text="'Создать новую заявку'"
        />
      </div>
      <div class="container q-pa-none q-gutter-md q-position-relative">
        <q-toggle
          v-model="this.isNotificationEnabled"
          icon="notifications_active"
          color="primary"
          class="element q-position-absolute q-right-0"
        />
        <q-toggle
          v-model="isShowCompletedTasks"
          icon="add_task"
          color="primary"
          class="element q-position-absolute q-right-0"
        />
      </div>
    </div>
    <q-separator/>
    <q-layout view="lHh Lpr lFf" container style="height: 65vh" class="shadow-2 rounded-borders">
      <q-page-container>
        <q-page>
          <div class="row justify-center">
            <div style="width: 100%;">
              <q-card-section style="padding: 0">
                <q-card class="my-card">
                  <q-card-section
                    v-for="(task, index) in this.getActualTasks"
                    :key="index"
                    style="padding: 0"
                  >
                    <q-btn
                      v-if="!task.completed"
                      icon="check_circle"
                      label="Отметить выполненной"
                      class="text-grey"
                      flat
                      @click="this.setTaskCompletedShowDialog(task)"
                    />
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
                          <th class="text-body2" v-text="task.priority"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Создана: '"/>
                          <th class="text-body2" v-text="this.getStamp(task)"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Статус: '"/>
                          <th class="text-body2" v-text="task.status.name"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Деадлайн: '"/>
                          <th class="text-body2" v-text="this.getStamp(task)"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Исполнитель: '"/>
                          <th class="text-body2" v-text="task.executor.firstname + ' ' + task.executor.lastname"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'SLA: '"/>
                          <th class="text-body2" v-text="task.sla"/>
                        </tr>
                      </table>
                    </q-item>
                    <q-separator/>
                  </q-card-section>
                </q-card>
              </q-card-section>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-card>
  <q-dialog
    v-model="this.isNewTaskDialogShow"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card style="width: 50vw;">
      <q-card-section>
        <q-input
          v-model="dialogTaskName"
          label="Название"
        />
        <q-input
          type="textarea"
          v-model="dialogTaskDescription"
          label="Описание"
        />
        <q-input
          v-model="dialogTaskPriority"
          label="Приоритет"
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
        />
        <div class="flex">
          <q-checkbox
            v-model="dialogTaskDeadlineCheckbox"
          />
          <q-input
            v-model="dialogTaskDeadline"
            label="Дедлайн"
            type="date"
          />
        </div>
        <q-select
          v-model="this.dialogTaskStatus"
          :options="this.statuses.map(s => s.name)"
          label="Статус"
        />
      </q-card-section>
      <q-card-actions align="right">
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
  <q-dialog
    v-model="this.isCompleteTaskDialogShow"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card>
      <q-card-section>
        Закрыть заявку {{ this.taskToComplete.name }}?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="primary"
          label="Отмена"
          @click="this.isCompleteTaskDialogShow = false"
        />
        <q-btn
          color="primary"
          label="Закрыть"
          @click="setTaskCompleted"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ChatTasks',

  props: ['tasks', 'tags', 'users', 'client', 'statuses'],

  data: () => ({
    isNotificationEnabled: true,
    isNewTaskDialogShow: false,
    isCompleteTaskDialogShow: false,

    dialogTaskName: '',
    dialogTaskDescription: '',
    dialogTaskPriority: '',
    dialogTaskExecutor: '',
    dialogTaskTags: [],
    dialogTaskDeadline: '',
    dialogTaskDeadlineCheckbox: false,
    dialogTaskStatus: '',

    isShowCompletedTasks: false,

    isNewTask: true,
    taskId: null, // for update

    taskToComplete: null
  }),

  methods: {
    onNewTaskCreate () {
      this.isNewTaskDialogShow = true
      this.dialogTaskDescription = ''
      this.dialogTaskPriority = ''
      this.dialogTaskExecutor = ''
      this.dialogTaskTags = []
      this.dialogTaskDeadline = ''
      this.dialogTaskDeadlineCheckbox = false
      this.dialogTaskStatus = ''
      this.isNewTask = true
    },

    saveNewOrUpdateTask () {
      const tags = []
      this.dialogTaskTags.forEach(tagName => tags.push(this.tags.find(tag => tag.name === tagName)))
      const task = {
        id: this.isNewTask ? null : this.taskId,
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        status: { id: 1, name: 'new' },
        priority: this.dialogTaskPriority,
        executor: this.users.find(user => this.getUserName(user) === this.dialogTaskExecutor),
        tags,
        isCompleted: false,
        createdAt: new Date(),
        deadline: /* this.dialogTaskDeadlineCheckbox ? this.dialogTaskDeadline : */ null
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
      this.taskId = null
    },

    onTaskClick (task) {
      this.isNewTaskDialogShow = true
      this.dialogTaskName = task.name
      this.dialogTaskDescription = task.description
      this.dialogTaskPriority = task.priority
      this.dialogTaskExecutor = this.getUserName(task.executor)
      this.dialogTaskTags = task.tags
      this.dialogTaskDeadline = task.deadline
      this.dialogTaskDeadlineCheckbox = task.deadline != null
      this.taskId = task.id
      this.isNewTask = false
      this.dialogTaskStatus = task.status
    },

    setTaskCompleted () {
      this.taskToComplete.completed = true
      axios.post(`/api/v1/client/${this.client.id}/update-task`, this.taskToComplete)
        .then(newTask => {
          this.isNewTaskDialogShow = false
          this.$emit('updateTask', this.taskToComplete, newTask)
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
      this.taskToComplete = null
      this.isCompleteTaskDialogShow = false
    },

    setTaskCompletedShowDialog (task) {
      this.taskToComplete = task
      this.isCompleteTaskDialogShow = true
    },

    getUserName (user) {
      return user.firstname + ' ' + user.lastname
    },

    getStamp (task) {
      return task.createdAt.toLocaleTimeString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },

  computed: {
    getActualTasks () {
      return this.tasks.filter(task => !task.completed || this.isShowCompletedTasks)
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
