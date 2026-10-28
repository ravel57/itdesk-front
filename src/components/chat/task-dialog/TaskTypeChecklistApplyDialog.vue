<template>
  <q-dialog
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
  >
    <q-card class="task-type-checklist-dialog">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          Стандартный чек-лист
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />
      </q-toolbar>

      <q-card-section>
        У типа «{{ this.taskType }}» есть стандартный чек-лист.
        Что сделать с текущим чек-листом заявки?
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="grey-7"
          label="Оставить текущий"
          v-close-popup
        />

        <q-btn
          outline
          color="primary"
          label="Добавить недостающие"
          @click="this.$emit('apply', 'append')"
          v-close-popup
        />

        <q-btn
          unelevated
          color="primary"
          label="Заменить"
          @click="this.$emit('apply', 'replace')"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
    // Название выбранного типа заявки (для текста диалога)
    taskType: { type: String, default: '' }
  },

  // apply: 'append' | 'replace'
  emits: ['update:modelValue', 'apply']
}
</script>

<style scoped>
.task-type-checklist-dialog {
  width: 460px;
  max-width: calc(100vw - 32px);
}
</style>
