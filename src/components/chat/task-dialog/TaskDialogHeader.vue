<template>
  <q-toolbar class="justify-between">
    <!--FIXME-->
    <div v-if="this.isNewTask" class="text-h6" data-tour="task-dialog-title">Новая заявка</div>
    <div v-else class="text-h6" data-tour="task-dialog-title">Заявка № {{ this.taskId }}</div>
    <div class="">
      <q-btn
        v-if="!this.isObserverReadOnly"
        flat
        round
        dense
        icon="help_outline"
        data-tour="task-dialog-help"
        @click="this.$emit('help')"
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
        @click="this.$router.push({ path: `/chats/${this.clientId}` })"
      >
        <q-tooltip>
          Перейти в чат с {{ this.clientName }}
        </q-tooltip>
      </q-btn>
      <q-btn
        v-if="this.canCreateVisit"
        flat
        round
        dense
        icon="directions_car"
        data-tour="task-dialog-visit"
        @click.stop="this.$emit('open-visit')"
      >
        <q-tooltip>
          Добавить выезд по этой заявке
        </q-tooltip>
      </q-btn>
      <q-btn
        flat
        round
        dense
        icon="close"
        @click="this.$emit('close')"
        v-close-popup
      />
    </div>
  </q-toolbar>
</template>

<script>
// Шапка диалога заявки: заголовок и кнопки (обучение, переход в чат, добавление выезда, закрытие).
// Действия наружу: help, open-visit, close (закрытие решает родитель: с подтверждением или без).
export default {
  props: {
    isNewTask: { type: Boolean, default: false },
    // Номер заявки для заголовка
    taskId: { type: [Number, String], default: null },
    isObserverReadOnly: { type: Boolean, default: false },
    clientId: { type: [Number, String], default: null },
    clientName: { type: String, default: '' },
    canCreateVisit: { type: Boolean, default: false }
  },

  emits: ['help', 'open-visit', 'close']
}
</script>
