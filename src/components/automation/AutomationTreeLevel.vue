<template>
  <draggable
    :list="nodes"
    item-key="key"
    group="automation-items"
    :class="['automation-level', {'automation-level-nested': level > 0}]"
    ghost-class="ghost"
    :handle="handleSelector"
    @end="$emit('drag-end')"
  >
    <template #item="{ element }">
      <div class="automation-tree-item">
        <template v-if="element.type === 'folder'">
          <q-item
            v-if="folderById[element.id]"
            class="automation-folder-header"
            clickable
            @click="$emit('toggle-folder', element.id)"
          >
            <q-item-section side :class="['settings-drag-handle cursor-grab', handleClass]" @click.stop>
              <q-icon name="drag_indicator" color="grey-6"/>
            </q-item-section>
            <q-item-section side class="automation-folder-icon">
              <q-icon :name="folderById[element.id].collapsed ? 'chevron_right' : 'expand_more'" color="grey-7"/>
            </q-item-section>
            <q-item-section side class="automation-folder-icon">
              <q-icon :name="folderById[element.id].collapsed ? 'folder' : 'folder_open'" color="amber-8"/>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ folderById[element.id].name }}
                <span class="text-caption text-grey-7 q-ml-sm">{{ countRules(element) }}</span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row items-center no-wrap" @click.stop>
                <q-btn dense flat round color="primary" icon="edit" @click="$emit('rename-folder', element.id)">
                  <q-tooltip>Переименовать папку</q-tooltip>
                </q-btn>
                <q-btn dense flat round color="negative" icon="delete_outline" @click="$emit('delete-folder', element.id)">
                  <q-tooltip>Удалить папку (автоматизации останутся)</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
          <automation-tree-level
            v-show="!folderById[element.id]?.collapsed"
            :nodes="element.children"
            :level="level + 1"
            :folder-by-id="folderById"
            :trigger-by-id="triggerById"
            :toggling-ids="togglingIds"
            :trigger-type-label="triggerTypeLabel"
            @drag-end="$emit('drag-end')"
            @toggle-folder="$emit('toggle-folder', $event)"
            @rename-folder="$emit('rename-folder', $event)"
            @delete-folder="$emit('delete-folder', $event)"
            @toggle-trigger="(trigger, enabled) => $emit('toggle-trigger', trigger, enabled)"
            @edit-trigger="$emit('edit-trigger', $event)"
          />
        </template>
        <automation-rule-row
          v-else-if="triggerById[element.id]"
          :handle-class="handleClass"
          :trigger="triggerById[element.id]"
          :type-label="triggerTypeLabel(triggerById[element.id])"
          :toggling="togglingIds.includes(element.id)"
          @toggle="$emit('toggle-trigger', triggerById[element.id], $event)"
          @edit="$emit('edit-trigger', triggerById[element.id])"
        />
      </div>
    </template>
  </draggable>
</template>

<script>
import draggable from 'vuedraggable'
import AutomationRuleRow from 'src/components/automation/AutomationRuleRow.vue'

// Один уровень дерева автоматизаций; папки рисуют вложенный такой же уровень — глубина произвольная.
export default {
  name: 'AutomationTreeLevel',

  components: {draggable, AutomationRuleRow},

  props: {
    nodes: {type: Array, required: true},
    level: {type: Number, default: 0},
    folderById: {type: Object, required: true},
    triggerById: {type: Object, required: true},
    togglingIds: {type: Array, default: () => []},
    triggerTypeLabel: {type: Function, required: true}
  },

  emits: ['drag-end', 'toggle-folder', 'rename-folder', 'delete-folder', 'toggle-trigger', 'edit-trigger'],

  computed: {
    // У каждого уровня свой класс ручки, чтобы вложенные списки не перехватывали друг у друга перетаскивание.
    handleClass() {
      return `automation-handle-d${this.level}`
    },

    handleSelector() {
      return `.${this.handleClass}`
    }
  },

  methods: {
    countRules(node) {
      return (node.children || []).reduce(
        (sum, child) => sum + (child.type === 'folder' ? this.countRules(child) : 1),
        0
      )
    }
  }
}
</script>

<style scoped>
.automation-tree-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.automation-tree-item:last-child {
  border-bottom: none;
}

.automation-folder-header {
  background-color: #f6f6f6;
}

.automation-folder-icon {
  padding-right: 0;
  min-width: 0;
}

/* Содержимое папки смещено вправо, как в файловом дереве. */
.automation-level-nested {
  min-height: 12px;
  margin-left: 32px;
  border-left: 2px solid #e0e0e0;
}

.automation-level-nested:empty::after {
  content: 'Перетащите сюда автоматизации';
  display: block;
  padding: 10px 16px;
  font-size: 12px;
  color: #9e9e9e;
}
</style>
