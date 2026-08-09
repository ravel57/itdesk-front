<template>
  <q-page padding class="my-lines-page">
    <div class="my-lines-toolbar">
      <div class="my-lines-heading">
        <div class="text-h5 text-weight-medium">Мои линии</div>
        <div class="text-caption text-grey-7">
          Заявки линий, где вы ответственный, участник или наблюдатель
        </div>
      </div>

      <div class="my-lines-search">
        <q-input
          v-model="searchRequest"
          outlined
          dense
          clearable
          debounce="0"
          label="Поиск по заявкам"
        >
          <template #prepend>
            <q-icon name="search"/>
          </template>
        </q-input>
        <q-btn
          flat
          round
          dense
          color="primary"
          icon="refresh"
          :loading="pageLoading"
          @click="resetPageAndLoad"
        >
          <q-tooltip>Обновить</q-tooltip>
        </q-btn>
      </div>
    </div>

    <div v-if="linesLoading" class="my-lines-loading absolute-center text-grey-6">
      <q-spinner color="primary" size="32px"/>
      <div>Загружаю линии...</div>
    </div>

    <template v-else-if="currentUserLines.length > 0">
      <div class="line-selector q-mt-md">
        <q-card
          flat
          bordered
          clickable
          class="line-summary-card all-lines-card"
          :class="{ 'line-summary-card--selected': selectedLineId === null }"
          @click="selectLine(null)"
        >
          <q-card-section class="line-summary-content">
            <div class="line-summary-icon bg-primary text-white">
              <q-icon name="account_tree" size="22px"/>
            </div>
            <div class="line-summary-body">
              <div class="line-summary-title">Все мои линии</div>
              <div class="line-summary-caption">
                {{ currentUserLines.length }} {{ pluralizeLines(currentUserLines.length) }}
              </div>
            </div>
            <q-icon
              v-if="selectedLineId === null"
              name="check_circle"
              color="primary"
              size="22px"
            />
          </q-card-section>
        </q-card>

        <q-card
          v-for="line in currentUserLines"
          :key="line.id"
          flat
          bordered
          clickable
          class="line-summary-card"
          :class="{ 'line-summary-card--selected': Number(selectedLineId) === Number(line.id) }"
          @click="selectLine(line.id)"
        >
          <q-card-section class="line-summary-content">
            <div class="line-summary-level">
              L{{ line.level || 1 }}
            </div>
            <div class="line-summary-body">
              <div class="line-summary-title text-ellipsis">{{ line.name }}</div>
              <div class="line-summary-meta">
                <q-badge outline color="primary" :label="getLineRoleLabel(line)"/>
                <span>{{ getLineMemberCount(line) }} участников</span>
              </div>
              <div class="line-summary-caption text-ellipsis">
                {{ getLineOlaLabel(line) }}
              </div>
            </div>
            <q-icon
              v-if="Number(selectedLineId) === Number(line.id)"
              name="check_circle"
              color="primary"
              size="22px"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="my-lines-status-row q-mt-md">
        <div class="text-body2 text-grey-7">
          <template v-if="selectedLine">
            Показаны заявки линии <strong>{{ selectedLine.name }}</strong>
          </template>
          <template v-else>
            Показаны заявки всех доступных линий
          </template>
        </div>
        <q-chip dense outline color="primary" icon="confirmation_number">
          {{ totalElements }}
        </q-chip>
      </div>

      <div v-if="isInitialLoading" class="my-lines-loading q-py-xl text-grey-6">
        <q-spinner color="primary" size="32px"/>
        <div>Загружаю заявки...</div>
      </div>

      <template v-else-if="displayedGroups.length > 0">
        <section
          v-for="group in displayedGroups"
          :key="group.line.id"
          class="line-task-section"
        >
          <div class="line-task-section__header">
            <div class="line-task-section__identity">
              <div class="line-task-section__level">L{{ group.line.level || 1 }}</div>
              <div>
                <div class="line-task-section__title">{{ group.line.name }}</div>
                <div class="line-task-section__caption">
                  {{ getLineRoleLabel(group.line) }} · показано {{ group.tasks.length }}
                </div>
              </div>
            </div>
            <div class="line-task-section__indicators">
              <q-chip
                v-if="countUnassigned(group.tasks) > 0"
                dense
                color="orange-1"
                text-color="orange-9"
                icon="person_off"
              >
                Без исполнителя: {{ countUnassigned(group.tasks) }}
              </q-chip>
              <q-chip
                v-if="countOlaRisk(group.tasks) > 0"
                dense
                color="red-1"
                text-color="red-8"
                icon="timer_off"
              >
                Риск OLA: {{ countOlaRisk(group.tasks) }}
              </q-chip>
            </div>
          </div>

          <div class="line-task-grid">
            <q-item
              v-for="(task, index) in group.tasks"
              :key="task.id"
              clickable
              class="line-task-card no-padding"
              @click="onTaskClicked(task)"
            >
              <q-item class="line-task-card__inner" clickable @click="onTaskClicked(task)">
                <task-card
                  class="task-card"
                  :task="task"
                  :descriptionRequire="false"
                  :slaRequire="true"
                  :task-name-short="20"
                  :selected-sorting="''"
                  @onTaskClicked="onTaskClicked($event)"
                >
                  <template #chatLink>
                    <a
                      :href="getChatLink(task.client?.id)"
                      @click.stop.prevent="onChatLinkClicked(task)"
                    >
                      <div :id="`my_line_chat_${task.id}_${index}`" class="link-to-chat-container">
                        <div class="link-container">
                          <q-icon class="link" color="white" name="open_in_new"/>
                        </div>
                      </div>
                    </a>
                  </template>
                </task-card>
              </q-item>
            </q-item>
          </div>
        </section>

        <div class="text-grey-6 text-center q-py-lg full-width">
          <div v-if="pageLoading">Загружаю заявки...</div>
          <div v-else-if="!pageIsEnd">Прокрутите ниже, чтобы загрузить ещё</div>
          <div v-else>Показано {{ pagedTasks.length }} из {{ totalElements }}</div>
        </div>
      </template>

      <div v-else-if="pageLoadedOnce && !pageLoading" class="my-lines-empty">
        <no-tasks-placeholder/>
        <div class="text-h6 q-mt-md">В выбранных линиях нет открытых заявок</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Попробуйте выбрать другую линию или изменить поисковый запрос.
        </div>
      </div>
    </template>

    <div v-else-if="!linesLoading" class="my-lines-empty">
      <q-icon name="account_tree" size="72px" color="grey-5"/>
      <div class="text-h6 q-mt-md">У вас пока нет доступных линий</div>
      <div class="text-body2 text-grey-7 q-mt-xs text-center">
        Попросите администратора добавить вас ответственным, участником или наблюдателем линии поддержки.
      </div>
    </div>

    <task-dialog
      v-if="isTaskDialogShow && selectedTask?.client"
      :client="selectedTask.client"
      :isMobile="isMobile"
      :task="selectedTask"
      :isNewTaskDialogShow="false"
      :isTaskDialogShow="isTaskDialogShow"
      :isNewTask="false"
      @closeDialog="closeDialog"
      @updateTask="updateTask"
      @addMessageToTask="addMessageToTask"
    />
  </q-page>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import {useStore} from 'stores/store'
