<template>
  <q-dialog
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        Удалить фильтр {{ this.filterLabel }}?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="primary"
          label="Отмена"
          @click="this.$emit('update:modelValue', false)"
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
// Подтверждение удаления сохранённого шаблона фильтров. Удаление выполняет страница по событию confirm.
export default {
  props: {
    // Показ диалога (v-model)
    modelValue: {
      type: Boolean,
      default: false
    },
    // Название удаляемого шаблона
    filterLabel: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue', 'confirm']
}
</script>
