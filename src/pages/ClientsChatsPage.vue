<template>
  <q-page padding style="min-width: 0;overflow-x: hidden;">
    <clients-chats-toolbar
      v-if="shouldShowChatsToolbar"
      v-model:search-query="searchQuery"
      v-model:sort-type="sortType"
      :sort-options="sortOptions"
      @search="search"
      @start-onboarding="startOnboarding(true)"
    />
    <div v-if="this.getSortedAndFilteredClients.length > 0">
      <q-list>
        <clients-chats-client-row
          v-for="client in this.getSortedAndFilteredClients"
          :key="client.id"
          :client="client"
          :is-first="isFirstClient(client)"
          :route="getClientChatRoute(client)"
          :is-observer="isObserver"
          :name="getClientName(client)"
          :abbreviation="getAbbreviation(client)"
          :avatar-color="nameToPastelHex(getClientName(client))"
          :organization="getOrganization(client)"
          :has-critical-tasks="hasCriticalTasks(client)"
          :has-ping="isHavePing(client)"
          :sla-visible="isSlaVisible(client)"
          :sla-expired="isClientSlaExpired(client)"
          :sla-percent="getClientSlaPercent(client)"
          :sla-color="getClientSlaColor(client)"
          :time-last-message="getTimeLastMessage(client)"
          :last-message="getLastMessage(client)"
          :has-unanswered-required="hasAnswerRequiredUnansweredMessages(client)"
          :answer-timer-text="getAnswerRequiredTimerText(client)"
          :answer-timer-title="getAnswerRequiredTimerTitle()"
          @chat-click="handleClientChatClick(client, $event)"
        />
      </q-list>
    </div>
    <div v-else class="absolute-center" data-tour="empty-state">
      <div style="text-align: center;font-size: 20px">
        {{ searchQuery.trim() ? 'Ничего не найдено' : 'Чатов нет' }}
        <no-tasks-placeholder/>
      </div>
    </div>

    <clients-chats-onboarding-overlay
      v-if="isOnboardingVisible && currentOnboardingStep"
      :step="currentOnboardingStep"
      :card-style="onboardingCardStyle"
      :highlight-style="onboardingHighlightStyle"
      :step-number="getCurrentOnboardingStepNumber()"
      :steps-count="getAvailableOnboardingStepsCount()"
      :has-previous="hasPreviousOnboardingStep()"
      :has-next="hasNextOnboardingStep()"
      @skip="skipOnboarding"
      @previous="previousOnboardingStep"
      @next="nextOnboardingStep"
    />
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'
import ClientsChatsToolbar from 'components/clients-chats/ClientsChatsToolbar.vue'
import ClientsChatsClientRow from 'components/clients-chats/ClientsChatsClientRow.vue'
import ClientsChatsOnboardingOverlay from 'components/clients-chats/ClientsChatsOnboardingOverlay.vue'
import clientsChatsOnboardingMixin from 'components/clients-chats/clientsChatsOnboardingMixin'
import clientsChatsSlaMixin from 'components/clients-chats/clientsChatsSlaMixin'
import clientsChatsAnswerWaitingMixin from 'components/clients-chats/clientsChatsAnswerWaitingMixin'
import clientsChatsRowMixin from 'components/clients-chats/clientsChatsRowMixin'
import clientsChatsSortMixin from 'components/clients-chats/clientsChatsSortMixin'
import { useSlaInfo } from 'src/composables/useSlaInfo'

export default {
  name: 'DialogsPage',

  components: {
    NoTasksPlaceholder,
    ClientsChatsToolbar,
    ClientsChatsClientRow,
    ClientsChatsOnboardingOverlay
  },

  mixins: [
    clientsChatsOnboardingMixin,
    clientsChatsSlaMixin,
    clientsChatsAnswerWaitingMixin,
    clientsChatsRowMixin,
    clientsChatsSortMixin
  ],

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
    // Настройка «Учитывать рабочее время в «Требует ответа»» подхватывается без перезагрузки страницы
    this.loadAnswerWaitingSettings()
    this.answerWaitingSettingsTimer = setInterval(this.loadAnswerWaitingSettings, 60000)

    window.addEventListener('resize', this.updateOnboardingPosition)
    window.addEventListener('scroll', this.updateOnboardingPosition, true)
    this.$nextTick(() => this.startOnboarding(false))
  },

  beforeUnmount () {
    clearInterval(this.slaTimer)
    clearInterval(this.answerWaitingSettingsTimer)
    window.removeEventListener('resize', this.updateOnboardingPosition)
    window.removeEventListener('scroll', this.updateOnboardingPosition, true)
  },

  setup () {
    const store = useStore()
    const slaScope = useSlaInfo()
    return {
      store,
      slaScope
    }
  }
}
</script>
