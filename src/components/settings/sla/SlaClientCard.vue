<template>
  <sla-card
    title="SLA по организациям и приоритетам"
    subtitle='Для отключения SLA впишите 0 или "выкл." в поле времени'
  >
    <div class="sla-table-scroll">
      <table class="sla-table">
        <thead>
        <tr>
          <th class="sla-corner-cell">
            Организация
          </th>
          <th
            v-for="(priority, columnIndex) in store.priorities"
            :key="priority.id || columnIndex"
            class="sla-priority-head"
            :class="getColumnHeaderClass(columnIndex)"
            @mouseenter="setHoveredColumn(columnIndex)"
            @mouseleave="clearHoveredCell"
            v-text="priority.name"
          />
        </tr>
        </thead>

        <tbody v-if="isSlaReady && tableData.length">
        <tr
          v-for="(organization, rowIndex) in getOrganizations"
          :key="organization.id || 'default-sla'"
          :class="getRowClass(rowIndex)"
        >
          <th
            class="sla-organization-cell"
            :class="getRowHeaderClass(rowIndex)"
            @mouseenter="setHoveredRow(rowIndex)"
            @mouseleave="clearHoveredCell"
          >
            <div
              class="sla-organization-name organization-name-ellipsis"
              :title="organization.name"
              v-text="organization.name"
            />
            <q-badge
              v-if="organization.isDefaultSla"
              outline
              color="primary"
              class="sla-default-badge"
              label="по умолчанию"
            />
          </th>

          <td
            v-for="(priority, columnIndex) in store.priorities"
            :key="priority.id || columnIndex"
            class="sla-data-cell"
            :class="getCellClass(rowIndex, columnIndex)"
            @mouseenter="setHoveredCell(rowIndex, columnIndex)"
            @mouseleave="clearHoveredCell"
            @focusin="setFocusedCell(rowIndex, columnIndex)"
            @focusout="clearFocusedCell(rowIndex, columnIndex)"
          >
            <div class="sla-cell">
              <q-input
                :model-value="getSlaInputValue(rowIndex, columnIndex)"
                type="text"
                dense
                outlined
                hide-bottom-space
                placeholder="0"
                class="sla-value"
                :debounce="400"
                @focus="event => onSlaInputFocus(rowIndex, columnIndex, event)"
                @keydown="preventNegativeSlaInput"
                @paste="preventNegativeSlaPaste"
                @update:model-value="value => onSlaValueInput(rowIndex, columnIndex, value)"
                @blur="() => onCellEdited(rowIndex, columnIndex)"
              />
              <q-select
                v-model="tableData[rowIndex][columnIndex].unit"
                :options="periodOptions"
                emit-value
                map-options
                dense
                outlined
                hide-bottom-space
                class="sla-unit"
                @focus="setFocusedCell(rowIndex, columnIndex)"
                @popup-show="setFocusedCell(rowIndex, columnIndex)"
                @popup-hide="clearFocusedCell(rowIndex, columnIndex)"
                @update:model-value="() => onCellEdited(rowIndex, columnIndex)"
                @input="() => onCellEdited(rowIndex, columnIndex)"
              />
            </div>
          </td>
        </tr>
        </tbody>

        <tbody v-else>
        <tr>
          <td class="sla-empty-cell" :colspan="store.priorities.length + 1">
            SLA еще не загружены
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </sla-card>
</template>

<script>
import {useStore} from 'stores/store'
import SlaCard from './SlaCard.vue'
import slaCellEditMixin from './slaCellEditMixin'
import slaHighlightMixin from './slaHighlightMixin'
import slaTableDataMixin from './slaTableDataMixin'

// Вкладка «SLA клиента»: таблица значений по организациям и приоритетам.
export default {
  name: 'SlaClientCard',
  components: {SlaCard},
  mixins: [slaTableDataMixin, slaHighlightMixin, slaCellEditMixin],

  mounted() {
    this.loadSla()
  },

  watch: {
    'store.organizations.length'() {
      this.loadSla()
    },
    'store.priorities.length'() {
      this.loadSla()
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.sla-table-scroll {
  overflow: auto;
  max-width: 100%;
}

.sla-table {
  width: 100%;
  min-width: 860px;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--app-surface, #ffffff);
}

.sla-table th,
.sla-table td {
  position: relative;
  padding: 12px;
  border-right: 1px solid var(--app-border, #edf0f7);
  border-bottom: 1px solid var(--app-border, #edf0f7);
  transition: background-color 0.12s ease, box-shadow 0.12s ease;
}

.sla-table th:last-child,
.sla-table td:last-child {
  border-right: 0;
}

.sla-table thead th {
  position: sticky;
  top: 0;
  z-index: 4;
  height: 54px;
  background: var(--app-surface, #f8faff);
  color: var(--app-text, #4b5563);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}

.sla-corner-cell {
  left: 0;
  z-index: 6 !important;
  min-width: 230px;
  text-align: left !important;
  box-shadow: 8px 0 16px rgba(24, 39, 75, 0.04);
}

.sla-organization-cell {
  position: sticky !important;
  left: 0;
  z-index: 3;
  min-width: 230px;
  max-width: 280px;
  background: var(--app-surface, #ffffff);
  text-align: left;
  vertical-align: middle;
  box-shadow: 8px 0 16px rgba(24, 39, 75, 0.04);
}

.sla-organization-name {
  font-weight: 700;
  color: var(--app-info-text, #253044);
  line-height: 1.2;
  max-width: 100%;
}

.sla-default-badge {
  margin-top: 6px;
  font-size: 11px;
}

.sla-data-cell {
  min-width: 245px;
  background: var(--app-surface, #ffffff);
  vertical-align: middle;
}

.sla-cell {
  display: grid;
  grid-template-columns: minmax(92px, 1fr) 116px;
  gap: 10px;
  align-items: center;
}

.sla-value,
.sla-unit {
  width: 100%;
}

.sla-priority-head.is-column-header-active,
.sla-data-cell.is-column-active {
  background: var(--app-surface, #f2f6ff);
}

.sla-table tr.is-row-active .sla-data-cell,
.sla-organization-cell.is-row-header-active {
  background: var(--app-surface, #f6f8ff);
}

.sla-data-cell.is-cell-active {
  background: var(--app-surface-muted, #edf3ff);
  box-shadow: inset 0 0 0 2px #5b6cff;
}

.sla-priority-head.is-column-header-active {
  color: var(--app-info-text, #3f51e8);
  box-shadow: inset 0 -2px 0 #5b6cff;
}

.sla-organization-cell.is-row-header-active {
  color: var(--app-info-text, #3f51e8);
  box-shadow: inset 3px 0 0 #5b6cff, 8px 0 16px rgba(24, 39, 75, 0.04);
}

.sla-table tbody tr:hover .sla-data-cell {
  background: var(--app-surface, #f8faff);
}

.sla-empty-cell {
  padding: 32px !important;
  color: var(--app-text-muted, #7b8794);
  text-align: center;
  background: var(--app-surface, #ffffff);
}
</style>
