<template>
  <q-page padding style="min-width: 0;overflow-x: hidden;">
    <div
      v-if="shouldShowChatsToolbar"
      class="search-sort-row"
    >
      <q-input
        v-model="searchQuery"
        dense
        data-tour="chat-search"
        placeholder="Поиск по клиенту или организации..."
        @input="search"
        clearable
        class="search-sort-row__search"
        @clear="searchQuery = ''"
      >
        <template v-slot:append>
          <q-icon
            name="search"
          />
        </template>
      </q-input>

      <q-select
        v-model="sortType"
        data-tour="chat-sort"
        :options="sortOptions"
        dense
        outlined
        emit-value
        map-options
        options-dense
        class="search-sort-row__sort"
      />

<!--      <q-btn>-->
<!--        <q-tooltip>Новый пользователь</q-tooltip>-->
<!--      </q-btn>-->

      <q-btn
        flat
        dense
        round
        icon="help_outline"
        color="primary"
        @click="startOnboarding(true)"
      >
        <q-tooltip>Показать обучение</q-tooltip>
      </q-btn>
    </div>
    <div v-if="this.getSortedAndFilteredClients.length > 0">
      <q-list>
        <div
          v-for="client in this.getSortedAndFilteredClients"
          :key="client.id"
        >
          <q-item
            clickable
            class="client-row-item"
            :data-tour="isFirstClient(client) ? 'client-row' : null"
          >
            <q-item-section class="client-row-main">
              <router-link
                :to="getClientChatRoute(client)"
                class="text-primary client-row-link"
                @click="preventOnboardingDemoNavigation(client, $event)"
              >
                <q-item-section
                  side
                  class="client-avatar-section"
                >
                  <div
                    class="client-avatar"
                    :style="'background-color: ' + this.nameToPastelHex(`${client.lastname} ${client.firstname}`)"
                  >
                    {{ this.getAbbreviation(client) }}
                  </div>
                </q-item-section>
                <q-item-section class="client-info-section">
                  <q-item-label
                    class="client-name-row"
                    :data-tour="isFirstClient(client) ? 'client-name' : null"
                  >
                    <img
                      v-if="client.messageFrom === 'TELEGRAM'"
                      src="/telegram.png"
                      alt="tg"
                      class="client-channel-icon"
                    >
                    <img
                      v-else-if="client.messageFrom === 'WHATSAPP'"
                      src="/whatsapp.png"
                      alt="wa"
                      class="client-channel-icon"
                    >
                    <img
                      v-else-if="client.messageFrom === 'EMAIL'"
                      src="/email.png"
                      alt="email"
                      class="client-channel-icon"
                    >
                    <span class="client-name-text">
                      {{ client.lastname }} {{ client.firstname }}
                    </span>
                    <div
                      v-if="getOpenTasksCount(client) > 0"
                      class="client-open-tasks-counter"
                      :data-tour="isFirstClient(client) ? 'client-tasks-count' : null"
                      title="Открытые заявки"
                    >
                      <q-icon
                        name="description"
                        class="client-open-tasks-counter__icon"
                      />

                      <span class="client-open-tasks-counter__value">
                        {{ getOpenTasksCount(client) }}
                      </span>
                    </div>
                    <div class="row items-center no-wrap">
                      <div
                        v-if="isSlaVisible(client)"
                        class="sla-pill q-ml-sm"
                        :class="{ 'sla-pill--expired': isClientSlaExpired(client) }"
                        :data-tour="isFirstClient(client) ? 'client-sla' : null"
                      >
                        <q-linear-progress
                          :value="getClientSlaPercent(client) ?? 0"
                          :color="isClientSlaExpired(client) ? 'negative' : getClientSlaColor(client)"
                          :track-color="isClientSlaExpired(client) ? 'negative-2' : 'grey-3'"
                          reverse
                          rounded
                          class="sla-bar"
                          style="width: 80px; border: solid 1px darkgray"
                          size="12px"
                          :animation-speed="0"
                        >
                          <q-tooltip
                            anchor="top middle"
                            self="bottom middle"
                            :offset="[10, 10]"
                          >
                            Минимальный SLA среди заявок
                          </q-tooltip>
                        </q-linear-progress>
                      </div>
                    </div>
                  </q-item-label>
                  <q-item-label
                    caption
                  >
                    <PluginExtensionPoint
                      point="CHAT_CLIENT_ROW_INFO"
                      entity-type="CLIENT"
                      :entity="client"
                      :context="{ client }"
                    />
                  </q-item-label>
                  <q-item-label
                    caption
                  >
                    {{ this.getOrganization(client) }}
                  </q-item-label>
                  <q-item-label
                    class="shorten-text"
                    caption
                    :data-tour="isFirstClient(client) ? 'client-last-message' : null"
                    :class="client.lastMessage.deleted ? 'strikethrough' : ''"
                  >
                    {{ this.getTimeLastMessage(client) }}
                    <q-icon
                      v-if="this.getLastMessageIcon(client)"
                      :name="this.getLastMessageIcon(client)"
                      size="16px"
                      class="q-mr-xs"
                    />
                    {{ this.getLastMessage(client) }}
                  </q-item-label>
                </q-item-section>
                <div
                  v-if="client.unreadMessagesCount || hasAnswerRequiredUnansweredMessages(client) || hasCriticalTasks(client) || isHavePing(client)"
                  class="client-row-alerts"
                  :data-tour="isFirstClient(client) ? 'client-alerts' : null"
                >
                  <q-separator vertical class="client-row-alerts__separator"/>

                  <div class="client-row-alerts__content">
                    <q-icon
                      v-if="hasCriticalTasks(client)"
                      name="priority_high"
                      class="text-red client-critical-icon"
                    >
                      <q-tooltip
                        anchor="center left"
                        self="center right"
                        :offset="[10, 10]"
                      >
                        Критическая заявка
                      </q-tooltip>
                    </q-icon>

                    <span
                      v-if="hasAnswerRequiredUnansweredMessages(client)"
                      class="unanswered-timer"
                    >
                      {{ getAnswerRequiredTimerText(client) }}
                    </span>

                    <circle-counter
                      v-if="client.unreadMessagesCount"
                      :counter="client.unreadMessagesCount"
                    />

                    <circle-counter
                      v-if="isHavePing(client)"
                      :image="'/at.svg'"
                      class="client-ping-counter"
                    />
                  </div>
                </div>
              </router-link>
            </q-item-section>
          </q-item>
          <q-separator/>
        </div>
      </q-list>
    </div>
    <div v-else class="absolute-center" data-tour="empty-state">
      <div style="text-align: center;font-size: 20px">
        {{ searchQuery.trim() ? 'Ничего не найдено' : 'Чатов нет' }}
        <no-tasks-placeholder/>
      </div>
    </div>

    <div
      v-if="isOnboardingVisible && currentOnboardingStep"
      class="onboarding-overlay"
    >
      <div
        v-if="onboardingHighlightStyle"
        class="onboarding-highlight"
        :style="onboardingHighlightStyle"
      />

      <q-card
        class="onboarding-card"
        :style="onboardingCardStyle"
      >
        <q-card-section class="q-pb-sm">
          <div class="onboarding-card__step">
            Шаг {{ getCurrentOnboardingStepNumber() }} из {{ getAvailableOnboardingStepsCount() }}
          </div>
          <div class="onboarding-card__title">
            {{ currentOnboardingStep.title }}
          </div>
          <div class="onboarding-card__text">
            {{ currentOnboardingStep.text }}
          </div>
        </q-card-section>

        <q-card-actions align="between" class="q-pt-none">
          <q-btn
            flat
            dense
            color="grey-7"
            label="Пропустить"
            @click="skipOnboarding"
          />

          <div class="row items-center q-gutter-xs">
            <q-btn
              flat
              dense
              color="primary"
              label="Назад"
              :disable="!hasPreviousOnboardingStep()"
              @click="previousOnboardingStep"
            />
            <q-btn
              unelevated
              dense
              color="primary"
              :label="hasNextOnboardingStep() ? 'Далее' : 'Готово'"
              @click="nextOnboardingStep"
            />
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'
import CircleCounter from 'components/CircleCounter.vue'
import moment from 'moment'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'
import axios from 'axios'
import PluginExtensionPoint from 'src/plugins/PluginExtensionPoint.vue'

