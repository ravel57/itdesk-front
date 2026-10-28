<template>
  <div>
    <div
      v-if="this.isMobile"
      class="sticky-tabs"
    >
      <q-tabs
        v-model="tab"
        dense
        align="justify"
        class="bg-primary text-white"
        :breakpoint="0"
      >
        <q-tab name="tab1" icon="forum"/>
        <q-tab name="tab2" icon="support" v-if="this.isShowHelper || this.isMobile"/>
        <q-tab name="tab3" icon="info"/>
      </q-tabs>
    </div>
    <q-page
      style="min-height: auto"
    >
      <div
        ref="chatPageLayout"
        class="chat-page-layout"
        :class="{ 'chat-page-layout-mobile': this.isMobile }"
        :style="this.isMobile ? 'height: calc(100vh - 90px)' : desktopGridStyle"
      >
        <div
          data-tour="chat-dialog-column"
          v-if="!this.isMobile || this.tab === 'tab1'"
          id="chatColumn"
          class="chat-page-column no-shadow"
          @dragenter.prevent="onChatDragEnter"
          @dragover.prevent
          @dragleave.prevent="onChatDragLeave"
          @drop.prevent="onChatFilesDropped"
        >
          <chat-drop-overlay v-if="isDraggingFilesOverChat"/>
          <chat-dialog
            ref="chatDialogRef"
            :isMobile="this.isMobile"
            :messages="this.getClient.messages"
            :inputField="this.inputField"
            :templates="this.activeTemplates"
            :isSending="this.isSending"
            :upload-progress="this.uploadProgress"
            :clientId="this.getClient.id"
            :typing="this.getClient.typingUsers"
            :currentUser="this.store.currentUser"
            :read-only="this.isObserverUser"
            :linkedMessageId="this.linkedMessageId"
            :highlight-linked-message="!this.isSilentLinkedMessage"
            :tasks="this.activeClientTasks"
            :onboarding-demo="this.isChatOnboardingActive"
            :task-watching-now="this.getClient.watchingUsers"
            :deleteClient="this.deleteClient"
            :isShowHelper="this.isShowHelper"
            :client="this.getClient"
            :isEnd="this.isEnd"
            :pending-new-messages-count="this.pendingNewMessagesCount"
            :has-trimmed-newer-messages="this.hasTrimmedNewerMessages"
            @goToLatestMessages="this.goToLatestMessages"
            @sendMessage="this.sendMessage"
            @keyPressed="this.keyPressed($event)"
            @updated="this.markMessagesRead"
            @isSending="this.isSending = true"
            @pastToInputField="pastToInputField"
            @linkToTask="this.linkToTask"
            @clearLinkedMessageId="this.clearLinkedMessageId"
            @deleteMessage="this.deleteMessage"
            @showHelper="this.showHelper"
            @hideHelper="this.hideHelper"
            @getMessagePage="this.getMessagePage"
            @getNewerMessagePage="this.getNewerMessagePage"
            @scrollToMessageAfterSearch="this.getMessageOnSearch($event)"
            @setAnswerRequired="setAnswerRequired"
            @findInKnowledgeBase="this.findInKnowledgeBase"
            @editMessage="this.editMessage"
            @openLinkedTask="this.openLinkedTask"
          />
        </div>
        <div
          v-if="!this.isMobile && isHelperVisible"
          class="chat-page-column-resizer"
          @mousedown="startColumnResize('chat-helper', $event)"
        />
        <div
          v-if="!this.isMobile && !isHelperVisible"
          class="chat-page-column-resizer"
          @mousedown="startColumnResize('chat-tasks', $event)"
        />
        <div
          data-tour="chat-helper-wrapper"
          class="chat-page-column no-shadow"
          v-if="(!this.isMobile || this.tab === 'tab2') && (this.isShowHelper || this.isMobile) && $can('CHAT_REPLY')"
        >
          <chat-helper
            :isMobile="this.isMobile"
            :templates="this.activeTemplates"
            :knowledgeBase="this.activeKnowledgeBase"
            :ai-query-from-message="this.helperAiQueryFromMessage"
            :ai-query-version="this.helperAiQueryVersion"
            :onboarding-demo="this.isChatOnboardingActive"
            @onTemplateClick="onTemplateClick"
            @hideHelper="this.hideHelper"
          />
        </div>

        <div
          v-if="!this.isMobile && isHelperVisible"
          class="chat-page-column-resizer"
          @mousedown="startColumnResize('helper-tasks', $event)"
        />

        <div
          data-tour="chat-tasks-wrapper"
          class="chat-page-column chat-page-tasks-column no-shadow"
          v-if="!this.isMobile || this.tab === 'tab3'"
        >
          <chat-tasks
            ref="chatTasks"
            :tasks="this.activeClientTasks"
            :isNotificationEnabled="isNotificationEnabled"
            :tags="this.activeTags"
            :users="this.activeUsers"
            :organizations="this.activeOrganizations"
            :client="this.getClient"
            :statuses="this.activeStatuses"
            :priorities="this.activePriorities"
            :is-mobile="this.isMobile"
            :onboarding-demo="this.isChatOnboardingActive"
            :request-status-change-reason="this.requestStatusChangeReasonIfNeeded"
            @newTask="this.newTask"
            @updateTask="this.updateTask"
            @tasksLoaded="this.onClientTasksLoaded"
            @scrollToElementById="this.getLinkedMessage($event)"
          />
        </div>
      </div>
    </q-page>

    <chat-status-reason-dialog ref="statusReasonDialog"/>

    <chat-onboarding-overlay
      :active="isChatOnboardingActive"
      :step="currentChatOnboardingStep"
      :step-index="chatOnboardingStepIndex"
      :steps-count="chatOnboardingSteps.length"
      :is-last-step="isLastChatOnboardingStep"
      :target-rect="chatOnboardingTargetRect"
      :card-style="chatOnboardingCardStyle"
      @start="startChatOnboarding(true)"
      @finish="finishChatOnboarding"
      @prev="prevChatOnboardingStep"
      @next="nextChatOnboardingStep"
    />

  </div>
