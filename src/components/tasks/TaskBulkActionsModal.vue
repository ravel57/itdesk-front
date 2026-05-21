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
        :rules="[val => this.isValidTaskTypeSelection(val) || 'Выберите тип заявки']"
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
        return `${user.lastname} ${user.firstname}`
      } else {
        return ''
      }
    },

    getMixedTaskTypeOption () {
      return {
        id: null,
        type: 'Смешанные типы',
        mixed: true
      }
    },

    getTaskTypeName (taskType) {
      if (!taskType) {
        return ''
      }
      if (typeof taskType === 'string') {
        return taskType.trim()
      }
      return String(taskType.type || taskType.name || '').trim()
    },

    getTaskTypeKey (taskType) {
      if (!taskType || taskType.mixed) {
        return 'none'
      }
      if (typeof taskType === 'object' && taskType.id != null) {
        return `id:${taskType.id}`
      }
      const name = this.getTaskTypeName(taskType).toLowerCase()
      return name ? `name:${name}` : 'none'
    },

    normalizeTaskTypeOption (taskType) {
      if (!taskType) {
        return null
      }
      if (taskType.mixed) {
        return this.getMixedTaskTypeOption()
      }
      if (typeof taskType === 'string') {
        const type = taskType.trim()
        return type ? { id: null, type } : null
      }
      const type = this.getTaskTypeName(taskType)
      if (!type) {
        return null
      }
      return {
        ...taskType,
        type
      }
    },

    isValidTaskTypeSelection (taskType) {
      if (!taskType || taskType.mixed) {
        return false
      }
      const type = this.getTaskTypeName(taskType)
      return type.length > 0 && type.toLowerCase() !== 'не указан'
    },

    async loadTaskTypes () {
      try {
        const response = await axios.get('/api/v1/task-types')
        this.taskTypes = Array.isArray(response.data) ? response.data : []
      } catch (e) {
        const typesByKey = new Map()
        ;(this.store.getTasks || []).forEach(task => {
          const option = this.normalizeTaskTypeOption(task?.type)
          if (option) {
            typesByKey.set(this.getTaskTypeKey(option), option)
          }
        })
        this.taskTypes = Array.from(typesByKey.values())
      }
    },

    getEntityKey (entity, nameGetter) {
      if (!entity) {
        return 'none'
      }
      if (typeof entity === 'object' && entity.id != null) {
        return `id:${entity.id}`
      }
      const rawName = typeof nameGetter === 'function'
        ? nameGetter(entity)
        : entity
      const name = String(rawName || '').trim().toLowerCase()
      return name ? `name:${name}` : 'none'
    },

    getExecutorKey (task) {
      return this.getEntityKey(task?.executor, executor => this.getUserName(executor))
    },

    getExecutorValue (task) {
      return task?.executor ? this.getUserName(task.executor) : ''
    },

    getPriorityKey (task) {
      return this.getEntityKey(task?.priority, priority => priority?.name || priority)
    },

    getPriorityValue (task) {
      return task?.priority?.name || ''
    },

    getStatusKey (task) {
      return this.getEntityKey(task?.status, status => this.getStatusName(status))
    },

    getStatusValue (task) {
      return this.getStatusName(task?.status)
    },

    getDeadlineKey (task) {
      const value = task?.deadline
      if (!value) {
        return 'none'
      }
      const date = moment(value)
      if (date.isValid()) {
        return date.format('YYYY-MM-DDTHH:mm')
      }
      const strictDate = moment(String(value), 'DD.MM.YYYY HH:mm', true)
      if (strictDate.isValid()) {
        return strictDate.format('YYYY-MM-DDTHH:mm')
      }
      return `raw:${String(value).trim()}`
    },

    getDeadlineValue (task) {
      const value = task?.deadline
      if (!value) {
        return ''
      }
      const date = moment(value)
      if (date.isValid()) {
        return date.format('DD.MM.YYYY HH:mm')
      }
      const strictDate = moment(String(value), 'DD.MM.YYYY HH:mm', true)
      return strictDate.isValid()
        ? strictDate.format('DD.MM.YYYY HH:mm')
        : String(value)
    },

    getTagKey (tag) {
      return this.getEntityKey(tag, item => item?.name || item)
    },

    getTagsKey (task) {
      const tags = Array.isArray(task?.tags) ? task.tags : []
      if (tags.length === 0) {
        return 'none'
      }
      return tags
        .map(tag => this.getTagKey(tag))
        .sort()
        .join('|')
    },

    getTagsValue (task) {
      return Array.isArray(task?.tags)
        ? task.tags.map(tag => tag?.name || String(tag || '')).filter(Boolean)
        : []
    },

    getSameSelectedTaskValue (keyGetter, valueGetter, mixedValue) {
      const tasks = Array.isArray(this.store.checkedTasks) ? this.store.checkedTasks : []
      const firstTask = tasks[0]

      if (!firstTask) {
        return typeof valueGetter === 'function' ? valueGetter(null) : ''
      }

      const firstKey = keyGetter(firstTask)
      const hasMixedValues = tasks.some(task => keyGetter(task) !== firstKey)

      return hasMixedValues ? mixedValue : valueGetter(firstTask)
    },

    isMixedBulkValue (value) {
      if (Array.isArray(value)) {
        return value.length === 1 && this.isMixedBulkValue(value[0])
      }
      return String(value || '').trim().toLowerCase().startsWith('смешанные')
    },

    initBulkActionValues () {
      const tasks = Array.isArray(this.store.checkedTasks) ? this.store.checkedTasks : []
      const firstTask = tasks[0]

      if (!firstTask) {
        this.tasksExecutor = ''
        this.tasksPriority = ''
        this.tasksType = null
        this.tasksStatus = ''
        this.tasksTags = []
        this.tasksDeadline = ''
        return
      }

      this.tasksExecutor = this.getSameSelectedTaskValue(
        task => this.getExecutorKey(task),
        task => this.getExecutorValue(task),
        'Смешанные исполнители'
      )

      this.tasksPriority = this.getSameSelectedTaskValue(
        task => this.getPriorityKey(task),
        task => this.getPriorityValue(task),
        'Смешанные приоритеты'
      )

      this.tasksType = this.getSameSelectedTaskValue(
        task => this.getTaskTypeKey(task?.type),
        task => this.normalizeTaskTypeOption(task?.type),
        this.getMixedTaskTypeOption()
      )

      this.tasksStatus = this.getSameSelectedTaskValue(
        task => this.getStatusKey(task),
        task => this.getStatusValue(task),
        'Смешанные статусы'
      )

      this.tasksTags = this.getSameSelectedTaskValue(
        task => this.getTagsKey(task),
        task => this.getTagsValue(task),
        ['Смешанные теги']
      )

      this.tasksDeadline = this.getSameSelectedTaskValue(
        task => this.getDeadlineKey(task),
        task => this.getDeadlineValue(task),
        'Смешанные дедлайны'
      )
    },

    hasRequiredActionValue () {
      if (['close', 'open'].includes(this.action)) {
        return true
      }
      if (this.action === 'type') {
        return this.isValidTaskTypeSelection(this.tasksType)
      }
      if (this.action === 'freeze') {
        return String(this.tasksFreezeUntil || '').length > 0
      }
      if (this.action === 'status') {
        if (!String(this.tasksStatus || '').length || this.isMixedBulkValue(this.tasksStatus)) {
          return false
        }
        if (this.isFrozenStatusName(this.tasksStatus)) {
          return String(this.taskFreezeUntil || this.tasksFreezeUntil || '').length > 0
        }
        return true
      }
      if (this.action === 'executor') {
        return String(this.tasksExecutor || '').length > 0 && !this.isMixedBulkValue(this.tasksExecutor)
      }
      if (this.action === 'priority') {
        return String(this.tasksPriority || '').length > 0 && !this.isMixedBulkValue(this.tasksPriority)
      }
      if (this.action === 'tags') {
        return Array.isArray(this.tasksTags) && this.tasksTags.length > 0 && !this.isMixedBulkValue(this.tasksTags)
      }
      if (this.action === 'deadline') {
        return String(this.tasksDeadline || '').length > 0 && !this.isMixedBulkValue(this.tasksDeadline)
      }
      return false
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
        task.frozenFrom = sourceTask.frozen === true && sourceTask.frozenFrom ? sourceTask.frozenFrom : new Date()
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
          task.frozenFrom = sourceTask.frozen === true && sourceTask.frozenFrom ? sourceTask.frozenFrom : new Date()
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
        task.type = this.isValidTaskTypeSelection(this.tasksType)
          ? this.tasksType
          : sourceTask.type
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
          return `${rawValue.slice(0, 2)}.${rawValue.slice(2)}`
        }
        if (rawValue.length <= 8) {
          return `${rawValue.slice(0, 2)}.${rawValue.slice(2, 4)}.${rawValue.slice(4, 8)}`
        }
        if (rawValue.length <= 10) {
          return `${rawValue.slice(0, 2)}.${rawValue.slice(2, 4)}.${rawValue.slice(4, 8)} ${rawValue.slice(8)}`
        }
        return `${rawValue.slice(0, 2)}.${rawValue.slice(2, 4)}.${rawValue.slice(4, 8)} ${rawValue.slice(8, 10)}:${rawValue.slice(10, 12)}`
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
    this.initBulkActionValues()
  },

  computed: {
    taskTypeOptions () {
      const optionsByKey = new Map()
      ;(this.taskTypes || []).forEach(taskType => {
        const option = this.normalizeTaskTypeOption(taskType)
        if (option && this.isValidTaskTypeSelection(option)) {
          optionsByKey.set(this.getTaskTypeKey(option), option)
        }
      })
      return Array.from(optionsByKey.values())
        .sort((a, b) => String(a.type || '').localeCompare(String(b.type || ''), 'ru'))
    },

    getHeader () {
      switch (this.action) {
        case 'close':
          return 'Закрыть заявки'
        case 'open':
          return 'Открыть заявки'
        // case 'freeze':
        //   return 'Заморозить заявки'
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
      handler (newVal, oldVal) {
        const oldName = String(oldVal || '').trim()
        const newName = String(newVal || '').trim()
        if (!newName || oldName.toLowerCase() === newName.toLowerCase()) {
          return
        }
        if (this.isFrozenStatusName(newName)) {
          this.taskFreezeUntil = ''
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
