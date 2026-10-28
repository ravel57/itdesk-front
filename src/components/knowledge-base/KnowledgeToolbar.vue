<template>
  <div class="knowledge-toolbar row items-center q-col-gutter-sm">
    <div class="col-12 col-md-auto row q-gutter-sm">
      <q-btn
        v-if="canManage"
        icon="add"
        label="Добавить статью"
        color="primary"
        unelevated
        @click="$emit('add')"
      />
      <q-btn
        v-if="canRetrain"
        icon="model_training"
        label="Переобучить LLM"
        color="primary"
        outline
        :loading="retraining"
        :disable="retraining"
        @click="$emit('retrain')"
      >
        <q-tooltip>
          Удалить старый LLM-индекс текущего инстанса и заново проиндексировать актуальную базу знаний
        </q-tooltip>
      </q-btn>
    </div>

    <div class="col-12 col-md">
      <q-input
        :model-value="search"
        dense
        outlined
        clearable
        debounce="200"
        placeholder="Поиск по базе знаний"
        class="knowledge-search"
        @update:model-value="$emit('update:search', $event)"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
  </div>

  <q-tabs
    v-if="showTabs"
    :model-value="view"
    dense
    inline-label
    no-caps
    align="left"
    active-color="primary"
    indicator-color="primary"
    class="knowledge-tabs text-grey-8 app-shared-plugin-badge"
    @update:model-value="$emit('update:view', $event)"
  >
    <q-tab name="published" label="Статьи"/>
    <q-tab name="drafts">
      <div class="row no-wrap items-center">
        Черновики
        <q-badge v-if="draftsCount" color="orange-8" rounded class="q-ml-xs">{{ draftsCount }}</q-badge>
      </div>
    </q-tab>
  </q-tabs>

  <q-banner
    v-if="view === 'drafts'"
    dense
    rounded
    class="knowledge-drafts-hint bg-orange-1 text-grey-9 app-shared-plugin-extension-point"
  >
    <template #avatar>
      <q-icon name="auto_awesome" color="orange-8"/>
    </template>
    Черновики готовит автоматизация «Черновик статьи из закрытой заявки (Jev)» по переписке закрытых заявок.
    Их видят только редакторы базы знаний: операторы, Jev и поиск получат статью после публикации.
  </q-banner>
</template>

<script>
// Панель над списком статей: кнопки «Добавить статью» / «Переобучить LLM», поиск,
// вкладки «Статьи / Черновики» и подсказка про черновики.
export default {
  name: 'KnowledgeToolbar',

  props: {
    search: { type: String, default: '' },
    view: { type: String, default: 'published' },
    canManage: { type: Boolean, default: false },
    canRetrain: { type: Boolean, default: false },
    retraining: { type: Boolean, default: false },
    showTabs: { type: Boolean, default: false },
    draftsCount: { type: Number, default: 0 }
  },

  emits: ['add', 'retrain', 'update:search', 'update:view']
}
</script>

<style scoped>
.knowledge-toolbar {
  margin-bottom: 8px;
}

.knowledge-search {
  max-width: 520px;
}
@media (max-width: 700px) {
  .knowledge-search {
    max-width: unset;
  }
}
</style>
