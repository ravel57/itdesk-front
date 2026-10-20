<template>
  <q-item class="list-group-item automation-rule-row">
    <q-item-section side :class="['settings-drag-handle cursor-grab', handleClass]">
      <q-icon name="drag_indicator" color="grey-6"/>
    </q-item-section>
    <q-item-section top class="justify-center">
      <q-item-label class="row items-center q-gutter-sm">
        <span>{{ trigger.name }}</span>
        <q-badge
          :color="trigger.automationRuleStatus === 'DISABLED' ? 'grey-6' : 'positive'"
          :label="trigger.automationRuleStatus === 'DISABLED' ? 'Выключено' : 'Активно'"
        />
        <q-badge
          v-if="trigger.stopProcessing"
          outline
          color="primary"
          label="Остановить после совпадения"
        />
      </q-item-label>
      <q-item-label caption>
        {{ typeLabel }} · срабатываний: {{ Number(trigger.matchCount || 0).toLocaleString('ru-RU') }}
        <span v-if="trigger.lastMatchedAt"> · последнее: {{ formatDateTime(trigger.lastMatchedAt) }}</span>
      </q-item-label>
    </q-item-section>
    <q-item-section top side>
      <div class="row items-center no-wrap">
        <q-toggle
          :model-value="trigger.automationRuleStatus !== 'DISABLED'"
          :disable="toggling"
          color="primary"
          @update:model-value="$emit('toggle', $event)"
        />
        <q-btn
          color="primary"
          dense
          flat
          icon="edit"
          @click="$emit('edit')"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  name: 'AutomationRuleRow',

  props: {
    trigger: {type: Object, required: true},
    typeLabel: {type: String, default: ''},
    toggling: {type: Boolean, default: false},
    handleClass: {type: String, default: ''}
  },

  emits: ['toggle', 'edit'],

  methods: {
    formatDateTime(value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value
      return date.toLocaleString('ru-RU')
    }
  }
}
</script>

<style scoped>
.list-group-item:hover {
  background-color: #e3e3e3;
}
</style>
