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
        {{ this.message }}
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn
          outline
          color="primary"
          @click="this.$emit('cancel')"
        >
          Отмена
        </q-btn>
        <q-btn
          outline
          color="primary"
          @click="this.$emit('discard')"
        >
          Не сохранять
        </q-btn>
        <q-btn
          color="primary"
          @click="this.$emit('save')"
        >
          Сохранить
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
    title: { type: String, default: '' },
    message: { type: String, default: '' }
  },

  // cancel — остаться в заявке, discard — «Не сохранять», save — «Сохранить»
  emits: ['update:modelValue', 'cancel', 'discard', 'save']
}
</script>
