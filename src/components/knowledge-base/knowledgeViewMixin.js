// Диалог просмотра статьи и синхронизация открытой статьи с query-параметром ?knowledgeId.
// Требует в компоненте: this.store, ensureKnowledgeBaseLoaded (knowledgeListMixin).
export default {
  data: () => ({
    viewKnowledgeVisible: false,
    selectedKnowledgeId: null,
    pendingKnowledgeId: null,
    knowledgeViewOpening: false
  }),

  computed: {
    selectedKnowledge () {
      return this.getKnowledgeById(this.selectedKnowledgeId)
    },

    selectedKnowledgeTitle () {
      if (!this.selectedKnowledge) {
        return 'Статья не найдена'
      }
      return this.selectedKnowledge.title || `Статья #${this.selectedKnowledge.id}`
    }
  },

  watch: {
    '$route.query.knowledgeId': {
      immediate: true,
      handler () {
        this.ensureKnowledgeBaseLoaded()
          .then(() => this.openKnowledgeFromRoute())
      }
    },

    'store.knowledgeBase': {
      deep: true,
      handler () {
        this.$nextTick(() => {
          if (this.pendingKnowledgeId || this.$route?.query?.knowledgeId) {
            this.openKnowledgeFromRoute()
          }
        })
      }
    }
  },

  methods: {
    openKnowledgeView (knowledge, replace = false) {
      if (!knowledge || !knowledge.id) {
        return
      }
      const knowledgeId = Number(knowledge.id)
      this.pendingKnowledgeId = null
      this.selectedKnowledgeId = knowledgeId
      this.knowledgeViewOpening = true
      this.$nextTick(() => {
        this.viewKnowledgeVisible = true

        this.$nextTick(() => {
          this.knowledgeViewOpening = false
        })
      })
      const query = {
        ...this.$route.query,
        knowledgeId: String(knowledge.id)
      }
      const navigation = {
        path: this.$route.path,
        query
      }
      if (replace) {
        this.$router.replace(navigation).catch(() => undefined)
      } else if (String(this.$route.query.knowledgeId || '') !== String(knowledge.id)) {
        this.$router.push(navigation).catch(() => undefined)
      }
    },

    openKnowledgeFromRoute () {
      const knowledgeId = this.$route?.query?.knowledgeId
      if (!knowledgeId) {
        this.pendingKnowledgeId = null
        this.selectedKnowledgeId = null
        this.viewKnowledgeVisible = false
        return
      }
      const normalizedId = Number(knowledgeId)
      if (!Number.isFinite(normalizedId)) {
        this.pendingKnowledgeId = null
        return
      }
      this.pendingKnowledgeId = normalizedId
      const knowledge = this.getKnowledgeById(normalizedId)
      if (!knowledge) {
        return
      }
      this.pendingKnowledgeId = null
      this.selectedKnowledgeId = Number(knowledge.id)
      this.knowledgeViewOpening = true
      this.$nextTick(() => {
        this.viewKnowledgeVisible = true
        this.$nextTick(() => {
          this.knowledgeViewOpening = false
        })
      })
    },

    closeKnowledgeView () {
      this.viewKnowledgeVisible = false
      this.selectedKnowledgeId = null
      this.pendingKnowledgeId = null
      this.removeKnowledgeIdFromRoute()
    },

    removeKnowledgeIdFromRoute () {
      if (!this.$route?.query?.knowledgeId) {
        return
      }

      const query = { ...this.$route.query }
      delete query.knowledgeId

      this.$router.replace({
        path: this.$route.path,
        query
      }).catch(() => undefined)
    },

    onKnowledgeViewHide () {
      if (this.knowledgeViewOpening) {
        return
      }
      if (this.$route?.query?.knowledgeId || this.selectedKnowledgeId) {
        this.selectedKnowledgeId = null
        this.pendingKnowledgeId = null
        this.removeKnowledgeIdFromRoute()
      }
    },

    getKnowledgeById (knowledgeId) {
      const normalizedId = Number(knowledgeId)

      if (!Number.isFinite(normalizedId)) {
        return null
      }

      return (this.store.knowledgeBase || []).find(knowledge => Number(knowledge.id) === normalizedId) || null
    },

    // События диалога редактирования: новая / изменённая / удалённая статья
    onKnowledgeCreated (knowledge) {
      this.openKnowledgeView(knowledge, true)
    },

    onKnowledgeUpdated (knowledge) {
      if (Number(this.selectedKnowledgeId) === Number(knowledge.id)) {
        this.openKnowledgeView(knowledge, true)
      }
    },

    onKnowledgeDeleted (knowledgeId) {
      if (Number(this.selectedKnowledgeId) === Number(knowledgeId)) {
        this.closeKnowledgeView()
      }
    }
  }
}
