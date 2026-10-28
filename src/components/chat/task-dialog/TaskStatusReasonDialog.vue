<template>
  <q-dialog
    persistent
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
  >
    <q-card class="dialog-width">
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
          v-model="this.textModel"
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
          label="Продолжить"
          @click="this.$emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    // Текст причины, v-model:text
    text: { type: String, default: '' },
    error: { type: Boolean, default: false }
  },

  emits: ['update:modelValue', 'update:text', 'cancel', 'confirm'],

  computed: {
    textModel: {
      get () {
        return this.text
      },
      set (value) {
        this.$emit('update:text', value)
      }
    }
  }
}
</script>