</template>

<script>
import ChatDialog from 'components/chat/ChatDialog.vue'
import ChatHelper from 'components/chat/ChatHelper.vue'
import ChatTasks from 'components/chat/ChatTasks.vue'
import ChatDropOverlay from 'components/chat-page/ChatDropOverlay.vue'
import ChatOnboardingOverlay from 'components/chat-page/ChatOnboardingOverlay.vue'
import ChatStatusReasonDialog from 'components/chat-page/ChatStatusReasonDialog.vue'
import chatClientContextMixin from 'components/chat-page/chatClientContextMixin'
import chatLayoutMixin from 'components/chat-page/chatLayoutMixin'
import chatLinkedTasksMixin from 'components/chat-page/chatLinkedTasksMixin'
import chatMessageActionsMixin from 'components/chat-page/chatMessageActionsMixin'
import chatMessageWindowMixin from 'components/chat-page/chatMessageWindowMixin'
import chatNavigationMixin from 'components/chat-page/chatNavigationMixin'
import chatOnboardingMixin from 'components/chat-page/chatOnboardingMixin'
import chatSocketMixin from 'components/chat-page/chatSocketMixin'
import {useStore} from 'stores/store'
import {useRoute} from 'vue-router'
import {onClientMessage} from 'src/util/ws'

