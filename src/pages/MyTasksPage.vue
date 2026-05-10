<template>
  <q-page padding style="padding-bottom: 0;" class="my-tasks-page"
          :class="{ 'my-tasks-onboarding-mode': this.myTasksOnboardingActive }">
    <div style="display: flex; width: 100%; align-items: center; gap: 8px;" data-my-tasks-tour="search">
      <q-input
        outlined
        dense
        v-model="this.searchRequest"
        label="Поиск"
        style="width: 100%; align-content: center; min-width: 300px; padding-right: 8px"
        clearable
      />
      <q-btn
        round
        dense
        flat
        color="primary"
        icon="help_outline"
        title="Показать обучение"
        data-my-tasks-tour="help"
        @click="this.startMyTasksOnboarding(true)"
      />
    </div>
    <div style="padding: 16px">
      <div
        v-if="this.myTasksDisplayedTasks.length > 0"
        data-my-tasks-tour="task-list"
        style="display: flex; flex-wrap: wrap; flex-direction: row"
        :style="this.isMobile ? 'justify-content: center;' : 'justify-content: start;'"
      >
        <q-item
          v-for="(task, index) in this.myTasksDisplayedTasks"
          :key="task.id"
          :data-my-tasks-tour="index === 0 ? 'task-card' : index === 1 ? 'second-task-card' : null"
          :class="{ 'my-tasks-demo-task-card': task.__demo && index === 0 }"
          style="border-style: solid;border-width: 0.01em;border-radius: 4px; border-color: var(--q-primary); margin-top: 8px; max-width: 420px;width: 100%;margin-right: 20px"
          clickable
          class="no-padding"
        >
          <q-item
            clickable
            style="padding: 8px;max-width: 420px;width: 420px;overflow: hidden"
            @click="this.onTaskClicked(task)"
          >
            <task-card
              class="task-card"
              :task="task"
              :descriptionRequire="false"
              :slaRequire="true"
              :task-name-short="20"
              :selected-sorting="''"
              @onTaskClicked="this.onTaskClicked($event)"
            >
              <!--:slaRequire="false"-->
              <template v-slot:chatLink>
                <a
                  :href="this.getChatLink(task.client.id, task)"
                  @click.stop.prevent="this.onChatLinkClicked(task, $event)"
                >
                  <div
                    :id="`link_to_chat_${task.id}_${index}`"
                    :data-my-tasks-tour="index === 0 ? 'chat-link' : null"
                    class="link-to-chat-container"
                  >
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
      <div
        v-else
        class="absolute-center"
      >
        <div style="display: flex;flex-direction: row;align-items: center">
          <div style="width: 140px">
            <div style="font-size: 20px">
              Заявок нет
            </div>
            <div style="font-size: 14px">
              Возможно стоит создать их
            </div>
            <div style="font-size: 14px">
              <a style="color: var(--q-primary)" href="/chats">Проверьте чаты.</a>
            </div>
          </div>
          <div style="display: flex;flex-direction: column;align-items: center">
            <no-tasks-placeholder/>
          </div>
        </div>
      </div>
      <task-dialog
        v-if="this.isTaskDialogShow"
        :client="this.selectedTask.client"
        :isMobile="this.isMobile"
        :task="this.selectedTask"
        :isNewTaskDialogShow="this.isNewTaskDialogShow"
        :isTaskDialogShow="this.isTaskDialogShow"
        :isNewTask="false"
        @closeDialog="this.closeDialog"
        @updateTask="this.updateTask"
        @addMessageToTask="this.addMessageToTask"
      />
    </div>

    <teleport to="body">
      <div
        v-if="this.myTasksOnboardingActive"
        class="my-tasks-onboarding-layer"
      >
        <div class="my-tasks-onboarding-backdrop"/>
        <div
          class="my-tasks-onboarding-highlight"
          :style="this.myTasksOnboardingHighlightStyle"
        />
        <div
          class="my-tasks-onboarding-tooltip"
          :style="this.myTasksOnboardingTooltipStyle"
        >
          <div class="my-tasks-onboarding-progress">
            {{ this.myTasksOnboardingStepIndex + 1 }} / {{ this.myTasksOnboardingSteps.length }}
          </div>
          <div class="my-tasks-onboarding-title">
            {{ this.myTasksCurrentOnboardingStep.title }}
          </div>
          <div class="my-tasks-onboarding-text">
            {{ this.myTasksCurrentOnboardingStep.text }}
          </div>
          <div class="my-tasks-onboarding-actions">
            <q-btn
              flat
              dense
              color="grey"
              label="Пропустить"
              @click="this.skipMyTasksOnboarding"
            />
            <div class="my-tasks-onboarding-nav">
              <q-btn
                flat
                dense
                color="primary"
                label="Назад"
                :disable="this.myTasksOnboardingStepIndex === 0"
                @click="this.prevMyTasksOnboardingStep"
              />
              <q-btn
                unelevated
                dense
                color="primary"
                :label="this.isLastMyTasksOnboardingStep ? 'Готово' : 'Далее'"
                @click="this.nextMyTasksOnboardingStep"
              />
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </q-page>
</template>

