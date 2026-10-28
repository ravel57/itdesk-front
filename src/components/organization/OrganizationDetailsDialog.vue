<template>
  <q-dialog
    :model-value="modelValue"
    no-route-dismiss
    @update:model-value="$emit('update:modelValue', $event)"
    @hide="$emit('hide')"
  >
    <q-card
      v-if="organization"
      ref="organizationInfoCard"
      class="organization-dialog-card"
    >
      <q-toolbar class="justify-between organization-dialog-toolbar">
        <div class="organization-dialog-title-block">
          <div
            class="text-h6 text-weight-medium organization-name-ellipsis"
            :title="name"
          >
            {{ name }}
          </div>
          <div class="text-caption text-grey-7">
            {{ contractLabel }}
          </div>
        </div>

        <div class="row q-gutter-xs items-center">
          <q-chip dense square color="primary" text-color="white">
            {{ employees.length }} сотрудников
          </q-chip>
          <q-chip dense square color="grey-8" text-color="white">
            {{ openTasksCount }} открытых заявок
          </q-chip>
          <q-chip
            v-if="overdueTasksCount > 0"
            dense
            square
            color="negative"
            text-color="white"
          >
            {{ overdueTasksCount }} SLA просрочено
          </q-chip>
        </div>

        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-separator />

      <div class="organization-dialog-body">

        <q-separator />

        <organization-info-section
          :organization="organization"
          :name="name"
          :contract-label="contractLabel"
          :employees="employees"
          :open-tasks-count="openTasksCount"
          :last-activity="lastActivity"
          :visit-stats="visitStats"
          :visit-history-loading="visitHistoryLoading"
          @open-visit-history="$emit('open-visit-history', $event)"
        />

        <organization-employees-section
          :employees="employees"
          :tasks="allTasks"
        />

        <organization-tasks-section
          :tasks="tasks"
          :loading="tasksLoading"
          :show-completed="showCompleted"
          :get-task-sla-label="getTaskSlaLabel"
          :is-task-sla-overdue="isTaskSlaOverdue"
          @update:show-completed="$emit('update:showCompleted', $event)"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
import OrganizationInfoSection from 'components/organization/OrganizationInfoSection.vue'
import OrganizationEmployeesSection from 'components/organization/OrganizationEmployeesSection.vue'
import OrganizationTasksSection from 'components/organization/OrganizationTasksSection.vue'

export default {
  name: 'OrganizationDetailsDialog',

  components: {
    OrganizationInfoSection,
    OrganizationEmployeesSection,
    OrganizationTasksSection
  },

  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    organization: {
      type: Object,
      default: null
    },
    name: {
      type: String,
      default: ''
    },
    contractLabel: {
      type: String,
      default: ''
    },
    // сотрудники выбранной организации
    employees: {
      type: Array,
      default: () => []
    },
    openTasksCount: {
      type: Number,
      default: 0
    },
    overdueTasksCount: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: String,
      default: ''
    },
    visitStats: {
      type: Object,
      required: true
    },
    visitHistoryLoading: {
      type: Boolean,
      default: false
    },
    // видимые заявки организации (с учётом переключателя «Показывать закрытые»)
    tasks: {
      type: Array,
      default: () => []
    },
    tasksLoading: {
      type: Boolean,
      default: false
    },
    showCompleted: {
      type: Boolean,
      default: false
    },
    // все известные заявки (tasksSource страницы)
    allTasks: {
      type: Array,
      default: () => []
    },
    getTaskSlaLabel: {
      type: Function,
      required: true
    },
    isTaskSlaOverdue: {
      type: Function,
      required: true
    }
  },

  emits: ['update:modelValue', 'update:showCompleted', 'hide', 'open-visit-history']
}
</script>

<style scoped>
.organization-dialog-toolbar {
  gap: 12px;
}

.organization-dialog-title-block {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.organization-dialog-card {
  width: 1180px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.organization-dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.organization-details-card {
  border-radius: 12px;
}

@media (max-width: 700px) {
  .organization-dialog-card {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
