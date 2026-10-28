<template>
  <div class="table-container">
    <q-list
      bordered
      class="rounded-borders bg-white settings-row-list organization-list app-overflow-hidden"
      separator
    >
      <draggable
        :list="organizations"
        item-key="id"
        class="organization-sortable-list"
        ghost-class="ghost"
        handle=".settings-drag-handle"
        :disabled="Boolean(search)"
        @start="$emit('drag-start')"
        @end="$emit('drag-end')"
      >
        <template #item="{ element }">
          <q-item
            class="organization-row app-shared-notification-header"
            :class="{ 'not-draggable': Boolean(search) }"
          >
            <q-item-section side class="settings-drag-handle cursor-grab">
              <q-icon name="drag_indicator" color="grey-6"/>
            </q-item-section>

            <q-item-section class="organization-name-section app-organization-name-section">
              <q-item-label class="row items-center q-gutter-sm no-wrap">
                <span class="text-weight-medium organization-name-ellipsis" :title="element.name">
                  {{ element.name }}
                </span>
                <q-badge
                  v-if="element.active === false"
                  color="grey-6"
                  label="Отключена"
                />
              </q-item-label>

              <q-item-label caption class="q-mt-xs organization-meta-line">
                <span>{{ element.contractNumber || 'Договор не указан' }}</span>
                <span>· {{ element.tariffName || element.servicePackageName || 'Тариф не указан' }}</span>
                <span>· Сотрудников: {{ organizationClientsCount(element) }}</span>
                <span v-if="element.useVisitsLimit">
                  · Выезды: {{ numberOrZero(element.visitsUsed) }} / {{ numberOrZero(element.monthlyVisitsLimit) }}
                </span>
                <span v-else>· Выезды не учитываются</span>
                <span>· SLA: {{ element.slaAgreementName || 'по общим настройкам' }}</span>
              </q-item-label>

              <q-item-label caption class="organization-secondary-line">
                {{ element.inn ? `ИНН ${element.inn}` : 'ИНН не указан' }}
                <span v-if="element.mainAddress"> · {{ element.mainAddress }}</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-btn
                color="primary"
                dense
                flat
                icon="edit"
                @click="$emit('edit', element)"
              >
                <q-tooltip>Настроить организацию</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </template>
      </draggable>

      <q-item v-if="organizations.length === 0">
        <q-item-section class="text-grey-7 text-center q-pa-lg">
          Организации не найдены
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import { useStore } from 'stores/store'
import settingsOrganizationHelpersMixin from 'components/settings/organizations/settingsOrganizationHelpersMixin'

// Список организаций настроек с drag-and-drop сортировкой.
// organizations — тот же массив, что показывает draggable (:list), он переставляется на месте.
// События: edit (с организацией), drag-start, drag-end.
export default {
  name: 'SettingsOrganizationsList',

  components: {draggable},

  mixins: [settingsOrganizationHelpersMixin],

  props: {
    organizations: {type: Array, default: () => []},
    search: {type: String, default: ''}
  },

  emits: ['edit', 'drag-start', 'drag-end'],

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.organization-meta-line,
.organization-secondary-line {
  color: var(--app-text-muted, #737b89);
  line-height: 1.45;
}

.organization-secondary-line {
  margin-top: 2px;
}
</style>