<script>
import {useStore} from 'stores/store'
import {useRoute} from 'vue-router'
import TaskCard from 'components/TaskCard.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'

export default {

  name: 'MyTasks',

  components: {NoTasksPlaceholder, TaskDialog, TaskCard},

  data: () => ({
    isShowTableMode: false,
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    isFilterSelected: false,
    selectedTask: {},
    searchRequest: '',
    myTasksOnboardingActive: false,
    myTasksOnboardingStepIndex: 0,
    myTasksOnboardingTooltipStyle: {},
    myTasksOnboardingHighlightStyle: {},
    myTasksOnboardingStorageKey: 'my-tasks-page-onboarding-v1',
    myTasksOnboardingSteps: [
      {
        selector: '[data-my-tasks-tour="search"]',
        title: 'Поиск по вашим заявкам',
        text: 'Здесь можно быстро найти свою активную заявку по номеру, названию, статусу, приоритету или исполнителю.',
        placement: 'bottom'
      },
      {
        selector: '[data-my-tasks-tour="task-list"]',
        title: 'Список назначенных заявок',
        text: 'На этом экране собраны заявки, где вы назначены исполнителем. Во время обучения показаны тестовые заявки, после завершения вернутся реальные данные.',
        placement: 'bottom'
      },
      {
        selector: '[data-my-tasks-tour="task-card"]',
        title: 'Карточка заявки',
        text: 'Карточка показывает номер, тему, статус, приоритет, исполнителя, дедлайн и последнюю активность клиента.',
        placement: 'right'
      },
      {
        selector: '[data-my-tasks-tour="task-card"] .task-card-status-container',
        title: 'Статус и индикаторы',
        text: 'В правом верхнем углу видно текущее состояние заявки. Если по заявке есть пинг или важное обновление, рядом появляется отдельный индикатор.',
        placement: 'left'
      },
      {
        selector: '[data-my-tasks-tour="task-card"] table',
        title: 'Ключевые поля заявки',
        text: 'Здесь удобно быстро проверить приоритет, исполнителя, дату создания, дедлайн и последнюю активность без открытия полной карточки.',
        placement: 'right'
      },
      {
        selector: '[data-my-tasks-tour="chat-link"]',
        title: 'Переход в чат клиента',
        text: 'Иконка в углу открывает чат клиента, чтобы посмотреть переписку и ответить без поиска клиента вручную.',
        placement: 'left'
      },
      {
        selector: '[data-my-tasks-tour="second-task-card"]',
        title: 'Разные состояния заявок',
        text: 'Тестовые карточки специально отличаются: одна срочная, другая обычная. Так проще понять, как выглядит очередь в реальной работе.',
        placement: 'right'
      },
      {
        selector: '[data-my-tasks-tour="help"]',
        title: 'Повтор обучения',
        text: 'Этой кнопкой можно снова открыть подсказки по экрану, если нужно быстро вспомнить назначение элементов.',
        placement: 'bottom'
      }
    ]
  }),

  methods: {

    startMyTasksOnboarding(force = false) {
      if (!force && this.isMyTasksOnboardingPassed()) {
        return
      }
      this.isTaskDialogShow = false
      this.isNewTaskDialogShow = false
      this.myTasksOnboardingStepIndex = 0
      this.myTasksOnboardingActive = true
      window.addEventListener('resize', this.updateMyTasksOnboardingPosition)
      window.addEventListener('scroll', this.updateMyTasksOnboardingPosition, true)
      this.$nextTick(() => {
        setTimeout(() => this.updateMyTasksOnboardingPosition(), 120)
      })
    },

    finishMyTasksOnboarding() {
      this.persistMyTasksOnboardingPassed()
      this.stopMyTasksOnboarding()
    },

    skipMyTasksOnboarding() {
      this.persistMyTasksOnboardingPassed()
      this.stopMyTasksOnboarding()
    },

    stopMyTasksOnboarding() {
      this.myTasksOnboardingActive = false
      window.removeEventListener('resize', this.updateMyTasksOnboardingPosition)
      window.removeEventListener('scroll', this.updateMyTasksOnboardingPosition, true)
      this.myTasksOnboardingTooltipStyle = {}
      this.myTasksOnboardingHighlightStyle = {}
      this.$nextTick(() => this.initializeTaskFromUrl())
    },

    isMyTasksOnboardingPassed() {
      try {
        return window.localStorage.getItem(this.myTasksOnboardingStorageKey) === 'true'
      } catch (e) {
        return false
      }
    },

    persistMyTasksOnboardingPassed() {
      try {
        window.localStorage.setItem(this.myTasksOnboardingStorageKey, 'true')
      } catch (e) {
      }
    },

    nextMyTasksOnboardingStep() {
      if (this.isLastMyTasksOnboardingStep) {
        this.finishMyTasksOnboarding()
        return
      }
      this.myTasksOnboardingStepIndex += 1
      this.$nextTick(() => this.scrollToCurrentMyTasksOnboardingStep())
    },

    prevMyTasksOnboardingStep() {
      if (this.myTasksOnboardingStepIndex === 0) {
        return
      }
      this.myTasksOnboardingStepIndex -= 1
      this.$nextTick(() => this.scrollToCurrentMyTasksOnboardingStep())
    },

    scrollToCurrentMyTasksOnboardingStep() {
      const target = document.querySelector(this.myTasksCurrentOnboardingStep.selector)
      if (target) {
        target.scrollIntoView({block: 'center', inline: 'nearest', behavior: 'smooth'})
      }
      setTimeout(() => this.updateMyTasksOnboardingPosition(), 180)
    },

    updateMyTasksOnboardingPosition() {
      if (!this.myTasksOnboardingActive) {
        return
      }

      const step = this.myTasksCurrentOnboardingStep
      const target = step?.selector ? document.querySelector(step.selector) : null

      if (!target) {
        this.myTasksOnboardingHighlightStyle = {
          display: 'none'
        }
        this.myTasksOnboardingTooltipStyle = {
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }
        return
      }

      const rect = target.getBoundingClientRect()
      const padding = 6
      const tooltipWidth = Math.min(360, window.innerWidth - 32)
      const tooltipHeight = 190
      const gap = 14

      this.myTasksOnboardingHighlightStyle = {
        left: `${Math.max(8, rect.left - padding)}px`,
        top: `${Math.max(8, rect.top - padding)}px`,
        width: `${Math.min(window.innerWidth - 16, rect.width + padding * 2)}px`,
        height: `${rect.height + padding * 2}px`
      }

      const preferredPlacement = step.placement || 'bottom'
      let left = rect.left
      let top = rect.bottom + gap

      if (preferredPlacement === 'right') {
        left = rect.right + gap
        top = rect.top
      }
      if (preferredPlacement === 'left') {
        left = rect.left - tooltipWidth - gap
        top = rect.top
      }
      if (preferredPlacement === 'top') {
        left = rect.left
        top = rect.top - tooltipHeight - gap
      }

      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16
      }
      if (left < 16) {
        left = 16
      }
      if (top + tooltipHeight > window.innerHeight - 16) {
        top = Math.max(16, rect.top - tooltipHeight - gap)
      }
      if (top < 16) {
        top = 16
      }

      this.myTasksOnboardingTooltipStyle = {
        left: `${left}px`,
        top: `${top}px`,
        width: `${tooltipWidth}px`
      }
    },

    closeDialog() {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.delete('task')
      this.$router.push({path: this.$route.path, query: Object.fromEntries(queryParams.entries())})
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
    },

    onTaskClicked(task) {
      if (!task || task.__demo) {
        return
      }
      this.isTaskDialogShow = true
      this.selectedTask = task
      this.updateUrlWithTask(task.id)
    },

    updateTask(task, newTask) {
      this.selectedTask = newTask.data
    },

    updateUrlWithTask(openedTaskId) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.set('task', openedTaskId)
      this.$router.push({path: this.$route.path, query: Object.fromEntries(queryParams.entries())})
    },

    initializeTaskFromUrl() {
      if (this.myTasksOnboardingActive) {
        return
      }
      const queryParams = new URLSearchParams(window.location.search)
      const taskIdFromUrl = queryParams.get('task')
      if (!taskIdFromUrl && this.isTaskDialogShow) {
        this.closeDialog()
      }
      if (taskIdFromUrl) {
        const taskFromUrl = this.getFilteredTasks.find(task => task.id === Number(taskIdFromUrl))
        if (taskFromUrl) {
          this.onTaskClicked(taskFromUrl)
        }
      } else {
        this.isNewTaskDialogShow = false
      }
    },

    getChatLink(id, task = null) {
      if (task?.__demo) {
        return '#'
      }
      const origin = window.location.origin
      return `${origin}/chats/${id}`
    },

    onChatLinkClicked(task, event) {
      if (task?.__demo) {
        event?.preventDefault()
        return
      }
      window.location.href = this.getChatLink(task.client.id)
    },

    addMessageToTask(event) {
      this.selectedTask.messages.push(event.message)
    }
  },

  computed: {
    myTasksDisplayedTasks() {
      return this.myTasksOnboardingActive ? this.myTasksOnboardingDemoTasks : this.getFilteredTasks
    },

    myTasksOnboardingDemoTasks() {
      const now = Date.now()
      const currentUser = this.store.currentUser || {
        id: 1,
        firstname: 'Пётр',
        lastname: 'Петров'
      }
      const currentUserId = currentUser.id || 1
      const hasCurrentUser = !!this.store.currentUser?.id

      return [
        {
          __demo: true,
          id: 9101,
          name: 'Не открывается 1С у бухгалтера',
          description: 'Пользователь не может открыть базу после обновления. Нужно проверить доступ к серверу и права.',
          tags: [{id: 1, name: '1 линия'}, {id: 2, name: '1С'}],
          priority: {id: 1, name: 'Критичный', critical: true},
          executor: currentUser,
          status: {id: 1, name: 'В работе'},
          completed: false,
          frozen: false,
          createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(now + 55 * 60 * 1000).toISOString(),
          client: {
            id: 'demo-client-accounting',
            firstname: 'Анна',
            lastname: 'Соколова',
            lastMessage: {
              date: new Date(now - 18 * 60 * 1000).toISOString()
            }
          },
          unreadPingTasksMessages: hasCurrentUser
            ? {
                [currentUserId]: true
              }
            : null,
          messages: []
        },
        {
          __demo: true,
          id: 9102,
          name: 'Настроить доступ новому сотруднику',
          description: 'Создать учетную запись, выдать права на почту, VPN и рабочие папки.',
          tags: [{id: 3, name: 'Доступы'}, {id: 4, name: 'Онбординг'}],
          priority: {id: 2, name: 'Средний', critical: false},
          executor: currentUser,
          status: {id: 2, name: 'Ожидает выполнения'},
          completed: false,
          frozen: false,
          createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
          deadline: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
          client: {
            id: 'demo-client-hr',
            firstname: 'Ирина',
            lastname: 'HR',
            lastMessage: {
              date: new Date(now - 70 * 60 * 1000).toISOString()
            }
          },
          unreadPingTasksMessages: null,
          messages: []
        },
        {
          __demo: true,
          id: 9103,
          name: 'Проверить медленную печать на складе',
          description: 'Принтер печатает с задержкой, нужно проверить очередь печати и сетевое подключение.',
          tags: [{id: 5, name: 'Принтеры'}],
          priority: {id: 3, name: 'Низкий', critical: false},
          executor: currentUser,
          status: {id: 3, name: 'Новая'},
          completed: false,
          frozen: false,
          createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
          deadline: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
          client: {
            id: 'demo-client-storage',
            firstname: 'Склад',
            lastname: '№2',
            lastMessage: {
              date: new Date(now - 25 * 60 * 1000).toISOString()
            }
          },
          unreadPingTasksMessages: null,
          messages: []
        }
      ]
    },

    myTasksCurrentOnboardingStep() {
      return this.myTasksOnboardingSteps[this.myTasksOnboardingStepIndex] || this.myTasksOnboardingSteps[0]
    },

    isLastMyTasksOnboardingStep() {
      return this.myTasksOnboardingStepIndex === this.myTasksOnboardingSteps.length - 1
    },

    getFilteredTasks() {
      return this.store.getTasks.filter(task => task.executor && task.executor.id === this.store.currentUser.id)
        .filter(task => {
          let matchesSearchRequest = true
          if (this.searchRequest) {
            matchesSearchRequest = task.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.id.toString().toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.priority.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              // task.createdAt.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              task.status.name.toLowerCase().includes(this.searchRequest.toLowerCase()) ||
              (task.executor.firstname + ' ' + task.executor.lastname).toLowerCase().includes(this.searchRequest.toLowerCase())
          }
          return !task.completed && matchesSearchRequest
        })
    },

    isMobile() {
      return this.$q.screen.width < 1023
    }
  },

  mounted() {
    setTimeout(() => this.initializeTaskFromUrl(), 300)
    setTimeout(() => {
      const queryParams = new URLSearchParams(window.location.search)
      if (!queryParams.get('task')) {
        this.startMyTasksOnboarding(false)
      }
    }, 500)
    document.title = 'ULDESK : Мои заявки'
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.updateMyTasksOnboardingPosition)
    window.removeEventListener('scroll', this.updateMyTasksOnboardingPosition, true)
  },

  watch: {
    '$route'(to) {
      this.initializeTaskFromUrl()
    }
  },

  setup() {
    const store = useStore()
    const router = useRoute()
    return {store, router}
  }

}
</script>

