import axios from 'axios'
import {
  isSlaOffText,
  isSlaOffValue,
  preventNegativeSlaKey,
  preventNegativeSlaPasteEvent
} from 'src/util/settingsSla/slaCells'

// Редактирование ячеек таблицы SLA: разбор ввода («выкл.», запятая, отрицательные), нормализация и сохранение.
// Требует в компоненте: tableData, isPopulatingSla, getOrganizations, notifyError, setFocusedCell
// (slaTableDataMixin + slaHighlightMixin) и this.store.
export default {
  methods: {
    isSlaOffValue,
    isSlaOffText,

    getSlaInputValue(rowIndex, colIndex) {
      const value = this.tableData?.[rowIndex]?.[colIndex]?.value
      return this.isSlaOffValue(value) ? 'выкл.' : value
    },

    onSlaInputFocus(rowIndex, colIndex, event) {
      this.setFocusedCell(rowIndex, colIndex)
      this.selectSlaInputText(event)
    },

    selectSlaInputText(event) {
      event?.target?.select?.()
    },

    onSlaValueInput(rowIndex, colIndex, value) {
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

    preventNegativeSlaInput(event) {
      preventNegativeSlaKey(event)
    },

    preventNegativeSlaPaste(event) {
      preventNegativeSlaPasteEvent(event)
    },

    normalizeSlaCellValue(rowIndex, colIndex) {
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

    async onCellEdited(rowIndex, colIndex) {
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
  }
}
