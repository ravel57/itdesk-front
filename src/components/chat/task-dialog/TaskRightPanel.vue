<template>
  <div
    id="chat-section"
    data-tour="task-dialog-right-panel"
    class="flex-item task-right-panel"
    style="border: 1px solid #0000001f;overflow: hidden;border-radius: 16px"
    :style="this.isMobile ? 'height: 541px' : ''"
  >
    <q-tabs
      :model-value="this.modelValue"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="text-grey-8 task-right-tabs"
      data-tour="task-dialog-right-tabs"
      @update:model-value="this.$emit('update:modelValue', $event)"
    >
      <q-tab name="messages" label="Сообщения" data-tour="task-dialog-messages-tab"/>
      <q-tab name="checklist" label="Чек-лист" data-tour="task-dialog-checklist-tab"/>
      <q-tab name="history" label="История" data-tour="task-dialog-history-tab"/>
    </q-tabs>

    <q-separator/>

    <q-tab-panels
      :model-value="this.modelValue"
      animated
      class="task-right-panels"
      @update:model-value="this.$emit('update:modelValue', $event)"
    >
      <q-tab-panel name="messages" class="q-pa-none task-messages-panel" data-tour="task-dialog-messages-panel">
        <chat-dialog
          :is-mobile="this.isMobile"
          :messages="this.messages"
          :input-field="this.inputField"
          :templates="this.templates"
          :isSending="this.isSending"
          :upload-progress="this.uploadProgress"
          :current-user="this.currentUser"
          :linked-message-id="this.chatLinkedMessageId"
          :client-id="this.client.id"
          :client="this.client"
          :is-show-helper="false"
          :show-helper-action="false"
          :taskWatchingNow="[]"
          :typing="[]"
          :isDialog="true"
          :comments="false"
          :show-answer-required-actions="false"
          :client-files="this.clientFiles"
          @sendMessage="this.$emit('sendMessage', $event)"
          @isSending="this.$emit('isSending')"
          @keyPressed="this.$emit('keyPressed', $event)"
          @editMessage="this.$emit('editMessage', $event)"
        />
      </q-tab-panel>

      <q-tab-panel
        name="checklist"
        class="q-pa-md task-checklist-panel"
        data-tour="task-dialog-checklist-panel"
      >
        <task-checklist-panel
          :checklist="this.checklist"
          :new-item-text="this.newChecklistItemText"
          @update:new-item-text="this.$emit('update:newChecklistItemText', $event)"
          @add="this.$emit('add-checklist-item')"
          @remove="this.$emit('remove-checklist-item', $event)"
        />
      </q-tab-panel>

      <q-tab-panel name="history" class="q-pa-md task-history-panel" data-tour="task-dialog-history-panel">
        <task-history-panel
          :items="this.history"
          :loading="this.historyLoading"
        />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script>
import ChatDialog from 'components/chat/ChatDialog.vue'
import TaskChecklistPanel from 'components/chat/task-dialog/TaskChecklistPanel.vue'
import TaskHistoryPanel from 'components/chat/task-dialog/TaskHistoryPanel.vue'

// Правая колонка диалога заявки: вкладки «Сообщения» (ChatDialog), «Чек-лист» и «История».
// Состояние живёт в TaskDialog: сюда приходит props, наружу уходят события.
// Активная вкладка — v-model, новый пункт чек-листа — v-model:new-checklist-item-text.
export default {
  components: {
    ChatDialog,
    TaskChecklistPanel,
    TaskHistoryPanel
  },

  props: {
    // Активная вкладка: messages | checklist | history
    modelValue: { type: String, default: 'messages' },
    isMobile: { type: Boolean, default: false },
    client: { type: Object, required: true },
    // Сообщения (ChatDialog)
    messages: { type: Array, default: () => [] },
    inputField: { type: String, default: '' },
    templates: { type: Array, default: () => [] },
    isSending: { type: Boolean, default: false },
    uploadProgress: { type: Number, default: null },
    currentUser: { type: Object, default: null },
    linkedMessageId: { type: [Number, String], default: null },
    clientFiles: { type: Array, default: () => [] },
    // Чек-лист (массив меняется на месте внутри TaskChecklistPanel)
    checklist: { type: Array, default: () => [] },
    newChecklistItemText: { type: String, default: '' },
    // История
    history: { type: Array, default: () => [] },
    historyLoading: { type: Boolean, default: false }
  },

  computed: {
    // ChatDialog ждёт Number или null: пустое значение ('' / undefined) приводится к null
    chatLinkedMessageId () {
      if (this.linkedMessageId === null || this.linkedMessageId === undefined || this.linkedMessageId === '') {
        return null
      }
      const id = Number(this.linkedMessageId)
      return Number.isFinite(id) ? id : null
    }
  },

  emits: [
    'update:modelValue',
    'sendMessage',
    'isSending',
    'keyPressed',
    'editMessage',
    'update:newChecklistItemText',
    'add-checklist-item',
    'remove-checklist-item'
  ]
}
</script>

<style scoped>
.task-right-panel {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-height: 0;
  height: 100%;
}

.task-right-tabs {
  flex: 0 0 auto;
  min-height: 40px;
}

.task-right-panels {
  flex: 1 1 auto;
  height: 100%;
  max-height: none;
  min-height: 0;
  overflow: hidden;
}

.task-right-panels :deep(.q-panel) {
  height: 100%;
  min-height: 0;
}

.task-right-panels :deep(.q-tab-panel) {
  height: 100%;
  min-height: 0;
}

.task-messages-panel {
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.task-checklist-panel {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.task-history-panel {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}
</style>
