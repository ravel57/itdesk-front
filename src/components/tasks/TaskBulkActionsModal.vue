<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">{{ this.getHeader }}</div>
    </q-card-section>
    <q-card-section class="q-pt-none">
      <div v-if="this.action === 'close'">
        Закрыть заявки ({{ this.store.checkedTasks.length }})?
      </div>
      <q-input
        v-if="this.action === 'freeze'"
        v-model="this.tasksFreezeUntil"
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
                v-model="this.tasksFreezeUntil"
                mask="DD.MM.YYYY HH:mm"
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
    </q-card-section>
    <q-card-actions align="right">
      <q-btn flat label="Закрыть" text-color="primary" v-close-popup />
      <q-btn label="Сохранить" color="primary" v-close-popup @click="this.doAction()"/>
    </q-card-actions>
  </q-card>
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
    tasksPriority: [],
    tasksFreezeUntil: '',
    tasksExecutor: [],
    tasksStatus: []
  }),

  methods: {
    getUserName (user) {
      if (user) {
        return user.lastname + ' ' + user.firstname
      } else {
        return ''
      }
    },

    doAction () {
      this.store.checkedTasks.filter(task => !task.completed).forEach(task => {
        if (this.action !== 'close' && this.tasksFreezeUntil.length === 0 && this.tasksExecutor.length === 0 &&
          this.tasksStatus.length === 0 && this.tasksPriority.length === 0) {
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
        if (this.action === 'close') {
          task.completed = true
        } else if (this.action === 'freeze') {
          task.frozen = true
          task.frozenFrom = new Date()
          task.frozenUntil = moment(this.tasksFreezeUntil, 'DD.MM.YYYY HH:mm').format()
        } else if (this.action === 'executor') {
          task.executor = this.store.users.find(user => this.getUserName(user) === this.tasksExecutor)
        } else if (this.action === 'status') {
          task.status = this.store.statuses.find(status => status.name === this.tasksStatus)
        } else if (this.action === 'priority') {
          task.priority = this.store.priorities.find(priority => priority.name === this.tasksPriority)
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
    }
  },

  computed: {
    getHeader () {
      switch (this.action) {
        case 'close':
          return 'Закрыть заявки'
        case 'freeze':
          return 'Заморозить заявки'
        case 'executor':
          return 'Смена исполнителя заявок'
        case 'status':
          return 'Смена статуса заявок'
        case 'priority':
          return 'Смена приоритета заявок'
        default :
          return ''
      }
    },

    getNotify () {
      switch (this.action) {
        case 'close':
          return 'Заявки закрыты'
        case 'freeze':
          return 'Заявки заморожены'
        case 'executor':
          return 'Исполнитель изменен'
        case 'status':
          return 'Статус изменен'
        case 'priority':
          return 'Приоритет изменен'
        default :
          return ''
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
