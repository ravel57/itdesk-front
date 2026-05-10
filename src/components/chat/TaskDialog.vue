<template>
  <q-dialog
    v-model="getPossibilityToOpenDialogTask"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card
      data-tour="task-dialog-card"
      :class="this.isMobile || !['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) || this.isNewTask ? 'dialog-width' : 'large-dialog-width'"
    >
      <q-toolbar class="justify-between">
        <!--FIXME-->
        <div v-if="this.isNewTask" class="text-h6" data-tour="task-dialog-title">Новая заявка</div>
        <div v-else class="text-h6" data-tour="task-dialog-title">Заявка № {{ this.task.id }}</div>
        <div class="">
          <q-btn
            flat
            round
            dense
            icon="help_outline"
            data-tour="task-dialog-help"
            @click="this.startTaskDialogOnboarding(true)"
          >
            <q-tooltip>
              Обучение по заявке
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="!(this.$route.path.includes('chats'))"
            data-tour="task-dialog-open-chat"
            flat
            round
            dense
            icon="open_in_new"
            @click="this.$router.push({ path: `/chats/${this.client.id}` })"
          >
            <q-tooltip>
              Перейти в чат с {{ this.getClientName }}
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="this.openSubmitModal"
            v-close-popup
          />
        </div>
      </q-toolbar>
      <q-card-section
        style="padding: 0 16px"
      >
        <div
          v-if="this.isMobile && !this.isNewTask"
          class="sticky-tabs"
        >
          <q-tabs
            v-model="dialogTab"
            dense
            align="justify"
            class="bg-white text-grey no-padding"
            :breakpoint="0"
          >
            <q-tab
              name="tab1"
              icon="info"
            />
            <q-tab
              name="tab2"
              icon="forum"
            />
          </q-tabs>
        </div>
        <div
          :class="this.isMobile || this.isNewTask ? '' : 'flex-container'"
        >
          <div
            v-if="(!this.isMobile || this.dialogTab === 'tab1')"
            class="flex-item"
            style="max-height: 100%"
          >
            <q-card
              class="no-border-card"
            >
              <q-card-section
                class="no-padding"
              >
                <q-input
                  id="task-name"
                  data-tour="task-dialog-name"
                  v-model="this.dialogTaskName"
                  ref="taskName"
                  label="Название *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <div
                  id="task-controls"
                  data-tour="task-dialog-status-controls"
                  class="flex"
                  style="display: flex;flex-wrap: nowrap;align-items: center;max-height: 40px"
                >
                  <q-select
                    id="task-status"
                    dense
                    outlined
                    v-model="this.dialogTaskStatus"
                    :options="this.isNewTask ? this.store.statuses.filter(s => s.name !== 'Закрыта' && s.name !== 'Заморожена').map(s => s.name) : this.store.statuses.map(s => s.name)"
                    label="Статус *"
                    :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                    style="width: 100%;padding: 0;"
                    :style="this.getBackgroundColor(this.dialogTaskStatus)"
                  />
                  <q-btn
                    v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
                    dense
                    outline
                    no-caps
                    label="Закрыть заявку"
                    color="white"
                    text-color="primary"
                    style="font-size: 14px;height: 40px;width: 100%; margin-left: 8px"
                    @click="this.setTaskCompleted(this.task)"
                  />
                  <q-btn
                    v-if="this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
                    dense
                    outline
                    no-caps
                    label="Вернуть в работу"
                    color="white"
                    text-color="primary"
                    style="font-size: 14px;height: 40px;width: 100%;margin-left: 8px;"
                    @click="this.setTaskNotCompleted(this.task)"
                  />
                  <div id="unfreeze-task-btn">
                    <q-btn
                      v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && this.task.frozen"
                      dense
                      outline
                      icon="ac_unit"
                      text-color="primary"
                      style="margin-left: 8px;position: relative;height: 40px;width: 40px"
                      @click="this.changeTaskFrozen()"
                    >
                      <q-tooltip>Заморожено до {{ this.getStamp(new Date(this.task.frozenUntil)) }}</q-tooltip>
                      <q-circular-progress
                        v-if="this.task.frozen"
                        :value="this.getPercentFrozenTask(this.task.frozenFrom, this.task.frozenUntil)"
                        reverse
                        size="32px"
                        style="
                      position: absolute;
                      font-size: 32px;
                      margin: 0;
                    "
                        :thickness="0.22"
                        color="primary"
                        track-color="grey-3"
                      />
                    </q-btn>
                  </div>
                  <div id="freeze-task-btn">
                    <q-btn
                      v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && !this.task.frozen"
                      dense
                      outline
                      icon="ac_unit"
                      style="height: 40px;width: 40px;margin-left: 8px"
                      text-color="gray"
                      @click="this.freezeDialog = true"
                    >
                      <q-tooltip>Заморозить заявку</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <q-input
                  id="task-description"
                  data-tour="task-dialog-description"
                  type="textarea"
                  v-model="this.dialogTaskDescription"
                  label="Описание"
                />
                <q-select
                  id="task-priority"
                  data-tour="task-dialog-priority"
                  v-model="this.dialogTaskPriority"
                  :options="this.store.priorities.map(priority => priority.name)"
                  label="Приоритет *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <q-select
                  id="task-executor"
                  data-tour="task-dialog-executor"
                  v-model="this.dialogTaskExecutor"
                  :options="this.filteredUsers"
                  label="Исполнитель"
                  use-input
                  @filter="filterUsers"
                />
                <q-select
                  id="task-tags"
                  data-tour="task-dialog-tags"
                  style="padding-top: 16px"
                  class="custom-select"
                  v-model="this.dialogTaskTags"
                  :options="this.filteredTags"
                  multiple
                  label="Теги"
                  use-chips
                  use-input
                  dense
                  @filter="filterTags"
                />
                <q-input
                  id="task-deadline"
                  data-tour="task-dialog-deadline"
                  v-model="this.dialogTaskDeadline"
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
                          v-model="this.dialogTaskDeadline"
                          first-day-of-week="1"
                          locale="ru"
                          today-btn
                          @update:model-value="this.$refs.qDateDeadlinePopup.hide()"
                          :options="this.dateOption"
                          mask="DD.MM.YYYY HH:mm"
                        />
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </q-card-section>
            </q-card>
          </div>
          <div
            v-if="(!this.isMobile || this.dialogTab === 'tab2') && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && !this.isNewTask"
            id="chat-section"
            data-tour="task-dialog-right-panel"
            class="flex-item task-right-panel"
            style="border: 1px solid #0000001f;overflow: hidden;border-radius: 16px"
            :style="this.isMobile ? 'height: 541px' : ''"
          >
            <q-tabs
              v-model="taskRightTab"
              dense
              align="left"
              active-color="primary"
              indicator-color="primary"
              class="text-grey-8 task-right-tabs"
              data-tour="task-dialog-right-tabs"
            >
              <q-tab name="messages" label="Сообщения" data-tour="task-dialog-messages-tab" />
              <q-tab name="history" label="История изменений" data-tour="task-dialog-history-tab" />
            </q-tabs>

            <q-separator />

            <q-tab-panels
              v-model="taskRightTab"
              animated
              class="task-right-panels"
            >
              <q-tab-panel name="messages" class="q-pa-none task-messages-panel" data-tour="task-dialog-messages-panel">
                <chat-dialog
                  :is-mobile="this.isMobile"
                  :messages="this.task.messages"
                  :input-field="this.inputField"
                  :templates="this.store.templates"
                  :isSending="this.isSending"
                  :current-user="this.store.currentUser"
                  :linkedMessageId="this.linkedMessageId"
                  :client-id="this.client.id"
                  :client="this.client"
                  :is-show-helper="true"
                  :taskWatchingNow="[]"
                  :typing="[]"
                  :isDialog="true"
                  :comments="false"
                  @sendMessage="this.sendMessage"
                  @isSending="this.isSending = true"
                  @keyPressed="this.keyPressed"
                />
              </q-tab-panel>

              <q-tab-panel name="history" class="q-pa-md task-history-panel" data-tour="task-dialog-history-panel">
                <q-inner-loading :showing="taskHistoryLoading">
                  <q-spinner size="32px" />
                </q-inner-loading>
                <div
                  v-if="!taskHistoryLoading && taskHistory.length === 0"
                  class="text-grey-7"
                >
                  История изменений пустая
                </div>
                <q-timeline
                  v-else
                  color="primary"
                >
                  <q-timeline-entry
                    v-for="item in taskHistory"
                    :key="item.id"
                    :title="item.title"
                    :subtitle="formatHistoryDate(item.createdAt)"
                    :icon="getHistoryIcon(item.triggerType)"
                  >
                    <div class="text-grey-8">
                      {{ item.description }}
                    </div>

                    <div
                      v-if="item.actorDisplayName"
                      class="text-caption text-grey-7 q-mt-xs"
                    >
                      Изменил: {{ item.actorDisplayName }}
                    </div>

                    <div
                      v-else
                      class="text-caption text-grey-7 q-mt-xs"
                    >
                      Изменил: неизвестно
                    </div>
                  </q-timeline-entry>
                </q-timeline>
              </q-tab-panel>
            </q-tab-panels>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        data-tour="task-dialog-actions"
        style="margin-right: 7px;margin-bottom: 8px;margin-top: 8px"
      >
        <q-btn
          color="white"
          text-color="primary"
          label="Закрыть"
          @click="this.openSubmitModal"
        />
        <q-btn
          id="save-task"
          color="primary"
          label="Сохранить"
          @click="this.saveNewOrUpdateTask"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog persistent v-model="this.freezeDialog">
    <div id="task-freeze-modal">
      <q-card>
        <q-card-section>
          <div class="text-h6">Заморозка заявки</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div id="freeze-time-input">
            <q-input
              v-model="this.dialogTaskFreezeUntil"
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
                    ref="qDateFreezePopup"
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date
                      v-model="this.dialogTaskFreezeUntil"
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
          <q-btn flat label="Закрыть" color="primary" v-close-popup/>
          <div id="freeze-save-btn">
            <q-btn @click="changeTaskFrozen" label="Заморозить" color="primary" v-close-popup/>
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
  <q-dialog
    v-model="this.isSubmitModal"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          Сохранить {{ this.isNewTask ? 'заявку?' : 'изменение в заявке №' + this.task.id + '?' }}
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />
      </q-toolbar>
      <q-card-section>
        {{ this.isNewTask ? 'Закрыть не сохраняя заявку?' : 'Соохранить изменения в заявке №' + this.task.id + '?' }}
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn
          outline
          color="primary"
          v-close-popup
        >
          Отмена
        </q-btn>
        <q-btn
          outline
          color="primary"
          v-close-popup
          @click="this.closeDialog"
        >
          Не сохранять
        </q-btn>
        <q-btn
          color="primary"
          v-close-popup
          @click="this.saveNewOrUpdateTask"
        >
          Сохранить
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <teleport to="body">
    <div
      v-if="this.taskDialogOnboardingActive"
      class="task-dialog-onboarding-layer"
    >
      <div
        class="task-dialog-onboarding-spotlight"
        :style="this.taskDialogOnboardingSpotlightStyle"
      />
      <q-card
        class="task-dialog-onboarding-tooltip"
        :style="this.taskDialogOnboardingTooltipStyle"
      >
        <q-card-section class="q-pb-xs">
          <div class="task-dialog-onboarding-progress text-caption text-grey-7">
            {{ this.taskDialogOnboardingStepIndex + 1 }} / {{ this.visibleTaskDialogOnboardingSteps.length }}
          </div>
          <div class="text-subtitle1 text-weight-bold q-mt-xs">
            {{ this.currentTaskDialogOnboardingStep.title }}
          </div>
          <div class="text-body2 q-mt-sm">
            {{ this.currentTaskDialogOnboardingStep.text }}
          </div>
        </q-card-section>
        <q-card-actions align="between" class="q-pt-none">
          <q-btn
            flat
            dense
            color="grey"
            label="Пропустить"
            @click="this.finishTaskDialogOnboarding"
          />
          <div>
            <q-btn
              flat
              dense
              color="primary"
              label="Назад"
              :disable="this.taskDialogOnboardingStepIndex === 0"
              @click="this.prevTaskDialogOnboardingStep"
            />
            <q-btn
              unelevated
              dense
              color="primary"
              :label="this.isLastTaskDialogOnboardingStep ? 'Готово' : 'Далее'"
              @click="this.nextTaskDialogOnboardingStep"
            />
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </teleport>
</template>

