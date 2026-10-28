<template>
  <q-expansion-item
    icon="science"
    label="Проверить маршрут на существующей заявке"
    class="automation-test-panel"
    header-class="text-primary"
  >
    <div class="automation-test-content">
      <div class="row items-end q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input
            :model-value="this.testTaskId"
            type="number"
            label="ID заявки"
            min="1"
            @update:model-value="this.$emit('update:testTaskId', $event)"
          />
        </div>
        <div class="col-auto">
          <q-btn
            color="primary"
            outline
            icon="play_arrow"
            label="Проверить"
            :loading="this.testLoading"
            @click="this.$emit('run')"
          />
        </div>
      </div>

      <q-expansion-item v-if="editorMode === 'workflow'" dense label="Задать данные события вместо заявки" class="q-mt-sm">
        <q-input :model-value="testEventPayload" @update:model-value="this.$emit('update:testEventPayload', $event)" outlined type="textarea" rows="6" label="Данные события (JSON)" hint="Например: { &quot;service&quot;: { &quot;id&quot;: 1 }, &quot;problem&quot;: { &quot;severity&quot;: 5, &quot;status&quot;: &quot;OPEN&quot; } }. Тест не изменяет данные и не вызывает ИИ."/>
      </q-expansion-item>
      <q-banner
        v-if="this.testResult"
        rounded
        :class="this.testResult.valid === false
          ? 'automation-test-result automation-test-error app-automation-test-error'
          : this.isWorkflowTestResult(this.testResult)
            ? (this.testResult.executed || this.testResult.scheduled
                ? 'automation-test-result automation-test-match'
                : 'automation-test-result automation-test-miss app-automation-test-miss')
            : this.testResult.matched
              ? 'automation-test-result automation-test-match'
              : 'automation-test-result automation-test-miss app-automation-test-miss'"
      >
        <div class="text-weight-medium">
          <template v-if="this.testResult.valid === false">Ошибка проверки</template>
          <template v-else-if="this.isWorkflowTestResult(this.testResult)">
            {{ this.workflowTestResultTitle(this.testResult) }}
          </template>
          <template v-else-if="this.testResult.branch === 'YES'">Будет выполнена ветка ДА</template>
          <template v-else-if="this.testResult.branch === 'NO'">Будет выполнена ветка НЕТ</template>
          <template v-else>Действия выполняться не будут</template>
        </div>
        <div v-if="this.testResult.taskName" class="text-caption">
          №{{ this.testResult.taskId }} · {{ this.testResult.taskName }}
        </div>
        <div v-if="this.testResult.error" class="text-caption">{{ this.testResult.error }}</div>
        <div v-if="this.testResult.selectedAction" class="text-caption q-mt-xs">
          Будут выполнены: {{ this.testResult.selectedAction }}
        </div>
        <div
          v-if="this.isWorkflowTestResult(this.testResult) && this.testResult.trace?.length"
          class="automation-test-trace q-mt-sm"
        >
          <div
            v-for="(step, index) in this.testResult.trace"
            :key="`${step.nodeId || 'step'}-${index}`"
            class="automation-test-trace-step"
          >
            <q-btn flat dense :label="step.label || step.nodeType || step.nodeId" @click="this.$emit('focus-step', step)"/>
            <span> — {{ this.workflowTraceStatusLabel(step.status) }}</span>
            <span v-if="step.detail">: {{ step.detail }}</span>
            <automation-trace-details :step="step"/>
          </div>
        </div>
      </q-banner>
    </div>
  </q-expansion-item>
</template>

<script>
import {
  isWorkflowTestResult,
  workflowTestResultTitle,
  workflowTraceStatusLabel
} from 'src/util/automationPage/traceLabels'
import AutomationTraceDetails from 'src/components/automation/AutomationTraceDetails.vue'

// Панель «Проверить маршрут на существующей заявке». Состояние и запрос теста принадлежат родителю
// (automationTestMixin); здесь — поля ввода, кнопка запуска и вывод результата.
export default {
  name: 'AutomationTestPanel',

  components: {
    AutomationTraceDetails
  },

  props: {
    editorMode: {type: String, default: 'graph'},
    testTaskId: {type: [Number, String], default: null},
    // модификатор .number из v-model:test-task-id.number родителя: Vue применяет его при emit('update:testTaskId')
    testTaskIdModifiers: {type: Object, default: () => ({})},
    testEventPayload: {type: String, default: ''},
    testLoading: {type: Boolean, default: false},
    testResult: {type: Object, default: null}
  },

  emits: ['update:testTaskId', 'update:testEventPayload', 'run', 'focus-step'],

  methods: {
    isWorkflowTestResult(result) {
      return isWorkflowTestResult(result)
    },

    workflowTestResultTitle(result) {
      return workflowTestResultTitle(result)
    },

    workflowTraceStatusLabel(status) {
      return workflowTraceStatusLabel(status)
    }
  }
}
</script>

<style scoped>
.automation-test-panel {
  margin-top: 18px;
  border: 1px solid var(--app-border, #e0e0e0);
  border-radius: 8px;
  background: var(--app-surface, #fff);
}

.automation-test-content {
  padding: 4px 18px 18px;
}

.automation-test-result {
  margin-top: 16px;
}

.automation-test-trace {
  display: grid;
  gap: 4px;
  white-space: pre-wrap;
}

.automation-test-trace-step {
  font-size: 12px;
  line-height: 1.35;
}

.automation-test-match {
  border: 1px solid var(--app-success-border, #a5d6a7);
  background: var(--app-surface-muted, #f1f8e9);
  color: var(--app-success-text, #2e7d32);
}
</style>
