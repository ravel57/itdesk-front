<template>
  <q-dialog persistent :model-value="modelValue" @update:model-value="value => $emit('update:modelValue', value)">
    <div id="task-freeze-modal">
      <q-card>
        <q-card-section>
          <div class="text-h6">Заморозка заявки</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div id="freeze-time-input">
            <bulk-date-time-field
              :model-value="freezeUntil"
              label="Заморозить до"
              @update:model-value="value => $emit('update:freezeUntil', value)"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup/>
          <div id="freeze-save-btn">
            <q-btn label="Применить" color="primary" v-close-popup/>
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script>
import BulkDateTimeField from 'components/tasks/bulk-actions/BulkDateTimeField.vue'

// Диалог «Заморозка заявки»: открывается при выборе замороженного статуса в массовом действии «Статус».
// v-model — видимость диалога, v-model:freezeUntil — дата разморозки.
export default {
  name: 'BulkFreezeDialog',

  components: {BulkDateTimeField},

  props: {
    modelValue: {type: Boolean, default: false},
    freezeUntil: {type: String, default: ''}
  },

  emits: ['update:modelValue', 'update:freezeUntil']
}
</script>
