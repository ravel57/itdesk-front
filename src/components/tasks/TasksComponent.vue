<template>
  <div class="tasks-onboarding-root">
    <q-btn
      class="tasks-onboarding-help"
      round
      dense
      color="primary"
      icon="help_outline"
      @click="startTasksOnboarding"
    />

    <div
      class="flex-container"
      style="padding-top: 8px"
    >
      <q-table
        class="tasks-table-full-width"
        v-if="this.isShowTableMode && !this.tasksOnboardingActive"
        data-tour="tasks-table"
        virtual-scroll
        :rows="this.displayedTableRows"
        :columns="this.filterTableColumns"
        :rows-per-page-options="[10, 20, 40, 60, 100]"
        :sortable="true"
        row-key="id"
        bordered
        style="margin-top: 8px;margin-bottom: 16px;width: 100%;"
        selection="multiple"
        v-model:selected="this.store.checkedTasks"
        :selected-rows-label="(numberOfRows) => `Строк: ${ numberOfRows } выбрано`"
        rows-per-page-label="Строк на странице"
    >
      <!-- кастомный хедер -->
      <template v-slot:header="props">
        <tr>
          <q-th
            :style="{
              position: 'sticky',
              top: '0',
              zIndex: '1',
              backgroundColor: 'white',
              color: 'var(--q-dark)'
            }"
          >
            <q-checkbox v-model="props.selected" @click.stop />
          </q-th>
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
            :style="{
              position: 'sticky',
              top: '0',
              zIndex: '1',
              backgroundColor: 'white',
              color: 'var(--q-dark)'
            }"
          >
            {{ col.label }}
          </q-th>
        </tr>
      </template>

      <!-- кастомный боди -->
      <template v-slot:body="props">
        <q-tr
          style="cursor: pointer"
          :props="props"
          @click="this.$emit('onTaskClicked', props.row)"
        >
          <q-td>
            <q-checkbox v-model="props.selected" @click.stop />
          </q-td>

          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <!-- дедлайн красным при просрочке -->
            <div
              v-if="col.name === 'deadline'"
              :style="`color: ${ this.parseStrToDate(col.value) < Date.now() ? 'red' : 'black' }`"
            >
              {{ col.value }}
            </div>

            <div
              v-else-if="col.name === 'type'"
            >
              <q-badge
                dense
                outline
                color="primary"
                :label="col.value || 'Не указан'"
              />
            </div>

            <div
              v-else-if="col.name === 'checklist'"
              class="task-table-checklist-cell"
            >
              <span v-if="props.row.checklistTotal > 0">
                {{ props.row.checklistCompleted }} / {{ props.row.checklistTotal }}
              </span>
              <span
                v-else
                class="text-grey-6"
                v-text="'—'"
              />
              <q-linear-progress
                v-if="props.row.checklistTotal > 0"
                rounded
                :value="props.row.checklistTotal > 0 ? props.row.checklistCompleted / props.row.checklistTotal : 0"
                color="primary"
                track-color="grey-3"
                size="7px"
                class="task-table-checklist-progress"
                :animation-speed="0"
              />
            </div>

            <!-- обведённый бейдж для статуса -->
            <q-badge
              v-else-if="col.name === 'status'"
              dense
              :color="col.value === 'Заморожена'
            ? 'rgba(50, 173, 230, 1)'
            : col.value === 'Закрыта'
              ? 'rgba(16, 181, 92, 1)'
              : 'grey'"
              :label="col.value"
            />

            <!-- всё остальное -->
            <div v-else>
              {{ col.value }}
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>

      <card-tasks-view
        v-else
        :groupedTasks="this.displayedGroupedTasks"
        :selectedGroupType="this.selectedGroupType || ''"
        :isOnboardingDemo="this.tasksOnboardingActive"
        @onTaskClicked="handleTaskClicked"
      />
    </div>

  </div>

  <teleport to="body">
    <div
      v-if="this.tasksOnboardingActive"
      class="tasks-onboarding-layer"
    >
      <div
        class="tasks-onboarding-spotlight"
        :style="this.tasksOnboardingSpotlightStyle"
      />
      <q-card
        class="tasks-onboarding-tooltip"
        :style="this.tasksOnboardingTooltipStyle"
      >
        <q-card-section class="q-pb-xs">
          <div class="text-subtitle1 text-weight-bold">
            {{ this.currentTasksOnboardingStep.title }}
          </div>
          <div class="text-body2 q-mt-sm">
            {{ this.currentTasksOnboardingStep.text }}
          </div>
        </q-card-section>
        <q-card-actions align="between" class="q-pt-none">
          <q-btn
            flat
            dense
            color="grey"
            label="Пропустить"
            @click="finishTasksOnboarding"
          />
          <div>
            <q-btn
              flat
              dense
              color="primary"
              label="Назад"
              :disable="this.tasksOnboardingStepIndex === 0"
              @click="prevTasksOnboardingStep"
            />
            <q-btn
              unelevated
              dense
              color="primary"
              :label="this.isLastTasksOnboardingStep ? 'Готово' : 'Далее'"
              @click="nextTasksOnboardingStep"
            />
          </div>
        </q-card-actions>
        <div class="tasks-onboarding-progress">
          {{ this.tasksOnboardingStepIndex + 1 }} / {{ this.tasksOnboardingSteps.length }}
        </div>
      </q-card>
    </div>
  </teleport>
  <task-dialog
    v-if="this.getPossibilityToOpenDialogTask"
    :client="this.selectedTask.client"
    :isMobile="this.isMobile"
    :task="this.selectedTask"
    :isNewTaskDialogShow="this.isNewTaskDialogShow"
    :isTaskDialogShow="this.isTaskDialogShow"
    :isNewTask="false"
    @closeDialog="this.$emit('closeDialog', $event)"
    @updateTask="this.$emit('updateTask', $event)"
    @addMessageToTask="this.addMessageToTask"
  />