import TaskCard from 'components/TaskCard.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'

export default {
  name: 'MyLinesPage',

  components: {
    NoTasksPlaceholder,
    TaskDialog,
    TaskCard
  },

  data: () => ({
    searchRequest: '',
    selectedLineId: null,
    selectedTask: {},
    isTaskDialogShow: false,
    linesLoading: false,
    pagedTasks: [],
    page: 0,
    pageSize: 50,
    totalElements: 0,
    totalPages: 0,
    pageIsEnd: false,
    pageLoading: false,
    pageLoadedOnce: false,
    reloadTimer: null,
    scrollTimer: null,
    userScrolled: false,
    loadScrollThreshold: 700
  }),

  computed: {
    isMobile() {
      return this.$q.screen.width < 1023
    },

    currentUserLines() {
      const currentUserId = Number(this.store.currentUser?.id)
      if (!Number.isFinite(currentUserId)) {
        return []
      }

      return (this.store.supportLines || [])
        .filter(line => line && line.active !== false && line.id != null)
        .filter(line => this.isUserRelatedToLine(line, currentUserId))
        .slice()
        .sort((left, right) => {
          const orderDiff = Number(left.orderNumber ?? 9999) - Number(right.orderNumber ?? 9999)
          if (orderDiff !== 0) return orderDiff
          const levelDiff = Number(left.level || 1) - Number(right.level || 1)
          if (levelDiff !== 0) return levelDiff
          return String(left.name || '').localeCompare(String(right.name || ''), 'ru')
        })
    },

    selectedLine() {
      if (this.selectedLineId === null) {
        return null
      }
      return this.currentUserLines.find(line => Number(line.id) === Number(this.selectedLineId)) || null
    },

    requestLines() {
      return this.selectedLine ? [this.selectedLine] : this.currentUserLines
    },

    displayedGroups() {
      const groups = []
      const lineById = new Map(this.currentUserLines.map(line => [Number(line.id), line]))
      const tasksByLineId = new Map()

      this.pagedTasks.forEach(task => {
        const lineId = Number(task?.supportLine?.id)
        if (!Number.isFinite(lineId) || !lineById.has(lineId)) {
          return
        }
        if (!tasksByLineId.has(lineId)) {
          tasksByLineId.set(lineId, [])
        }
        tasksByLineId.get(lineId).push(task)
      })

      this.requestLines.forEach(line => {
        const tasks = tasksByLineId.get(Number(line.id)) || []
        if (tasks.length > 0) {
          groups.push({line, tasks})
        }
      })

      return groups
    },

    isInitialLoading() {
      return this.pageLoading && !this.pageLoadedOnce
    }
  },

  methods: {
    getRelatedUsers(line, keys) {
      return keys.flatMap(key => {
        const value = line?.[key]
        if (Array.isArray(value)) return value
        return value ? [value] : []
      }).filter(Boolean)
    },

    getResponsible(line) {
      return line?.responsible || line?.owner || line?.manager || null
    },

    getMembers(line) {
      return this.getRelatedUsers(line, ['members', 'participants', 'operators'])
    },

    getObservers(line) {
      return this.getRelatedUsers(line, ['observers', 'watchers'])
    },

    isSameUser(user, userId) {
      return Number(user?.id) === Number(userId)
    },

    isUserRelatedToLine(line, userId) {
      return this.isSameUser(this.getResponsible(line), userId) ||
          this.getMembers(line).some(user => this.isSameUser(user, userId)) ||
          this.getObservers(line).some(user => this.isSameUser(user, userId))
    },

    getLineRoleLabel(line) {
      const userId = Number(this.store.currentUser?.id)
      if (this.isSameUser(this.getResponsible(line), userId)) return 'Ответственный'
      if (this.getMembers(line).some(user => this.isSameUser(user, userId))) return 'Участник'
      if (this.getObservers(line).some(user => this.isSameUser(user, userId))) return 'Наблюдатель'
      return 'Доступ'
    },

    getLineMemberCount(line) {
      const ids = new Set()
      const responsible = this.getResponsible(line)
      if (responsible?.id != null) ids.add(Number(responsible.id))
      this.getMembers(line).forEach(user => {
        if (user?.id != null) ids.add(Number(user.id))
      })
      return ids.size
    },

    getLineOlaLabel(line) {
      if (line?.olaEnabled === false) return 'OLA не применяется'

      const directMinutes = Number(line?.olaMinutes ?? line?.olaDurationMinutes)
      if (Number.isFinite(directMinutes) && directMinutes > 0) {
        return `OLA: ${this.formatMinutes(directMinutes)}`
      }

      const value = Number(line?.olaValue ?? line?.olaDuration)
      if (!Number.isFinite(value) || value <= 0) return 'OLA не настроена'

      const unit = String(line?.olaUnit || 'MINUTES').toUpperCase()
      const multiplier = unit === 'DAYS' ? 1440 : unit === 'HOURS' ? 60 : 1
      return `OLA: ${this.formatMinutes(value * multiplier)}`
    },

    formatMinutes(value) {
      const minutes = Math.max(0, Math.round(Number(value) || 0))
      if (minutes >= 1440 && minutes % 1440 === 0) return `${minutes / 1440} д.`
      if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} ч.`
      return `${minutes} мин.`
    },

    pluralizeLines(value) {
      const number = Math.abs(Number(value) || 0) % 100
      const lastDigit = number % 10
      if (number > 10 && number < 20) return 'линий'
      if (lastDigit === 1) return 'линия'
      if (lastDigit >= 2 && lastDigit <= 4) return 'линии'
      return 'линий'
    },

    selectLine(lineId) {
      const nextId = lineId == null ? null : Number(lineId)
      if (Number(this.selectedLineId) === Number(nextId) || (this.selectedLineId === null && nextId === null)) {
        return
      }
      this.selectedLineId = nextId
      this.resetPageAndLoad()
    },

    normalizeTask(task) {
      if (!task) return task
      const normalizedTask = {...task}

      ;['createdAt', 'deadline', 'frozenFrom', 'frozenUntil', 'closedAt', 'lastActivity', 'olaDeadline', 'enteredCurrentLineAt']
        .forEach(field => {
          if (normalizedTask[field]) normalizedTask[field] = new Date(normalizedTask[field])
        })

      if (normalizedTask.sla) {
        normalizedTask.sla = {...normalizedTask.sla}
        if (normalizedTask.sla.startDate) {
          normalizedTask.sla.startDate = moment(new Date(normalizedTask.sla.startDate), 'DD.MM.YYYY HH:mm')
        }
        if (normalizedTask.sla.duration !== undefined && normalizedTask.sla.duration !== null) {
          normalizedTask.sla.duration = moment.duration(normalizedTask.sla.duration * 1000)
        }
      }

      normalizedTask.messages = Array.isArray(normalizedTask.messages)
        ? normalizedTask.messages.map(message => ({
          ...message,
          date: message.date ? new Date(message.date) : message.date
        }))
        : []

      return normalizedTask
    },

    buildPageRequest(page = 1) {
      const lineNames = this.requestLines
        .map(line => String(line?.name || '').trim())
        .filter(Boolean)

      return {
        page,
        size: this.pageSize,
        search: this.searchRequest || '',
        includeCompleted: false,
        sortSlug: 'creating',
        ascendingSort: false,
        filterJoinOperator: 'AND',
        filterChain: lineNames.length > 0
          ? [{
              label: 'Линия поддержки',
              slug: 'supportLine',
              selectedOptions: lineNames,
              isBeforeDeadline: false
            }]
          : [],
        requiredFilterChain: []
      }
    },

    mergeTasks(currentTasks = [], newTasks = []) {
      const taskById = new Map()
      currentTasks.forEach(task => {
        if (task?.id != null) taskById.set(Number(task.id), task)
      })
      newTasks.forEach(task => {
        if (task?.id != null) taskById.set(Number(task.id), task)
      })
      return Array.from(taskById.values())
    },

    async loadLines() {
      if ((this.store.supportLines || []).length > 0) return
      this.linesLoading = true
      try {
        const {data} = await axios.get('/api/v1/support-lines')
        this.store.supportLines = Array.isArray(data) ? data : []
      } catch (error) {
        this.showError(error, 'Не удалось загрузить линии поддержки')
      } finally {
        this.linesLoading = false
      }
    },

    async loadPage(reset = false) {
      if (this.pageLoading || this.requestLines.length === 0) {
        if (this.requestLines.length === 0) this.pageLoadedOnce = true
        return
      }
      if (!reset && this.pageIsEnd) return

      this.pageLoading = true
      const page = reset ? 1 : this.page + 1
      const requestSearch = this.searchRequest || ''
      const requestLineId = this.selectedLineId

      try {
        const response = await axios.post('/api/v1/tasks-page', this.buildPageRequest(page))
        if ((this.searchRequest || '') !== requestSearch || this.selectedLineId !== requestLineId) return

        const loadedTasks = Array.isArray(response.data?.tasks)
          ? response.data.tasks.map(task => this.normalizeTask(task))
          : []

        this.pagedTasks = reset ? loadedTasks : this.mergeTasks(this.pagedTasks, loadedTasks)
        this.page = response.data?.page ?? page
        this.totalElements = response.data?.totalElements ?? this.pagedTasks.length
        this.totalPages = response.data?.totalPages ?? 0
        this.pageIsEnd = response.data?.isEnd ?? loadedTasks.length === 0
        this.pageLoadedOnce = true
      } catch (error) {
        this.showError(error, 'Не удалось загрузить заявки моих линий')
      } finally {
        this.pageLoading = false
      }
    },

    resetPageAndLoad() {
      if (this.reloadTimer) {
        clearTimeout(this.reloadTimer)
        this.reloadTimer = null
      }
      this.pagedTasks = []
      this.page = 0
      this.totalElements = 0
      this.totalPages = 0
      this.pageIsEnd = false
      this.pageLoadedOnce = false
      this.userScrolled = false
      this.loadPage(true)
    },

    reloadDebounced() {
      if (this.reloadTimer) clearTimeout(this.reloadTimer)
      this.reloadTimer = setTimeout(() => {
        this.reloadTimer = null
        this.resetPageAndLoad()
      }, 300)
    },

    onScrollIntent(event) {
      if (event?.type === 'keydown') {
        const allowedKeys = ['PageDown', 'End', 'ArrowDown', 'Space', ' ']
        if (!allowedKeys.includes(event.key)) return
      }
      this.userScrolled = true
      this.scheduleTryLoadNextPage()
    },

    onAnyScroll() {
      this.userScrolled = true
      this.scheduleTryLoadNextPage()
    },

    scheduleTryLoadNextPage() {
      if (this.scrollTimer) return
      this.scrollTimer = setTimeout(() => {
        this.scrollTimer = null
        this.tryLoadNextPage()
      }, 100)
    },

    tryLoadNextPage() {
      if (!this.pageLoadedOnce || !this.userScrolled || this.pageLoading || this.pageIsEnd) return
      if (this.getDistanceToBottom() > this.loadScrollThreshold) return
      this.userScrolled = false
      this.loadPage(false)
    },

    getDistanceToBottom() {
      const documentElement = document.documentElement
      const body = document.body
      const scrollTop = window.scrollY || documentElement.scrollTop || body.scrollTop || 0
      const scrollHeight = Math.max(body.scrollHeight, documentElement.scrollHeight, body.offsetHeight, documentElement.offsetHeight)
      const clientHeight = window.innerHeight || documentElement.clientHeight
      return scrollHeight - scrollTop - clientHeight
    },

    isTaskInCurrentScope(task) {
      const taskLineId = Number(task?.supportLine?.id)
      if (!Number.isFinite(taskLineId)) return false
      return this.requestLines.some(line => Number(line.id) === taskLineId)
    },

    upsertTask(task) {
      const normalizedTask = this.normalizeTask(task)
      if (!normalizedTask?.id) return

      if (normalizedTask.completed || normalizedTask.frozen || !this.isTaskInCurrentScope(normalizedTask)) {
        const hadTask = this.pagedTasks.some(item => Number(item.id) === Number(normalizedTask.id))
        this.pagedTasks = this.pagedTasks.filter(item => Number(item.id) !== Number(normalizedTask.id))
        if (hadTask) this.totalElements = Math.max(0, Number(this.totalElements || 0) - 1)
        return
      }

      const index = this.pagedTasks.findIndex(item => Number(item.id) === Number(normalizedTask.id))
      if (index === -1) {
        this.pagedTasks = [normalizedTask, ...this.pagedTasks]
        this.totalElements = Number(this.totalElements || 0) + 1
      } else {
        const nextTasks = [...this.pagedTasks]
        nextTasks.splice(index, 1, {...nextTasks[index], ...normalizedTask})
        this.pagedTasks = nextTasks
      }
    },

    countUnassigned(tasks) {
      return tasks.filter(task => !task?.executor?.id).length
    },

    countOlaRisk(tasks) {
      return tasks.filter(task => {
        const info = task?.olaInfo || {}
        const status = String(info.status || task?.olaStatus || '').toUpperCase()
        if (['WARNING', 'BREACHED'].includes(status)) return true
        const deadline = info.deadline || task?.olaDeadline
        if (!deadline || task?.completed) return false
        const deadlineTime = new Date(deadline).getTime()
        return Number.isFinite(deadlineTime) && deadlineTime <= Date.now()
      }).length
    },

    onTaskClicked(task) {
      if (!task) return
      this.selectedTask = task
      this.isTaskDialogShow = true
      this.updateUrlWithTask(task.id)
    },

    updateUrlWithTask(taskId) {
      this.$router.push({
        path: this.$route.path,
        query: {...this.$route.query, task: taskId}
      })
    },

    initializeTaskFromUrl() {
      const taskId = this.$route.query.task
      if (!taskId) {
        if (this.isTaskDialogShow) this.isTaskDialogShow = false
        return
      }
      const task = this.pagedTasks.find(item => Number(item.id) === Number(taskId))
      if (task) {
        this.selectedTask = task
        this.isTaskDialogShow = true
      }
    },

    closeDialog() {
      const query = {...this.$route.query}
      delete query.task
      this.$router.push({path: this.$route.path, query})
      this.isTaskDialogShow = false
      this.selectedTask = {}
    },

    updateTask(task, newTask) {
      const updatedTask = newTask?.data || newTask
      if (!updatedTask?.id) return
      this.upsertTask(updatedTask)
      this.selectedTask = this.normalizeTask(updatedTask)
    },

    addMessageToTask(event) {
      if (!Array.isArray(this.selectedTask.messages)) this.selectedTask.messages = []
      this.selectedTask.messages.push(event.message)
    },

    getChatLink(clientId) {
      return clientId == null ? '#' : `${window.location.origin}/chats/${clientId}`
    },

    onChatLinkClicked(task) {
      if (task?.client?.id == null) return
      window.location.href = this.getChatLink(task.client.id)
    },

    showError(error, fallback) {
      this.$q.notify({
        type: 'negative',
        position: 'top-right',
        message: error?.response?.data?.message || error?.message || fallback,
        actions: [{icon: 'close', color: 'white', dense: true}]
      })
    }
  },

  async mounted() {
    document.title = 'ULDESK : Мои линии'
    window.addEventListener('wheel', this.onScrollIntent, {passive: true})
    window.addEventListener('touchmove', this.onScrollIntent, {passive: true})
    window.addEventListener('keydown', this.onScrollIntent)
    document.addEventListener('scroll', this.onAnyScroll, true)

    await this.loadLines()
    this.resetPageAndLoad()
    setTimeout(() => this.initializeTaskFromUrl(), 300)
  },

  beforeUnmount() {
    window.removeEventListener('wheel', this.onScrollIntent)
    window.removeEventListener('touchmove', this.onScrollIntent)
    window.removeEventListener('keydown', this.onScrollIntent)
    document.removeEventListener('scroll', this.onAnyScroll, true)
    if (this.reloadTimer) clearTimeout(this.reloadTimer)
    if (this.scrollTimer) clearTimeout(this.scrollTimer)
  },

  watch: {
    searchRequest() {
      this.reloadDebounced()
    },

    '$route.query.task'() {
      this.initializeTaskFromUrl()
    },

    'store.supportLines': {
      deep: true,
      handler() {
        if (this.selectedLineId !== null && !this.selectedLine) {
          this.selectedLineId = null
        }
      }
    }
  },

  setup() {
    return {store: useStore()}
  }
}
</script>

<style scoped>
.my-lines-page {
  position: relative;
  padding-bottom: 0;
}

.my-lines-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.my-lines-heading {
  min-width: 220px;
}

.my-lines-search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: min(520px, 100%);
}

.my-lines-search .q-input {
  flex: 1;
}

.line-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.line-summary-card {
  cursor: pointer;
  border-left: 4px solid #bdbdbd;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.line-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.1);
}

.line-summary-card--selected {
  border-left-color: var(--q-primary);
  box-shadow: 0 4px 14px rgba(92, 53, 249, 0.14);
}

.line-summary-content {
  min-height: 92px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.line-summary-icon,
.line-summary-level {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.line-summary-level {
  background: rgba(92, 53, 249, 0.1);
  color: var(--q-primary);
  font-weight: 700;
}

.line-summary-body {
  min-width: 0;
  flex: 1;
}

.line-summary-title {
  font-size: 15px;
  font-weight: 700;
}

.line-summary-meta {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #757575;
  font-size: 12px;
}

.line-summary-caption {
  margin-top: 5px;
  color: #757575;
  font-size: 12px;
}

.my-lines-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.line-task-section {
  margin-top: 22px;
}

.line-task-section__header {
  min-height: 58px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-left: 4px solid var(--q-primary);
  border-radius: 8px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.line-task-section__identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.line-task-section__level {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--q-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex: 0 0 auto;
}

.line-task-section__title {
  font-size: 16px;
  font-weight: 700;
}

.line-task-section__caption {
  color: #757575;
  font-size: 12px;
}

.line-task-section__indicators {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.line-task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 420px));
  gap: 12px 20px;
  padding-top: 10px;
}

.line-task-card {
  width: 100%;
  min-width: 0;
  max-width: 420px;
  box-sizing: border-box;
  border: 1px solid var(--q-primary);
  border-radius: 5px;
  overflow: hidden;
  background: #fff;
}

.line-task-card__inner {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px;
  overflow: hidden;
}

.line-task-card .task-card {
  width: 100%;
  min-width: 0;
}

.my-lines-loading,
.my-lines-empty {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.link-to-chat-container {
  background-color: var(--q-primary);
  display: none;
  height: 60px;
  overflow: hidden;
  position: absolute;
  right: -38px;
  top: -38px;
  transform: rotate(45deg);
  transition: transform 0.3s ease;
  width: 60px;
  z-index: 1;
}

.link-container {
  display: flex;
  position: absolute;
  right: 25%;
  bottom: 0;
  width: 50%;
  height: 50%;
}

.link {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotate(-45deg);
}

.link-to-chat-container:hover {
  transform: rotate(45deg) scale(1.2);
}

.task-card:hover .link-to-chat-container {
  display: unset;
}

@media (max-width: 700px) {
  .my-lines-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .my-lines-search {
    width: 100%;
  }

  .line-selector {
    grid-template-columns: 1fr;
  }

  .line-task-section__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .line-task-section__indicators {
    justify-content: flex-start;
  }

  .line-task-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .line-task-card {
    max-width: none;
  }
}
</style>
