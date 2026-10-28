<template>
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
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="close"
          color="grey-7"
          class="onboarding-close-btn app-shared-onboarding-close-btn"
          aria-label="Закрыть обучение"
          @click="this.finishTaskDialogOnboarding"
        >
          <q-tooltip>Закрыть обучение</q-tooltip>
        </q-btn>
        <q-card-section class="q-pb-xs app-inline app-padding-right-40">
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
        <q-card-actions align="right" class="q-pt-none">
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
import { wantsOnboarding, getOnboardingStatus, setOnboardingStatus } from 'src/util/onboarding'

// Обучающий тур по диалогу заявки. Подсвечивает элементы по [data-tour="..."] (они остаются в TaskDialog и его подкомпонентах).
// Запуск/остановка — снаружи через ref: startTaskDialogOnboarding(force) / stopTaskDialogOnboarding().
export default {
  props: {
    isNewTask: { type: Boolean, default: false },
    // Пользователь с правом TASK_EDIT (шаги с requiresOperator показываются только ему)
    isOperator: { type: Boolean, default: false }
  },

  // Шаги переключают вкладки в диалоге заявки (мобильная вкладка и вкладка правой панели)
  emits: ['set-dialog-tab', 'set-task-right-tab'],

  data: () => ({
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
        target: 'task-dialog-fields',
        title: 'Поля заявки',
        text: 'Название, тип, описание, приоритет, линия поддержки, исполнитель, теги, дедлайн и сервис — все поля подписаны. Тип может подставить стандартный чек-лист, а линия поддержки влияет на список доступных исполнителей.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-status-controls',
        title: 'Статус и закрытие',
        text: 'Статус показывает этап обработки. Рядом доступны быстрые действия: закрыть заявку, вернуть в работу или заморозить выполнение.',
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
        title: 'Сообщения, чек-лист и история',
        text: 'Правая часть заявки хранит связанную переписку, рабочий чек-лист и историю изменений, каждый на своей вкладке. На мобильном экране этот блок открывается отдельно.',
        dialogTab: 'tab2',
        rightTab: 'messages',
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
      if (!force && (getOnboardingStatus(this.taskDialogOnboardingKey) || !wantsOnboarding())) {
        return
      }
      this.taskDialogOnboardingActive = true
      this.taskDialogOnboardingStepIndex = 0
      this.addTaskDialogOnboardingListeners()
      this.applyTaskDialogOnboardingStep()
    },

    finishTaskDialogOnboarding () {
      this.taskDialogOnboardingActive = false
      setOnboardingStatus(this.taskDialogOnboardingKey, 'done')
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
        this.$emit('set-dialog-tab', step.dialogTab)
      }
      if (step.rightTab) {
        this.$emit('set-task-right-tab', step.rightTab)
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

      target.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'smooth'
      })

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
    }
  },

  computed: {
    visibleTaskDialogOnboardingSteps () {
      return this.taskDialogOnboardingSteps.filter(step => {
        if (step.requiresExistingTask && this.isNewTask) {
          return false
        }
        if (step.requiresOperator && !this.isOperator) {
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
    }
  },

  beforeUnmount () {
    this.removeTaskDialogOnboardingListeners()
  }
}
</script>

<style scoped>
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

/* Крестик закрытия обучения в правом верхнем углу карточки */
</style>
