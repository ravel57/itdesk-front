<template>
  <div class="row q-col-gutter-sm items-center q-mb-md">
    <div class="col">
      <q-input
        v-model="this.textModel"
        dense
        outlined
        label="Новый пункт чек-листа"
        @keyup.enter="this.$emit('add')"
      />
    </div>

    <div class="col-auto">
      <q-btn
        dense
        round
        color="primary"
        icon="add"
        @click="this.$emit('add')"
      />
    </div>
  </div>

  <div
    v-if="this.checklist.length === 0"
    class="text-grey-7"
  >
    Чек-лист пустой
  </div>

  <q-list
    v-else
    bordered
    separator
    class="rounded-borders"
  >
    <draggable
      :list="this.checklist"
      item-key="id"
      handle=".task-checklist-drag-handle"
      ghost-class="ghost"
      class="task-checklist-draggable-list app-width-full"
    >
      <template #item="{ element: item }">
        <q-item class="task-checklist-item">
          <q-item-section
            side
            class="task-checklist-drag-handle app-drag-handle"
          >
            <q-icon
              name="drag_indicator"
              color="grey-6"
            />
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="item.completed"/>
          </q-item-section>

          <q-item-section>
            <q-input
              v-model="item.text"
              dense
              borderless
              placeholder="Пункт чек-листа"
            />
          </q-item-section>

          <q-item-section side>
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              @click.stop="this.$emit('remove', item.id)"
            />
          </q-item-section>
        </q-item>
      </template>
    </draggable>
  </q-list>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  components: { draggable },

  props: {
    // Чек-лист заявки (массив меняется на месте: drag-and-drop, completed, text)
    checklist: { type: Array, required: true },
    // Текст поля «Новый пункт чек-листа», v-model:new-item-text
    newItemText: { type: String, default: '' }
  },

  // add — добавить пункт из поля ввода, remove — удалить пункт по id
  emits: ['update:newItemText', 'add', 'remove'],

  computed: {
    textModel: {
      get () {
        return this.newItemText
      },
      set (value) {
        this.$emit('update:newItemText', value)
      }
    }
  }
}
</script>

<style scoped>
.task-checklist-item {
  padding: 4px 8px;
}

.ghost {
  opacity: 0.5;
}
</style>
