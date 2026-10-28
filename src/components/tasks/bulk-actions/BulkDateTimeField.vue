<template>
  <q-input
    :model-value="modelValue"
    clearable
    :label="label"
    mask="##.##.#### ##:##"
    @update:model-value="value => $emit('update:modelValue', value)"
  >
    <template
      v-slot:append
    >
      <q-icon
        name="event"
        class="cursor-pointer"
      >
        <q-popup-proxy
          ref="qDatePopup"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date
            :model-value="modelValue"
            first-day-of-week="1"
            locale="ru"
            today-btn
            :options="dateOption"
            mask="DD.MM.YYYY HH:mm"
            @update:model-value="onDatePicked"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script>
import { dateOption } from 'src/util/taskBulkActions/bulkTask'

// Поле «дата и время» (ДД.ММ.ГГГГ ЧЧ:мм) с календарём в попапе; используется в модалке массовых действий
// для «Заморозить до» и «Дедлайн».
export default {
  name: 'BulkDateTimeField',

  props: {
    modelValue: {type: String, default: ''},
    label: {type: String, default: ''}
  },

  emits: ['update:modelValue'],

  methods: {
    dateOption (date) {
      return dateOption(date)
    },

    onDatePicked (value) {
      this.$emit('update:modelValue', value)
      this.$refs.qDatePopup.hide()
    }
  }
}
</script>
