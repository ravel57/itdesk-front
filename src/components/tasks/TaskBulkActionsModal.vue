<template>
  <q-card style="min-width: 440px;min-height: 150px; position: relative">
    <q-card-section style="display: flex; flex-direction: row; justify-content: space-between">
      <div class="text-h5">{{ this.getHeader }}</div>
      <q-btn
        flat
        round
        dense
        icon="close"
        v-close-popup
      />
    </q-card-section>
    <q-card-section style="margin-bottom: 44px" class="q-pt-none">
<!--      <div v-if="this.action === 'close'">-->
<!--        Закрыть заявки ({{ this.store.checkedTasks.length }})?-->
<!--      </div>-->
<!--      <div v-if="this.action === 'open'">-->
<!--        Открыть заявки ({{ this.store.checkedTasks.length }})?-->
<!--      </div>-->
      <q-input
        v-if="this.action === 'freeze'"
        v-model="this.tasksFreezeUntil"
        clearable
        label="Заморозить до"
        @input="formatDateTime"
        mask="##.##.#### ##:##"
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
                v-model="this.tasksFreezeUntil"
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
      <q-select
        v-if="this.action === 'executor'"
        v-model="this.tasksExecutor"
        :options="this.store.users.filter(user => ['ADMIN', 'OPERATOR'].includes(user.authorities[0])).map(user => this.getUserName(user))"
        label="Исполнитель"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        use-input
      />
      <q-select
        v-if="this.action === 'status'"
        v-model="this.tasksStatus"
        :options="this.store.statuses.map(s => s.name)"
        label="Статус"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        style="width: 100%;"
      />
      <q-select
        v-if="this.action === 'priority'"
        v-model="this.tasksPriority"
        :options="this.store.priorities.map(priority => priority.name)"
        style="width: 100%;"
        label="Приоритет"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
      />
      <q-select
        v-if="this.action === 'tags'"
        v-model="this.tasksTags"
        :options="this.store.tags.map(t => t.name)"
        multiple
        label="Теги"
        use-chips
        use-input
        dense
        style="padding-top: 16px"
      />
      <q-input
        v-if="this.action === 'deadline'"
        v-model="this.tasksDeadline"
        clearable
        label="Дедлайн"
        @input="formatDateTime"
        mask="##.##.#### ##:##"
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
                v-model="this.tasksDeadline"
                first-day-of-week="1"
                locale="ru"
                today-btn
                :options="this.dateOption"
                mask="DD.MM.YYYY HH:mm"
                @update:model-value="this.$refs.qDateDeadlinePopup.hide()"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
      <div class="text-h7" style="padding-top: 20px">
        {{ this.getDeclension(this.store.checkedTasks.length) }}
      </div>
    </q-card-section>
    <q-card-actions style="position: absolute;bottom: 0;width: 100%" align="right">
      <q-btn flat label="Отменить" text-color="primary" v-close-popup />
      <q-btn label="Применить" color="primary" v-close-popup @click="this.doAction()"/>
    </q-card-actions>
  </q-card>
  <q-dialog persistent v-model="this.freezeDialog">
    <div id="task-freeze-modal">
      <q-card>
        <q-card-section>
          <div class="text-h6">Заморозка заявки</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div id="freeze-time-input">
            <q-input
              v-model="this.taskFreezeUntil"
              clearable
              label="Заморозить до"
              @input="formatDateTime"
              mask="##.##.#### ##:##"
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
                      v-model="this.taskFreezeUntil"
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
          <q-btn flat label="Закрыть" color="primary" v-close-popup />
          <div id="freeze-save-btn">
            <q-btn label="Применить" color="primary" v-close-popup />
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'
import moment from 'moment'

