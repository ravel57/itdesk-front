<template>
  <div class="sla-page">
    <q-card flat bordered class="sla-card">
      <div class="sla-card-header">
        <div>
          <div class="sla-title">SLA по организациям и приоритетам</div>
          <div class="sla-subtitle">
            Длы отключения SLA впишите 0 в время
          </div>
        </div>
      </div>

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
              <div class="sla-organization-name" v-text="organization.name" />
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
    </q-card>
  </div>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'SlaPage',

  data: () => ({
    tableData: [],
    isPopulatingSla: false,
    lastSent: {},
    hoveredRowIndex: null,
    hoveredColumnIndex: null,
    focusedRowIndex: null,
    focusedColumnIndex: null,
    periodOptions: [
      {
        label: 'минуты',
        value: 'MINUTES'
      },
      {
        label: 'часы',
        value: 'HOURS'
      },
      {
        label: 'дни',
        value: 'DAYS'
      }
    ]
  }),

  computed: {
    getOrganizations () {
      return [
        {
          id: null,
          name: 'Стандартный SLA',
          isDefaultSla: true
        },
        ...(this.store.organizations || [])
      ]
    },

    isSlaReady () {
      return this.store.priorities.length > 0
    },

    activeRowIndex () {
      return this.hoveredRowIndex !== null ? this.hoveredRowIndex : this.focusedRowIndex
    },

    activeColumnIndex () {
      return this.hoveredColumnIndex !== null ? this.hoveredColumnIndex : this.focusedColumnIndex
    }
  },

  methods: {
    notifyError (e) {
      this.$q.notify({
        message: e?.response?.data?.message || e.message,
        type: 'negative',
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
    },

    async loadSla () {
      if (!this.isSlaReady) {
        return
      }
      this.isPopulatingSla = true
      try {
        const organizations = this.getOrganizations
        const priorities = this.store.priorities

        const emptyTable = Array.from({ length: organizations.length }, () =>
          Array.from({ length: priorities.length }, () => ({
            value: '',
            unit: 'HOURS'
          }))
        )
        const { data } = await axios.get('/api/v1/sla')
        organizations.forEach((org, rowIndex) => {
          priorities.forEach((priority, colIndex) => {
            const cell = data?.[org.name]?.[priority.name]
            emptyTable[rowIndex][colIndex] = {
              value: cell?.value ?? '',
              unit: cell?.unit ?? 'HOURS'
            }
          })
        })
        this.tableData = emptyTable
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.isPopulatingSla = false
      }
    },

    isSlaOffValue (value) {
      return value !== null && value !== undefined && String(value).trim() !== '' && Number(value) === 0
    },

    isSlaOffText (value) {
      const normalized = String(value ?? '').trim().toLowerCase()
      return normalized === 'выкл' || normalized === 'выкл.' || normalized === 'off'
    },

    getSlaInputValue (rowIndex, colIndex) {
      const value = this.tableData?.[rowIndex]?.[colIndex]?.value
      return this.isSlaOffValue(value) ? 'выкл.' : value
    },

    onSlaInputFocus (rowIndex, colIndex, event) {
      this.setFocusedCell(rowIndex, colIndex)
      this.selectSlaInputText(event)
    },

    selectSlaInputText (event) {
      event?.target?.select?.()
    },

    setHoveredCell (rowIndex, columnIndex) {
      this.hoveredRowIndex = rowIndex
      this.hoveredColumnIndex = columnIndex
    },

    setHoveredRow (rowIndex) {
      this.hoveredRowIndex = rowIndex
      this.hoveredColumnIndex = null
    },

    setHoveredColumn (columnIndex) {
      this.hoveredRowIndex = null
      this.hoveredColumnIndex = columnIndex
    },

    clearHoveredCell () {
      this.hoveredRowIndex = null
      this.hoveredColumnIndex = null
    },

    setFocusedCell (rowIndex, columnIndex) {
      this.focusedRowIndex = rowIndex
      this.focusedColumnIndex = columnIndex
    },

    clearFocusedCell (rowIndex, columnIndex) {
      if (this.focusedRowIndex === rowIndex && this.focusedColumnIndex === columnIndex) {
        this.focusedRowIndex = null
        this.focusedColumnIndex = null
      }
    },

    getRowClass (rowIndex) {
      return {
        'is-row-active': this.activeRowIndex === rowIndex
      }
    },

    getRowHeaderClass (rowIndex) {
      return {
        'is-row-header-active': this.activeRowIndex === rowIndex
      }
    },

    getColumnHeaderClass (columnIndex) {
      return {
        'is-column-header-active': this.activeColumnIndex === columnIndex
      }
    },

    getCellClass (rowIndex, columnIndex) {
      return {
        'is-row-active': this.activeRowIndex === rowIndex,
        'is-column-active': this.activeColumnIndex === columnIndex,
        'is-cell-active': this.activeRowIndex === rowIndex && this.activeColumnIndex === columnIndex
      }
    },

    onSlaValueInput (rowIndex, colIndex, value) {
      const cell = this.tableData?.[rowIndex]?.[colIndex]

      if (!cell) {
        return
      }

      const rawValue = String(value ?? '').trim()

      if (rawValue === '') {
        cell.value = ''
        this.onCellEdited(rowIndex, colIndex)
        return
      }

      if (this.isSlaOffText(rawValue)) {
        cell.value = 0
        this.onCellEdited(rowIndex, colIndex)
        return
      }

      const normalizedRawValue = rawValue.replace(',', '.')
      const numberValue = Number(normalizedRawValue)

      if (!Number.isFinite(numberValue)) {
        return
      }

      cell.value = Math.max(0, numberValue)
      this.onCellEdited(rowIndex, colIndex)
    },

    preventNegativeSlaInput (event) {
      if (event.key === '-' || event.key === 'Minus' || event.key === 'Subtract') {
        event.preventDefault()
      }
    },

    preventNegativeSlaPaste (event) {
      const pastedText = event.clipboardData?.getData('text') ?? ''
      const pastedValue = Number(String(pastedText).replace(',', '.'))

      if (pastedText.trim() !== '' && (!Number.isFinite(pastedValue) || pastedValue < 0)) {
        event.preventDefault()
      }
    },

    normalizeSlaCellValue (rowIndex, colIndex) {
      const cell = this.tableData?.[rowIndex]?.[colIndex]

      if (!cell) {
        return ''
      }

      const rawValue = cell.value

      if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
        cell.value = ''
        return ''
      }

      const numberValue = Number(rawValue)

      if (!Number.isFinite(numberValue)) {
        cell.value = ''
        return ''
      }

      const normalizedValue = Math.max(0, numberValue)

      if (cell.value !== normalizedValue) {
        cell.value = normalizedValue
      }

      return normalizedValue
    },

    async onCellEdited (rowIndex, colIndex) {
      if (this.isPopulatingSla) {
        return
      }
      const organizationRow = this.getOrganizations[rowIndex]
      const organization = organizationRow?.isDefaultSla ? null : organizationRow
      const priority = this.store.priorities[colIndex]
      const cell = this.tableData?.[rowIndex]?.[colIndex]
      if (!priority || !cell) {
        return
      }
      const normalizedValue = this.normalizeSlaCellValue(rowIndex, colIndex)
      const value = normalizedValue === '' ? null : normalizedValue
      const unit = cell.unit || 'HOURS'
      try {
        await axios.post('/api/v1/sla', {
          organization,
          priority,
          value,
          unit
        })
      } catch (e) {
        this.notifyError(e)
      }
    }
  },

  mounted () {
    this.loadSla()
  },

  watch: {
    'store.organizations.length' () {
      this.loadSla()
    },
    'store.priorities.length' () {
      this.loadSla()
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style scoped>
.sla-page {
  padding: 16px;
}

.sla-card {
  border-radius: 18px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 14px 32px rgba(24, 39, 75, 0.08);
}

.sla-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid #edf0f7;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
}

.sla-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.sla-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: #7b8794;
}

.sla-table-scroll {
  overflow: auto;
  max-width: 100%;
}

.sla-table {
  width: 100%;
  min-width: 860px;
  border-collapse: separate;
  border-spacing: 0;
  background: #ffffff;
}

.sla-table th,
.sla-table td {
  position: relative;
  padding: 12px;
  border-right: 1px solid #edf0f7;
  border-bottom: 1px solid #edf0f7;
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
  background: #f8faff;
  color: #4b5563;
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
  background: #ffffff;
  text-align: left;
  vertical-align: middle;
  box-shadow: 8px 0 16px rgba(24, 39, 75, 0.04);
}

.sla-organization-name {
  font-weight: 700;
  color: #253044;
  line-height: 1.2;
}

.sla-default-badge {
  margin-top: 6px;
  font-size: 11px;
}

.sla-data-cell {
  min-width: 245px;
  background: #ffffff;
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
  background: #f2f6ff;
}

.sla-table tr.is-row-active .sla-data-cell,
.sla-organization-cell.is-row-header-active {
  background: #f6f8ff;
}

.sla-data-cell.is-cell-active {
  background: #edf3ff;
  box-shadow: inset 0 0 0 2px #5b6cff;
}

.sla-priority-head.is-column-header-active {
  color: #3f51e8;
  box-shadow: inset 0 -2px 0 #5b6cff;
}

.sla-organization-cell.is-row-header-active {
  color: #3f51e8;
  box-shadow: inset 3px 0 0 #5b6cff, 8px 0 16px rgba(24, 39, 75, 0.04);
}

.sla-table tbody tr:hover .sla-data-cell {
  background: #f8faff;
}

.sla-empty-cell {
  padding: 32px !important;
  color: #7b8794;
  text-align: center;
  background: #ffffff;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
  background: #ffffff;
}

:deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 2px rgba(91, 108, 255, 0.16);
}

:deep(.q-field__native),
:deep(.q-field__input) {
  font-weight: 600;
}
</style>