export default {
  components: {
    ChatTasks,
    ChatHelper,
    ChatDialog,
    ChatDropOverlay,
    ChatOnboardingOverlay,
    ChatStatusReasonDialog
  },

  mixins: [
    chatClientContextMixin,
    chatOnboardingMixin,
    chatMessageWindowMixin,
    chatMessageActionsMixin,
    chatSocketMixin,
    chatLinkedTasksMixin,
    chatNavigationMixin,
    chatLayoutMixin
  ],

  data: () => ({
    tab: 'tab1',
    inputField: '',
    isComment: false,
    isNotificationEnabled: true,
    isShowHelper: false
  }),

  methods: {
    // Диалог причины живёт в ChatStatusReasonDialog; ChatTasks получает этот метод пропом.
    requestStatusChangeReasonIfNeeded(oldStatusName, newStatusName) {
      return this.$refs.statusReasonDialog.request(oldStatusName, newStatusName)
    },
  },

  computed: {
    isMobile() {
      return this.$q.screen.width < 1023
    },
  },

  watch: {
    isShowHelper() {
      this.$nextTick(() => {
        this.applyColumnWidthsFromRatios()
        requestAnimationFrame(() => {
          this.applyColumnWidthsFromRatios()
        })
      })
    },

    '$route.query.messageId'(newValue, oldValue) {
      if (!newValue && oldValue) {
        return
      }
      this.routeMessageIdHandled = null
      this.$nextTick(() => this.handleRouteMessageId())
    },

    '$route.params.clientId'() {
      this.routeMessageIdHandled = null
      this.linkedMessageId = null
      this.currentClientTasks = []
      this.messagesLoadedForCurrentChat = false
      this.pageCounter = 0
      this.pendingNewMessagesCount = 0
      this.hasTrimmedNewerMessages = false
      this.$nextTick(() => {
        this.loadCurrentChatData()
        this.handleRouteMessageId()
      })
    },

    'store.clients': {
      handler() {
        // /api/v1/clients обычно приходит уже после messages-page при F5.
        // В этот момент переносим кэш в появившийся реальный объект клиента.
        this.syncCachedMessagesToRealClient()
        this.$nextTick(() => this.handleRouteMessageId())
      }
    },
  },

  mounted() {
    // По умолчанию спрятан — пользователь открывает его сам по значку, когда понадобится
    this.isShowHelper = this.isChatOnboardingActive || localStorage.getItem('isShowHelper') === 'true'
    this.$nextTick(() => {
      this.initColumnWidths()
      window.addEventListener('resize', this.handleWindowResize)
      window.addEventListener('resize', this.onChatOnboardingWindowChange)
      window.addEventListener('scroll', this.onChatOnboardingWindowChange, true)
    })
    if (this.isMobile) {
      this.tab = this.isChatOnboardingActive ? 'tab1' : 'tab3'
    }
    // Подписка нужна и при обучении: после закрытия тура страница не монтируется заново,
    // и без подписки новые сообщения пропадали бы из открытого чата до перезагрузки
    this.clientMessageUnsubscribe = onClientMessage(this.onClientMessageFromSocket)
    if (this.isChatOnboardingActive) {
      this.startChatOnboarding()
      return
    }
    this.$nextTick(() => {
      setTimeout(() => {
        this.markMessagesRead()
      }, 350)
    })
    this.initCurrentChatDraft()
    this.$nextTick(() => {
      setTimeout(() => {
        this.handleRouteMessageId()
      }, 300)
    })
  },

  created() {
    if (!this.isChatOnboardingActive) {
      this.loadCurrentChatData()
    }
  },

  setup() {
    const store = useStore()
    const router = useRoute()
    return {store, router}
  },

  beforeUnmount() {
    this.stopColumnResize()
    clearTimeout(this.socketMessageRefreshTimer)
    this.socketMessageRefreshTimer = null
    this.socketMessageRefreshLoadedWindow = false
    if (this.clientMessageUnsubscribe) {
      this.clientMessageUnsubscribe()
      this.clientMessageUnsubscribe = null
    }
    window.removeEventListener('resize', this.handleWindowResize)
    window.removeEventListener('resize', this.onChatOnboardingWindowChange)
    window.removeEventListener('scroll', this.onChatOnboardingWindowChange, true)
  },
}
</script>

<style scoped>
.chat-page-layout {
  display: grid;
  width: 100%;
  overflow: hidden;
}

.chat-page-layout-mobile {
  display: block;
  overflow: auto;
}

.chat-page-column {
  position: relative;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.chat-page-column-resizer {
  width: 8px;
  height: 100%;
  cursor: col-resize;
  position: relative;
  z-index: 5;
}

.chat-page-column-resizer::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 2px;
  background: #0000001f;
}

.chat-page-column-resizer:hover::before {
  background: var(--q-primary);
}

.chat-page-tasks-column {
  min-width: 452px;
}
</style>
