<template>
  <q-page padding style="padding-bottom: 0;" class="my-tasks-page"
          :class="{ 'my-tasks-onboarding-mode': this.myTasksOnboardingActive }">
    <div style="display: flex; width: 100%; align-items: center; gap: 8px;" data-my-tasks-tour="search">
      <q-input class="app-inline app-task-search"
        outlined
        dense
        v-model="this.searchRequest"
        label="Поиск"
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
    <my-tasks-list
      :tasks="this.myTasksDisplayedTasks"
      :is-initial-loading="this.isInitialMyTasksLoading"
      :is-mobile="this.isMobile"
      :onboarding-active="this.myTasksOnboardingActive"
      :page-loading="this.myTasksPageLoading"
      :page-is-end="this.myTasksPageIsEnd"
      :total-elements="this.myTasksTotalElements"
      :show-placeholder="this.shouldShowMyTasksPlaceholder"
      @task-click="this.onTaskClicked"
      @chat-link-click="this.onChatLinkClicked"
    />
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

    <my-tasks-onboarding-overlay
      :active="this.myTasksOnboardingActive"
      :step="this.myTasksCurrentOnboardingStep"
      :step-index="this.myTasksOnboardingStepIndex"
      :steps-count="this.myTasksOnboardingSteps.length"
      :is-last-step="this.isLastMyTasksOnboardingStep"
      :highlight-style="this.myTasksOnboardingHighlightStyle"
      :tooltip-style="this.myTasksOnboardingTooltipStyle"
      @skip="this.skipMyTasksOnboarding"
      @prev="this.prevMyTasksOnboardingStep"
      @next="this.nextMyTasksOnboardingStep"
    />
  </q-page>
</template>

<script>
import {useStore} from 'stores/store'
import {useRoute} from 'vue-router'
import TaskDialog from 'components/chat/TaskDialog.vue'
import MyTasksList from 'components/my-tasks/MyTasksList.vue'
import MyTasksOnboardingOverlay from 'components/my-tasks/MyTasksOnboardingOverlay.vue'
import myTasksLoaderMixin from 'components/my-tasks/myTasksLoaderMixin'
import myTasksScrollMixin from 'components/my-tasks/myTasksScrollMixin'
import myTasksDialogMixin from 'components/my-tasks/myTasksDialogMixin'
import myTasksOnboardingMixin from 'components/my-tasks/myTasksOnboardingMixin'

export default {

  name: 'MyTasks',

  components: {MyTasksList, MyTasksOnboardingOverlay, TaskDialog},

  mixins: [myTasksLoaderMixin, myTasksScrollMixin, myTasksDialogMixin, myTasksOnboardingMixin],

  data: () => ({
    isShowTableMode: false,
    isFilterSelected: false,
    searchRequest: '',
  }),

  computed: {
    myTasksDisplayedTasks() {
      return this.myTasksOnboardingActive ? this.myTasksOnboardingDemoTasks : this.getFilteredTasks
    },

    isMobile() {
      return this.$q.screen.width < 1023
    },
  },

  mounted() {
    this.addMyTasksScrollListeners()
    this.resetMyTasksPageAndLoad()
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
    this.removeMyTasksOnboardingListeners()
    this.removeMyTasksScrollListeners()
    this.clearMyTasksReloadTimer()
    this.clearMyTasksScrollTimer()
  },

  watch: {
    '$route'(to) {
      this.initializeTaskFromUrl()
    },

    searchRequest() {
      this.reloadMyTasksPageDebounced()
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
.my-tasks-page {
  position: relative;
}
</style>
