<template>
  <div class="table-container">
    <q-list
      bordered
      class="rounded-borders knowledge-list"
      separator
      full-width
    >
      <q-item header class="text-bold knowledge-list-header">
        <q-item-section>
          Название
        </q-item-section>
        <q-item-section>
          Информация
        </q-item-section>
        <q-item-section>
          Теги
        </q-item-section>
        <q-item-section side />
      </q-item>

      <draggable
        :model-value="items"
        item-key="id"
        class="list-group"
        ghost-class="ghost"
        :disabled="isSearchActive || !canManage || view === 'drafts'"
        @update:model-value="$emit('reorder', $event)"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element }">
          <q-item
            clickable
            class="list-group-item knowledge-item"
            :class="{ 'knowledge-item--search': isSearchActive }"
            @click="$emit('open', element)"
          >
            <q-item-section
              top
              class="knowledge-title-section"
            >
              <div class="text-weight-medium">
                {{ element.title }}
                <q-badge v-if="isDraft(element)" color="orange-8" class="q-ml-xs">Черновик</q-badge>
              </div>
              <div class="text-caption text-grey-7">
                Статья #{{ element.id }}
                <template v-if="element.sourceTaskId">
                  · из заявки
                  <router-link :to="taskLink(element)" class="knowledge-task-link" @click.stop>№{{ element.sourceTaskId }}</router-link>
                </template>
              </div>
            </q-item-section>

            <q-item-section
              top
              class="knowledge-preview-section"
            >
              <div class="knowledge-preview">
                {{ getKnowledgePreview(element) }}
              </div>
            </q-item-section>

            <q-item-section
              top
              class="knowledge-tags-section"
            >
              <div v-if="getKnowledgeTags(element).length" class="row q-gutter-xs">
                <q-chip
                  v-for="tag in getKnowledgeTags(element)"
                  :key="tag.id || tag.name"
                  dense
                  outline
                  color="primary"
                  text-color="primary"
                  class="knowledge-tag"
                >
                  {{ tag.name }}
                </q-chip>
              </div>
              <span v-else class="text-grey-6">—</span>
            </q-item-section>

            <q-item-section
              top
              side
            >
              <div class="row no-wrap items-center">
                <q-btn
                  v-if="canManage && isDraft(element)"
                  color="positive"
                  dense
                  flat
                  round
                  icon="publish"
                  :loading="publishingId === element.id"
                  @click.stop="$emit('publish', element)"
                >
                  <q-tooltip>Опубликовать</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="canManage"
                  color="primary"
                  dense
                  flat
                  round
                  icon="edit"
                  @click.stop="$emit('edit', element)"
                >
                  <q-tooltip>Редактировать</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </template>
      </draggable>

      <q-item v-if="items.length === 0">
        <q-item-section class="text-grey-7 text-center q-pa-md">
          {{ view === 'drafts' && !isSearchActive ? 'Черновиков нет' : 'Ничего не найдено' }}
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import knowledgeHelpersMixin from 'components/knowledge-base/knowledgeHelpersMixin'

// Список статей / черновиков с drag-and-drop сортировкой.
// События: open, edit, publish (с элементом), reorder (с новым порядком).
export default {
  name: 'KnowledgeList',

  components: { draggable },

  mixins: [knowledgeHelpersMixin],

  props: {
    items: { type: Array, default: () => [] },
    view: { type: String, default: 'published' },
    isSearchActive: { type: Boolean, default: false },
    canManage: { type: Boolean, default: false },
    publishingId: { type: [Number, String], default: null }
  },

  emits: ['open', 'edit', 'publish', 'reorder'],

  data: () => ({
    dragging: true
  })
}
</script>

<style scoped>
.knowledge-task-link {
  color: var(--q-primary);
  text-decoration: none;
}

.knowledge-task-link:hover {
  text-decoration: underline;
}

.knowledge-list {
  margin-top: 8px;
  overflow: hidden;
  background: #fff;
}

.knowledge-list-header {
  background: #fafafa;
}

.knowledge-item {
  min-height: 72px;
  cursor: pointer;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.knowledge-item:hover {
  background: #f8fbff;
}

.knowledge-item--search {
  cursor: pointer;
}

.knowledge-title-section {
  min-width: 180px;
}

.knowledge-preview-section {
  white-space: pre-wrap;
  line-height: 1.45;
}

.knowledge-preview {
  color: #333;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.knowledge-tags-section {
  min-width: 180px;
}

.knowledge-tag {
  margin: 2px;
}

.ghost {
  opacity: 0.5;
}

@media (max-width: 700px) {
  .knowledge-list-header {
    display: none;
  }

  .knowledge-item {
    display: block;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .knowledge-title-section,
  .knowledge-preview-section,
  .knowledge-tags-section {
    min-width: unset;
    width: 100%;
    padding-bottom: 8px;
  }
}
</style>
