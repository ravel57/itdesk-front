import { wantsOnboarding, getOnboardingStatus, setOnboardingStatus } from 'src/util/onboarding'
import {
  CHAT_ONBOARDING_STEPS,
  createDemoClient,
  createDemoKnowledgeBase,
  createDemoOrganizations,
  createDemoPriorities,
  createDemoStatuses,
  createDemoTags,
  createDemoTemplates,
  createDemoUsers
} from 'src/util/chatPage/onboardingDemo'

// Обучающий тур страницы чата: демо-данные, шаги и позиционирование подсказки.
// Требует в компоненте: inputField, isShowHelper, tab, isMobile и методы
// loadCurrentChatData / applyColumnWidthsFromRatios (другие миксины страницы).
export default {
  data: () => ({
    chatOnboardingStorageKey: 'chat-page-onboarding-v1',
    isChatOnboardingActive: getOnboardingStatus('chat-page-onboarding-v1') !== 'done' && wantsOnboarding(),
    chatOnboardingStepIndex: 0,
    chatOnboardingTargetRect: null,
    chatOnboardingCardStyle: {},
    chatOnboardingMoveDirection: 1,
    chatOnboardingPreviousInputField: '',
    chatOnboardingPreviousIsShowHelper: true,
    chatOnboardingDemoClient: createDemoClient(),
    chatOnboardingDemoTemplates: createDemoTemplates(),
    chatOnboardingDemoKnowledgeBase: createDemoKnowledgeBase(),
    chatOnboardingDemoTags: createDemoTags(),
    chatOnboardingDemoUsers: createDemoUsers(),
    chatOnboardingDemoOrganizations: createDemoOrganizations(),
    chatOnboardingDemoStatuses: createDemoStatuses(),
    chatOnboardingDemoPriorities: createDemoPriorities()
  }),

  computed: {
    chatOnboardingSteps() {
      return CHAT_ONBOARDING_STEPS
    },

    currentChatOnboardingStep() {
      return this.chatOnboardingSteps[this.chatOnboardingStepIndex]
    },

    isLastChatOnboardingStep() {
      return this.chatOnboardingStepIndex >= this.chatOnboardingSteps.length - 1
    },
  },

  methods: {
    startChatOnboarding(force = false) {
      if (!force && getOnboardingStatus(this.chatOnboardingStorageKey) === 'done') {
        return
      }
      this.chatOnboardingPreviousInputField = this.inputField
      this.chatOnboardingPreviousIsShowHelper = this.isShowHelper
      this.isChatOnboardingActive = true
      this.chatOnboardingStepIndex = 0
      this.inputField = 'Здравствуйте! Уже проверяю ваш вопрос.'
      this.isShowHelper = true
      this.$nextTick(() => {
        this.goToChatOnboardingStep(0, 1)
      })
    },

    finishChatOnboarding() {
      setOnboardingStatus(this.chatOnboardingStorageKey, 'done')
      this.isChatOnboardingActive = false
      this.chatOnboardingTargetRect = null
      this.chatOnboardingCardStyle = {}
      this.inputField = this.chatOnboardingPreviousInputField
      this.isShowHelper = this.chatOnboardingPreviousIsShowHelper
      this.$nextTick(() => {
        this.loadCurrentChatData()
        this.applyColumnWidthsFromRatios()
      })
    },

    nextChatOnboardingStep() {
      if (this.isLastChatOnboardingStep) {
        this.finishChatOnboarding()
        return
      }
      this.goToChatOnboardingStep(this.chatOnboardingStepIndex + 1, 1)
    },

    prevChatOnboardingStep() {
      if (this.chatOnboardingStepIndex === 0) {
        return
      }
      this.goToChatOnboardingStep(this.chatOnboardingStepIndex - 1, -1)
    },

    goToChatOnboardingStep(index, direction = 1) {
      this.chatOnboardingMoveDirection = direction
      this.chatOnboardingStepIndex = Math.max(0, Math.min(index, this.chatOnboardingSteps.length - 1))
      this.prepareCurrentChatOnboardingStep()
      this.$nextTick(() => {
        setTimeout(() => {
          this.updateChatOnboardingPosition(direction)
        }, 120)
      })
    },

    prepareCurrentChatOnboardingStep() {
      const step = this.currentChatOnboardingStep
      if (!step) {
        return
      }
      if (step.tab && this.isMobile) {
        this.tab = step.tab
      }
      if (step.requiresHelper) {
        this.isShowHelper = true
      }
      if (!this.isMobile) {
        this.$nextTick(() => {
          this.applyColumnWidthsFromRatios()
        })
      }
    },

    updateChatOnboardingPosition(direction = this.chatOnboardingMoveDirection, attempts = 0) {
      if (!this.isChatOnboardingActive || !this.currentChatOnboardingStep) {
        return
      }

      const target = document.querySelector(`[data-tour="${this.currentChatOnboardingStep.target}"]`)

      if (!target) {
        if (attempts < 4) {
          setTimeout(() => this.updateChatOnboardingPosition(direction, attempts + 1), 120)
          return
        }
        const nextIndex = this.chatOnboardingStepIndex + (direction >= 0 ? 1 : -1)
        if (nextIndex >= 0 && nextIndex < this.chatOnboardingSteps.length) {
          this.goToChatOnboardingStep(nextIndex, direction)
        } else {
          this.finishChatOnboarding()
        }
        return
      }

      target.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'auto'
      })

      const rect = target.getBoundingClientRect()
      const padding = 8
      const cardWidth = Math.min(360, window.innerWidth - 32)
      const cardHeight = 230
      let top = rect.bottom + 14
      let left = rect.left

      if (top + cardHeight > window.innerHeight - 16) {
        top = rect.top - cardHeight - 14
      }
      if (top < 16) {
        top = 16
      }
      if (left + cardWidth > window.innerWidth - 16) {
        left = window.innerWidth - cardWidth - 16
      }
      if (left < 16) {
        left = 16
      }

      this.chatOnboardingTargetRect = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      }
      this.chatOnboardingCardStyle = {
        top: `${top}px`,
        left: `${left}px`,
        width: `${cardWidth}px`
      }
    },

    onChatOnboardingWindowChange() {
      if (!this.isChatOnboardingActive) {
        return
      }
      this.$nextTick(() => {
        this.updateChatOnboardingPosition()
      })
    },
  },
}