</template>

<script>
import CardTasksView from 'components/tasks/CardTasksView.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import moment from 'moment/moment'
import { useStore } from 'stores/store'
import { QBadge } from 'quasar'

export default {

  components: { TaskDialog, CardTasksView, QBadge },

  name: 'TasksComponent',

  props: [
    'isShowTableMode',
    'isMobile',
    'tableRows',
    'isFilterSelected',
    'groupedTasks',
    'selectedGroupType',
    'isNewTaskDialogShow',
    'isTaskDialogShow',
    'selectedTask',
    'activeColumns'
  ],

  data: () => ({
    tasksOnboardingKey: 'tasks-page-onboarding-v1',
    tasksOnboardingActive: false,
    tasksOnboardingStepIndex: 0,
    tasksOnboardingTooltipStyle: {},
    tasksOnboardingSpotlightStyle: {},
    tasksOnboardingRefreshHandler: null,
    tasksOnboardingDemoTask: {
      id: 900001,
      __onboardingDemo: true,
      name: 'Не работает доступ к корпоративной почте',
      description: 'Пользователь не может войти в почту после смены пароля. Нужно проверить учетную запись и MFA.',
      type: 'Инцидент',
      checklist: '2 / 4',
      checklistCompleted: 2,
      checklistTotal: 4,
      completed: false,
      frozen: false,
      createdAt: new Date(Date.now() - 35 * 60 * 1000),
      deadline: new Date(Date.now() + 3 * 60 * 60 * 1000),
      tags: [
        { id: 1, name: 'Почта' },
        { id: 2, name: 'Доступы' }
      ],
      priority: { id: 1, name: 'Высокий', critical: true },
      status: { id: 1, name: 'В работе' },
      executor: { id: 1, firstname: 'Иван', lastname: 'Петров' },
      unreadPingTasksMessages: { demo: true },
      sla: {
        startDate: new Date(Date.now() - 35 * 60 * 1000),
        duration: 4 * 60 * 60
      },
      __onboardingSlaInfo: {
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        remainingSeconds: 2 * 60 * 60,
        pausedSeconds: 0,
        paused: false
      },
      client: {
        id: 900001,
        name: 'Алексей Смирнов',
        lastMessage: {
          date: new Date(Date.now() - 10 * 60 * 1000),
          text: 'После смены пароля почта перестала открываться.'
        }
      }
    },
    tasksOnboardingSteps: [
      {
        target: 'tasks-board-column',
        title: 'Колонка заявок',
        text: 'Заявки могут группироваться по статусу, приоритету, исполнителю или другому выбранному признаку. Заголовок колонки показывает текущую группу.'
      },
      {
        target: 'tasks-group-select',
        title: 'Выбор всей группы',
        text: 'Чекбокс в заголовке выбирает все заявки внутри колонки. Это удобно для массового изменения статуса, исполнителя, дедлайна или тегов.'
      },
      {
        target: 'tasks-task-card',
        title: 'Карточка заявки',
        text: 'В карточке собраны ключевые данные: номер, название, статус, описание, теги, приоритет, исполнитель, дедлайн и SLA.'
      },
      {
        target: 'tasks-task-select',
        title: 'Выбор заявки',
        text: 'Отмечай отдельные заявки чекбоксом, чтобы применить к ним массовое действие, не открывая каждую заявку вручную.'
      },
      {
        target: 'tasks-task-title',
        title: 'Название и номер',
        text: 'Номер помогает быстро сослаться на заявку, а короткое название должно отражать проблему пользователя или суть работы.'
      },
      {
        target: 'tasks-task-status',
        title: 'Статус заявки',
        text: 'Статус показывает текущий этап обработки: новая, в работе, заморожена или закрыта. По нему удобно строить очереди.'
      },
      {
        target: 'tasks-task-priority',
        title: 'Приоритет',
        text: 'Приоритет помогает понять срочность. Критичные и высокие заявки стоит обрабатывать раньше обычных.'
      },
      {
        target: 'tasks-task-deadline',
        title: 'Дедлайн',
        text: 'Дедлайн показывает крайний срок решения. Просроченные даты подсвечиваются и должны быстро попадать в поле зрения оператора.'
      },
      {
        target: 'tasks-task-sla',
        title: 'SLA',
        text: 'SLA показывает, сколько времени осталось по регламенту. Прогресс-бар помогает быстро увидеть риск нарушения срока.'
      },
      {
        target: 'tasks-chat-link',
        title: 'Переход в чат клиента',
        text: 'Эта кнопка открывает чат клиента, связанного с заявкой. Так оператор быстро переходит от задачи к переписке.'
      }
    ],
    tableColumns: [
      {
        name: 'id',
        label: 'ID',
        align: 'left',
        field: row => row.id,
        sortable: true
      },
      {
        name: 'name',
        label: 'Название',
        align: 'left',
        field: row => row.name.length > 40 ? row.name.substring(0, 40) + '...' : row.name,
        sortable: true
      },
      {
        name: 'type',
        label: 'Тип',
        align: 'left',
        field: row => row.type || 'Не указан',
        sortable: true
      },
      {
        name: 'checklist',
        label: 'Чек-лист',
        align: 'left',
        field: row => row.checklist || '—',
        sortable: true,
        sort: (a, b, rowA, rowB) => {
          const totalA = Number(rowA.checklistTotal || 0)
          const totalB = Number(rowB.checklistTotal || 0)
          const completedA = Number(rowA.checklistCompleted || 0)
          const completedB = Number(rowB.checklistCompleted || 0)
          if (totalA === 0 && totalB === 0) {
            return 0
          }
          if (totalA === 0) {
            return 1
          }
          if (totalB === 0) {
            return -1
          }
          return completedA / totalA - completedB / totalB
        }
      },
      {
        name: 'tags',
        label: 'Теги',
        align: 'left',
        field: row => row.tags.map(tag => tag.name).join(', ').length > 21
          ? row.tags.map(tag => tag.name).join(', ').substring(0, 21) + '...'
          : row.tags.map(tag => tag.name).join(', '),
        sortable: true
      },
      {
        name: 'priority',
        label: 'Приоритет',
        align: 'left',
        field: row => row.priority.name,
        sortable: true
      },
      {
        name: 'createdAt',
        label: 'Создана',
        align: 'left',
        field: row => row.createdAt.toLocaleTimeString('ru-RU', {
          timeZone: 'Europe/Moscow',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        sortable: true,
        sort: (a, b, rowA, rowB) => {
          const dateA = new Date(rowA.createdAt)
          const dateB = new Date(rowB.createdAt)
          return dateA - dateB
        }
      },
      {
        name: 'status',
        label: 'Статус',
        align: 'left',
        field: row => row.status.name,
        sortable: true
      },
      {
        name: 'deadline',
        label: 'Дедлайн',
        align: 'left',
        field: row => row.deadline
          ? row.deadline.toLocaleTimeString('ru-RU', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
          : '',
        sortable: true,
        sort: (a, b, rowA, rowB) => {
          const dateA = new Date(rowA.deadline)
          const dateB = new Date(rowB.deadline)
          return dateA - dateB
        }
      },
      {
        name: 'executor',
        label: 'Исполнитель',
        align: 'left',
        field: row => row.executor
          ? row.executor.firstname + ' ' + row.executor.lastname
          : '',
        sortable: true
      },
      {
        name: 'sla',
        label: 'SLA',
        align: 'left',
        field: row => row.sla || '',
        sortable: true,
        sort: (a, b, rowA, rowB) => {
          const secondsA = Number(rowA.slaSecondsLeft)
          const secondsB = Number(rowB.slaSecondsLeft)

          if (!Number.isFinite(secondsA) && !Number.isFinite(secondsB)) {
            return 0
          }
          if (!Number.isFinite(secondsA)) {
            return 1
          }
          if (!Number.isFinite(secondsB)) {
            return -1
          }
          return secondsA - secondsB
        }
      }
    ],
    selectedTasks: [],
    dragging: true
  }),

  methods: {
    shortenLine (string) {
      if (string.length > 31) {
        return string.substring(0, 31) + '...'
      } else {
        return string
      }
    },

    parseStrToDate (str) {
      return moment(str, 'DD.MM.YYYY, HH:mm')
    },

    addMessageToTask (event) {
      this.$emit('addMessageToTask', event)
    },

    handleTaskClicked (task) {
      if (task?.__onboardingDemo || this.tasksOnboardingActive) {
        return
      }
      this.$emit('onTaskClicked', task)
    },

    startTasksOnboarding () {
      this.tasksOnboardingActive = true
      this.tasksOnboardingStepIndex = 0
      this.$nextTick(() => {
        setTimeout(() => this.updateTasksOnboardingPosition(), 80)
      })
    },

    finishTasksOnboarding () {
      this.tasksOnboardingActive = false
      localStorage.setItem(this.tasksOnboardingKey, 'done')
      this.tasksOnboardingTooltipStyle = {}
      this.tasksOnboardingSpotlightStyle = {}
    },

    nextTasksOnboardingStep () {
      if (this.isLastTasksOnboardingStep) {
        this.finishTasksOnboarding()
        return
      }
      this.tasksOnboardingStepIndex += 1
      this.$nextTick(() => {
        setTimeout(() => this.updateTasksOnboardingPosition(), 80)
      })
    },

    prevTasksOnboardingStep () {
      if (this.tasksOnboardingStepIndex === 0) {
        return
      }
      this.tasksOnboardingStepIndex -= 1
      this.$nextTick(() => {
        setTimeout(() => this.updateTasksOnboardingPosition(), 80)
      })
    },

    updateTasksOnboardingPosition () {
      if (!this.tasksOnboardingActive) {
        return
      }

      const step = this.currentTasksOnboardingStep
      const target = document.querySelector(`[data-tour="${step.target}"]`)

      if (!target) {
        this.tasksOnboardingSpotlightStyle = { display: 'none' }
        this.tasksOnboardingTooltipStyle = {
          top: 'calc(50vh - 120px)',
          left: 'calc(50vw - 180px)'
        }
        return
      }

      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })

      setTimeout(() => {
        const rect = target.getBoundingClientRect()
        const padding = 8
        const tooltipWidth = 360
        const tooltipHeight = 210
        const viewportWidth = document.documentElement.clientWidth
        const viewportHeight = document.documentElement.clientHeight

        const topCandidate = rect.bottom + 16
        const top = topCandidate + tooltipHeight > viewportHeight
          ? Math.max(16, rect.top - tooltipHeight - 16)
          : topCandidate

        const left = Math.min(
          Math.max(16, rect.left + rect.width / 2 - tooltipWidth / 2),
          viewportWidth - tooltipWidth - 16
        )

        this.tasksOnboardingSpotlightStyle = {
          top: `${Math.max(0, rect.top - padding)}px`,
          left: `${Math.max(0, rect.left - padding)}px`,
          width: `${rect.width + padding * 2}px`,
          height: `${rect.height + padding * 2}px`
        }
        this.tasksOnboardingTooltipStyle = {
          top: `${top}px`,
          left: `${left}px`,
          width: `${tooltipWidth}px`
        }
      }, 220)
    }
  },

  computed: {
    displayedGroupedTasks () {
      if (this.tasksOnboardingActive) {
        return [
          {
            title: 'В работе',
            taskCards: [this.tasksOnboardingDemoTask]
          }
        ]
      }
      return this.groupedTasks
    },

    displayedTableRows () {
      if (this.tasksOnboardingActive) {
        return [this.tasksOnboardingDemoTask]
      }
      return this.tableRows
    },

    currentTasksOnboardingStep () {
      return this.tasksOnboardingSteps[this.tasksOnboardingStepIndex] || this.tasksOnboardingSteps[0]
    },

    isLastTasksOnboardingStep () {
      return this.tasksOnboardingStepIndex === this.tasksOnboardingSteps.length - 1
    },

    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    filterTableColumns () {
      return this.activeColumns
        .map(activeCol => {
          const col = this.tableColumns.find(tableCol => tableCol.name === activeCol.name && activeCol.active !== false)
          if (col) {
            return { ...col, label: activeCol.label }
          }
          return null
        })
        .filter(col => col !== null)
    }
  },

  mounted () {
    this.tasksOnboardingRefreshHandler = () => this.updateTasksOnboardingPosition()
    window.addEventListener('resize', this.tasksOnboardingRefreshHandler)
    window.addEventListener('scroll', this.tasksOnboardingRefreshHandler, true)

    if (!localStorage.getItem(this.tasksOnboardingKey)) {
      this.$nextTick(() => {
        setTimeout(() => this.startTasksOnboarding(), 350)
      })
    }
  },

  beforeUnmount () {
    window.removeEventListener('resize', this.tasksOnboardingRefreshHandler)
    window.removeEventListener('scroll', this.tasksOnboardingRefreshHandler, true)
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style lang="scss" scoped>
.flex-container {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: none;
  flex-wrap: nowrap;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: auto;
}

.tasks-table-full-width {
  width: 100%;
  min-width: 100%;
  max-width: none;
  flex: 1 1 100%;
}

.my-sticky-header-table {
  height: calc(100vh - 80px);

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th {
    background-color: var(--q-primary);
  }

  thead tr th {
    position: sticky;
    z-index: 1;
  }

  thead tr:first-child th {
    top: 0;
  }

  &.q-table--loading thead tr:last-child th {
    top: 48px;
  }

  tbody {
    scroll-margin-top: 48px;
  }
}

.tasks-onboarding-root {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.tasks-onboarding-help {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 9999;
}

.tasks-onboarding-layer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
}

.tasks-onboarding-spotlight {
  position: fixed;
  border: 2px solid var(--q-primary);
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.52);
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  pointer-events: none;
}

.tasks-onboarding-tooltip {
  position: fixed;
  z-index: 10001;
  pointer-events: auto;
  border-radius: 12px;
}

.tasks-onboarding-progress {
  position: absolute;
  right: 16px;
  top: 12px;
  color: #777;
  font-size: 12px;
}

.task-table-checklist-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.task-table-checklist-progress {
  width: 72px;
  flex: 0 0 72px;
}
</style>
