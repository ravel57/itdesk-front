import axios from 'axios'
import {pickUserLines} from 'src/util/myLines/lineHelpers'

// Линии пользователя: загрузка справочника линий, линии, где пользователь ответственный/участник/наблюдатель,
// выбранная линия и область запроса заявок.
// Требует на странице: this.store, resetPageAndLoad / showError (myLinesLoaderMixin).
export default {
  data: () => ({
    selectedLineId: null,
    linesLoading: false,
  }),

  computed: {
    currentUserLines() {
      const currentUserId = Number(this.store.currentUser?.id)
      if (!Number.isFinite(currentUserId)) {
        return []
      }

      return pickUserLines(this.store.supportLines, currentUserId)
    },

    selectedLine() {
      if (this.selectedLineId === null) {
        return null
      }
      return this.currentUserLines.find(line => Number(line.id) === Number(this.selectedLineId)) || null
    },

    requestLines() {
      return this.selectedLine ? [this.selectedLine] : this.currentUserLines
    },
  },

  methods: {
    selectLine(lineId) {
      const nextId = lineId == null ? null : Number(lineId)
      if (Number(this.selectedLineId) === Number(nextId) || (this.selectedLineId === null && nextId === null)) {
        return
      }
      this.selectedLineId = nextId
      this.resetPageAndLoad()
    },

    async loadLines() {
      if ((this.store.supportLines || []).length > 0) return
      this.linesLoading = true
      try {
        const {data} = await axios.get('/api/v1/support-lines')
        this.store.supportLines = Array.isArray(data) ? data : []
      } catch (error) {
        this.showError(error, 'Не удалось загрузить линии поддержки')
      } finally {
        this.linesLoading = false
      }
    },
  }
}