export default {
  name: 'TaskBulkActionsModal',
  props: {
    action: { type: String, required: true }
  },
  data: () => ({
    tasksPriority: '',
    tasksFreezeUntil: '',
    tasksExecutor: '',
    tasksStatus: '',
    tasksTags: [],
    tasksDeadline: '',
    taskFreezeUntil: '',
    freezeDialog: false
  }),

  methods: {

    dateOption (date) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return date >= `${year}/${month}/${day}`
    },

    getUserName (user) {
      if (user) {
        return user.lastname + ' ' + user.firstname
      } else {
        return ''
      }
    },

    doAction () {
      // const isShowCompletedTasks = localStorage.getItem('isShowCompletedTasks') !== 'false'
      this.store.checkedTasks.forEach(task => {
        if (this.action !== 'close' && this.action !== 'open') {
          if (this.tasksFreezeUntil.length === 0 && this.tasksExecutor.length === 0 &&
            this.tasksStatus.length === 0 && this.tasksPriority.length === 0 && this.tasksTags.length === 0 &&
          this.tasksDeadline.length === 0) {
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
        if (this.action === 'close') {
          task.completed = true
        } else if (this.action === 'open') {
          task.completed = false
        } else if (this.action === 'freeze') {
          task.frozen = true
          task.frozenFrom = new Date()
          task.frozenUntil = moment(this.tasksFreezeUntil, 'DD.MM.YYYY HH:mm').format()
        } else if (this.action === 'executor') {
          task.executor = this.store.users.find(user => this.getUserName(user) === this.tasksExecutor)
        } else if (this.action === 'status') {
          task.status = this.store.statuses.find(status => status.name === this.tasksStatus)
          if (task.status.name === 'Заморожена') {
            task.frozen = true
            task.frozenFrom = new Date()
            task.frozenUntil = moment(this.taskFreezeUntil, 'DD.MM.YYYY HH:mm').format()
          } else {
            task.frozen = false
            task.frozenFrom = null
            task.frozenUntil = null
          }
        } else if (this.action === 'priority') {
          task.priority = this.store.priorities.find(priority => priority.name === this.tasksPriority)
        } else if (this.action === 'tags') {
          const taskTags = []
          this.tasksTags.forEach(tagName => taskTags.push(this.store.tags.find(tag => tag.name === tagName)))
          task.tags = taskTags
        } else if (this.action === 'deadline') {
          task.deadline = moment(this.tasksDeadline, 'DD.MM.YYYY HH:mm').format()
        }
        delete task.client
        axios.patch(`/api/v1/client/${this.getClient(task)}/task`, task)
          .then(newTask => {
            this.$emit('updateTask', task, newTask)
            this.store.checkedTasks = []
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
          message: this.getNotify,
          type: 'positive',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      })
    },

    getClient (task) {
      return this.store.clients.find(client => client.tasks.find(t => t.id === task.id)).id
    },

    getDeclension (count) {
      const declensions = ['заявка', 'заявки', 'заявок']
      let form
      let selected
      if (count % 10 === 1 && count % 100 !== 11) {
        form = declensions[0]
        selected = 'Выбрана'
      } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
        form = declensions[1]
        selected = 'Выбраны'
      } else {
        form = declensions[2]
        selected = 'Выбраны'
      }
      return `${selected} ${count} ${form}`
    },

    formatDateTime () {
      const rawValue = this.dialogTaskDeadline.replace(/\D/g, '')
      let formattedValue = ''
      if (rawValue.length <= 2) {
        formattedValue = rawValue
      } else if (rawValue.length <= 4) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2)
      } else if (rawValue.length <= 6) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4)
      } else if (rawValue.length <= 8) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8)
      } else if (rawValue.length <= 10) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8)
      } else if (rawValue.length <= 12) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8, 10) + ':' + rawValue.slice(10)
      } else {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8, 10) + ':' + rawValue.slice(10, 12)
      }
      this.dialogTaskDeadline = formattedValue
    }
  },

  created () {
    const firstTask = this.store.checkedTasks[0]
    const sameExecutor = this.store.checkedTasks.every(task => task.executor && task.executor === firstTask.executor)
    this.tasksExecutor = sameExecutor && firstTask.executor
      ? `${firstTask.executor.lastname} ${firstTask.executor.firstname}`
      : 'Смешанные исполнители'
    const samePriority = this.store.checkedTasks.every(task => task.priority && task.priority === firstTask.priority)
    this.tasksPriority = samePriority && firstTask.priority
      ? firstTask.priority.name
      : 'Смешанные приоритеты'
    const sameStatus = this.store.checkedTasks.every(task => task.status && task.status === firstTask.status)
    this.tasksStatus = sameStatus && firstTask.status
      ? firstTask.status.name
      : 'Смешанные статусы'
    const sameTags = this.store.checkedTasks.every(task => Array.isArray(task.tags) && task.tags === firstTask.tags)
    this.tasksTags = sameTags && Array.isArray(firstTask.tags)
      ? firstTask.tags.map(tag => tag.name)
      : ['Смешанные теги']
    const sameDeadline = this.store.checkedTasks.every(task => task.deadline && task.deadline === firstTask.deadline)
    this.tasksDeadline = sameDeadline && firstTask.deadline
      ? moment(firstTask.deadline, 'DD.MM.YYYY HH:mm').format('DD.MM.YYYY HH:mm')
      : 'Смешанные дедлайны'
    if (this.tasksDeadline === 'Invalid date') {
      this.tasksDeadline = ''
    }
  },

  computed: {
    getHeader () {
      switch (this.action) {
        case 'close':
          return 'Закрыть заявки'
        case 'open':
          return 'Открыть заявки'
        case 'freeze':
          return 'Заморозить заявки'
        case 'executor':
          return 'Изменить исполнителя заявок'
        case 'status':
          return 'Изменить статусы заявок'
        case 'priority':
          return 'Изменить приоритеты заявок'
        case 'tags':
          return 'Изменить теги заявок'
        case 'deadline':
          return 'Изменить дедлайны заявок'
        default :
          return ''
      }
    },

    getNotify () {
      switch (this.action) {
        case 'close':
          return 'Заявки закрыты'
        case 'open':
          return 'Заявки открыты'
        case 'freeze':
          return 'Заявки заморожены'
        case 'executor':
          return 'Исполнитель изменен'
        case 'status':
          return 'Статус изменен'
        case 'priority':
          return 'Приоритет изменен'
        case 'tags':
          return 'Теги изменены'
        case 'deadline':
          return 'Дедлайн изменен'
        default :
          return ''
      }
    }
  },

  watch: {
    tasksTags: {
      deep: true,
      handler () {
        if (this.tasksTags.length > 1) {
          if (this.tasksTags[0] === 'Смешанные теги') {
            this.tasksTags.splice(0, 1)
          }
        }
      }
    },
    tasksStatus: {
      deep: true,
      handler () {
        if (this.tasksStatus === 'Заморожена') {
          this.freezeDialog = true
        }
      }
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style scoped>

</style>