<script>
import moment from 'moment/moment'
import axios from 'axios'
import { useStore } from 'stores/store'
import ChatDialog from 'components/chat/ChatDialog.vue'
import { useRoute } from 'vue-router'

export default {

  components: { ChatDialog },

  props: [
    'isMobile',
    'task',
    'isNewTaskDialogShow',
    'isTaskDialogShow',
    'isNewTask',
    'client'
  ],

  data: () => ({
    dialogTab: 'tab1',

    taskRightTab: 'messages',
    taskHistory: [],
    taskHistoryLoading: false,

    dialogTaskId: '',
    dialogTaskName: '',
    dialogTaskDescription: '',
    dialogTaskPriority: '',
    dialogTaskExecutor: '',
    dialogTaskTags: [],
    dialogTaskStatus: '',
    dialogTaskDeadline: '',
    dialogTaskComplete: false,
    linkedMessageId: '',
    taskCreatedAt: '',

    taskId: null, // for update
    inputField: '',
    isSending: false,
    freezeDialog: false,
    dialogTaskFreezeUntil: '',

    taskOnCreateProcess: false,

    isSubmitModal: false,

    filteredUsers: [],
    filteredTags: [],

    taskDialogOnboardingKey: 'task-dialog-onboarding-v1',
    taskDialogOnboardingActive: false,
    taskDialogOnboardingStepIndex: 0,
    taskDialogOnboardingTooltipStyle: {},
    taskDialogOnboardingSpotlightStyle: {},
    taskDialogOnboardingRefreshHandler: null,
    taskDialogOnboardingSteps: [
      {
        target: 'task-dialog-title',
        title: 'Номер и заголовок заявки',
        text: 'Здесь видно, какую заявку вы открыли. Для новой заявки вместо номера отображается заголовок создания.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-name',
        title: 'Название заявки',
        text: 'Коротко сформулируйте проблему или запрос. Хорошее название помогает быстро найти заявку в общем списке.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-status-controls',
        title: 'Статус и закрытие',
        text: 'Статус показывает этап обработки. Рядом доступны быстрые действия: закрыть заявку, вернуть в работу или заморозить выполнение.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-description',
        title: 'Описание',
        text: 'В описании фиксируются детали обращения: что произошло, какие действия уже выполнены и какой результат ожидается.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-priority',
        title: 'Приоритет',
        text: 'Приоритет помогает понять срочность. Критичные и высокие заявки легче поднять в очереди и контролировать по SLA.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-executor',
        title: 'Исполнитель',
        text: 'Исполнитель отвечает за решение заявки. Если поле пустое, заявка может попасть в очередь без ответственного.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-tags',
        title: 'Теги',
        text: 'Теги нужны для классификации: тип проблемы, продукт, отдел, канал или причина обращения.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-deadline',
        title: 'Дедлайн',
        text: 'Дедлайн задаёт ожидаемый срок решения. Его удобно использовать для сортировки и контроля просрочек.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-open-chat',
        title: 'Переход в чат клиента',
        text: 'Кнопка открывает чат клиента, чтобы посмотреть полный контекст общения и продолжить диалог.',
        dialogTab: 'tab1',
        requiresExistingTask: true,
        skipOnChatRoute: true
      },
      {
        target: 'task-dialog-right-panel',
        title: 'Связанные сообщения и история',
        text: 'Правая часть заявки показывает переписку по этой заявке и историю изменений. На мобильном экране этот блок открывается отдельной вкладкой.',
        dialogTab: 'tab2',
        rightTab: 'messages',
        requiresExistingTask: true,
        requiresOperator: true
      },
      {
        target: 'task-dialog-messages-panel',
        title: 'Сообщения по заявке',
        text: 'Здесь видна переписка, связанная именно с этой заявкой. Можно отвечать клиенту, не выходя из карточки заявки.',
        dialogTab: 'tab2',
        rightTab: 'messages',
        requiresExistingTask: true,
        requiresOperator: true
      },
      {
        target: 'task-dialog-history-tab',
        title: 'История изменений',
        text: 'На вкладке истории можно проверить, кто менял статус, приоритет, исполнителя, дедлайн и другие поля заявки.',
        dialogTab: 'tab2',
        rightTab: 'history',
        requiresExistingTask: true,
        requiresOperator: true
      },
      {
        target: 'task-dialog-actions',
        title: 'Сохранение изменений',
        text: 'После редактирования нажмите «Сохранить». Если закрыть окно с несохранёнными изменениями, система попросит подтвердить действие.',
        dialogTab: 'tab1'
      }
    ]
  }),

  methods: {

    startTaskDialogOnboarding (force = false) {
      if (!force && localStorage.getItem(this.taskDialogOnboardingKey)) {
        return
      }
      if (!this.getPossibilityToOpenDialogTask) {
        return
      }
      this.taskDialogOnboardingActive = true
      this.taskDialogOnboardingStepIndex = 0
      this.addTaskDialogOnboardingListeners()
      this.applyTaskDialogOnboardingStep()
    },

    finishTaskDialogOnboarding () {
      this.taskDialogOnboardingActive = false
      localStorage.setItem(this.taskDialogOnboardingKey, 'done')
      this.taskDialogOnboardingTooltipStyle = {}
      this.taskDialogOnboardingSpotlightStyle = {}
      this.removeTaskDialogOnboardingListeners()
    },

    stopTaskDialogOnboarding () {
      this.taskDialogOnboardingActive = false
      this.taskDialogOnboardingTooltipStyle = {}
      this.taskDialogOnboardingSpotlightStyle = {}
      this.removeTaskDialogOnboardingListeners()
    },

    nextTaskDialogOnboardingStep () {
      if (this.isLastTaskDialogOnboardingStep) {
        this.finishTaskDialogOnboarding()
        return
      }
      this.taskDialogOnboardingStepIndex += 1
      this.applyTaskDialogOnboardingStep()
    },

    prevTaskDialogOnboardingStep () {
      if (this.taskDialogOnboardingStepIndex === 0) {
        return
      }
      this.taskDialogOnboardingStepIndex -= 1
      this.applyTaskDialogOnboardingStep()
    },

    applyTaskDialogOnboardingStep () {
      const steps = this.visibleTaskDialogOnboardingSteps
      if (this.taskDialogOnboardingStepIndex >= steps.length) {
        this.taskDialogOnboardingStepIndex = Math.max(steps.length - 1, 0)
      }
      const step = this.currentTaskDialogOnboardingStep
      if (step.dialogTab) {
        this.dialogTab = step.dialogTab
      }
      if (step.rightTab) {
        this.taskRightTab = step.rightTab
      }
      this.$nextTick(() => {
        setTimeout(() => this.updateTaskDialogOnboardingPosition(), 120)
      })
    },

    updateTaskDialogOnboardingPosition () {
      if (!this.taskDialogOnboardingActive) {
        return
      }
      const step = this.currentTaskDialogOnboardingStep
      const target = this.getTaskDialogOnboardingTarget(step)
      if (!target) {
        this.taskDialogOnboardingSpotlightStyle = {
          top: '96px',
          left: '96px',
          width: '1px',
          height: '1px',
          opacity: 0
        }
        this.taskDialogOnboardingTooltipStyle = {
          top: '96px',
          left: '96px'
        }
        return
      }

      target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' })

      setTimeout(() => {
        if (!this.taskDialogOnboardingActive) {
          return
        }
        const rect = target.getBoundingClientRect()
        const padding = 8
        const tooltipWidth = Math.min(380, window.innerWidth - 24)
        const tooltipEstimatedHeight = 190
        const gap = 14

        const spotlightTop = Math.max(rect.top - padding, 8)
        const spotlightLeft = Math.max(rect.left - padding, 8)
        const spotlightWidth = Math.min(rect.width + padding * 2, window.innerWidth - spotlightLeft - 8)
        const spotlightHeight = Math.min(rect.height + padding * 2, window.innerHeight - spotlightTop - 8)

        let tooltipTop = rect.bottom + gap
        if (tooltipTop + tooltipEstimatedHeight > window.innerHeight - 12) {
          tooltipTop = rect.top - tooltipEstimatedHeight - gap
        }
        if (tooltipTop < 12) {
          tooltipTop = 12
        }

        let tooltipLeft = rect.left
        if (tooltipLeft + tooltipWidth > window.innerWidth - 12) {
          tooltipLeft = window.innerWidth - tooltipWidth - 12
        }
        if (tooltipLeft < 12) {
          tooltipLeft = 12
        }

        this.taskDialogOnboardingSpotlightStyle = {
          top: `${spotlightTop}px`,
          left: `${spotlightLeft}px`,
          width: `${spotlightWidth}px`,
          height: `${spotlightHeight}px`
        }
        this.taskDialogOnboardingTooltipStyle = {
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
          width: `${tooltipWidth}px`
        }
      }, 120)
    },

    getTaskDialogOnboardingTarget (step) {
      if (!step?.target) {
        return document.querySelector('[data-tour="task-dialog-card"]')
      }
      return document.querySelector(`[data-tour="${step.target}"]`) || document.querySelector('[data-tour="task-dialog-card"]')
    },

    addTaskDialogOnboardingListeners () {
      if (this.taskDialogOnboardingRefreshHandler) {
        return
      }
      this.taskDialogOnboardingRefreshHandler = () => this.updateTaskDialogOnboardingPosition()
      window.addEventListener('resize', this.taskDialogOnboardingRefreshHandler)
      window.addEventListener('scroll', this.taskDialogOnboardingRefreshHandler, true)
    },

    removeTaskDialogOnboardingListeners () {
      if (!this.taskDialogOnboardingRefreshHandler) {
        return
      }
      window.removeEventListener('resize', this.taskDialogOnboardingRefreshHandler)
      window.removeEventListener('scroll', this.taskDialogOnboardingRefreshHandler, true)
      this.taskDialogOnboardingRefreshHandler = null
    },

    getCurrentTaskId () {
      return this.taskId || this.dialogTaskId || this.task?.id || null
    },

    dateOption (date) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return date >= `${year}/${month}/${day}`
    },

    openSubmitModal () {
      const dialogTaskDeadline = this.dialogTaskDeadline ? this.dialogTaskDeadline : ''
      const taskDeadline = this.task.deadline ? moment(this.task.deadline, 'DD.MM.YYYY HH:mm').format('DD.MM.YYYY HH:mm') : ''
      if (this.isNewTask) {
        if (!this.dialogTaskName) {
          this.closeDialog()
        } else {
          this.isSubmitModal = true
        }
      } else if (
        this.dialogTaskName !== this.task.name || this.dialogTaskDescription !== this.task.description ||
        this.dialogTaskPriority !== this.task.priority.name ||
        this.dialogTaskExecutor !== this.getUserName(this.task.executor) ||
        JSON.stringify(this.dialogTaskTags) !== JSON.stringify(this.task.tags.map(tag => tag.name)) ||
        // this.dialogTaskTags !== this.task.tags.map(tag => tag.name) ||
        dialogTaskDeadline !== taskDeadline ||
        this.dialogTaskStatus !== this.task.status.name ||
        this.dialogTaskComplete !== this.task.completed
      ) {
        this.isSubmitModal = true
      } else {
        this.closeDialog()
      }
    },

    closeDialog () {
      this.$emit('closeDialog')
    },

    getTaskField () {
      if (this.isNewTask) {
        this.dialogTaskName = ''
        this.dialogTaskDescription = ''
        this.dialogTaskPriority = this.store.priorities.find(priority => priority.defaultSelection === true).name
        this.dialogTaskExecutor = ''
        this.dialogTaskTags = []
        this.dialogTaskDeadline = ''
        this.dialogTaskStatus = this.store.statuses.find(status => status.defaultSelection === true).name
        setTimeout(() => this.$refs.taskName.focus(), 300)
      } else {
        this.dialogTaskId = this.task.id
        this.dialogTaskName = this.task.name
        this.dialogTaskDescription = this.task.description
        this.dialogTaskPriority = this.task.priority.name
        this.dialogTaskExecutor = this.getUserName(this.task.executor)
        this.dialogTaskTags = this.task.tags.map(tag => tag.name)
        this.dialogTaskDeadline = this.task.deadline ? moment(this.task.deadline, 'DD.MM.YYYY HH:mm').format('DD.MM.YYYY HH:mm') : ''
        this.taskId = this.task.id
        this.dialogTaskStatus = this.task.status.name
        this.taskCreatedAt = this.task.createdAt
        this.dialogTaskComplete = this.task.completed
        this.linkedMessageId = this.task.linkedMessageId
      }
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
      const queryParams = new URLSearchParams(window.location.search)
      const messageId = queryParams.get('newTaskFromMessage')
      if (!this.linkedMessageId) {
        this.linkedMessageId = messageId
      }
      const tags = []
      this.dialogTaskTags.forEach(tagName => tags.push(this.store.tags.find(tag => tag.name === tagName)))
      const currentTaskId = this.getCurrentTaskId()
      if (!this.isNewTask && !currentTaskId) {
        this.$q.notify({
          message: 'Не найден id заявки для обновления',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      const task = {
        id: this.isNewTask ? null : currentTaskId,
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        status: this.store.statuses.find(status => status.name === this.dialogTaskStatus),
        priority: this.store.priorities.find(priority => priority.name === this.dialogTaskPriority),
        executor: this.store.users.find(user => this.getUserName(user) === this.dialogTaskExecutor),
        tags,
        completed: false,
        createdAt: this.isNewTask ? new Date() : this.taskCreatedAt,
        deadline: this.dialogTaskDeadline ? moment(this.dialogTaskDeadline, 'DD.MM.YYYY HH:mm').format() : null,
        linkedMessageId: this.linkedMessageId,
        previousStatus: this.isNewTask ? this.store.statuses.find(status => status.name === this.dialogTaskStatus) : this.task.previousStatus,
        messages: this.isNewTask ? (this.getLinkedMessage ? this.getLinkedMessage : null) : this.task.messages
      }
      if (!this.isNewTask) {
        task.sla = this.task.sla
      }
      if (task.status.name === 'Закрыта') {
        task.completed = true
      }
      if (this.isNewTask) {
        if (this.taskOnCreateProcess) {
          return
        }
        this.taskOnCreateProcess = true
        axios.post(`/api/v1/client/${this.client.id}/task`, task)
          .then(task => {
            this.closeDialog()
            this.$emit('newTask', task)
            this.taskOnCreateProcess = false
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
        axios.patch(`/api/v1/client/${this.client.id}/task`, task)
          .then(newTask => {
            this.closeDialog()
            this.$emit('updateTask', task, newTask.data)
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
    },

    setTaskCompleted (task) {
      task.completed = true
      task = Object.keys(task)
        .filter(objKey => objKey !== 'client' && objKey !== 'sla')
        .reduce((newObj, client) => {
          newObj[client] = task[client]
          return newObj
        }, {})
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.closeDialog()
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
      this.$q.notify({
        message: 'Заяка закрыта',
        type: 'positive',
        position: 'top-right',
        actions: [{
          icon: 'close', color: 'white', dense: true, handler: () => undefined
        }]
      })
    },

    setTaskNotCompleted (task) {
      task.completed = false
      task = Object.keys(task).filter(objKey => objKey !== 'client').reduce((newObj, client) => {
        newObj[client] = task[client]
        return newObj
      }, {})
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.closeDialog()
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
    },

    changeTaskFrozen () {
      const tags = []
      this.dialogTaskTags.forEach(tagName => tags.push(this.store.tags.find(tag => tag.name === tagName)))
      if (!this.task.frozen) {
        if (this.dialogTaskFreezeUntil.length === 0) {
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
      const currentTaskId = this.getCurrentTaskId()
      if (!currentTaskId) {
        this.$q.notify({
          message: 'Не найден id заявки для обновления',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      const task = {
        id: currentTaskId,
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        status: this.store.statuses.find(status => status.name === this.dialogTaskStatus),
        priority: this.store.priorities.find(priority => priority.name === this.dialogTaskPriority),
        executor: this.store.users.find(user => this.getUserName(user) === this.dialogTaskExecutor),
        tags,
        completed: false,
        createdAt: this.isNewTask ? new Date() : this.taskCreatedAt,
        deadline: this.dialogTaskDeadline ? moment(this.dialogTaskDeadline, 'DD.MM.YYYY HH:mm').format() : null,
        linkedMessageId: this.linkedMessageId,
        frozen: !this.task.frozen,
        frozenFrom: this.task.frozen ? null : new Date(),
        frozenUntil: this.task.frozen ? null : moment(this.dialogTaskFreezeUntil, 'DD.MM.YYYY HH:mm').format(),
        previousStatus: this.task.previousStatus
      }
      if (!this.isNewTask) {
        task.sla = this.task.sla
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.closeDialog()
          this.$emit('updateTask', task, newTask.data)
          this.$q.notify({
            message: task.frozen ? 'Заявка заморожена' : 'Заявка разморожена',
            type: 'positive',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
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
    },

    getUserName (user) {
      if (user) {
        return user.lastname + ' ' + user.firstname
      } else {
        return ''
      }
    },

    sendMessage (event) {
      if (event.attachedFile) {
        const data = new FormData()
        data.append('file', event.attachedFile)
        axios.post('/files/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then(response => {
            event.message.fileUuid = response.data
            event.message.fileName = event.attachedFile.name
            event.message.fileType = event.attachedFile.type
            this.sendTextMessage(event)
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
        this.sendTextMessage(event)
      }
    },

    sendTextMessage (event) {
      axios.post(`/api/v1/client/${event.clientId}/task/${this.task.id}/message`, event.message)
        .then(() => {
          this.inputField = ''
          this.isSending = false
          this.$emit('addMessageToTask', { task: this.task, message: event.message, client: this.client })
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
    },

    keyPressed (text) {
      this.inputField = text
    },

    getPercentFrozenTask (date, endDate) {
      const startDate = new Date(date).getTime()
      const targetDate = new Date(endDate).getTime()
      const now = new Date().getTime()
      const totalInterval = targetDate - startDate
      const timeRemaining = now - startDate
      return (1 - (timeRemaining / totalInterval)) * 100
    },

    getStamp (date) {
      if (date) {
        return date.toLocaleTimeString('ru-RU', {
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

    getBackgroundColor (statusLabel) {
      const status = this.store.statuses.find(status => status.name === statusLabel)
      if (!status) {
        return ''
      }
      switch (status.name) {
        case 'Закрыта': {
          return 'background-color: rgba(16, 181, 92, 0.2);'
        }
        case 'Заморожена': {
          return 'background-color: #32ade633;'
        }
        default: {
          return `background-color: ${this.generateStatusColor(status.orderNumber)};`
        }
      }
    },

    generateStatusColor (index) {
      const adjustedIndex = Math.abs(index)
      function generateHSLAColor (hue) {
        return `hsla(${hue}, 70%, 50%, 0.2)`
      }
      function isGreenOrBlue (hue) {
        return (hue >= 120 && hue <= 240)
      }
      let hue = (adjustedIndex * 30) % 360
      while (isGreenOrBlue(hue)) {
        hue = (hue + 60) % 360
      }
      return generateHSLAColor(hue)
    },

    filterUsers (val, update) {
      update(() => {
        if (val) {
          this.filteredUsers = this.store.users
            .filter(user =>
              ['ADMIN', 'OPERATOR'].includes(user.authorities[0]) && this.getUserName(user).toLowerCase().includes(val.toLowerCase())
            )
            .map(user => this.getUserName(user))
        } else {
          this.filteredUsers = this.store.users
            .filter(user => ['ADMIN', 'OPERATOR'].includes(user.authorities[0]))
            .map(user => this.getUserName(user))
        }
      })
    },

    filterTags (val, update) {
      update(() => {
        this.filteredTags = this.store.tags
          .filter(tag => tag.name.toLowerCase().includes(val.toLowerCase()))
          .map(tag => tag.name)
      })
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
    },

    loadTaskHistory () {
      const taskId = this.getCurrentTaskId()

      if (!taskId) {
        this.taskHistory = []
        return
      }

      this.taskHistoryLoading = true

      axios.get(`/api/v1/task/${taskId}/history`)
        .then(response => {
          this.taskHistory = response.data || []
        })
        .catch(error => {
          console.error(error)
          this.taskHistory = []
          this.$q.notify({
            type: 'negative',
            message: 'Не удалось загрузить историю заявки'
          })
        })
        .finally(() => {
          this.taskHistoryLoading = false
        })
    },

    formatHistoryDate (value) {
      if (!value) {
        return ''
      }

      return new Date(value).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getHistoryIcon (type) {
      switch (type) {
        case 'TASK_CREATED':
          return 'add_circle'
        case 'TASK_STATUS_CHANGED':
          return 'published_with_changes'
        case 'TASK_PRIORITY_CHANGED':
          return 'priority_high'
        case 'TASK_ASSIGNEE_CHANGED':
        case 'TASK_EXECUTOR_CHANGED':
          return 'person'
        case 'TASK_DUE_DATE_CHANGED':
          return 'event'
        case 'TASK_CLOSED':
        case 'TASK_COMPLETED':
          return 'check_circle'
        case 'TASK_REOPENED':
          return 'restart_alt'
        case 'TASK_TAG_ADDED':
        case 'TASK_TAG_REMOVED':
          return 'sell'
        default:
          return 'history'
      }
    },
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    isTaskDialogOperator () {
      return ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])
    },

    visibleTaskDialogOnboardingSteps () {
      return this.taskDialogOnboardingSteps.filter(step => {
        if (step.requiresExistingTask && this.isNewTask) {
          return false
        }
        if (step.requiresOperator && !this.isTaskDialogOperator) {
          return false
        }
        if (step.skipOnChatRoute && this.$route.path.includes('chats')) {
          return false
        }
        return true
      })
    },

    currentTaskDialogOnboardingStep () {
      return this.visibleTaskDialogOnboardingSteps[this.taskDialogOnboardingStepIndex] || this.visibleTaskDialogOnboardingSteps[0] || {}
    },

    isLastTaskDialogOnboardingStep () {
      return this.taskDialogOnboardingStepIndex >= this.visibleTaskDialogOnboardingSteps.length - 1
    },

    getClientName () {
      const client = this.task?.client || this.client
      if (!client) {
        return ''
      }
      return `${client.lastname || ''} ${client.firstname || ''}`.trim()
    },

    getLinkedMessage () {
      const queryParams = new URLSearchParams(window.location.search)
      let message = null
      if (queryParams.get('newTaskFromMessage')) {
        const messageId = queryParams.get('newTaskFromMessage')
        const clientId = Number(this.router.params.clientId)
        const client = this.store.clients.find(client => client.id === clientId)
        message = [
          {
            id: null,
            text: client.messages.find(message => message.id === Number(messageId)).text,
            date: moment(new Date(), 'DD.MM.YYYY HH:mm'),
            client: null
          }
        ]
      }
      return message
    }
  },

  watch: {
    getPossibilityToOpenDialogTask (value) {
      if (value) {
        this.$nextTick(() => {
          setTimeout(() => this.startTaskDialogOnboarding(false), 450)
        })
      } else {
        this.stopTaskDialogOnboarding()
      }
    },

    dialogTaskStatus: {
      deep: true,
      handler (oldVal, newVal) {
        if (oldVal !== '' && newVal !== '') {
          if (this.dialogTaskStatus === 'Заморожена') {
            this.freezeDialog = true
          }
        }
      }
    },

    taskRightTab (value) {
      if (value === 'history') {
        this.loadTaskHistory()
      }
    },

    'task.id' () {
      this.taskHistory = []
      if (this.taskRightTab === 'history') {
        this.loadTaskHistory()
      }
    }
  },

  mounted () {
    this.getTaskField()
    const currentTaskId = this.getCurrentTaskId()
    if (!this.isNewTask && currentTaskId) {
      axios.post(`/api/v1/client/${this.client.id}/task/${currentTaskId}/mark-message-read`, { userId: this.store.currentUser.id })
    }
    if (this.taskRightTab === 'history') {
      this.loadTaskHistory()
    }
    this.$nextTick(() => {
      setTimeout(() => this.startTaskDialogOnboarding(false), 450)
    })
  },

  beforeUnmount () {
    this.removeTaskDialogOnboardingListeners()
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return { store, router }
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

.flex-container {
  display: flex;
  justify-content: space-between;
}

.flex-item {
  flex: 0 0 48%;
}

.no-border-card {
  border: none;
  box-shadow: none;
}

.custom-select .q-field__label {
  font-size: 16px;
}

.task-right-panel {
  display: block;
}

.task-right-tabs {
  min-height: 40px;
}

.task-right-panels {
  height: auto;
  max-height: 510px;
  overflow: hidden;
}

.task-messages-panel {
  height: 510px;
  padding: 0;
}

.task-history-panel {
  position: relative;
  max-height: 470px;
  overflow-y: auto;
}

.task-dialog-onboarding-layer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: auto;
}

.task-dialog-onboarding-spotlight {
  position: fixed;
  z-index: 10001;
  border: 2px solid var(--q-primary);
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  pointer-events: none;
  transition: top 0.18s ease, left 0.18s ease, width 0.18s ease, height 0.18s ease;
}

.task-dialog-onboarding-tooltip {
  position: fixed;
  z-index: 10002;
  max-width: calc(100vw - 24px);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
  pointer-events: auto;
}

.task-dialog-onboarding-progress {
  text-align: right;
}
</style>
