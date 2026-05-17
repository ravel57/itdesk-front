<template>
  <q-card style="min-width: 440px;min-height: 150px; position: relative" data-tour="tasks-bulk-actions-modal">
    <q-card-section style="display: flex; flex-direction: row; justify-content: space-between">
      <div class="text-h5" data-tour="tasks-bulk-actions-title">{{ this.getHeader }}</div>
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
        data-tour="tasks-bulk-actions-field"
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
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksExecutor"
        :options="this.store.users.filter(user => ['ADMIN', 'OPERATOR'].includes(user.authorities[0])).map(user => this.getUserName(user))"
        label="Исполнитель"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        use-input
      />
      <q-select
        v-if="this.action === 'status'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksStatus"
        :options="this.store.statuses.map(s => s.name)"
        label="Статус"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        style="width: 100%;"
      />
      <q-select
        v-if="this.action === 'priority'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksPriority"
        :options="this.store.priorities.map(priority => priority.name)"
        style="width: 100%;"
        label="Приоритет"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
      />
      <q-select
        v-if="this.action === 'type'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksType"
        :options="this.taskTypeOptions"
        option-label="type"
        style="width: 100%;"
        label="Тип заявки"
        clearable
        :rules="[val => val !== null || 'Обязательное поле']"
      />
      <q-select
        v-if="this.action === 'tags'"
        data-tour="tasks-bulk-actions-field"
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
        data-tour="tasks-bulk-actions-field"
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
      <div class="text-h7" style="padding-top: 20px" data-tour="tasks-bulk-actions-count">
        {{ this.getDeclension(this.store.checkedTasks.length) }}
      </div>
    </q-card-section>
    <q-card-actions style="position: absolute;bottom: 0;width: 100%" align="right" data-tour="tasks-bulk-actions-buttons">
      <q-btn flat label="Отменить" text-color="primary" v-close-popup />
      <q-btn label="Применить" color="primary" @click="this.doAction()"/>
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
    action: { type: String, required: true },
    statusChangeReason: { type: String, default: '' },
    requestStatusChangeReason: { type: Function, default: null }
  },

  data: () => ({
    tasksPriority: '',
    tasksFreezeUntil: '',
    tasksExecutor: '',
    tasksStatus: '',
    tasksType: null,
    taskTypes: [],
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

    getTaskTypeName (taskType) {
      if (!taskType) {
        return 'Не указан'
      }
      if (typeof taskType === 'string') {
        return taskType.trim() || 'Не указан'
      }
      return taskType.type || taskType.name || 'Не указан'
    },

    getTaskTypeKey (taskType) {
      if (!taskType) {
        return 'none'
      }
      if (typeof taskType === 'object' && taskType.id != null) {
        return `id:${taskType.id}`
      }
      return `name:${this.getTaskTypeName(taskType).toLowerCase()}`
    },

    normalizeTaskTypeOption (taskType) {
      if (!taskType) {
        return { id: null, type: 'Не указан' }
      }
      if (typeof taskType === 'string') {
        return {
          id: null,
          type: taskType.trim() || 'Не указан'
        }
      }
      return {
        ...taskType,
        type: this.getTaskTypeName(taskType)
      }
    },

    async loadTaskTypes () {
      try {
        const response = await axios.get('/api/v1/task-types')
        this.taskTypes = Array.isArray(response.data) ? response.data : []
      } catch (e) {
        const typesByKey = new Map()
        ;(this.store.getTasks || []).forEach(task => {
          if (task?.type && typeof task.type === 'object') {
            const option = this.normalizeTaskTypeOption(task.type)
            typesByKey.set(this.getTaskTypeKey(option), option)
          }
        })
        this.taskTypes = Array.from(typesByKey.values())
      }
    },

    hasRequiredActionValue () {
      if (['close', 'open'].includes(this.action)) {
        return true
      }
      if (this.action === 'type') {
        return this.tasksType !== null
      }
      return String(this.tasksFreezeUntil || '').length > 0 ||
        String(this.tasksExecutor || '').length > 0 ||
        String(this.tasksStatus || '').length > 0 ||
        String(this.tasksPriority || '').length > 0 ||
        (Array.isArray(this.tasksTags) && this.tasksTags.length > 0) ||
        String(this.tasksDeadline || '').length > 0
    },

    buildTaskForBulkAction (sourceTask, statusChangeReason) {
      let task = {
        ...sourceTask,
        tags: Array.isArray(sourceTask.tags) ? [...sourceTask.tags] : []
      }
      if (this.action === 'close') {
        const closedStatus = this.getClosedStatus()
        task.completed = true
        task.frozen = false
        task.frozenFrom = null
        task.frozenUntil = null
        if (closedStatus) {
          task.status = closedStatus
        }
      } else if (this.action === 'open') {
        const openStatus = this.getOpenStatus(sourceTask)
        task.completed = false
        task.frozen = false
        task.frozenFrom = null
        task.frozenUntil = null
        if (openStatus) {
          task.status = openStatus
        }
      } else if (this.action === 'freeze') {
        const frozenStatus = this.getFrozenStatus()
        task.completed = false
        task.frozen = true
        task.frozenFrom = new Date()
        task.frozenUntil = moment(this.tasksFreezeUntil, 'DD.MM.YYYY HH:mm').format()
        if (sourceTask.status && this.isOpenStatusName(sourceTask.status.name)) {
          task.previousStatus = sourceTask.status
        }
        if (frozenStatus) {
          task.status = frozenStatus
        }
      } else if (this.action === 'executor') {
        task.executor = this.store.users.find(user => this.getUserName(user) === this.tasksExecutor)
      } else if (this.action === 'status') {
        const selectedStatus = this.store.statuses.find(status => status.name === this.tasksStatus)
        task.status = selectedStatus
        if (selectedStatus && this.isClosedStatusName(selectedStatus.name)) {
          task.completed = true
          task.frozen = false
          task.frozenFrom = null
          task.frozenUntil = null
        } else if (selectedStatus && this.isFrozenStatusName(selectedStatus.name)) {
          task.completed = false
          task.frozen = true
          task.frozenFrom = new Date()
          task.frozenUntil = moment(this.taskFreezeUntil || this.tasksFreezeUntil, 'DD.MM.YYYY HH:mm').format()
          if (sourceTask.status && this.isOpenStatusName(sourceTask.status.name)) {
            task.previousStatus = sourceTask.status
          }
        } else {
          task.completed = false
          task.frozen = false
          task.frozenFrom = null
          task.frozenUntil = null
        }
      } else if (this.action === 'priority') {
        task.priority = this.store.priorities.find(priority => priority.name === this.tasksPriority)
      } else if (this.action === 'type') {
        task.type = this.tasksType && this.tasksType.id != null
          ? this.tasksType
          : null
      } else if (this.action === 'tags') {
        const taskTags = []
        this.tasksTags.forEach(tagName => taskTags.push(this.store.tags.find(tag => tag.name === tagName)))
        task.tags = taskTags
      } else if (this.action === 'deadline') {
        task.deadline = moment(this.tasksDeadline, 'DD.MM.YYYY HH:mm').format()
      }
      task = this.withStatusChangeReason(task, statusChangeReason)
      delete task.client
      delete task.sla
      return task
    },

    async doAction () {
      if (!this.hasRequiredActionValue()) {
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
      const selectedTasks = [...this.store.checkedTasks]
      const statusChangeReason = await this.getStatusChangeReasonForBulkAction()
      if (statusChangeReason === null) {
        return
      }

      try {
        for (const sourceTask of selectedTasks) {
          const task = this.buildTaskForBulkAction(sourceTask, statusChangeReason)
          const clientId = this.getClient(sourceTask)
          const newTask = await axios.patch(`/api/v1/client/${clientId}/task`, task)
          this.$emit('updateTask', task, newTask)
        }
        this.store.checkedTasks = []
        this.$q.notify({
          message: this.getNotify,
          type: 'positive',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        this.$emit('close')
      } catch (e) {
        this.$q.notify({
          message: e.message,
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      }
    },

    getClient (task) {
      const directClientId = task?.client?.id || task?.clientId || task?.client_id || (typeof task?.client === 'number' ? task.client : null)
      if (directClientId) {
        return directClientId
      }
      const client = this.store.clients.find(client => Array.isArray(client.tasks) && client.tasks.find(t => t.id === task.id))
      if (!client?.id) {
        throw new Error(`Не найден clientId для заявки ${task?.id || ''}`)
      }
      return client.id
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
      const formatValue = value => {
        const rawValue = String(value || '').replace(/\D/g, '')
        if (rawValue.length <= 2) {
          return rawValue
        }
        if (rawValue.length <= 4) {
          return rawValue.slice(0, 2) + '.' + rawValue.slice(2)
        }
        if (rawValue.length <= 8) {
          return rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8)
        }
        if (rawValue.length <= 10) {
          return rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8)
        }
        return rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8, 10) + ':' + rawValue.slice(10, 12)
      }
      ;['tasksFreezeUntil', 'taskFreezeUntil', 'tasksDeadline'].forEach(field => {
        if (typeof this[field] === 'string') {
          this[field] = formatValue(this[field])
        }
      })
    },

    getNormalizedStatusChangeReason (reason = this.statusChangeReason) {
      const normalizedReason = String(reason || '').trim()
      return normalizedReason.length > 0 ? normalizedReason : null
    },

    withStatusChangeReason (task, reason = this.statusChangeReason) {
      const normalizedReason = this.getNormalizedStatusChangeReason(reason)
      if (!normalizedReason) {
        return task
      }
      return {
        ...task,
        statusChangeReason: normalizedReason
      }
    },

    getStatusName (status) {
      if (!status) {
        return ''
      }
      return typeof status === 'string' ? status : status.name || ''
    },

    isClosedStatusName (statusName) {
      return ['закрыта', 'закрыто', 'закрыт'].includes(String(statusName || '').trim().toLowerCase())
    },

    isFrozenStatusName (statusName) {
      return ['заморожена', 'заморожено', 'заморожен'].includes(String(statusName || '').trim().toLowerCase())
    },

    isOpenStatusName (statusName) {
      return !!statusName && !this.isClosedStatusName(statusName) && !this.isFrozenStatusName(statusName)
    },

    getSelectedStatus () {
      return this.store.statuses.find(status => status.name === this.tasksStatus)
    },

    getTargetStatusForCurrentAction () {
      switch (this.action) {
        case 'close':
          return this.getClosedStatus()
        case 'freeze':
          return this.getFrozenStatus() || { name: 'Заморожено' }
        case 'status':
          return this.getSelectedStatus()
        default:
          return null
      }
    },

    needStatusChangeReason (oldStatusName, newStatusName, task = null) {
      const oldName = String(oldStatusName || '').trim()
      const newName = String(newStatusName || '').trim()

      if (!newName) {
        return false
      }

      if (oldName && oldName.toLowerCase() === newName.toLowerCase()) {
        return false
      }

      if (this.isClosedStatusName(newName) || this.isFrozenStatusName(newName)) {
        return true
      }

      return this.isOpenStatusName(newName) && (
        this.isClosedStatusName(oldName) ||
        this.isFrozenStatusName(oldName) ||
        task?.completed === true ||
        task?.frozen === true
      )
    },

    async getStatusChangeReasonForBulkAction () {
      const existingReason = this.getNormalizedStatusChangeReason()
      if (existingReason) {
        return existingReason
      }

      if (!['close', 'open', 'freeze', 'status'].includes(this.action)) {
        return ''
      }

      if (typeof this.requestStatusChangeReason !== 'function') {
        return ''
      }

      if (this.action === 'open') {
        const affectedOpenTasks = this.store.checkedTasks.filter(task =>
          task?.completed === true ||
          task?.frozen === true ||
          this.isClosedStatusName(this.getStatusName(task?.status)) ||
          this.isFrozenStatusName(this.getStatusName(task?.status))
        )

        if (affectedOpenTasks.length === 0) {
          return ''
        }

        const openStatus = this.getOpenStatus(affectedOpenTasks[0]) || { name: 'Открыто' }
        return this.requestStatusChangeReason({
          action: this.action,
          newStatus: openStatus,
          newStatusName: this.getStatusName(openStatus),
          tasks: affectedOpenTasks
        })
      }

      if (this.action === 'freeze') {
        const frozenStatus = this.getFrozenStatus() || { name: 'Заморожено' }
        return this.requestStatusChangeReason({
          action: this.action,
          newStatus: frozenStatus,
          newStatusName: this.getStatusName(frozenStatus),
          tasks: this.store.checkedTasks
        })
      }

      const selectedStatus = this.getTargetStatusForCurrentAction()
      if (!selectedStatus) {
        this.$q.notify({
          message: this.action === 'status' ? 'Выберите статус' : 'Не найден целевой статус',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return null
      }

      const newStatusName = this.getStatusName(selectedStatus)
      const affectedTasks = this.store.checkedTasks.filter(task => this.needStatusChangeReason(
        this.getStatusName(task?.status),
        newStatusName,
        task
      ))

      if (affectedTasks.length === 0) {
        return ''
      }

      return this.requestStatusChangeReason({
        action: this.action,
        newStatus: selectedStatus,
        newStatusName,
        tasks: affectedTasks
      })
    },

    getClosedStatus () {
      return this.store.statuses.find(status => this.isClosedStatusName(status.name))
    },

    getFrozenStatus () {
      return this.store.statuses.find(status => this.isFrozenStatusName(status.name))
    },

    getOpenStatus (task) {
      if (task?.previousStatus && this.isOpenStatusName(task.previousStatus.name)) {
        return task.previousStatus
      }
      return this.store.statuses.find(status => this.isOpenStatusName(status.name) && status.defaultSelection === true) ||
        this.store.statuses.find(status => this.isOpenStatusName(status.name))
    },
  },

  created () {
    this.loadTaskTypes()
    const firstTask = this.store.checkedTasks[0]
    const sameExecutor = this.store.checkedTasks.every(task => task.executor && task.executor === firstTask.executor)
    this.tasksExecutor = sameExecutor && firstTask.executor
      ? `${firstTask.executor.lastname} ${firstTask.executor.firstname}`
      : 'Смешанные исполнители'
    const samePriority = this.store.checkedTasks.every(task => task.priority && task.priority === firstTask.priority)
    this.tasksPriority = samePriority && firstTask.priority
      ? firstTask.priority.name
      : 'Смешанные приоритеты'
    const sameType = this.store.checkedTasks.every(task => this.getTaskTypeKey(task.type) === this.getTaskTypeKey(firstTask.type))
    this.tasksType = sameType
      ? this.normalizeTaskTypeOption(firstTask.type)
      : null
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
    taskTypeOptions () {
      const optionsByKey = new Map()
      optionsByKey.set('none', {
        id: null,
        type: 'Не указан'
      })
      ;(this.taskTypes || []).forEach(taskType => {
        const option = this.normalizeTaskTypeOption(taskType)
        optionsByKey.set(this.getTaskTypeKey(option), option)
      })
      return Array.from(optionsByKey.values())
        .sort((a, b) => {
          if (a.id === null) {
            return -1
          }
          if (b.id === null) {
            return 1
          }
          return String(a.type || '').localeCompare(String(b.type || ''), 'ru')
        })
    },

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
        case 'type':
          return 'Изменить тип заявки'
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
        case 'type':
          return 'Тип заявки изменен'
        case 'tags':
          return 'Теги изменены'
        case 'deadline':
          return 'Дедлайн изменен'
        default :
          return ''
      }
    },
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
        if (this.isFrozenStatusName(this.tasksStatus)) {
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
