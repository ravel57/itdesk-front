<template>
  <div class="q-pa-md knowledge-page">
    <KnowledgeToolbar
      v-model:search="knowledgeSearch"
      v-model:view="knowledgeView"
      :can-manage="canManageKnowledge"
      :can-retrain="canRetrainLlm"
      :retraining="retraining"
      :show-tabs="showDraftTabs"
      :drafts-count="drafts.length"
      @add="dialogNewKnowledge"
      @retrain="confirmRetrainLlm"
    />

    <KnowledgeList
      :items="knowledgeItemsForDisplay"
      :view="knowledgeView"
      :is-search-active="isKnowledgeSearchActive"
      :can-manage="canManageKnowledge"
      :publishing-id="publishingId"
      @reorder="onKnowledgeReorder"
      @open="openKnowledgeView"
      @edit="editRow"
      @publish="publishKnowledge"
    />
  </div>

  <KnowledgeViewDialog
    v-model="viewKnowledgeVisible"
    :knowledge="selectedKnowledge"
    :title="selectedKnowledgeTitle"
    :can-manage="canManageKnowledge"
    :publishing-id="publishingId"
    @hide="onKnowledgeViewHide"
    @edit="editRow"
    @close="closeKnowledgeView"
    @publish="publishKnowledge"
  />

  <KnowledgeEditDialog
    ref="editDialog"
    @created="onKnowledgeCreated"
    @updated="onKnowledgeUpdated"
    @deleted="onKnowledgeDeleted"
  />
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'
import { watch } from 'vue'
import KnowledgeToolbar from 'components/knowledge-base/KnowledgeToolbar.vue'
import KnowledgeList from 'components/knowledge-base/KnowledgeList.vue'
import KnowledgeViewDialog from 'components/knowledge-base/KnowledgeViewDialog.vue'
import KnowledgeEditDialog from 'components/knowledge-base/KnowledgeEditDialog.vue'
import knowledgeHelpersMixin from 'components/knowledge-base/knowledgeHelpersMixin'
import knowledgeListMixin from 'components/knowledge-base/knowledgeListMixin'
import knowledgeViewMixin from 'components/knowledge-base/knowledgeViewMixin'
import { canManageKnowledgeBase } from 'src/util/knowledgeBase/knowledgeAccess'

export default {
  name: 'KnowledgeBasePage',

  components: { KnowledgeToolbar, KnowledgeList, KnowledgeViewDialog, KnowledgeEditDialog },

  mixins: [knowledgeHelpersMixin, knowledgeListMixin, knowledgeViewMixin],

  mounted () {
    document.title = 'ULDESK : База знаний'
    this.ensureKnowledgeBaseLoaded()
      .then(() => this.openKnowledgeFromRoute())
  },

  methods: {
    // Диалог редактирования живёт в KnowledgeEditDialog и открывается через ref
    editRow (row) {
      this.$refs.editDialog.editRow(row)
    },

    dialogNewKnowledge () {
      this.$refs.editDialog.dialogNewKnowledge()
    }
  },

  setup () {
    const store = useStore()
    watch(() => store.knowledgeBase, () => {
      if (!canManageKnowledgeBase()) {
        return
      }
      axios.post('/api/v1/knowledge-base/resort', store.knowledgeBase)
    }, { deep: true })
    return { store }
  }
}
</script>

<style scoped>
.knowledge-page {
  max-width: 1180px;
}
</style>
