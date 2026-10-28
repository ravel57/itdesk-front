import { getOnboardingStatus, setOnboardingStatus, wantsOnboarding } from 'src/util/onboarding'
import { buildOnboardingDemoClients, buildOnboardingSteps } from 'src/util/clientsChats/onboardingContent'
import { computeOnboardingPosition } from 'src/util/clientsChats/onboardingPosition'

// Обучение на странице «Чаты»: демо-клиенты, шаги, подсветка элемента и позиция карточки.
// Слушатели resize/scroll и запуск обучения подключаются в хуках страницы.
export default {
  data: () => ({
    isOnboardingVisible: false,
    currentOnboardingStepIndex: 0,
    onboardingCardStyle: {},
    onboardingHighlightStyle: null,
    onboardingStorageKey: 'clients-chats-onboarding-v3',
    onboardingDemoClients: buildOnboardingDemoClients(),
    onboardingSteps: buildOnboardingSteps()
  }),

  computed: {
    currentOnboardingStep () {
      return this.onboardingSteps[this.currentOnboardingStepIndex] || null
    }
  },

  methods: {
    isOnboardingDemoClient (client) {
      return client?.isOnboardingDemoClient === true
    },

    preventOnboardingDemoNavigation (client, event) {
      if (!this.isOnboardingDemoClient(client)) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
    },

    startOnboarding (force = false) {
      if (!force && (getOnboardingStatus(this.onboardingStorageKey) === 'skipped' || !wantsOnboarding())) {
        return
      }
      this.isOnboardingVisible = true
      this.currentOnboardingStepIndex = 0
      this.$nextTick(() => this.normalizeOnboardingStep())
    },

    skipOnboarding () {
      setOnboardingStatus(this.onboardingStorageKey, 'skipped')
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

      const { cardStyle, highlightStyle } = computeOnboardingPosition(
        target.getBoundingClientRect(),
        this.currentOnboardingStep.placement
      )
      this.onboardingCardStyle = cardStyle
      this.onboardingHighlightStyle = highlightStyle
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
    }
  }
}
