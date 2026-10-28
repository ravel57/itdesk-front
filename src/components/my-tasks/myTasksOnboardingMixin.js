import {getOnboardingStatus, setOnboardingStatus, wantsOnboarding} from 'src/util/onboarding'
import {buildMyTasksOnboardingDemoTasks} from 'src/util/myTasks/myTasksDemoTasks'
import {
  computeMyTasksOnboardingPosition,
  createMyTasksOnboardingSteps,
  MY_TASKS_ONBOARDING_STORAGE_KEY,
  TASKS_PAGE_ONBOARDING_STORAGE_KEY
} from 'src/util/myTasks/myTasksOnboardingSteps'

// Обучение на странице «Мои заявки»: тестовые карточки, шаги, положение подсветки и подсказки, сохранение прохождения.
// Требует на странице: this.store, isTaskDialogShow / isNewTaskDialogShow (data страницы),
// initializeTaskFromUrl (myTasksDialogMixin), this.$nextTick.
// Слушатели resize/scroll снимает страница в beforeUnmount через removeMyTasksOnboardingListeners().
export default {
  data: () => ({
    myTasksOnboardingActive: false,
    myTasksOnboardingStepIndex: 0,
    myTasksOnboardingTooltipStyle: {},
    myTasksOnboardingHighlightStyle: {},
    myTasksOnboardingStorageKey: MY_TASKS_ONBOARDING_STORAGE_KEY,
    myTasksOnboardingSteps: createMyTasksOnboardingSteps()
  }),

  computed: {
    myTasksOnboardingDemoTasks() {
      return buildMyTasksOnboardingDemoTasks(this.store.currentUser)
    },

    myTasksCurrentOnboardingStep() {
      return this.myTasksOnboardingSteps[this.myTasksOnboardingStepIndex] || this.myTasksOnboardingSteps[0]
    },

    isLastMyTasksOnboardingStep() {
      return this.myTasksOnboardingStepIndex === this.myTasksOnboardingSteps.length - 1
    },
  },

  methods: {
    startMyTasksOnboarding(force = false) {
      if (!force && (this.isMyTasksOnboardingPassed() || !wantsOnboarding())) {
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
      this.removeMyTasksOnboardingListeners()
      this.myTasksOnboardingTooltipStyle = {}
      this.myTasksOnboardingHighlightStyle = {}
      this.$nextTick(() => this.initializeTaskFromUrl())
    },

    removeMyTasksOnboardingListeners() {
      window.removeEventListener('resize', this.updateMyTasksOnboardingPosition)
      window.removeEventListener('scroll', this.updateMyTasksOnboardingPosition, true)
    },

    isMyTasksOnboardingPassed() {
      // Если пользователь уже прошёл обучение на странице «Заявки», карточки заявок ему знакомы — не повторяем
      return getOnboardingStatus(this.myTasksOnboardingStorageKey) === 'true' ||
        Boolean(getOnboardingStatus(TASKS_PAGE_ONBOARDING_STORAGE_KEY))
    },

    persistMyTasksOnboardingPassed() {
      setOnboardingStatus(this.myTasksOnboardingStorageKey, 'true')
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

      const position = computeMyTasksOnboardingPosition(step, target)
      this.myTasksOnboardingHighlightStyle = position.highlightStyle
      this.myTasksOnboardingTooltipStyle = position.tooltipStyle
    },
  }
}
