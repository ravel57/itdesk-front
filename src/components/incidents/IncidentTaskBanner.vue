<template>
  <q-banner
    v-if="incident"
    rounded
    class="incident-task-banner q-mb-md"
    :class="incident.communicationOverdue ? 'bg-red-1 text-negative' : 'bg-deep-purple-1 text-primary'"
  >
    <template #avatar>
      <q-icon name="crisis_alert" :color="incident.communicationOverdue ? 'negative' : 'primary'"/>
    </template>
    <div class="row items-center q-col-gutter-sm">
      <div class="col">
        <div class="text-weight-medium">Связано с {{ incident.incidentNumber }} — {{ incident.title }}</div>
        <div class="text-caption">
          {{ incident.severity }} · {{ statusLabel(incident.status) }}
          <span v-if="incident.nextUpdateAt"> · Следующее обновление: {{ formatDate(incident.nextUpdateAt) }}</span>
        </div>
      </div>
      <div class="col-auto">
        <q-btn flat dense color="primary" label="Открыть" @click="openIncident"/>
      </div>
    </div>
  </q-banner>
</template>

<script>
import axios from 'axios'

export default {
  name: 'IncidentTaskBanner',
  props: {
    taskId: {type: [Number, String], default: null}
  },
  data: () => ({incident: null}),
  watch: {
    taskId: {
      immediate: true, handler() {
        this.loadIncident()
      }
    }
  },
  methods: {
    openIncident() {
      const incidentId = Number(this.incident?.id)
      if (!Number.isSafeInteger(incidentId) || incidentId <= 0) return
      this.$router.push({name: 'incident-detail', params: {incidentId: String(incidentId)}})
    },
    async loadIncident() {
      if (!Number(this.taskId)) {
        this.incident = null;
        return
      }
      try {
        this.incident = (await axios.get(`/api/v1/task/${encodeURIComponent(this.taskId)}/incident`)).data || null
      } catch (_) {
        this.incident = null
      }
    },
    statusLabel(value) {
      return ({
        DRAFT: 'Черновик',
        VERIFYING: 'Проверка',
        DECLARED: 'Объявлен',
        DIAGNOSIS: 'Диагностика',
        MITIGATION: 'Устранение',
        MONITORING: 'Наблюдение',
        RESTORED: 'Восстановлен',
        CLOSED: 'Закрыт',
        CANCELLED: 'Отменён'
      })[value] || value
    },
    formatDate(value) {
      return value ? new Date(value).toLocaleString('ru-RU') : '—'
    }
  }
}
</script>
