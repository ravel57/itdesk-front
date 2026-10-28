<template>
  <div class="period-toggle">
    <q-btn
      v-for="option in options"
      :key="option.value"
      :label="option.label"
      :color="modelValue === option.value ? 'primary' : 'grey-3'"
      :text-color="modelValue === option.value ? 'white' : 'dark'"
      unelevated
      dense
      class="period-toggle-btn"
      @click="$emit('select', option.value)"
    />
  </div>
</template>

<script>
import {PERIOD_OPTIONS} from 'src/util/analytics/analyticsPeriod'

// Кнопки быстрого выбора периода (сегодня / 7 дней / 30 дней).
export default {
  name: 'AnalyticsPeriodToggle',

  props: {
    modelValue: {
      type: String,
      default: ''
    }
  },

  emits: ['select'],

  data: () => ({
    options: PERIOD_OPTIONS
  })
}
</script>

<style scoped>
.period-toggle {
  display: flex;
  gap: 8px;
  align-items: center;
}

.period-toggle-btn {
  border-radius: 4px;
  min-height: 32px;
  padding: 4px 10px;
}
</style>
