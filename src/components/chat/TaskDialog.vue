<template>
  <q-dialog
    v-model="getPossibilityToOpenDialogTask"
    persistent
    backdrop-filter="blur(4px)"
    transition-show="none"
    transition-hide="none"
    :transition-duration="0"
  >
    <q-card
      data-tour="task-dialog-card"
      :class="[
        'task-dialog-card',
        this.isMobile || !$can('TASK_EDIT') || this.isNewTask
          ? 'dialog-width'
          : 'large-dialog-width'
  ]"
    >
      <task-dialog-header
        :is-new-task="this.isNewTask"
        :task-id="this.task?.id"
        :is-observer-read-only="this.isObserverReadOnly"
        :client-id="this.client?.id"
        :client-name="this.getClientName"
        :can-create-visit="this.canCreateVisitFromTask"
        @help="this.startTaskDialogOnboarding(true)"
        @open-visit="this.openTaskVisitDialog"
        @close="this.isObserverReadOnly ? this.closeDialog() : this.openSubmitModal()"
      />
      <q-card-section
        class="task-dialog-body app-inline app-padding-horizontal-16"
      >
        <incident-task-banner
          v-if="!this.isNewTask && this.task?.id"
          :task-id="this.task.id"
        />
        <div
          v-if="this.isMobile && !this.isNewTask && !this.isObserverReadOnly"
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
          :class="this.isMobile || this.isNewTask || this.isObserverReadOnly ? '' : 'flex-container'"
        >
          <div
            v-if="(!this.isMobile || this.dialogTab === 'tab1')"
            class="flex-item task-left-panel"
          >
            <task-fields-panel
              ref="taskFields"
              :task="this.task"
              :is-new-task="this.isNewTask"
              :is-observer-read-only="this.isObserverReadOnly"
              :dialog-task-complete="this.dialogTaskComplete"
              v-model:name="this.dialogTaskName"
              v-model:type="this.dialogTaskType"
              v-model:status="this.dialogTaskStatus"
              v-model:description="this.dialogTaskDescription"
              v-model:priority="this.dialogTaskPriority"
              v-model:support-line="this.dialogTaskSupportLine"
              v-model:executor="this.dialogTaskExecutor"
              v-model:tags="this.dialogTaskTags"
              v-model:deadline="this.dialogTaskDeadline"
              v-model:service="this.dialogTaskService"
              :filtered-task-types="this.filteredTaskTypes"
              :filtered-users="this.filteredUsers"
              :filtered-tags="this.filteredTags"
              :active-support-line-names="this.activeSupportLineNames"
              :available-service-labels="this.availableServiceLabels"
              :selected-task-type-checklist="this.selectedTaskTypeChecklist"
              :checklist-label="this.selectedTaskTypeChecklistLabel"
              :executor-selection-hint="this.executorSelectionHint"
              :executor-select-disabled="this.executorSelectDisabled"
              :selected-support-line="this.selectedDialogSupportLine"
              :is-closing-dialog-task="this.isClosingDialogTask"
              @filter-task-types="this.filterTaskTypes"
              @task-type-changed="this.onTaskTypeChanged"
              @open-apply-type-checklist="this.openApplyTypeChecklistDialog"
              @close-task="this.setTaskCompleted(this.task)"
              @reopen-task="this.setTaskNotCompleted(this.task)"
              @unfreeze="this.changeTaskFrozen()"
              @freeze="this.openFreezeDialog"
              @support-line-changed="this.onSupportLineChanged"
              @filter-users="this.filterUsers"
              @filter-tags="this.filterTags"
              @deadline-input="this.formatDateTime"
              @task-service-changed="this.onTaskServiceChanged"
            />
          </div>
          <task-right-panel
            v-if="(!this.isMobile || this.dialogTab === 'tab2') && this.isTaskDialogOperator && !this.isNewTask"
            v-model="taskRightTab"
            v-model:new-checklist-item-text="this.newChecklistItemText"
            :is-mobile="this.isMobile"
            :client="this.client"
            :messages="this.normalizedTaskMessages"
            :input-field="this.inputField"
            :templates="this.store.templates"
            :is-sending="this.isSending"
            :upload-progress="this.uploadProgress"
            :current-user="this.store.currentUser"
            :linked-message-id="this.linkedMessageId"
            :client-files="this.taskFiles"
            :checklist="this.dialogTaskChecklist"
            :history="this.taskHistory"
            :history-loading="this.taskHistoryLoading"
            @sendMessage="this.sendMessage"
            @isSending="this.isSending = true"
            @keyPressed="this.keyPressed"
            @editMessage="this.editMessage"
            @add-checklist-item="this.addChecklistItem"
            @remove-checklist-item="this.removeChecklistItem"
          />
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="task-dialog-actions"
        data-tour="task-dialog-actions"
      >
        <q-btn
          color="white"
          text-color="primary"
          label="Отмена"
          @click="this.isObserverReadOnly ? this.closeDialog() : this.openSubmitModal()"
        />
        <q-btn
          v-if="!this.isObserverReadOnly"
          id="save-task"
          color="primary"
          label="Сохранить"
          @click="this.saveNewOrUpdateTask"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <organization-visit-dialog
    v-model="taskVisitDialog"
    :organization="this.currentTaskOrganization"
    :selected-task="this.currentTaskVisitOption"
    :lock-task="true"
    @saved="this.onTaskVisitSaved"
  />

  <task-freeze-dialog
    v-model="this.freezeDialog"
    v-model:until="this.dialogTaskFreezeUntil"
    v-model:reason="this.dialogTaskFreezeReason"
    @confirm="this.changeTaskFrozen"
  />
  <task-submit-confirm-dialog
    v-model="this.isSubmitModal"
    :title="this.getSubmitModalTitle()"
    :message="this.getSubmitModalMessage()"
    @cancel="this.cancelSubmitModal"
    @discard="this.confirmSubmitModalWithoutSave"
    @save="this.confirmSubmitModalWithSave"
  />

  <task-type-checklist-apply-dialog
    v-model="this.typeChecklistApplyDialog"
    :task-type="this.dialogTaskType"
    @apply="this.applySelectedTypeChecklist"
  />

  <task-status-reason-dialog
    v-model="this.statusReasonDialog"
    v-model:text="this.statusReasonText"
    :title="this.statusReasonDialogTitle"
    :message="this.statusReasonDialogMessage"
    :error="this.statusReasonError"
    @cancel="this.cancelStatusReasonDialog"
    @confirm="this.confirmStatusReasonDialog"
  />

  <task-dialog-onboarding
    ref="taskDialogOnboarding"
    :is-new-task="this.isNewTask"
    :is-operator="this.isTaskDialogOperator"
    @set-dialog-tab="this.dialogTab = $event"
    @set-task-right-tab="this.taskRightTab = $event"
  />
