<template>
  <q-card
    style="height: calc(100vh - 225px); padding: 16px;"
  >
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
              @click="goToTask(task.id)"
              style="width: 100%;"
            >
              {{ task.name }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>
    <q-separator/>
    <q-layout
      view="lHh Lpr lFf"
      container
      style="height: 65vh"
      class="shadow-2 rounded-borders"
    >
      <q-page-container>
        <q-page>
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
                        label="Отметить выполненной"
                        class="text-grey"
                        flat
                        @click="this.setTaskCompletedShowDialog(task)"
                      />
                      <q-btn
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
                          <th class="text-body2" v-text="this.getStamp(task)"/>
                        </tr>
                        <tr v-if="!task.completed">
                          <th class="small-text text-grey" v-text="'Статус: '"/>
                          <th class="text-body2" v-text="task.status.name"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Деадлайн: '"/>
                          <th class="text-body2" v-text="this.getStamp(task)"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Исполнитель: '"/>
                          <th class="text-body2" v-text="getName(task.executor)"/>
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
          label="Статус *"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
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
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
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

  props: ['tasks', 'tags', 'users', 'client', 'statuses', 'priorities'],

  data: () => ({
    isNewTaskDialogShow: false,
    isCompleteTaskDialogShow: false,
    showTooltipClosedTasks: false,

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

    taskToComplete: null,

    showSearch: false,
    search: '',
    searchResults: [],
    sortMenuOpened: false,
    sortingTypes: [
      { label: 'По дедлайну', slug: 'deadline' },
      { label: 'По дате создания', slug: 'creating' },
      { label: 'Приоритету', slug: 'priority' },
      { label: 'SLA', slug: 'sla' }
    ]
  }),

  methods: {
    dialogNewTask () {
      this.isNewTask = true
      this.isNewTaskDialogShow = true
      this.dialogTaskName = ''
      this.dialogTaskDescription = ''
      this.dialogTaskPriority = this.priorities.find(priority => priority.defaultSelection === true).name
      this.dialogTaskExecutor = ''
      this.dialogTaskTags = []
      this.dialogTaskDeadline = ''
      this.dialogTaskDeadlineCheckbox = false
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
        createdAt: new Date(),
        deadline: this.dialogTaskDeadlineCheckbox ? this.dialogTaskDeadline : null
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
      this.isNewTask = false
      this.isNewTaskDialogShow = true
      this.dialogTaskName = task.name
      this.dialogTaskDescription = task.description
      this.dialogTaskPriority = task.priority.name
      this.dialogTaskExecutor = this.getUserName(task.executor)
      this.dialogTaskTags = task.tags.map(tag => tag.name)
      this.dialogTaskDeadline = task.deadline
      this.dialogTaskDeadlineCheckbox = task.deadline != null
      this.taskId = task.id
      this.dialogTaskStatus = task.status.name
      setTimeout(() => this.$refs.taskName.focus(), 250)
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
      if (user) {
        return user.firstname + ' ' + user.lastname
      } else {
        return ''
      }
    },

    getStamp (task) {
      if (task.createdAt) {
        return task.createdAt.toLocaleTimeString('ru-RU', {
          timeZone: 'Europe/Moscow',
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
        this.searchResults = this.tasks.filter(task => {
          if (task.name) {
            return task.name.toLowerCase().includes(this.search.toLowerCase())
          } else {
            return false
          }
        })
      } else {
        this.searchResults = []
      }
    },

    goToTask (taskId) {
      this.scrollToElementById(`task_${taskId}`)
    }
  },

  computed: {
    getActualTasks () {
      return this.tasks.filter(task => !task.completed || this.isShowCompletedTasks)
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