export default {
  name: 'DialogsPage',

  components: {
    NoTasksPlaceholder,
    CircleCounter,
    PluginExtensionPoint
  },

  data: () => ({
    searchQuery: '',
    sortType: 'ANSWER_WAIT',
    sortOptions: [
      {
        label: 'По времени ожидания',
        value: 'ANSWER_WAIT'
      },
      {
        label: 'По минимальному SLA среди заявок',
        value: 'MIN_SLA'
      },
      {
        label: 'По времени последнего сообщения',
        value: 'LAST_MESSAGE'
      },
      {
        label: 'Пинги',
        value: 'PINGS'
      },
      {
        label: 'Непрочитанные сообщения',
        value: 'UNREAD_MESSAGES'
      },
      {
        label: 'Заявки без исполнителя',
        value: 'TASKS_WITHOUT_ASSIGNEE'
      }
    ],
    nowTs: Date.now(),
    slaTimer: null,
    // taskId -> SlaInfoDto
    slaInfoByTaskId: {},
    // taskId -> boolean (чтобы не спамить запросами)
    slaInfoLoading: {},

    isOnboardingVisible: false,
    currentOnboardingStepIndex: 0,
    onboardingCardStyle: {},
    onboardingHighlightStyle: null,
    onboardingStorageKey: 'clients-chats-onboarding-v3',
    onboardingDemoClients: [
      {
        id: '__onboarding_demo_client_1__',
        isOnboardingDemoClient: true,
        firstname: 'Иван',
        lastname: 'Петров',
        messageFrom: 'TELEGRAM',
        sourceChannel: 'Telegram',
        organization: {
          name: 'ООО «Северный офис»'
        },
        unreadMessagesCount: 2,
        demoPingCount: 1,
        lastMessage: {
          date: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          text: 'Здравствуйте! Не получается подключиться к рабочему VPN.'
        },
        messages: [
          {
            id: '__onboarding_demo_message_1_1__',
            date: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
            text: 'Здравствуйте! Не получается подключиться к рабочему VPN.',
            isSent: false,
            isComment: false,
            deleted: false,
            answerRequired: 'ANSWER_REQUIRED'
          },
          {
            id: '__onboarding_demo_message_1_2__',
            date: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
            text: 'Подскажите, пожалуйста, когда сможете посмотреть?',
            isSent: false,
            isComment: false,
            deleted: false,
            answerRequired: 'ANSWER_REQUIRED'
          }
        ],
        tasks: [
          {
            id: null,
            title: 'Проверить доступ к VPN',
            completed: false,
            priority: {
              critical: true
            },
            sla: {
              startDate: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
              duration: 'PT45M'
            },
            unreadPingTasksMessages: {
              onboarding: 1
            }
          }
        ]
      },
      {
        id: '__onboarding_demo_client_2__',
        isOnboardingDemoClient: true,
        firstname: 'Мария',
        lastname: 'Смирнова',
        messageFrom: 'EMAIL',
        sourceChannel: 'Email',
        organization: {
          name: 'ИП Смирнова'
        },
        unreadMessagesCount: 1,
        demoPingCount: 0,
        lastMessage: {
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          text: 'Прикладываю скриншот ошибки при входе в личный кабинет.'
        },
        messages: [
          {
            id: '__onboarding_demo_message_2_1__',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            text: 'Прикладываю скриншот ошибки при входе в личный кабинет.',
            isSent: false,
            isComment: false,
            deleted: false,
            answerRequired: 'ANSWER_REQUIRED'
          }
        ],
        tasks: [
          {
            id: null,
            title: 'Восстановить доступ к личному кабинету',
            completed: false,
            priority: {
              critical: false
            },
            sla: {
              startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              duration: 'PT6H'
            }
          },
          {
            id: null,
            title: 'Назначить исполнителя по обращению',
            completed: false,
            priority: {
              critical: false
            }
          }
        ]
      },
      {
        id: '__onboarding_demo_client_3__',
        isOnboardingDemoClient: true,
        firstname: 'Алексей',
        lastname: 'Орлов',
        messageFrom: 'WHATSAPP',
        sourceChannel: 'WhatsApp',
        organization: {
          name: 'ООО «Ромашка»'
        },
        unreadMessagesCount: 0,
        demoPingCount: 0,
        lastMessage: {
          date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
          text: 'Спасибо, всё заработало.'
        },
        messages: [
          {
            id: '__onboarding_demo_message_3_1__',
            date: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
            text: 'Добрый день, принтер не печатает.',
            isSent: false,
            isComment: false,
            deleted: false,
            answerRequired: 'ANSWER_REQUIRED'
          },
          {
            id: '__onboarding_demo_message_3_2__',
            date: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
            text: 'Проверьте, пожалуйста, очередь печати и перезапустите службу.',
            isSent: true,
            isComment: false,
            deleted: false
          },
          {
            id: '__onboarding_demo_message_3_3__',
            date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
            text: 'Спасибо, всё заработало.',
            isSent: false,
            isComment: false,
            deleted: false,
            answerRequired: 'ANSWER_NOT_REQUIRED'
          }
        ],
        tasks: []
      }
    ],
    onboardingSteps: [
      {
        selector: '[data-tour="chat-search"]',
        placement: 'bottom',
        title: 'Поиск по клиентам',
        text: 'Здесь можно быстро найти чат по имени клиента, организации или каналу обращения.'
      },
      {
        selector: '[data-tour="chat-sort"]',
        placement: 'bottom',
        title: 'Сортировка очереди',
        text: 'Переключайте порядок списка: по времени ожидания, SLA, последнему сообщению, пингам, непрочитанным или заявкам без исполнителя.'
      },
      {
        selector: '[data-tour="client-row"]',
        placement: 'bottom',
        title: 'Строка клиента',
        text: 'Каждая строка — это клиентский диалог. Нажмите на строку, чтобы открыть чат и карточку клиента.'
      },
      {
        selector: '[data-tour="client-name"]',
        placement: 'right',
        title: 'Канал и имя клиента',
        text: 'Иконка показывает источник обращения, рядом отображается имя клиента.'
      },
      {
        selector: '[data-tour="client-tasks-count"]',
        placement: 'right',
        title: 'Активные заявки',
        text: 'Число рядом с иконкой заявки показывает, сколько открытых задач связано с этим клиентом.'
      },
      {
        selector: '[data-tour="client-sla"]',
        placement: 'right',
        title: 'Минимальный SLA',
        text: 'Полоса показывает самый срочный SLA среди открытых заявок клиента. Чем меньше осталось времени, тем тревожнее цвет.'
      },
      {
        selector: '[data-tour="client-alerts"]',
        placement: 'left',
        title: 'Индикаторы внимания',
        text: 'Здесь отображаются критичность, время ожидания ответа, непрочитанные сообщения и пинги.'
      },
      {
        selector: '[data-tour="client-last-message"]',
        placement: 'top',
        title: 'Последнее сообщение',
        text: 'Эта строка помогает быстро понять, когда клиент писал последний раз и о чём было сообщение.'
      },
      {
        selector: '[data-tour="empty-state"]',
        placement: 'top',
        title: 'Пока чатов нет',
        text: 'Когда появятся обращения клиентов, они будут отображаться на этом экране списком.'
      }
    ]
  }),

  methods: {
    isOnboardingDemoClient (client) {
      return client?.isOnboardingDemoClient === true
    },

    getClientChatRoute (client) {
      if (this.isOnboardingDemoClient(client)) {
        return this.$route?.fullPath || '/chats'
      }
      return `/chats/${client.id}`
    },

    preventOnboardingDemoNavigation (client, event) {
      if (!this.isOnboardingDemoClient(client)) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
    },

    isFirstClient (client) {
      return this.getSortedAndFilteredClients[0]?.id === client?.id
    },

    startOnboarding (force = false) {
      if (!force && localStorage.getItem(this.onboardingStorageKey) === 'skipped') {
        return
      }
      this.isOnboardingVisible = true
      this.currentOnboardingStepIndex = 0
      this.$nextTick(() => this.normalizeOnboardingStep())
    },

    skipOnboarding () {
      localStorage.setItem(this.onboardingStorageKey, 'skipped')
      this.isOnboardingVisible = false
      this.onboardingHighlightStyle = null
    },

    getOnboardingTarget (step = this.currentOnboardingStep) {
      if (!step?.selector) {
        return null
      }
      return document.querySelector(step.selector)
    },

    findAvailableOnboardingStepIndex (startIndex, direction) {
      let index = startIndex
      while (index >= 0 && index < this.onboardingSteps.length) {
        if (this.getOnboardingTarget(this.onboardingSteps[index])) {
          return index
        }
        index += direction
      }
      return null
    },

    normalizeOnboardingStep () {
      if (!this.isOnboardingVisible) {
        return
      }

      if (!this.getOnboardingTarget()) {
        const nextIndex = this.findAvailableOnboardingStepIndex(this.currentOnboardingStepIndex, 1)
        const previousIndex = this.findAvailableOnboardingStepIndex(this.currentOnboardingStepIndex, -1)
        const firstIndex = this.findAvailableOnboardingStepIndex(0, 1)
        const index = nextIndex ?? previousIndex ?? firstIndex

        if (index === null) {
          this.isOnboardingVisible = false
          return
        }
        this.currentOnboardingStepIndex = index
      }

      this.updateOnboardingPosition()
    },

    updateOnboardingPosition () {
      if (!this.isOnboardingVisible || !this.currentOnboardingStep) {
        return
      }

      const target = this.getOnboardingTarget()
      if (!target) {
        this.normalizeOnboardingStep()
        return
      }

      const rect = target.getBoundingClientRect()
      const gap = 12
      const padding = 8
      const cardWidth = Math.min(360, window.innerWidth - 24)
      let top = rect.bottom + gap
      let left = rect.left

      if (this.currentOnboardingStep.placement === 'right') {
        top = rect.top + rect.height / 2 - 90
        left = rect.right + gap
      }

      if (this.currentOnboardingStep.placement === 'left') {
        top = rect.top + rect.height / 2 - 90
        left = rect.left - cardWidth - gap
      }

      if (this.currentOnboardingStep.placement === 'top') {
        top = rect.top - 190
        left = rect.left
      }

      if (left + cardWidth + 12 > window.innerWidth) {
        left = window.innerWidth - cardWidth - 12
      }
      if (left < 12) {
        left = 12
      }
      if (top < 12) {
        top = rect.bottom + gap
      }
      if (top > window.innerHeight - 210) {
        top = Math.max(12, window.innerHeight - 210)
      }

      this.onboardingCardStyle = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${cardWidth}px`
      }

      this.onboardingHighlightStyle = {
        top: `${Math.max(4, rect.top - padding)}px`,
        left: `${Math.max(4, rect.left - padding)}px`,
        width: `${rect.width + padding * 2}px`,
        height: `${rect.height + padding * 2}px`
      }
    },

    hasNextOnboardingStep () {
      return this.findAvailableOnboardingStepIndex(this.currentOnboardingStepIndex + 1, 1) !== null
    },

    hasPreviousOnboardingStep () {
      return this.findAvailableOnboardingStepIndex(this.currentOnboardingStepIndex - 1, -1) !== null
    },

    nextOnboardingStep () {
      const nextIndex = this.findAvailableOnboardingStepIndex(this.currentOnboardingStepIndex + 1, 1)
      if (nextIndex === null) {
        this.skipOnboarding()
        return
      }
      this.currentOnboardingStepIndex = nextIndex
      this.$nextTick(() => this.updateOnboardingPosition())
    },

    previousOnboardingStep () {
      const previousIndex = this.findAvailableOnboardingStepIndex(this.currentOnboardingStepIndex - 1, -1)
      if (previousIndex === null) {
        return
      }
      this.currentOnboardingStepIndex = previousIndex
      this.$nextTick(() => this.updateOnboardingPosition())
    },

    getAvailableOnboardingStepsCount () {
      return this.onboardingSteps.filter(step => this.getOnboardingTarget(step)).length || 1
    },

    getCurrentOnboardingStepNumber () {
      const availableIndexes = this.onboardingSteps
        .map((step, index) => this.getOnboardingTarget(step) ? index : null)
        .filter(index => index !== null)
      const currentIndex = availableIndexes.indexOf(this.currentOnboardingStepIndex)
      return currentIndex === -1 ? 1 : currentIndex + 1
    },

    nameToPastelHex (name) {
      let hash = 0
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
      }

      let r = (hash & 0xFF0000) >> 16
      let g = (hash & 0x00FF00) >> 8
      let b = hash & 0x0000FF

      r = Math.floor((r + 255) / 2)
      g = Math.floor((g + 255) / 2)
      b = Math.floor((b + 255) / 2)

      const pastelHex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

      return pastelHex
    },

    getActualTasks (client) {
      if (this.isOnboardingDemoClient(client)) {
        return (client.tasks || []).filter(task => !task.completed)
      }
      return []
    },

    getOpenTasksCount (client) {
      if (this.isOnboardingDemoClient(client)) {
        return this.getActualTasks(client).length
      }
      return Number(client?.openTasksCount || 0)
    },

    getClientSlaPreviewTask (client) {
      if (this.isOnboardingDemoClient(client)) {
        return this.getMinimalSlaTask(this.getActualTasks(client))
      }
      if (!client?.minimalSlaTaskId || !client?.minimalSlaStartDate || !client?.minimalSlaDurationSeconds) {
        return null
      }
      return {
        id: client.minimalSlaTaskId,
        completed: false,
        frozen: false,
        sla: {
          startDate: client.minimalSlaStartDate,
          duration: Number(client.minimalSlaDurationSeconds)
        },
        slaInfo: {
          paused: client.minimalSlaPaused === true,
          deadline: client.minimalSlaDeadline
        }
      }
    },

    search () {
    },

    getOrganization (client) {
      if (client.organization) {
        return client.organization.name
      } else {
        return ''
      }
    },

    getSlaLeftMs (task) {
      return this.getSlaLeftMsApprox(task)
    },

    getSlaTotalMs (task) {
      const info = this.getTaskSlaInfo(task)
      const durations = [
        task?.sla?.duration,
        task?.slaDuration,
        task?.sla?.totalDuration,
        task?.slaTotalDuration,
        info?.duration,
        info?.totalDuration,
        info?.slaDuration,
        info?.durationSeconds,
        info?.totalSeconds,
        info?.totalDurationSeconds,
        info?.slaDurationSeconds
      ]
      for (const duration of durations) {
        const ms = this.parseIsoDurationToMs(duration)
        if (Number.isFinite(ms) && ms > 0) {
          return ms
        }
      }
      return 0
    },

    getTaskSlaInfo (task) {
      if (!task) {
        return null
      }
      return this.getSlaInfo(task) || task.slaInfo || task.slaInfoDto || task.slaStatus || null
    },

    getTaskSlaTags (task) {
      const tags = task?.tags || task?.labels || []
      if (!Array.isArray(tags)) {
        return []
      }
      return tags
        .map(tag => {
          if (typeof tag === 'string') {
            return tag
          }
          return tag?.name || tag?.title || tag?.label || tag?.value || ''
        })
        .filter(Boolean)
    },

    isTaskSlaExpiredByFlags (task) {
      if (!task) {
        return false
      }
      if (task.slaExpired === true || task.slaOverdue === true || task.slaViolated === true || task.deadlineOverdue === true) {
        return true
      }
      return this.getTaskSlaTags(task).some(tag => {
        const normalized = tag.toLowerCase()
        return normalized.includes('sla наруш') ||
          normalized.includes('sla просроч') ||
          normalized.includes('просроч') ||
          normalized.includes('overdue')
      })
    },

    hasTaskSla (task) {
      if (!task || task.completed || task.frozen) {
        return false
      }
      const totalMs = this.getSlaTotalMs(task)
      if (!Number.isFinite(totalMs) || totalMs <= 0) {
        return false
      }
      const info = this.getTaskSlaInfo(task)
      const startDate = task?.sla?.startDate || task?.slaStartDate
      return !!(
        startDate ||
        info?.deadline ||
        Number.isFinite(Number(info?.remainingSeconds)) ||
        this.isTaskSlaExpiredByFlags(task)
      )
    },

    parseIsoDurationToMs (duration) {
      if (!duration) {
        return 0
      }

      if (typeof duration.asMilliseconds === 'function') {
        const ms = duration.asMilliseconds()
        return Number.isFinite(ms) && ms > 0 ? ms : 0
      }

      if (typeof duration === 'number') {
        return duration * 1000
      }
      if (typeof duration === 'object') {
        if (Number.isFinite(duration.seconds)) {
          return duration.seconds * 1000
        }
        if (Number.isFinite(duration._milliseconds)) {
          return duration._milliseconds
        }
        if (Number.isFinite(duration.milliseconds)) {
          return duration.milliseconds
        }
      }
      if (typeof duration === 'string') {
        const parsed = Number(duration)
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed * 1000
        }
        const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
        if (match) {
          const days = Number(match[1] || 0)
          const hours = Number(match[2] || 0)
          const minutes = Number(match[3] || 0)
          const seconds = Number(match[4] || 0)
          return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000
        }
      }
      return 0
    },

    isSlaExpired (tasks) {
      const task = this.getMinimalSlaTask(tasks)
      if (!task) return false
      const leftMs = this.getSlaLeftMsApprox(task)
      return leftMs !== null && leftMs <= 0
    },

    getMinimalSlaTask (tasks) {
      const withSla = (tasks || []).filter(task => this.hasTaskSla(task))
      if (withSla.length === 0) {
        return null
      }
      // Берём самую срочную заявку — с минимальным оставшимся временем.
      // Важно учитывать данные /sla/info по каждой заявке, иначе просроченная
      // заявка может потеряться, а в строке клиента будет показан зелёный SLA
      // от другой заявки.
      return withSla.reduce((best, task) => {
        const bestLeft = this.getSlaLeftMsApprox(best)
        const taskLeft = this.getSlaLeftMsApprox(task)
        return taskLeft !== null && (bestLeft === null || taskLeft < bestLeft) ? task : best
      }, withSla[0])
    },

    getSlaPercent (tasks) {
      const task = this.getMinimalSlaTask(tasks)
      if (!task) {
        return null
      }
      const totalMs = this.getSlaTotalMs(task)
      const leftMs = this.getSlaLeftMsApprox(task)
      if (!Number.isFinite(totalMs) || totalMs <= 0 || leftMs === null) {
        return null
      }
      return Math.max(0, Math.min(1, leftMs / totalMs))
    },

    getSlaColor (tasks) {
      const p = this.getSlaPercent(tasks)
      if (p === null) return 'grey'
      if (p > 0.5) {
        return 'green'
      } else if (p > 0.25) {
        return 'orange'
      } else {
        return 'red'
      }
    },

    getTimeLastMessage (client) {
      if (client.lastMessage) {
        const dateFormatted = new Date(client.lastMessage.date)
        const currentDate = new Date()
        const timeDifference = currentDate - dateFormatted
        const seconds = Math.floor(timeDifference / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)
        const years = Math.floor(days / 365)

        const declension = (number, words) => {
          return words[
            (number % 10 === 1 && number % 100 !== 11) ? 0
              : (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 10 || number % 100 >= 20)) ? 1
                : 2
            ]
        }

        let result
        if (years > 0) {
          result = `${years} ${declension(years, ['год', 'года', 'лет'])}`
        } else if (days > 0) {
          result = `${days} ${declension(days, ['день', 'дня', 'дней'])}`
        } else if (hours > 0) {
          result = `${hours} ${declension(hours, ['час', 'часа', 'часов'])}`
        } else {
          result = `${minutes} ${declension(minutes, ['минута', 'минуты', 'минут'])}`
        }
        // назад (${dateFormatted.toLocaleTimeString('ru-RU', {
        //   timeZone: 'Europe/Moscow',
        //   year: 'numeric',
        //   month: 'numeric',
        //   day: 'numeric',
        //   hour: '2-digit',
        //   minute: '2-digit'
        // })})
        return `${result} назад`
      }
    },

    hasAnswerRequiredUnansweredMessages (client) {
      return !!this.getLastAnswerRequiredUnansweredMessageDate(client)
    },

    getAnswerRequiredTimerText (client) {
      const date = this.getLastAnswerRequiredUnansweredMessageDate(client)
      if (!date) {
        return ''
      }
      const startMs = new Date(date).getTime()
      if (!Number.isFinite(startMs)) {
        return ''
      }
      const diffMs = Math.max(0, this.nowTs - startMs)
      const totalMinutes = Math.floor(diffMs / 60000)
      const days = Math.floor(totalMinutes / 1440)
      const hours = Math.floor((totalMinutes % 1440) / 60)
      const minutes = totalMinutes % 60
      if (days > 0) {
        return `${days}д ${hours}ч`
      }
      if (hours > 0) {
        return `${hours}ч ${minutes}м`
      }
      return `${minutes}м`
    },

    getClientMessages (client) {
      return client?.messages || client?.clientMessages || []
    },

    isIncomingMessage (message) {
      return message &&
        message.isSent === false &&
        message.isComment !== true &&
        message.deleted !== true
    },

    isOutgoingOperatorMessage (message) {
      return message &&
        message.isSent === true &&
        message.isComment !== true &&
        message.deleted !== true
    },

    getLastAnswerRequiredUnansweredMessageDate (client) {
      const messages = [...this.getClientMessages(client)]
        .filter(message => message?.date && message.deleted !== true)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      if (messages.length === 0) {
        return client.firstUnansweredMessageDate || null
      }
      let lastOperatorAnswerMs = 0
      messages.forEach(message => {
        if (this.isOutgoingOperatorMessage(message)) {
          const dateMs = new Date(message.date).getTime()
          if (Number.isFinite(dateMs)) {
            lastOperatorAnswerMs = Math.max(lastOperatorAnswerMs, dateMs)
          }
        }
      })
      const unansweredIncomingMessages = messages.filter(message => {
        const dateMs = new Date(message.date).getTime()
        return this.isIncomingMessage(message) &&
          Number.isFinite(dateMs) &&
          dateMs > lastOperatorAnswerMs
      })
      if (unansweredIncomingMessages.length === 0) {
        return null
      }
      const lastMarkedMessage = [...unansweredIncomingMessages]
        .reverse()
        .find(message =>
          message.answerRequired === 'ANSWER_REQUIRED' ||
          message.answerRequired === 'ANSWER_NOT_REQUIRED'
        )
      if (!lastMarkedMessage || lastMarkedMessage.answerRequired !== 'ANSWER_REQUIRED') {
        return null
      }
      return lastMarkedMessage.date
    },

    getAnswerRequiredWaitMs (client) {
      const date = this.getLastAnswerRequiredUnansweredMessageDate(client)
      if (!date) {
        return 0
      }
      const startMs = new Date(date).getTime()
      if (!Number.isFinite(startMs)) {
        return 0
      }
      return Math.max(0, this.nowTs - startMs)
    },

    getLastMessageDateMs (client) {
      const dateMs = new Date(client?.lastMessage?.date || 0).getTime()
      return Number.isFinite(dateMs) ? dateMs : 0
    },

    getClientMinimalSlaLeftMs (client) {
      const task = this.getClientSlaPreviewTask(client)
      if (!task) {
        return null
      }
      return this.getSlaLeftMsApprox(task)
    },

    sortByAnswerWait (a, b) {
      const waitA = this.getAnswerRequiredWaitMs(a)
      const waitB = this.getAnswerRequiredWaitMs(b)
      const hasRequiredA = waitA > 0
      const hasRequiredB = waitB > 0
      if (hasRequiredA !== hasRequiredB) {
        return hasRequiredB ? 1 : -1
      }
      if (waitA !== waitB) {
        return waitB - waitA
      }
      return this.sortByLastMessage(a, b)
    },

    sortByMinimalSla (a, b) {
      const slaA = this.getClientMinimalSlaLeftMs(a)
      const slaB = this.getClientMinimalSlaLeftMs(b)
      const hasSlaA = slaA !== null
      const hasSlaB = slaB !== null
      if (hasSlaA !== hasSlaB) {
        return hasSlaB ? 1 : -1
      }
      if (hasSlaA && slaA !== slaB) {
        return slaA - slaB
      }
      return this.sortByLastMessage(a, b)
    },

    getUnreadMessagesCount (client) {
      return Number(client?.unreadMessagesCount || 0)
    },

    getClientPingScore (client) {
      if (this.isOnboardingDemoClient(client)) {
        return Number(client.demoPingCount || 0)
      }
      const userId = this.store.currentUser?.id
      if (!userId || !client) {
        return 0
      }
      let count = 0
      const clientPing = client.unreadPingMessages?.[userId]
      if (typeof clientPing === 'number') {
        count += clientPing
      } else if (clientPing) {
        count += 1
      }
      count += Number(client.taskPingCount || 0)
      return count
    },

    isTaskWithoutAssignee (task) {
      if (!task || task.completed) {
        return false
      }
      return !task.executor &&
        !task.executorId &&
        !task.assignee &&
        !task.assigneeId &&
        !task.assignedUser &&
        !task.assignedUserId &&
        !task.performer &&
        !task.performerId &&
        !task.responsible &&
        !task.responsibleId &&
        !task.user &&
        !task.userId &&
        !task.operator &&
        !task.operatorId
    },

    getTasksWithoutAssigneeCount (client) {
      if (this.isOnboardingDemoClient(client)) {
        return this.getActualTasks(client).filter(task => this.isTaskWithoutAssignee(task)).length
      }
      return Number(client?.tasksWithoutAssigneeCount || 0)
    },

    sortByPings (a, b) {
      const pingA = this.getClientPingScore(a)
      const pingB = this.getClientPingScore(b)
      if (pingA !== pingB) {
        return pingB - pingA
      }
      return this.sortByLastMessage(a, b)
    },

    sortByUnreadMessages (a, b) {
      const unreadA = this.getUnreadMessagesCount(a)
      const unreadB = this.getUnreadMessagesCount(b)
      if (unreadA !== unreadB) {
        return unreadB - unreadA
      }
      return this.sortByLastMessage(a, b)
    },

    sortByTasksWithoutAssignee (a, b) {
      const countA = this.getTasksWithoutAssigneeCount(a)
      const countB = this.getTasksWithoutAssigneeCount(b)
      if (countA !== countB) {
        return countB - countA
      }
      return this.sortByLastMessage(a, b)
    },

    sortByLastMessage (a, b) {
      return this.getLastMessageDateMs(b) - this.getLastMessageDateMs(a)
    },

    getLastMessage (client) {
      if (client.lastMessage) {
        if (client.lastMessage.text) {
          return client.lastMessage.text
        } else {
          if (client.lastMessage.fileType === null) {
            return 'Неизвестный формат файла'
          } else if (client.lastMessage.fileType.startsWith('video/')) {
            return 'Видео'
          } else if (client.lastMessage.fileType.startsWith('image/')) {
            return 'Изображение'
          } else if (client.lastMessage.fileType.startsWith('audio/')) {
            return 'Аудио'
          } else {
            return 'Файл'
          }
        }
      } else {
        return ''
      }
    },

    getAbbreviation (client) {
      const lastname = client.lastname ? client.lastname[0].toUpperCase() : ''
      const firstname = client.firstname ? client.firstname[0].toUpperCase() : ''
      return `${lastname}${firstname}`
    },

    isHavePing (client) {
      if (this.isOnboardingDemoClient(client)) {
        return Number(client.demoPingCount || 0) > 0
      }
      const userId = this.store.currentUser?.id
      if (!userId || !client) {
        return false
      }
      const hasClientPing = Boolean(client.unreadPingMessages?.[userId])
      return hasClientPing || client.hasTaskPing === true || Number(client.taskPingCount || 0) > 0
    },

    getSlaInfo (task) {
      if (!task?.id) return null
      return this.slaInfoByTaskId[task.id] || null
    },

    async loadSlaInfoForTaskId (taskId) {
      if (!taskId) return
      if (this.slaInfoByTaskId[taskId]) return
      if (this.slaInfoLoading[taskId]) return

      this.slaInfoLoading[taskId] = true
      try {
        const { data } = await axios.get(`/api/v1/task/${taskId}/sla/info`)
        this.slaInfoByTaskId[taskId] = data
      } catch (e) {
        // игнор
      } finally {
        this.slaInfoLoading[taskId] = false
      }
    },

    async preloadSlaInfosForClients (clients) {
      const ids = []
      ;(clients || []).forEach(client => {
        if (this.isOnboardingDemoClient(client)) {
          this.getActualTasks(client).forEach(task => {
            if (task?.id && !task.completed && !task.frozen) {
              ids.push(task.id)
            }
          })
        }
      })
      const uniqIds = [...new Set(ids)]
      await Promise.all(uniqIds.map(id => this.loadSlaInfoForTaskId(id)))
    },

    getSlaLeftMsApprox (task) {
      if (!task) {
        return null
      }

      const info = this.getTaskSlaInfo(task)
      if (info) {
        const remainingSeconds = Number(info.remainingSeconds)
        const deadlineMs = info.deadline ? new Date(info.deadline).getTime() : NaN

        if (Number.isFinite(remainingSeconds) && remainingSeconds <= 0) {
          return 0
        }

        if (info.paused === true && Number.isFinite(remainingSeconds)) {
          return Math.max(0, remainingSeconds * 1000)
        }

        if (Number.isFinite(deadlineMs)) {
          return Math.max(0, deadlineMs - this.nowTs)
        }

        if (Number.isFinite(remainingSeconds)) {
          return Math.max(0, remainingSeconds * 1000)
        }
      }

      if (this.isTaskSlaExpiredByFlags(task)) {
        return 0
      }

      const startDate = task?.sla?.startDate || task?.slaStartDate
      const duration = task?.sla?.duration || task?.slaDuration
      if (!startDate || !duration) {
        return null
      }

      const startMs = new Date(startDate).getTime()
      const durationMs = this.parseIsoDurationToMs(duration)
      if (!Number.isFinite(startMs) || durationMs <= 0) {
        return null
      }
      const deadlineMs = startMs + durationMs
      return Math.max(0, deadlineMs - this.nowTs)
    },

    getSlaDuration (duration) {
      if (!duration) {
        return moment.duration(0)
      }
      if (typeof duration.asMilliseconds === 'function') {
        return duration
      }
      if (typeof duration === 'number') {
        return moment.duration(duration, 'seconds')
      }
      if (typeof duration === 'object') {
        if (Number.isFinite(duration.seconds)) {
          return moment.duration(duration.seconds, 'seconds')
        }
        if (Number.isFinite(duration._milliseconds)) {
          return moment.duration(duration._milliseconds, 'milliseconds')
        }
      }
      return moment.duration(duration)
    },

    getSlaEndDate (task) {
      if (!task?.sla?.startDate || !task?.sla?.duration) {
        return null
      }
      return moment(task.sla.startDate).add(this.getSlaDuration(task.sla.duration))
    },

    getClientSlaPercent (client) {
      const task = this.getClientSlaPreviewTask(client)
      return task ? this.getSlaPercent([task]) : null
    },

    hasClientSla (client) {
      return this.getClientSlaPreviewTask(client) !== null
    },

    hasCriticalTasks (client) {
      if (this.isOnboardingDemoClient(client)) {
        return client.tasks?.some(task => task.priority?.critical && !task.completed) === true
      }
      return client.hasCriticalTasks === true
    },

    isClientSlaExpired (client) {
      const task = this.getClientSlaPreviewTask(client)
      return task ? this.isSlaExpired([task]) : false
    },

    getClientSlaColor (client) {
      const task = this.getClientSlaPreviewTask(client)
      return task ? this.getSlaColor([task]) : 'grey'
    },

    getLastMessageObject (client) {
      if (!client) {
        return null
      }
      if (client.lastMessage) {
        return client.lastMessage
      }
      const messages = [...this.getClientMessages(client)]
        .filter(message => message && message.deleted !== true && message.isComment !== true)
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      return messages[0] || null
    },

    getLastMessageIcon (client) {
      const message = this.getLastMessageObject(client)
      if (!message || message.isSent === undefined || message.isSent === null) {
        return ''
      }
      return message.isSent === true ? 'output' : 'input'
    },

    isSlaVisible (client) {
      const task = this.getClientSlaPreviewTask(client)
      if (!task || task.completed) {
        return false
      }
      const totalMs = this.getSlaTotalMs(task)
      if (!Number.isFinite(totalMs) || totalMs <= 0) {
        return false
      }
      const leftMs = this.getSlaLeftMsApprox(task)
      return leftMs !== null
    },
  },

  computed: {
    shouldShowChatsToolbar () {
      return this.clientsForChatsList.length > 0 || this.searchQuery.trim() !== '' || this.isOnboardingVisible
    },

    clientsForChatsList () {
      if (this.isOnboardingVisible) {
        return this.onboardingDemoClients
      }
      return this.store.clients || []
    },

    currentOnboardingStep () {
      return this.onboardingSteps[this.currentOnboardingStepIndex] || null
    },

    getSortedAndFilteredClients () {
      let clients = this.clientsForChatsList || []

      if (this.searchQuery !== '') {
        const query = this.searchQuery.toLowerCase()
        clients = clients.filter(client => {
          const firstname = client.firstname || ''
          const lastname = client.lastname || ''
          const organization = client.organization?.name || ''
          const sourceChannel = client.sourceChannel || ''
          return `${firstname} ${lastname} ${organization} ${sourceChannel}`
            .toLowerCase()
            .includes(query)
        })
      }
      clients = [...clients].sort((a, b) => {
        if (this.sortType === 'MIN_SLA') {
          return this.sortByMinimalSla(a, b)
        }
        if (this.sortType === 'LAST_MESSAGE') {
          return this.sortByLastMessage(a, b)
        }
        if (this.sortType === 'PINGS') {
          return this.sortByPings(a, b)
        }
        if (this.sortType === 'UNREAD_MESSAGES') {
          return this.sortByUnreadMessages(a, b)
        }
        if (this.sortType === 'TASKS_WITHOUT_ASSIGNEE') {
          return this.sortByTasksWithoutAssignee(a, b)
        }
        return this.sortByAnswerWait(a, b)
      })
      return clients
    },
  },

  watch: {
    searchQuery () {
      this.preloadSlaInfosForClients(this.getSortedAndFilteredClients)
    },

    sortType (newValue) {
      if (newValue) {
        localStorage.setItem('clientsChatsSortType', newValue)
      }
      this.preloadSlaInfosForClients(this.getSortedAndFilteredClients)
    },

    'store.clients': {
      handler () {
        this.preloadSlaInfosForClients(this.getSortedAndFilteredClients)
        this.$nextTick(() => this.normalizeOnboardingStep())
      },
      deep: true
    }
  },

  created () {
    const savedSortType = localStorage.getItem('clientsChatsSortType')
    if (this.sortOptions.some(option => option.value === savedSortType)) {
      this.sortType = savedSortType
    }
  },

  mounted () {
    document.title = 'ULDESK : Чаты'
    this.preloadSlaInfosForClients(this.getSortedAndFilteredClients)
    this.slaTimer = setInterval(() => {
      this.nowTs = Date.now()
    }, 1000)

    window.addEventListener('resize', this.updateOnboardingPosition)
    window.addEventListener('scroll', this.updateOnboardingPosition, true)
    this.$nextTick(() => this.startOnboarding(false))
  },

  beforeUnmount () {
    clearInterval(this.slaTimer)
    window.removeEventListener('resize', this.updateOnboardingPosition)
    window.removeEventListener('scroll', this.updateOnboardingPosition, true)
  },

  setup () {
    const store = useStore()
    return {
      store
    }
  }
}
</script>

<style scoped>
.search-sort-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.search-sort-row__search {
  flex: 1 1 auto;
  min-width: 0;
}

.search-sort-row__sort {
  flex: 0 0 300px;
  width: 300px;
}

.shorten-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sla-pill {
  width: 80px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;

  border: 3px solid transparent;
  border-radius: 5px;

  background: transparent;
  flex: 0 0 auto;
}

.sla-pill--expired {
  border-color: red;
}

.sla-bar {
  width: 100%;
}

.client-row-alerts {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  flex: 0 0 auto;
  margin-left: 0;
  margin-right: auto;
}

.client-row-alerts__separator {
  align-self: stretch;
  height: auto;
  margin-right: 12px;
}

.client-row-alerts__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.client-info-section {
  flex: 0 0 400px;
  width: 400px;
  min-width: 0;
  max-width: 400px;
}

.client-critical-icon {
  font-size: 20px;
}

.unanswered-timer {
  font-size: 12px;
  line-height: 1;
  color: var(--q-primary);
  white-space: nowrap;
  font-weight: 600;
}

.client-ping-counter {
  margin-right: 0;
}

.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 6000;
  pointer-events: none;
}

.onboarding-highlight {
  position: fixed;
  z-index: 6001;
  border: 2px solid var(--q-primary);
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.32);
  pointer-events: none;
  transition: top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease;
}

.onboarding-card {
  position: fixed;
  z-index: 6002;
  border-radius: 14px;
  pointer-events: auto;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
}

.onboarding-card__step {
  margin-bottom: 4px;
  color: #777;
  font-size: 12px;
}

.onboarding-card__title {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 700;
}

.onboarding-card__text {
  color: #555;
  font-size: 14px;
  line-height: 1.45;
}

.strikethrough {
  text-decoration: line-through;
  opacity: 0.6;
}

.client-open-tasks-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 34px;
  height: 20px;
  padding: 0 7px;
  margin-left: 8px;
  color: #fff;
  background: var(--q-primary);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, .16);
}

.client-open-tasks-counter__icon {
  color: inherit;
  font-size: 14px;
  width: 14px;
  height: 14px;
  line-height: 14px;
}

.client-open-tasks-counter__value {
  color: inherit;
  font-size: 12px;
  line-height: 1;
}

.client-row-link {
  text-decoration: none;
  display: flex;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.client-avatar-section {
  padding-right: 8px;
  flex: 0 0 auto;
}

.client-avatar {
  width: 50px;
  height: 50px;
  border-radius: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 20px;
  flex: 0 0 auto;
}

.client-name-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.client-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-channel-icon {
  width: 16px;
  flex: 0 0 auto;
  filter: invert(29%) sepia(65%) saturate(7267%) hue-rotate(249deg) brightness(95%) contrast(106%);
}

.client-row-main {
  min-width: 0;
  overflow: hidden;
}

@media (max-width: 600px) {
  .search-sort-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 36px;
    gap: 6px;
    align-items: center;
    margin-bottom: 6px;
  }

  .search-sort-row__search {
    grid-column: 1 / -1;
    width: 100%;
  }

  .search-sort-row__sort {
    grid-column: 1;
    width: 100%;
    min-width: 0;
    flex: 1 1 auto;
  }

  .search-sort-row > .q-btn {
    grid-column: 2;
    justify-self: end;
  }

  .client-row-item {
    padding: 7px 4px;
  }

  .client-row-link {
    align-items: stretch;
  }

  .client-avatar-section {
    padding-right: 8px;
  }

  .client-avatar {
    width: 42px;
    height: 42px;
    font-size: 17px;
  }

  .client-info-section {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
    max-width: none;
  }

  .client-name-row {
    flex-wrap: wrap;
    gap: 3px 6px;
    line-height: 1.15;
  }

  .client-channel-icon {
    width: 15px;
    margin-right: 0;
  }

  .client-name-text {
    flex: 1 1 auto;
    max-width: 100%;
    font-size: 14px;
  }

  .client-open-tasks-counter {
    height: 18px;
    min-width: 30px;
    padding: 0 6px;
    margin-left: 0;
    gap: 3px;
    font-size: 11px;
  }

  .client-open-tasks-counter__icon {
    font-size: 13px;
    width: 13px;
    height: 13px;
    line-height: 13px;
  }

  .client-open-tasks-counter__value {
    font-size: 11px;
  }

  .sla-pill {
    width: 64px;
    height: 12px;
    margin-left: 0;
  }

  .sla-bar {
    width: 64px !important;
  }

  .client-row-alerts {
    flex: 0 0 70px;
    max-width: 70px;
    margin-left: 6px;
    margin-right: 0;
    justify-content: flex-end;
  }

  .client-row-alerts__separator {
    margin-right: 8px;
  }

  .client-row-alerts__content {
    gap: 4px;
  }

  .unanswered-timer {
    font-size: 11px;
    line-height: 1.1;
    text-align: right;
  }

  .shorten-text {
    max-width: 100%;
    font-size: 12px;
  }

  .client-row-main {
    min-width: 0;
    overflow: hidden;
  }
}
</style>