</template>

<script>
import axios from 'axios'
import { useStore } from 'stores/store'
import OrganizationVisitDialog from 'components/organization/OrganizationVisitDialog.vue'
import IncidentTaskBanner from 'components/incidents/IncidentTaskBanner.vue'
import TaskDialogHeader from 'components/chat/task-dialog/TaskDialogHeader.vue'
import TaskRightPanel from 'components/chat/task-dialog/TaskRightPanel.vue'
import TaskFieldsPanel from 'components/chat/task-dialog/TaskFieldsPanel.vue'
import TaskFreezeDialog from 'components/chat/task-dialog/TaskFreezeDialog.vue'
import TaskSubmitConfirmDialog from 'components/chat/task-dialog/TaskSubmitConfirmDialog.vue'
import TaskTypeChecklistApplyDialog from 'components/chat/task-dialog/TaskTypeChecklistApplyDialog.vue'
import TaskStatusReasonDialog from 'components/chat/task-dialog/TaskStatusReasonDialog.vue'
import TaskDialogOnboarding from 'components/chat/task-dialog/TaskDialogOnboarding.vue'
import taskDialogFormMixin from 'components/chat/task-dialog/taskDialogFormMixin'
import taskDialogDirectoriesMixin from 'components/chat/task-dialog/taskDialogDirectoriesMixin'
import taskDialogChecklistMixin from 'components/chat/task-dialog/taskDialogChecklistMixin'
import taskDialogStatusMixin from 'components/chat/task-dialog/taskDialogStatusMixin'
import taskDialogFreezeMixin from 'components/chat/task-dialog/taskDialogFreezeMixin'
import taskDialogSubmitMixin from 'components/chat/task-dialog/taskDialogSubmitMixin'
import taskDialogSaveMixin from 'components/chat/task-dialog/taskDialogSaveMixin'
import taskDialogMessagesMixin from 'components/chat/task-dialog/taskDialogMessagesMixin'
import taskDialogHistoryMixin from 'components/chat/task-dialog/taskDialogHistoryMixin'
import taskDialogRealtimeMixin from 'components/chat/task-dialog/taskDialogRealtimeMixin'
import taskDialogVisitMixin from 'components/chat/task-dialog/taskDialogVisitMixin'
import { useRoute } from 'vue-router'
import { notifyTaskOpened } from 'src/util/ws'
import { getClientDisplayName } from 'src/util/clientName'

