<template>
  <draggable
    v-model="sectionsModel"
    :item-key="section => section"
    tag="div"
    class="flow-section-navigation"
    ghost-class="flow-section-ghost"
    :animation="150"
  >
    <template #item="{ element: section }">
      <q-btn flat dense class="flow-section-btn app-shared-flow-section-btn" @click="$emit('focus-section', section)">
        <q-icon name="drag_indicator" size="14px" class="flow-section-drag-handle"/>
        <span>{{ section }}</span>
      </q-btn>
    </template>
  </draggable>
</template>

<script>
import draggable from 'vuedraggable'

// Навигация по этапам сценария: клик — переход к этапу, перетаскивание — изменение порядка.
export default {
  name: 'FlowSectionNavigation',

  components: {draggable},

  props: {
    modelValue: {type: Array, default: () => []}
  },

  emits: ['update:modelValue', 'focus-section'],

  computed: {
    sectionsModel: {
      get() { return this.modelValue },
      set(sections) { this.$emit('update:modelValue', sections) }
    }
  }
}
</script>

<style scoped>
.flow-section-navigation { display: flex; flex-wrap: wrap; gap: 3px; padding: 6px; border-bottom: 1px solid var(--app-border, #dfe2e8); background: var(--app-surface, #fff); max-height: 110px; overflow: auto; }

.flow-section-drag-handle {
  margin-right: 4px;
  opacity: 0.45;
}

.flow-section-ghost {
  opacity: 0.4;
}
</style>
