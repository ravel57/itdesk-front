<template>
  <div class="row q-col-gutter-md q-mb-md">
    <div
      v-for="card in metricCards"
      :key="card.key"
      class="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
    >
      <q-card flat bordered class="metric-card" :class="card.tone">
        <q-card-section>
          <div class="row items-center justify-between no-wrap">
            <div class="metric-title">
              {{ card.label }}
            </div>
            <q-icon :name="card.icon" size="22px" class="metric-icon"/>
          </div>

          <div class="metric-value">
            {{ card.value }}
          </div>

          <div class="metric-caption">
            {{ card.caption }}
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import analyticsSummaryMixin from './analyticsSummaryMixin'

// Карточки ключевых метрик над вкладками аналитики.
export default {
  name: 'AnalyticsMetricCards',

  mixins: [analyticsSummaryMixin],

  props: {
    summary: {
      type: Object,
      default: () => ({})
    },
    canViewInternalAnalytics: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    metricCards() {
      const cards = [
        {
          key: 'newAppeals',
          label: 'Новые обращения',
          value: this.formatNumber(this.newAppeals),
          caption: 'Входящие за период',
          icon: 'forum',
          tone: this.newAppeals > 0 ? 'metric-card-info' : 'metric-card-neutral'
        },
        {
          key: 'openTasks',
          label: 'Открытые заявки',
          value: this.formatNumber(this.openTasks),
          caption: 'Сейчас в работе',
          icon: 'task_alt',
          tone: this.openTasks > 0 ? 'metric-card-info' : 'metric-card-neutral'
        },
        {
          key: 'closedTasks',
          label: 'Закрыто',
          value: this.formatNumber(this.closedTasks),
          caption: 'За выбранный период',
          icon: 'done_all',
          tone: this.closedTasks > 0 ? 'metric-card-positive' : 'metric-card-neutral'
        },
        {
          key: 'overdueSla',
          label: 'Просроченные SLA',
          value: this.formatNumber(this.overdueSla),
          caption: 'Нарушена реакция',
          icon: 'warning',
          tone: this.overdueSla > 0 ? 'metric-card-negative' : 'metric-card-healthy'
        },
        {
          key: 'overdueOla',
          label: 'Просроченные OLA',
          value: this.formatNumber(this.overdueOla),
          caption: 'Нарушен внутренний срок линии',
          icon: 'timer_off',
          tone: this.overdueOla > 0 ? 'metric-card-negative' : 'metric-card-healthy'
        },
        {
          key: 'overdueDeadlines',
          label: 'Просроченные дедлайны',
          value: this.formatNumber(this.overdueDeadlines),
          caption: 'Нарушен срок выполнения',
          icon: 'event_busy',
          tone: this.overdueDeadlines > 0 ? 'metric-card-negative' : 'metric-card-healthy'
        },
        {
          key: 'unansweredMessages',
          label: 'Без ответа',
          value: this.formatNumber(this.unansweredMessages),
          caption: 'Сообщения клиентов',
          icon: 'mark_chat_unread',
          tone: this.unansweredMessages > 0 ? 'metric-card-warning' : 'metric-card-healthy'
        },
        {
          key: 'avgFirstResponseSeconds',
          label: 'Первый ответ',
          value: this.formatDuration(this.avgFirstResponseSeconds),
          caption: this.firstResponseCount > 0
            ? `Ответов учтено: ${this.firstResponseCount}`
            : 'Нет учтённых ответов',
          icon: 'reply',
          tone: this.avgFirstResponseSeconds > 0 ? 'metric-card-info' : 'metric-card-neutral'
        },
        {
          key: 'avgCloseTimeSeconds',
          label: 'Закрытие заявки',
          value: this.formatDuration(this.avgCloseTimeSeconds),
          caption: 'Среднее время',
          icon: 'schedule',
          tone: this.avgCloseTimeSeconds > 0 ? 'metric-card-info' : 'metric-card-neutral'
        },
        {
          key: 'unassignedTasks',
          label: 'Без исполнителя',
          value: this.formatNumber(this.unassignedTasks),
          caption: 'Открытые заявки',
          icon: 'person_off',
          tone: this.unassignedTasks > 0 ? 'metric-card-warning' : 'metric-card-neutral'
        },
        {
          key: 'reopenedTasks',
          label: 'Переоткрыто',
          value: this.formatNumber(this.reopenedTasks),
          caption: 'Возвращены в работу',
          icon: 'restart_alt',
          tone: this.reopenedTasks > 0 ? 'metric-card-warning' : 'metric-card-neutral'
        }
      ]
      return this.canViewInternalAnalytics
        ? cards
        : cards.filter(card => !['overdueOla', 'unassignedTasks'].includes(card.key))
    }
  }
}
</script>

<style scoped>
.metric-card {
  height: 100%;
  border-radius: 8px;
  border-left: 4px solid #e0e0e0;
}

.metric-card-info {
  border-left-color: #1976d2;
}

.metric-card-positive {
  border-left-color: #21ba45;
}

.metric-card-warning {
  border-left-color: #f2c037;
}

.metric-card-negative {
  border-left-color: #c10015;
}

.metric-card-neutral {
  border-left-color: #9e9e9e;
}

.metric-card-healthy {
  border-left-color: #21ba45;
}

.metric-title {
  color: #616161;
  font-size: 13px;
  line-height: 16px;
}

.metric-icon {
  color: #757575;
}

.metric-value {
  margin-top: 12px;
  font-size: 28px;
  line-height: 32px;
  font-weight: 600;
}

.metric-caption {
  margin-top: 4px;
  color: #757575;
  font-size: 12px;
}
</style>