// Оболочка диалога заявки: шаблон, props, вкладки и оркестрация (watchers, mounted/beforeUnmount).
// Логика разнесена по mixin-ам из components/chat/task-dialog/ (поля формы, справочники, чек-лист,
// статусы, заморозка, подтверждение закрытия, сохранение, сообщения, история, websocket, выезд)
// и чистым функциям из src/util/taskDialog/. Mixin-ы работают с общим this компонента.
export default {

  mixins: [
    taskDialogFormMixin,
    taskDialogDirectoriesMixin,
    taskDialogChecklistMixin,
    taskDialogStatusMixin,
    taskDialogFreezeMixin,
    taskDialogSubmitMixin,
    taskDialogSaveMixin,
    taskDialogMessagesMixin,
    taskDialogHistoryMixin,
    taskDialogRealtimeMixin,
    taskDialogVisitMixin
  ],

  components: {
    OrganizationVisitDialog,
    IncidentTaskBanner,
    TaskDialogHeader,
    TaskRightPanel,
    TaskFieldsPanel,
    TaskFreezeDialog,
    TaskSubmitConfirmDialog,
    TaskTypeChecklistApplyDialog,
    TaskStatusReasonDialog,
    TaskDialogOnboarding
  },

  props: [
    'isMobile',
    'task',
    'isNewTaskDialogShow',
    'isTaskDialogShow',
    'isNewTask',
    'client',
    'requestStatusChangeReason'
  ],

  data: () => ({
    dialogTab: 'tab1',

    taskRightTab: 'messages',

    taskOpeningRequests: new Set()
  }),

  methods: {

    async markTaskOpened () {
      const taskId = this.task?.id
      const userId = this.store.currentUser?.id
      if (this.isNewTask || !this.getPossibilityToOpenDialogTask || !taskId || !userId) {
        return
      }
      const key = `${userId}:${taskId}`
      if (this.taskOpeningRequests.has(key)) {
        return
      }
      this.taskOpeningRequests.add(key)
      try {
        await axios.post(`/api/v1/task/${taskId}/opened`)
        notifyTaskOpened({ taskId })
      } catch (error) {
        this.taskOpeningRequests.delete(key)
      }
    },

    startTaskDialogOnboarding (force = false) {
      if (!this.getPossibilityToOpenDialogTask) {
        return
      }
      this.$refs.taskDialogOnboarding?.startTaskDialogOnboarding(force)
    },

    stopTaskDialogOnboarding () {
      this.$refs.taskDialogOnboarding?.stopTaskDialogOnboarding()
    },

    closeDialog () {
      this.$emit('closeDialog')
    }
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    isObserverReadOnly () {
      return Array.isArray(this.store.currentUser?.authorities) &&
        this.store.currentUser.authorities.includes('OBSERVER')
    },

    isTaskDialogOperator () {
      return this.$can('TASK_EDIT')
    },

    getClientName () {
      const client = this.task?.client || this.client
      if (!client) {
        return ''
      }
      return getClientDisplayName(client)
    }
  },

  watch: {
    getPossibilityToOpenDialogTask (value) {
      if (value) {
        this.markTaskOpened()
        this.getTaskField()
        this.syncLocalTaskMessages()
        if (!this.isNewTask) {
          this.loadTaskFiles()
        }
        if (!this.isNewTask && this.taskRightTab === 'history') {
          this.loadTaskHistory()
        }
        this.$nextTick(() => {
          this.startTaskDialogOnboarding(false)
        })
      } else {
        this.stopTaskDialogOnboarding()
        this.taskFiles = []
      }
    },

    dialogTaskStatus: {
      deep: true,
      handler (newVal, oldVal) {
        this.onDialogTaskStatusChanged(newVal, oldVal)
      }
    },

    'store.users': {
      deep: true,
      handler () {
        if (this.getPossibilityToOpenDialogTask) {
          this.refreshFilteredUsers()
        }
      }
    },

    'store.supportLines': {
      deep: true,
      handler () {
        if (this.getPossibilityToOpenDialogTask) {
          this.refreshFilteredUsers()
          this.loadSupportLineAssignableUsers()
        }
      }
    },

    taskRightTab (value) {
      if (value === 'history') {
        this.loadTaskHistory()
      }
      if (value === 'messages') {
        this.loadTaskFiles()
      }
    },

    'task.id' () {
      this.markTaskOpened()
      this.taskHistory = []
      this.taskFiles = []
      this.syncLocalTaskMessages()
      if (!this.isNewTask) {
        this.loadTaskFiles()
      }
      if (this.taskRightTab === 'history') {
        this.loadTaskHistory()
      }
    },

    'task.messages': {
      deep: true,
      handler () {
        this.syncLocalTaskMessages()
      }
    },
  },

  mounted () {
    this.markTaskOpened()
    this.loadTaskTypes()
      .finally(() => {
        this.getTaskField()
        this.syncLocalTaskMessages()
        if (!this.isNewTask) {
          this.loadTaskFiles()
        }
        const currentTaskId = this.getCurrentTaskId()
        if (!this.isNewTask && currentTaskId && this.isTaskDialogOperator) {
          axios.post(`/api/v1/client/${this.client.id}/task/${currentTaskId}/mark-message-read`, { userId: this.store.currentUser.id })
        }
        if (this.taskRightTab === 'history') {
          this.loadTaskHistory()
        }
        this.$nextTick(() => {
          this.startTaskDialogOnboarding(false)
        })
        this.subscribeToTaskEvents()
      })
  },

  beforeUnmount () {
    this.unsubscribeFromTaskEvents()
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return {
      store,
      router
    }
  }
}
</script>

