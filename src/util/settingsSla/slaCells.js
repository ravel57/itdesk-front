// Чистые функции для ячеек таблицы SLA (значение + единица измерения).

export function isSlaOffValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '' && Number(value) === 0
}

export function isSlaOffText(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'выкл' || normalized === 'выкл.' || normalized === 'off'
}

// Пустая таблица rows x columns для заполнения данными с сервера
export function createEmptySlaTable(rowCount, columnCount) {
  return Array.from({length: rowCount}, () =>
    Array.from({length: columnCount}, () => ({
      value: '',
      unit: 'HOURS'
    }))
  )
}

// Заполняет таблицу значениями из ответа /api/v1/sla (data[organization.name][priority.name])
export function fillSlaTable(table, data, organizations, priorities) {
  organizations.forEach((org, rowIndex) => {
    priorities.forEach((priority, colIndex) => {
      const cell = data?.[org.name]?.[priority.name]
      table[rowIndex][colIndex] = {
        value: cell?.value ?? '',
        unit: cell?.unit ?? 'HOURS'
      }
    })
  })
  return table
}

export function preventNegativeSlaKey(event) {
  if (event.key === '-' || event.key === 'Minus' || event.key === 'Subtract') {
    event.preventDefault()
  }
}

export function preventNegativeSlaPasteEvent(event) {
  const pastedText = event.clipboardData?.getData('text') ?? ''
  const pastedValue = Number(String(pastedText).replace(',', '.'))

  if (pastedText.trim() !== '' && (!Number.isFinite(pastedValue) || pastedValue < 0)) {
    event.preventDefault()
  }
}
