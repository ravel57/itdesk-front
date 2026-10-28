// Подсветка строки/столбца/ячейки таблицы SLA при наведении и фокусе.
export default {
  data: () => ({
    hoveredRowIndex: null,
    hoveredColumnIndex: null,
    focusedRowIndex: null,
    focusedColumnIndex: null
  }),

  computed: {
    activeRowIndex() {
      return this.hoveredRowIndex !== null ? this.hoveredRowIndex : this.focusedRowIndex
    },

    activeColumnIndex() {
      return this.hoveredColumnIndex !== null ? this.hoveredColumnIndex : this.focusedColumnIndex
    }
  },

  methods: {
    setHoveredCell(rowIndex, columnIndex) {
      this.hoveredRowIndex = rowIndex
      this.hoveredColumnIndex = columnIndex
    },

    setHoveredRow(rowIndex) {
      this.hoveredRowIndex = rowIndex
      this.hoveredColumnIndex = null
    },

    setHoveredColumn(columnIndex) {
      this.hoveredRowIndex = null
      this.hoveredColumnIndex = columnIndex
    },

    clearHoveredCell() {
      this.hoveredRowIndex = null
      this.hoveredColumnIndex = null
    },

    setFocusedCell(rowIndex, columnIndex) {
      this.focusedRowIndex = rowIndex
      this.focusedColumnIndex = columnIndex
    },

    clearFocusedCell(rowIndex, columnIndex) {
      if (this.focusedRowIndex === rowIndex && this.focusedColumnIndex === columnIndex) {
        this.focusedRowIndex = null
        this.focusedColumnIndex = null
      }
    },

    getRowClass(rowIndex) {
      return {
        'is-row-active': this.activeRowIndex === rowIndex
      }
    },

    getRowHeaderClass(rowIndex) {
      return {
        'is-row-header-active': this.activeRowIndex === rowIndex
      }
    },

    getColumnHeaderClass(columnIndex) {
      return {
        'is-column-header-active': this.activeColumnIndex === columnIndex
      }
    },

    getCellClass(rowIndex, columnIndex) {
      return {
        'is-row-active': this.activeRowIndex === rowIndex,
        'is-column-active': this.activeColumnIndex === columnIndex,
        'is-cell-active': this.activeRowIndex === rowIndex && this.activeColumnIndex === columnIndex
      }
    }
  }
}
