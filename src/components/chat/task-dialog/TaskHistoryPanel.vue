<template>
  <q-inner-loading :showing="this.loading">
    <q-spinner size="32px"/>
  </q-inner-loading>
  <div
    v-if="!this.loading && this.items.length === 0"
    class="text-grey-7"
  >
    История изменений пустая
  </div>
  <q-timeline
    v-else
    color="primary"
  >
    <q-timeline-entry
      v-for="item in this.items"
      :key="item.id"
      :title="item.title"
      :subtitle="this.formatHistoryDate(item.createdAt)"
      :icon="this.getHistoryIcon(item.triggerType)"
    >
      <div class="text-grey-8 task-history-description">
        {{ item.description }}
      </div>
      <q-markup-table
        v-if="this.getTaskHistoryChanges(item).length > 0"
        dense
        flat
        bordered
        class="q-mt-sm task-history-changes-table app-width-full"
      >
        <thead>
        <tr>
          <th class="text-left">Поле</th>
          <th class="text-left">Было</th>
          <th class="text-left">Стало</th>
        </tr>
        </thead>

        <tbody>
        <tr
          v-for="(change, index) in this.getTaskHistoryChanges(item)"
          :key="`${change.field}-${index}`"
        >
          <td>{{ change.label || change.field }}</td>
          <td>{{ this.getTaskHistoryChangeValue(change.oldValue, change.field) }}</td>
          <td>{{ this.getTaskHistoryChangeValue(change.newValue, change.field) }}</td>
        </tr>
        </tbody>
      </q-markup-table>
      <div
        v-if="item.actorDisplayName"
        class="text-caption text-grey-7 q-mt-xs"
      >
        Изменил: {{ item.actorDisplayName }}
      </div>

      <div
        v-else
        class="text-caption text-grey-7 q-mt-xs"
      >
        Изменил: неизвестно
      </div>
    </q-timeline-entry>
  </q-timeline>
</template>

<script>
import moment from 'moment/moment'

export default {
  props: {
    // Записи истории заявки
    items: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },

  methods: {
    formatHistoryDate (value) {
      if (!value) {
        return ''
      }

      return new Date(value).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getTaskHistoryChanges (item) {
      const changes = Array.isArray(item?.changes)
        ? item.changes.map(change => ({ ...change }))
        : []

      if (changes.some(change => change?.field === 'frozenUntil')) {
        return changes
      }

      const frozenChange = changes.find(change => change?.field === 'frozen')
      if (!this.isPositiveHistoryValue(frozenChange?.newValue)) {
        return changes
      }

      const frozenUntil = this.getTaskHistoryPayloadValue(item, ['task', 'frozenUntil']) ||
        this.getTaskHistoryPayloadValue(item, ['frozenUntil'])

      if (!frozenUntil) {
        return changes
      }

      changes.push({
        field: 'frozenUntil',
        label: 'Заморожена до',
        oldValue: '—',
        newValue: frozenUntil
      })

      return changes
    },

    getTaskHistoryPayloadValue (item, path) {
      const payload = this.getTaskHistoryPayload(item)
      if (!payload) {
        return null
      }

      return path.reduce((value, key) => {
        if (value === null || value === undefined) {
          return null
        }
        return value[key]
      }, payload)
    },

    getTaskHistoryPayload (item) {
      const payload = item?.meta?.payload || item?.payload

      if (!payload) {
        return null
      }

      if (typeof payload === 'object') {
        return payload
      }

      try {
        return JSON.parse(payload)
      } catch (e) {
        return null
      }
    },

    isPositiveHistoryValue (value) {
      if (value === true) {
        return true
      }
      const normalized = String(value || '').trim().toLowerCase()
      return ['true', 'да', 'заморожена', 'заморожено'].includes(normalized)
    },

    getTaskHistoryChangeValue (value, field) {
      if (value === null || value === undefined || value === '' || value === 'null') {
        return '—'
      }

      if (['deadline', 'frozenFrom', 'frozenUntil'].includes(field)) {
        return this.formatHistoryDateValue(value)
      }

      return value
    },

    formatHistoryDateValue (value) {
      if (!value || value === 'null') {
        return '—'
      }

      if (Array.isArray(value) && value.length >= 5) {
        const [year, month, day, hour, minute] = value
        return moment({
          year: Number(year),
          month: Number(month) - 1,
          date: Number(day),
          hour: Number(hour),
          minute: Number(minute)
        }).format('DD.MM.YYYY HH:mm')
      }

      const parsed = moment(value)
      if (parsed.isValid()) {
        return parsed.format('DD.MM.YYYY HH:mm')
      }

      return value
    },

    getHistoryIcon (type) {
      switch (type) {
        case 'TASK_CREATED':
          return 'add_circle'
        case 'TASK_STATUS_CHANGED':
          return 'published_with_changes'
        case 'TASK_PRIORITY_CHANGED':
          return 'priority_high'
        case 'TASK_TYPE_CHANGED':
          return 'category'
        case 'TASK_SERVICE_CHANGED':
          return 'dns'
        case 'FIRST_RESPONSE_SLA_WARNING':
          return 'timer'
        case 'FIRST_RESPONSE_SLA_BREACHED':
          return 'timer_off'
        case 'TASK_ASSIGNEE_CHANGED':
        case 'TASK_EXECUTOR_CHANGED':
          return 'person'
        case 'TASK_DUE_DATE_CHANGED':
          return 'event'
        case 'TASK_CLOSED':
        case 'TASK_COMPLETED':
          return 'check_circle'
        case 'TASK_REOPENED':
          return 'restart_alt'
        case 'TASK_TAG_ADDED':
        case 'TASK_TAG_REMOVED':
          return 'sell'
        case 'TASK_UPDATED':
          return 'edit_note'
        default:
          return 'history'
      }
    }
  }
}
</script>

<style scoped>
th {
  text-align: left;
}

.task-history-description {
  white-space: pre-line;
}

.task-history-changes-table th,
.task-history-changes-table td {
  white-space: normal;
  vertical-align: top;
}
</style>