<style scoped>
.small-text {
  font-size: 0.9em;
}

.flex-item {
  flex: 0 0 48%;
  min-height: 0;
}

.task-dialog-card {
  display: flex;
  flex-direction: column;
  height: min(720px, calc(100vh - 96px));
  max-height: calc(100vh - 96px);
  overflow: hidden;
}

.task-dialog-card.large-dialog-width {
  height: min(800px, calc(100vh - 96px));
}

.task-dialog-card.dialog-width {
  height: auto;
  max-height: calc(100vh - 96px);
}

.task-dialog-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.task-dialog-body > .flex-container {
  flex: 1 1 auto;
  width: 100%;
  height: auto;
  min-height: 0;
}

.task-dialog-actions {
  flex: 0 0 auto;
  margin: 8px 7px 8px 0;
  background: var(--app-surface, white);
  z-index: 2;
}

.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  height: 100%;
  min-height: 0;
}

/* Полоса прокрутки — правее полей, в промежутке между колонками: панель выступает вправо на 12px
   (margin-right), а внутренний отступ компенсирует это, поэтому ширина полей не меняется */
.task-left-panel {
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: content-box;
  padding-right: 12px;
  margin-right: -12px;
}

.task-left-panel > .q-card {
  min-height: 100%;
}
</style>
