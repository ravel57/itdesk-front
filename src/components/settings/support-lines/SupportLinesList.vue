<template>
  <q-list bordered separator class="rounded-borders support-lines-list settings-row-list">
    <draggable
      :list="store.supportLines"
      item-key="id"
      handle=".drag-handle"
      @end="saveOrder"
    >
      <template #item="{ element }">
        <q-item class="support-line-item">
          <q-item-section avatar class="drag-handle cursor-grab">
            <q-icon name="drag_indicator" color="grey-6"/>
          </q-item-section>

          <q-item-section>
            <q-item-label class="row items-center q-gutter-sm">
              <span class="text-weight-medium">{{ element.name }}</span>
              <q-badge v-if="element.defaultSelection" color="primary">По умолчанию</q-badge>
              <q-badge v-if="element.active === false" color="grey">Отключена</q-badge>
              <q-badge color="blue-grey-6">L{{ element.level || 1 }}</q-badge>
            </q-item-label>

            <q-item-label caption class="q-mt-xs">
              <span>{{ getResponsibleLabel(element) }}</span>
              <span class="q-mx-xs">·</span>
              <span>Участников: {{ (element.members || []).length }}</span>
              <span class="q-mx-xs">·</span>
              <span>Наблюдателей: {{ (element.observers || []).length }}</span>
              <span class="q-mx-xs">·</span>
              <span>{{ getAssignmentStrategyLabel(element.assignmentStrategy) }}</span>
            </q-item-label>

            <q-item-label caption class="q-mt-xs">
              <q-icon name="timer" size="15px" class="q-mr-xs"/>
              {{ getOlaLabel(element) }}
            </q-item-label>

            <q-item-label v-if="element.description" caption class="q-mt-xs">
              {{ element.description }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row no-wrap">
              <q-btn
                :text-color="element.defaultSelection ? 'primary' : 'grey'"
                flat
                dense
                icon="beenhere"
                @click.stop="setDefault(element)"
              >
                <q-tooltip>
                  {{ element.defaultSelection ? 'Используется по умолчанию' : 'Использовать по умолчанию' }}
                </q-tooltip>
              </q-btn>
              <q-btn flat dense icon="edit" color="primary" @click.stop="openEdit(element)"/>
            </div>
          </q-item-section>
        </q-item>
      </template>
    </draggable>
  </q-list>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'
import {useStore} from 'stores/store'
import {
  getAssignmentStrategyLabel,
  getOlaLabel,
  getResponsibleLabel,
  getSupportLineErrorMessage
} from 'src/util/settingsSupportLines/supportLineLabels'

// Список линий поддержки: сортировка перетаскиванием, выбор линии по умолчанию, запрос на редактирование.
export default {
  name: 'SupportLinesList',
  components: {draggable},
  emits: ['edit'],

  methods: {
    getResponsibleLabel,
    getAssignmentStrategyLabel,
    getOlaLabel,

    openEdit(line) {
      this.$emit('edit', line)
    },

    setDefault(line) {
      axios.patch('/api/v1/support-line/set-default', line)
        .then(({data}) => {
          this.store.supportLines = this.store.supportLines.map(item => ({
            ...item,
            defaultSelection: item.id === data.id
          }))
        })
        .catch(error => this.showError(error))
    },

    saveOrder() {
      this.store.supportLines = this.store.supportLines.map((line, index) => ({...line, orderNumber: index}))
      axios.patch('/api/v1/support-lines/resort', this.store.supportLines)
        .then(({data}) => {
          this.store.supportLines = data
        })
        .catch(error => this.showError(error))
    },

    showError(error) {
      this.$q.notify({
        type: 'negative',
        message: getSupportLineErrorMessage(error)
      })
    }
  },

  setup() {
    return {store: useStore()}
  }
}
</script>

<style scoped>
.cursor-grab {
  cursor: grab;
}

.support-lines-list {
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}

.support-line-item {
  min-height: 68px;
}
</style>
