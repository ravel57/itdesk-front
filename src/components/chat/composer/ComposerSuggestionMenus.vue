<template>
  <q-menu
    v-if="mentionsEnabled"
    ref="mentionSuggestionsMenu"
    :model-value="mentionMenu"
    @update:model-value="$emit('update:mentionMenu', $event)"
    :target="mentionTargetEl"
    anchor="top left"
    self="bottom left"
    :offset="[0, 8]"
    fit
    no-parent-event
    :auto-close="false"
    no-focus
    no-refocus
  >
    <q-list dense style="min-width: 260px; max-height: 220px; overflow: auto;">
      <q-item
        v-for="(u, i) in mentionUsers"
        :key="u.id || u.uuid || (u.username + '_' + i)"
        clickable
        :active="i === mentionIndex"
        active-class="bg-grey-3"
        @click="$emit('selectMention', u)"
      >
        <q-item-section>
          <div class="text-body2">
            {{ `${u.lastname || ''} ${u.firstname || ''}` }}
          </div>
          <div class="text-caption text-grey-7">
            @{{ u.username || (u.email ? u.email.split('@')[0] : '') }}
          </div>
        </q-item-section>
      </q-item>

      <q-item v-if="mentionUsers.length === 0">
        <q-item-section class="text-grey-6 text-caption">
          Нет совпадений
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>

  <q-menu
    ref="templateSuggestionsMenu"
    :model-value="templateMenu"
    @update:model-value="$emit('update:templateMenu', $event)"
    :target="templateTargetEl"
    anchor="top left"
    self="bottom left"
    :offset="[0, 8]"
    fit
    no-parent-event
    :auto-close="false"
    no-focus
    no-refocus
  >
    <q-list dense class="template-suggestions-list">
      <q-item
        v-for="(template, index) in templateSuggestions"
        :key="template.id || template.shortcut || index"
        clickable
        :active="index === templateIndex"
        active-class="bg-grey-3"
        class="template-suggestion-item"
        @mousedown.prevent
        @click="$emit('selectTemplate', template)"
      >
        <q-item-section side top>
          <q-badge
            outline
            color="primary"
            class="template-suggestion-shortcut"
          >
            :{{ template.shortcut }}
          </q-badge>
        </q-item-section>

        <q-item-section>
          <q-item-label lines="2" class="template-suggestion-text">
            {{ template.text }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item v-if="templateSuggestions.length === 0">
        <q-item-section class="text-grey-6 text-caption">
          Нет совпадений
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script>
// Выпадающие списки над полем ввода: упоминания пользователей (@) и подсказки шаблонов (:shortcut).
// Состояние (открыто, индекс, фильтр) хранит родитель; здесь только отображение.
export default {
  name: 'ComposerSuggestionMenus',

  props: {
    mentionsEnabled: { type: Boolean },
    mentionMenu: { type: Boolean },
    mentionTargetEl: { default: null },
    mentionUsers: {
      default: () => [],
      type: Array
    },
    mentionIndex: {
      default: 0,
      type: Number
    },

    templateMenu: { type: Boolean },
    templateTargetEl: { default: null },
    templateSuggestions: {
      default: () => [],
      type: Array
    },
    templateIndex: {
      default: 0,
      type: Number
    }
  },

  emits: [
    'update:mentionMenu',
    'update:templateMenu',
    'selectMention',
    'selectTemplate'
  ],

  methods: {
    // Пересчитать позицию меню упоминаний относительно поля ввода
    updateMentionPosition () {
      this.$refs.mentionSuggestionsMenu?.updatePosition()
    },

    // Пересчитать позицию меню шаблонов относительно поля ввода
    updateTemplatePosition () {
      this.$refs.templateSuggestionsMenu?.updatePosition()
    }
  }
}
</script>

<style scoped>
.template-suggestions-list {
  min-width: 320px;
  max-height: 280px;
  overflow-y: auto;
  border-radius: 8px;
}

.template-suggestion-item {
  min-height: 58px;
  padding: 8px 12px;
}

.template-suggestion-shortcut {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 12px;
}

.template-suggestion-text {
  white-space: normal;
  line-height: 1.35;
}
</style>
