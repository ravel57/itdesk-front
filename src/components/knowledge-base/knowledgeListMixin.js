import axios from 'axios'
import { canManageKnowledgeBase } from 'src/util/knowledgeBase/knowledgeAccess'

// Список статей и черновиков: загрузка, поиск, вкладки, публикация, порядок, переобучение LLM.
// Требует в компоненте: this.store, методы knowledgeHelpersMixin (isDraft, normalizeKnowledgeSearch,
// getKnowledgeSearchText).
export default {
  data: () => ({
    knowledgeSearch: '',
    retraining: false,
    knowledgeLoading: false,

    // Статьи или черновики, сформированные из закрытых заявок
    knowledgeView: 'published',
    publishingId: null
  }),

  computed: {
    canManageKnowledge () {
      return canManageKnowledgeBase()
    },

    canRetrainLlm () {
      return this.$can('LLM_MANAGE')
    },

    isKnowledgeSearchActive () {
      return this.normalizeKnowledgeSearch(this.knowledgeSearch).length > 0
    },

    drafts () {
      return (this.store.knowledgeBase || []).filter(knowledge => this.isDraft(knowledge))
    },

    publishedKnowledge () {
      return (this.store.knowledgeBase || []).filter(knowledge => !this.isDraft(knowledge))
    },

    showDraftTabs () {
      return this.canManageKnowledge && (this.drafts.length > 0 || this.knowledgeView === 'drafts')
    },

    knowledgeItemsForDisplay () {
      const items = this.knowledgeView === 'drafts' ? this.drafts : this.publishedKnowledge
      if (!this.isKnowledgeSearchActive) {
        return items
      }

      const search = this.normalizeKnowledgeSearch(this.knowledgeSearch)

      return items.filter(knowledge => {
        return this.getKnowledgeSearchText(knowledge).includes(search)
      })
    }
  },

  methods: {
    confirmRetrainLlm () {
      // this.$q.dialog({
      //   title: 'Переобучить LLM?',
      //   message: 'Старый индекс текущего инстанса будет удалён, после чего LLM заново проиндексирует актуальные статьи базы знаний.',
      //   persistent: true,
      //   ok: {
      //     label: 'Переобучить',
      //     color: 'primary'
      //   },
      //   cancel: {
      //     label: 'Отмена',
      //     flat: true
      //   }
      // }).onOk(() => this.retrainLlm())
      this.retrainLlm()
    },

    async retrainLlm () {
      this.retraining = true
      try {
        const { data } = await axios.post('/api/v1/llm/retrain')
        this.$q.notify({
          type: 'positive',
          message: `LLM переобучена: ${data?.documents ?? 0} статей, ${data?.chunks ?? 0} чанков`
        })
      } catch (e) {
        const detail = e?.response?.data?.detail || e?.response?.data?.message || e.message
        this.$q.notify({
          type: 'negative',
          message: `Не удалось переобучить LLM: ${detail}`
        })
      } finally {
        this.retraining = false
      }
    },

    ensureKnowledgeBaseLoaded () {
      if ((this.store.knowledgeBase || []).length > 0) {
        return Promise.resolve()
      }

      if (this.knowledgeLoading) {
        return new Promise(resolve => {
          const timer = setInterval(() => {
            if (!this.knowledgeLoading) {
              clearInterval(timer)
              resolve()
            }
          }, 50)
        })
      }

      this.knowledgeLoading = true

      return axios.get('/api/v1/knowledge-base')
        .then(({ data }) => {
          this.store.knowledgeBase = Array.isArray(data) ? data : []
        })
        .catch(e => {
          this.$q.notify({
            message: e.message,
            type: 'negative'
          })
        })
        .finally(() => {
          this.knowledgeLoading = false
        })
    },

    // Порядок меняется только среди опубликованных статей, черновики остаются в конце
    onKnowledgeReorder (items) {
      if (this.knowledgeView === 'drafts' || this.isKnowledgeSearchActive) {
        return
      }
      this.store.knowledgeBase = [...items, ...this.drafts]
    },

    publishKnowledge (knowledge) {
      if (!knowledge?.id || this.publishingId) {
        return
      }
      this.publishingId = knowledge.id
      axios.post(`/api/v1/knowledge-base/${knowledge.id}/publish`)
        .then(({ data }) => {
          const index = this.store.knowledgeBase.findIndex(item => item.id === data.id)
          if (index >= 0) {
            this.store.knowledgeBase.splice(index, 1, data)
          }
          if (this.knowledgeView === 'drafts' && this.drafts.length === 0) {
            this.knowledgeView = 'published'
          }
          this.$q.notify({ type: 'positive', message: `Статья «${data.title}» опубликована` })
        })
        .catch(e => this.$q.notify({
          type: 'negative',
          message: e?.response?.data || e.message
        }))
        .finally(() => {
          this.publishingId = null
        })
    }
  }
}
