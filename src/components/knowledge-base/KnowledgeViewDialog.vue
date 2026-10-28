<template>
  <q-dialog
    :model-value="modelValue"
    backdrop-filter="blur(4px)"
    @update:model-value="$emit('update:modelValue', $event)"
    @hide="$emit('hide')"
  >
    <q-card class="knowledge-view-card">
      <q-toolbar class="knowledge-view-toolbar">
        <q-icon
          name="menu_book"
          color="primary"
          size="28px"
          class="q-mr-sm"
        />
        <div class="col">
          <div class="text-h6 ellipsis">
            {{ title }}
          </div>
        </div>

        <q-btn
          v-if="knowledge && canManage"
          flat
          round
          dense
          icon="edit"
          color="primary"
          @click="$emit('edit', knowledge)"
        >
          <q-tooltip>Редактировать статью</q-tooltip>
        </q-btn>

        <q-btn
          flat
          round
          dense
          icon="close"
          @click="$emit('close')"
        />
      </q-toolbar>

      <q-separator />

      <q-card-section v-if="knowledge" class="knowledge-view-body">
        <q-banner
          v-if="isDraft(knowledge)"
          dense
          rounded
          class="bg-orange-1 text-grey-9 q-mb-md"
        >
          <template #avatar>
            <q-icon name="edit_note" color="orange-8"/>
          </template>
          Черновик<template v-if="knowledge.sourceTaskId">, сформирован ИИ по закрытой заявке
            <router-link :to="taskLink(knowledge)" class="knowledge-task-link app-shared-knowledge-task-link">№{{ knowledge.sourceTaskId }}</router-link></template>.
          Проверьте текст: его видят только редакторы базы знаний, пока статья не опубликована.
          <template v-if="canManage" #action>
            <q-btn
              unelevated
              color="positive"
              icon="publish"
              label="Опубликовать"
              :loading="publishingId === knowledge.id"
              @click="$emit('publish', knowledge)"
            />
          </template>
        </q-banner>

        <div
          v-if="getKnowledgeTags(knowledge).length"
          class="row q-gutter-xs q-mb-md"
        >
          <q-chip
            v-for="tag in getKnowledgeTags(knowledge)"
            :key="tag.id || tag.name"
            dense
            color="primary"
            text-color="white"
            icon="sell"
          >
            {{ tag.name }}
          </q-chip>
        </div>

        <div
          v-for="(textBlock, index) in getKnowledgeTexts(knowledge)"
          :key="index"
          class="knowledge-view-text"
        >
          {{ textBlock }}
        </div>

        <div
          v-if="getKnowledgeTexts(knowledge).length === 0"
          class="text-grey-7"
        >
          У статьи пока нет текста.
        </div>
      </q-card-section>

      <q-card-section v-else class="text-grey-7">
        Статья не найдена.
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import knowledgeHelpersMixin from 'components/knowledge-base/knowledgeHelpersMixin'

// Диалог просмотра статьи (только чтение).
// События: update:modelValue, hide, close, edit / publish (со статьёй).
export default {
  name: 'KnowledgeViewDialog',

  mixins: [knowledgeHelpersMixin],

  props: {
    modelValue: { type: Boolean, default: false },
    knowledge: { type: Object, default: null },
    title: { type: String, default: '' },
    canManage: { type: Boolean, default: false },
    publishingId: { type: [Number, String], default: null }
  },

  emits: ['update:modelValue', 'hide', 'close', 'edit', 'publish']
}
</script>

<style scoped>
.knowledge-view-card {
  width: 820px;
  max-width: 92vw;
  border-radius: 12px;
}

.knowledge-view-toolbar {
  padding: 12px 16px;
}

.knowledge-view-body {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px 24px 24px;
}

.knowledge-view-text {
  white-space: pre-wrap;
  line-height: 1.65;
  font-size: 15px;
  color: var(--app-text, #242424);
}

.knowledge-view-text + .knowledge-view-text {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--app-border, #eeeeee);
}
</style>
