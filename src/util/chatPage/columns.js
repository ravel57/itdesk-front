// Расчёт ширины колонок страницы чата по сохранённым пропорциям.

export function calculateColumnsByRatios(columnWidthRatios, availableWidth, columns, minWidths) {
  const result = {}
  let remainingWidth = availableWidth
  let remainingColumns = [...columns]

  while (remainingColumns.length > 0) {
    const ratioSum = remainingColumns.reduce((sum, column) => {
      return sum + columnWidthRatios[column]
    }, 0)
    const tooSmallColumns = []
    remainingColumns.forEach(column => {
      const width = remainingWidth * (columnWidthRatios[column] / ratioSum)

      if (width < minWidths[column]) {
        result[column] = minWidths[column]
        tooSmallColumns.push(column)
      }
    })
    if (tooSmallColumns.length === 0) {
      remainingColumns.forEach(column => {
        result[column] = Math.round(
          remainingWidth * (columnWidthRatios[column] / ratioSum)
        )
      })
      break
    }
    tooSmallColumns.forEach(column => {
      remainingWidth -= minWidths[column]
    })
    remainingColumns = remainingColumns.filter(column => !tooSmallColumns.includes(column))
    if (remainingWidth <= 0) {
      remainingColumns.forEach(column => {
        result[column] = minWidths[column]
      })
      break
    }
  }
  return result
}
