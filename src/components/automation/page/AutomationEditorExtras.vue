<template>
  <q-expansion-item
    v-if="triggerId && !isNewTrigger && workflowPublishesHints"
    label="Оценки подсказок оператору"
    icon="thumbs_up_down"
    class="automation-editor-extra"
    @show="hintStatsOpened = true"
  >
    <operator-hint-stats v-if="hintStatsOpened" :rule-id="triggerId"/>
  </q-expansion-item>
  <q-expansion-item v-if="triggerId && !isNewTrigger" label="Журнал выполнения: решения и данные шагов" icon="history" class="automation-editor-extra" @show="loadGraphHistory">
    <q-expansion-item v-if="graphBackups.length" dense label="Версия графа до переноса логики">
      <div v-for="backup in graphBackups" :key="backup.migration_version" class="q-pa-sm">
        <div class="text-caption">Сохранено {{ formatDateTime(backup.saved_at) }}</div>
        <q-btn outline dense label="Открыть прежний граф в редакторе" @click="$emit('open-backup', backup)"/>
      </div>
    </q-expansion-item>
    <q-btn flat dense icon="refresh" label="Обновить" :loading="historyLoading" @click="loadGraphHistory"/>
    <div v-if="!graphHistory.length" class="text-caption q-pa-sm">Пока нет записей новых графовых операций.</div>
    <div v-for="row in graphHistory" :key="row.execution_id + row.created_at + row.step.nodeId" class="q-pa-sm">
      <div class="text-caption">{{ formatDateTime(row.created_at) }} · {{ row.execution_id }}</div>
      <q-btn flat dense :label="row.step.label" @click="$emit('focus-step', row.step)"/>
      <span>{{ workflowTraceStatusLabel(row.step.status) }}: {{ row.step.detail }}</span>
      <automation-trace-details :step="row.step"/>
    </div>
  </q-expansion-item>
</template>

<script>
import axios from 'axios'
import AutomationTraceDetails from 'src/components/automation/AutomationTraceDetails.vue'
import OperatorHintStats from 'src/components/jev/OperatorHintStats.vue'
import {formatDateTime, workflowTraceStatusLabel} from 'src/util/automationPage/traceLabels'

// Нижние панели окна редактора сохранённой автоматизации: оценки подсказок оператору и журнал выполнения
// (с версиями графа до переноса логики). Данные журнала загружаются при раскрытии панели.
export default {
  name: 'AutomationEditorExtras',

  components: {
    OperatorHintStats,
    AutomationTraceDetails
  },

  props: {
    triggerId: {type: Number, default: null},
    isNewTrigger: {type: Boolean, default: false},
    workflowPublishesHints: {type: Boolean, default: false}
  },

  emits: ['focus-step', 'open-backup'],

  data: () => ({
    graphHistory: [],
    hintStatsOpened: false,
    graphBackups: [],
    historyLoading: false
  }),

  methods: {
    async loadGraphHistory() {
      this.historyLoading = true
      try {
        const [history, backups] = await Promise.all([
          axios.get('/api/v1/automation/history', {params: {triggerId: this.triggerId}}),
          axios.get('/api/v1/automation/backups', {params: {triggerId: this.triggerId}})
        ])
        this.graphHistory = history.data.map(row => ({...row, step: typeof row.step === 'string' ? JSON.parse(row.step) : row.step}))
        this.graphBackups = backups.data.map(row => ({...row, definition: typeof row.definition === 'string' ? JSON.parse(row.definition) : row.definition}))
      } catch (error) {
        this.$q.notify({type: 'negative', message: 'Не удалось загрузить журнал шагов'})
      } finally {
        this.historyLoading = false
      }
    },

    formatDateTime(value) {
      return formatDateTime(value)
    },

    workflowTraceStatusLabel(status) {
      return workflowTraceStatusLabel(status)
    }
  }
}
</script>

<style scoped>
.automation-editor-extra {
  margin-top: 12px;
  border: 1px solid var(--app-border, #e0e0e0);
  border-radius: 8px;
}
</style>
