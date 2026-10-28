<template>
  <q-expansion-item v-if="step.input != null || step.output != null || step.variables != null" dense
                    label="Данные шага">
    <template v-for="field in fields" :key="field.key">
      <div v-if="step[field.key] != null" class="q-my-sm"><b>{{ field.label }}</b>
        <pre class="automation-trace-json">{{ JSON.stringify(step[field.key], null, 2) }}</pre>
      </div>
    </template>
  </q-expansion-item>
</template>

<script>
export default {
  name: 'AutomationTraceDetails',
  props: {
    step: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      fields: [{
        key: 'input',
        label: 'Входные значения'
      }, {
        key: 'output',
        label: 'Результат'
      }, {
        key: 'variables',
        label: 'Переменные после шага'
      }]
    }
  }
}
</script>

<style scoped>
.automation-trace-json {
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: var(--app-surface, #f5f7fa);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