<style scoped>
.card {
  border-radius: 5px;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 10px;
  width: 300px;
  display: inline-block;
  text-decoration: none;
  color: black;
  margin-left: 8px;
  margin-right: 8px;
  margin-bottom: 8px
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
  transition: transform .3s ease;
  width: 60px;
  z-index: 1;
}

.link-container {
  color: var(--q-primary);
  display: flex;
  font-size: 15px;
  margin-left: 3px;
  padding: 0;
  text-decoration: none;
  transition: transform .3s ease;
  width: 50%;
  position: absolute;
  right: 25%;
  bottom: 0;
  height: 50%;
}

.link {
  position: absolute;
  height: 100%;
  width: 100%;
  transform: rotate(-45deg);
}

.link-to-chat-container:hover {
  transform: rotate(45deg) scale(1.2);
}

.task-card:hover {
  .link-to-chat-container {
    display: unset;
  }
}

a:visited {
  text-decoration: none;
}

a:hover {
  text-decoration: none;
}

a:focus {
  text-decoration: none;
}

a:hover, a:active {
  text-decoration: none;
}

.my-tasks-page {
  position: relative;
}

.my-tasks-onboarding-mode .my-tasks-demo-task-card {
  background: #fff;
}

.my-tasks-onboarding-mode .link-to-chat-container {
  display: unset;
}

.my-tasks-onboarding-layer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: none;
}

.my-tasks-onboarding-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.my-tasks-onboarding-highlight {
  position: fixed;
  border: 3px solid var(--q-primary);
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 20px rgba(120, 90, 255, 0.45);
  background: rgba(255, 255, 255, 0.08);
  z-index: 10001;
  pointer-events: none;
  transition: all 0.18s ease;
}

.my-tasks-onboarding-tooltip {
  position: fixed;
  z-index: 10002;
  background: #fff;
  color: #111;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.26);
  padding: 16px;
  pointer-events: auto;
  transition: top 0.18s ease, left 0.18s ease;
}

.my-tasks-onboarding-progress {
  text-align: right;
  color: #757575;
  font-size: 13px;
  margin-bottom: 4px;
}

.my-tasks-onboarding-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.my-tasks-onboarding-text {
  font-size: 14px;
  line-height: 1.45;
  margin-bottom: 14px;
}

.my-tasks-onboarding-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.my-tasks-onboarding-nav {
  display: flex;
  gap: 8px;
}

</style>
