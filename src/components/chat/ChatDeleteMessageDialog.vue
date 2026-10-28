<template>
  <q-dialog
    :model-value="this.modelValue"
    persistent
    @update:model-value="this.$emit('update:modelValue', $event)"
    @hide="this.$emit('hide')"
  >
    <q-card style="min-width: 360px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h6">Удалить сообщение?</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        Сообщение будет помечено как удалённое, и удалится у клиента. Это действие нельзя отменить.
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Отмена"
          color="primary"
          v-close-popup
        />
        <q-btn
          unelevated
          color="negative"
          icon="delete"
          label="Удалить"
          @click="this.$emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
// Подтверждение удаления сообщения
export default {

  name: 'ChatDeleteMessageDialog',

  props: {
    modelValue: { type: Boolean }
  },

  emits: ['update:modelValue', 'hide', 'confirm']
}
</script>
