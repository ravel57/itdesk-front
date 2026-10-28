<template>
  <q-card
    v-if="organizations.length > 0"
    flat
    bordered
    class="organizations-list-card"
  >
    <q-card-section class="organizations-list-title app-organizations-list-title">
      <div>
        <div class="text-subtitle1 text-weight-medium">
          {{ isShowTableMode ? 'Таблица организаций' : 'Карточки организаций' }}
        </div>
        <div class="text-caption text-grey-7">
          Найдено: {{ organizations.length }}. Нажмите на организацию, чтобы открыть карточку.
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <div v-if="!isShowTableMode" class="organizations-cards">
      <q-card
        v-for="row in organizations"
        :key="row.key"
        flat
        bordered
        clickable
        class="organization-card cursor-pointer"
        :class="{ 'organization-card--selected': selectedKey === row.key }"
        @click.stop="openOrganization(row.organization)"
      >
        <q-card-section>
          <div class="row items-start justify-between no-wrap q-gutter-sm">
            <div class="organization-card-main app-min-width-zero">
              <div
                class="text-subtitle1 text-weight-medium organization-name-ellipsis"
                :title="row.name"
              >
                {{ row.name }}
              </div>
              <div class="text-caption text-grey-7 shorten-text app-text-ellipsis">
                {{ row.contractLabel }}
              </div>
            </div>

            <q-chip
              dense
              square
              :color="row.slaLoading ? 'grey-5' : row.overdueTasks > 0 ? 'negative' : 'positive'"
              text-color="white"
            >
              {{ row.slaLoading ? 'Проверка SLA' : row.overdueTasks > 0 ? 'Есть просрочки' : 'ОК' }}
            </q-chip>
          </div>

          <div class="organization-card-stats q-mt-md">
            <div class="organization-stat">
              <div class="organization-stat-value">{{ row.employees }}</div>
              <div class="organization-stat-label">сотрудников</div>
            </div>

            <div class="organization-stat">
              <div class="organization-stat-value">{{ row.openTasks }}</div>
              <div class="organization-stat-label">открытых</div>
            </div>

            <div class="organization-stat">
              <div class="organization-stat-value">{{ row.tasks }}</div>
              <div class="organization-stat-label">всего заявок</div>
            </div>
          </div>

          <div class="q-mt-md">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption text-grey-7">SLA</span>
              <span class="text-caption text-weight-medium">{{ row.minSlaLabel }}</span>
            </div>
            <q-linear-progress
              v-if="row.minSlaPercent !== null"
              :value="row.minSlaPercent"
              :color="row.minSlaColor"
              rounded
              size="8px"
            />
            <div v-else class="text-caption text-grey-6">
              Нет активного SLA
            </div>
          </div>

          <div v-if="row.visits.enabled" class="q-mt-md">
            <div class="row items-center justify-between q-mb-xs">
              <span class="text-caption text-grey-7">Выезды</span>
              <span class="text-caption text-weight-medium">{{ row.visits.label }}</span>
            </div>
            <q-linear-progress
              :value="row.visits.percent"
              :color="row.visits.color"
              rounded
              size="8px"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-table
      v-else
      flat
      :rows="organizations"
      :columns="organizationColumns"
      row-key="key"
      :pagination="organizationPagination"
      :rows-per-page-options="rowsPerPageOptions"
      class="organizations-table"
      @row-click="openOrganizationRow"
    >
      <template #body-cell-name="props">
        <q-td :props="props">
          <div
            class="text-weight-medium organization-name-ellipsis"
            :title="props.row.name"
          >{{ props.row.name }}</div>
          <div class="text-caption text-grey-7">{{ props.row.contractLabel }}</div>
        </q-td>
      </template>

      <template #body-cell-tasks="props">
        <q-td :props="props">
          <div>{{ props.row.openTasks }} открытых</div>
          <div class="text-caption text-grey-7">{{ props.row.tasks }} всего</div>
        </q-td>
      </template>

      <template #body-cell-sla="props">
        <q-td :props="props">
          <div :class="props.row.overdueTasks > 0 ? 'text-negative text-weight-medium' : ''">
            {{ props.row.minSlaLabel }}
          </div>
          <div class="text-caption text-grey-7">{{ props.row.slaAgreementLabel }}</div>
        </q-td>
      </template>

      <template #body-cell-visits="props">
        <q-td :props="props">
          <span v-if="props.row.visits.enabled">{{ props.row.visits.label }}</span>
          <span v-else class="text-grey-6">Не настроены</span>
        </q-td>
      </template>
    </q-table>
  </q-card>

  <div v-else class="empty-organizations-state">
    <div class="text-center">
      <div class="text-h6">Организации не найдены</div>
      <div class="text-grey-7 q-mt-xs">Измените строку поиска или настройки фильтрации.</div>
      <q-btn
        v-if="searchRequest"
        class="q-mt-md"
        color="primary"
        outline
        icon="close"
        label="Сбросить поиск"
        @click="$emit('reset-search')"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrganizationsList',

  props: {
    // отфильтрованные и отсортированные строки (sortedFilteredOrganizations страницы)
    organizations: {
      type: Array,
      default: () => []
    },
    isShowTableMode: {
      type: Boolean,
      default: false
    },
    selectedKey: {
      type: String,
      default: null
    },
    searchRequest: {
      type: String,
      default: ''
    }
  },

  emits: ['open', 'reset-search'],

  data: () => ({
    organizationColumns: [
      { name: 'name', label: 'Организация', field: 'name', align: 'left', sortable: true },
      { name: 'employees', label: 'Сотрудники', field: 'employees', align: 'left', sortable: true },
      { name: 'tasks', label: 'Заявки', field: 'openTasks', align: 'left', sortable: true },
      { name: 'sla', label: 'SLA', field: 'minSlaSortValue', align: 'left', sortable: true },
      { name: 'visits', label: 'Выезды', field: row => row.visits.used, align: 'left', sortable: true }
    ],
    rowsPerPageOptions: [5, 10, 15, 20, 25, 50, 0],
    organizationPagination: {
      rowsPerPage: 10
    }
  }),

  methods: {
    openOrganization (organization) {
      this.$emit('open', organization)
    },

    openOrganizationRow (event, row) {
      this.openOrganization(row?.organization)
    }
  }
}
</script>

<style scoped>
.organizations-list-card {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 0;
  border-radius: 12px;
  overflow: visible;
}

.organizations-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
  flex: 0 0 auto;
  min-height: 0;
  padding: 12px;
  overflow: visible;
}

.organization-card {
  height: 100%;
  border-radius: 10px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.organization-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.organization-card--selected {
  border-color: var(--q-primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.organization-card-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.organization-stat {
  padding: 8px;
  background: var(--app-surface, #f6f7f9);
  border-radius: 8px;
}

.organization-stat-value {
  font-size: 18px;
  font-weight: 600;
}

.organization-stat-label {
  color: var(--app-text-muted, #6b7280);
  font-size: 12px;
}

.organizations-table {
  flex: 1 1 auto;
  min-height: 0;
  cursor: pointer;
}

.organizations-table :deep(.q-table__middle) {
  flex: 1 1 auto;
  min-height: 0;
}

.empty-organizations-state {
  height: 100%;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}
@media (max-width: 1023px) {
  .organizations-list-card {
    height: auto;
  }

  .organizations-cards {
    grid-template-columns: 1fr;
    max-height: none;
    overflow: visible;
  }
}
</style>
