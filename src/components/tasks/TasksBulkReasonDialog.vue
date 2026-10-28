<template>
  <q-dialog
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
    persistent
  >
    <q-card class="app-inline app-dialog-medium">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ this.title }}
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          @click="this.$emit('cancel')"
        />
      </q-toolbar>

      <q-card-section>
        <div class="text-body2 q-mb-md">
          {{ this.message }}
        </div>

        <q-input
          :model-value="this.reason"
          @update:model-value="this.$emit('update:reason', $event)"
          type="textarea"
          autogrow
          autofocus
          label="Причина *"
          :error="this.error"
          error-message="Обязательное поле"
          @keyup.ctrl.enter="this.$emit('confirm')"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="primary"
          label="Отмена"
          @click="this.$emit('cancel')"
        />

        <q-btn
          color="primary"
          :label="this.confirmLabel"
          @click="this.$emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
// Диалог запроса причины для массового закрытия / возврата / смены статуса заявок.
// Вся логика (promise, валидация, выполнение действия) остаётся на странице: диалог только показывает
// переданные тексты и сообщает о нажатии «Отмена» / «Подтвердить».
export default {
  props: {
    // Показ диалога (v-model)
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    message: {
      type: String,
      default: ''
    },
    confirmLabel: {
      type: String,
      default: ''
    },
    // Текст причины (v-model:reason)
    reason: {
      type: String,
      default: ''
    },
    // Показать ошибку «Обязательное поле»
    error: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue', 'update:reason', 'cancel', 'confirm']
}
</script>
