<template>
  <q-page padding class="organizations-page">
    <div class="organizations-header">
      <div class="organizations-title-block">
        <div class="text-h5 text-weight-medium">
          Организации
        </div>
        <div class="text-grey-7">
          Клиенты, сотрудники, заявки, SLA и договорные лимиты обслуживания
        </div>
      </div>

      <div class="organizations-controls">
        <q-input
          v-model="searchRequest"
          outlined
          dense
          clearable
          placeholder="Поиск по организации, сотруднику, заявке"
          class="organizations-search"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select
          v-if="!isShowTableMode"
          v-model="sortType"
          :options="sortOptions"
          outlined
          dense
          emit-value
          map-options
          label="Сортировка"
          class="organizations-sort"
        />

        <q-toggle
          v-model="isShowTableMode"
          color="grey"
          left-label
          checked-icon="list"
          unchecked-icon="dashboard"
          size="50px"
          keep-color
        >
          <q-tooltip>
            Режим отображения: {{ isShowTableMode ? 'Таблица' : 'Карточки' }}
          </q-tooltip>
        </q-toggle>
      </div>
    </div>

    <organizations-summary
      :organizations-count="organizationRows.length"
      :total-employees="totalEmployees"
      :total-open-tasks="totalOpenTasks"
      :total-overdue-sla="totalOverdueSla"
    />

    <div class="organizations-page-content">
      <organizations-list
        :organizations="sortedFilteredOrganizations"
        :is-show-table-mode="isShowTableMode"
        :selected-key="selectedOrganizationKey"
        :search-request="searchRequest"
        @open="openOrganizationDialog"
        @reset-search="searchRequest = ''"
      />
    </div>
  </q-page>

  <organization-details-dialog
    ref="organizationDetailsDialog"
    v-model="organizationDialog"
    v-model:show-completed="showCompletedTasks"
    :organization="selectedOrganization"
    :name="selectedOrganizationName"
    :contract-label="selectedOrganizationContractLabel"
    :employees="selectedOrganizationEmployees"
    :open-tasks-count="selectedOrganizationOpenTasksCount"
    :overdue-tasks-count="selectedOrganizationOverdueTasks.length"
    :last-activity="selectedOrganizationLastActivity"
    :visit-stats="selectedOrganizationVisitStats"
    :visit-history-loading="selectedOrganizationVisitHistoryLoading"
    :tasks="selectedOrganizationVisibleTasks"
    :tasks-loading="organizationTasksLoading"
    :all-tasks="tasksSource"
    :get-task-sla-label="getTaskSlaLabel"
    :is-task-sla-overdue="isTaskSlaOverdue"
    @hide="closeOrganizationDialog"
    @open-visit-history="openVisitHistoryDialog"
  />

  <organization-visit-dialog
    v-model="addVisitDialog"
    :organization="selectedOrganization"
    :task-options="visitTaskOptions"
    @saved="onOrganizationVisitSaved"
  />

  <organization-visit-history-dialog
    v-model="visitHistoryDialog"
    :organization="visitHistoryOrganization"
    :rows="selectedOrganizationVisitHistory"
    :loading="selectedOrganizationVisitHistoryLoading"
    @refresh="loadOrganizationVisitHistory"
  />
</template>

<script>
import { useStore } from 'stores/store'
import OrganizationVisitDialog from 'components/organization/OrganizationVisitDialog.vue'
import OrganizationVisitHistoryDialog from 'components/organization/OrganizationVisitHistoryDialog.vue'
import OrganizationDetailsDialog from 'components/organization/OrganizationDetailsDialog.vue'
import OrganizationsList from 'components/organization/OrganizationsList.vue'
import OrganizationsSummary from 'components/organization/OrganizationsSummary.vue'
import organizationDataMixin from 'components/organization/organizationDataMixin'
import organizationRowsMixin from 'components/organization/organizationRowsMixin'
import organizationSelectionMixin from 'components/organization/organizationSelectionMixin'
import organizationSlaMixin from 'components/organization/organizationSlaMixin'
import organizationVisitsMixin from 'components/organization/organizationVisitsMixin'
import { useSlaInfo } from 'src/composables/useSlaInfo'

// Страница-оркестратор справочника организаций. Логика разнесена по mixin-ам
// (src/components/organization/organization*Mixin.js) и чистым функциям (src/util/organizations/):
//  - organizationDataMixin      — источники данных, загрузка заявок и статистики
//  - organizationSlaMixin       — SLA-расчёты и таймер nowTs
//  - organizationRowsMixin      — строки списка, поиск, сортировка, итоги
//  - organizationSelectionMixin — выбранная организация и синхронизация с роутом
//  - organizationVisitsMixin    — выезды и история выездов
export default {
  name: 'OrganizationsPage',

  components: {
    OrganizationVisitDialog,
    OrganizationVisitHistoryDialog,
    OrganizationDetailsDialog,
    OrganizationsList,
    OrganizationsSummary
  },

  mixins: [
    organizationDataMixin,
    organizationSlaMixin,
    organizationRowsMixin,
    organizationSelectionMixin,
    organizationVisitsMixin
  ],

  data: () => ({
    isShowTableMode: false
  }),

  watch: {
    sortedFilteredOrganizations: {
      deep: true,
      handler (rows) {
        if (!this.selectedOrganizationKey) {
          return
        }

        if (!rows.some(row => row.key === this.selectedOrganizationKey)) {
          this.selectedOrganizationKey = null
          this.organizationDialog = false
        }
      }
    },

    selectedOrganizationKey () {
      this.preloadSlaInfosForOrganization(this.selectedOrganization)
      this.loadOrganizationVisitHistory(this.selectedOrganization)
    },

    isShowTableMode (value) {
      localStorage.setItem('organizationsTableMode', value ? 'true' : 'false')
    }
  },

  mounted () {
    document.title = 'ULDESK : Организации'
    this.isShowTableMode = localStorage.getItem('organizationsTableMode') === 'true'
    this.startSlaTimer()
    this.selectInitialOrganization()
    Promise.all([
      this.loadOrganizationTaskStats(),
      this.loadOrganizationTasksForPage(true)
    ]).then(() => {
      this.$nextTick(() => {
        this.preloadSlaInfosForAllOpenTasks()
      })
    })
  },

  beforeUnmount () {
    this.stopSlaTimer()
  },

  setup () {
    const store = useStore()
    const slaScope = useSlaInfo()
    return { store, slaScope }
  }
}
</script>

<style scoped>
.organizations-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 24px;
  overflow: visible;
}

.organizations-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.organizations-title-block {
  min-width: 220px;
}

.organizations-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.organizations-search {
  width: 360px;
  max-width: 100%;
}

.organizations-sort {
  width: 240px;
  max-width: 100%;
}

.organizations-page-content {
  flex: 0 0 auto;
  min-height: 0;
  overflow: visible;
}

@media (max-width: 1023px) {
  .organizations-page {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .organizations-header {
    flex-direction: column;
  }

  .organizations-controls,
  .organizations-search,
  .organizations-sort {
    width: 100%;
  }

  .organizations-page-content {
    overflow: visible;
  }
}
</style>
