<template>
  <div class="organizations-summary">
    <q-card flat bordered class="summary-card">
      <q-card-section>
        <div class="summary-label">Организации</div>
        <div class="summary-value">{{ organizationsCount }}</div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="summary-card">
      <q-card-section>
        <div class="summary-label">Сотрудники клиентов</div>
        <div class="summary-value">{{ totalEmployees }}</div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="summary-card">
      <q-card-section>
        <div class="summary-label">Открытые заявки</div>
        <div class="summary-value">{{ totalOpenTasks }}</div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="summary-card">
      <q-card-section>
        <div class="summary-label">Просроченные SLA</div>
        <div class="summary-value" :class="totalOverdueSla > 0 ? 'text-negative' : ''">
          {{ totalOverdueSla }}
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
export default {
  name: 'OrganizationsSummary',

  props: {
    organizationsCount: {
      type: Number,
      default: 0
    },
    totalEmployees: {
      type: Number,
      default: 0
    },
    totalOpenTasks: {
      type: Number,
      default: 0
    },
    totalOverdueSla: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style scoped>
.organizations-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.summary-card {
  min-height: 92px;
  border-radius: 12px;
}

.summary-label {
  color: #6b7280;
  font-size: 13px;
}

.summary-value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .organizations-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .organizations-summary {
    grid-template-columns: 1fr;
  }
}
</style>
