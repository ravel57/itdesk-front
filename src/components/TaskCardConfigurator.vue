<template>
  <div class="row q-col-gutter-lg q-mt-none">
    <div class="col-12 col-md-7">
      <q-list
        bordered
        class="rounded-borders settings-row-list"
        separator
      >
        <q-item header class="text-bold">
          Поля карточки
        </q-item>
        <draggable
          :list="this.items"
          item-key="key"
          class="list-group"
          ghost-class="ghost"
          handle=".settings-drag-handle"
          @end="this.persist"
        >
          <template #item="{ element }">
            <q-item class="list-group-item">
              <q-item-section side class="settings-drag-handle cursor-grab">
                <q-icon name="drag_indicator" color="grey-6"/>
              </q-item-section>
              <q-item-section>
                <q-item-label :class="{ 'text-grey-6': !element.enabled }">
                  {{ this.fieldLabel(element.key) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-toggle
                  v-model="element.enabled"
                  color="primary"
                  @update:model-value="this.persist"
                />
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </q-list>
      <div class="row items-start justify-between no-wrap q-mt-sm">
        <div class="text-caption text-grey-7">
          Поля, у которых для заявки нет значения (например, не назначен исполнитель), в карточке не показываются.
        </div>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="restart_alt"
          label="Сбросить"
          class="q-ml-md"
          @click="this.reset"
        />
      </div>
    </div>

    <div class="col-12 col-md-5">
      <div class="text-subtitle2 q-mb-sm">Так будет выглядеть карточка</div>
      <div class="task-card-preview">
        <div class="task-card-preview__header">
          <span class="text-grey-7">№1</span>
          <span class="task-card-preview__name">Не работает принтер</span>
          <span class="task-card-preview__status">OPEN</span>
        </div>
        <table>
          <tr
            v-for="field in this.visibleItems"
            :key="field.key"
          >
            <th class="task-card-preview__label">{{ this.fieldLabel(field.key) }}:</th>
            <th class="task-card-preview__value">{{ this.fieldSample(field.key) }}</th>
          </tr>
        </table>
        <div v-if="this.visibleItems.length === 0" class="text-grey-6">
          Все поля скрыты — в карточке останутся только номер, название и статус.
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import {
  TASK_CARD_FIELDS,
  taskCardConfig,
  saveTaskCardConfig,
  resetTaskCardConfig
} from 'src/util/taskCardConfig'

export default {
  name: 'TaskCardConfigurator',

  components: { draggable },

  data: () => ({
    items: []
  }),

  computed: {
    visibleItems () {
      return this.items.filter(item => item.enabled)
    }
  },

  methods: {
    fieldLabel (key) {
      return TASK_CARD_FIELDS.find(field => field.key === key)?.label || key
    },

    fieldSample (key) {
      return TASK_CARD_FIELDS.find(field => field.key === key)?.sample || ''
    },

    persist () {
      saveTaskCardConfig(this.items.map(item => ({ key: item.key, enabled: item.enabled })))
    },

    reset () {
      resetTaskCardConfig()
      this.items = taskCardConfig.value.map(item => ({ ...item }))
    }
  },

  created () {
    this.items = taskCardConfig.value.map(item => ({ ...item }))
  }
}
</script>

<style scoped>
.list-group-item:hover {
  background-color: #f3f3f5;
}

.task-card-preview {
  border: 1px solid var(--q-primary);
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
}

.task-card-preview__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.task-card-preview__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-card-preview__status {
  border: 1px solid var(--q-primary);
  border-radius: 4px;
  background: rgba(148, 121, 255, 0.2);
  color: var(--q-primary);
  padding: 0 4px;
}

.task-card-preview th {
  text-align: left;
  font-weight: 400;
}

.task-card-preview__label {
  color: grey;
  padding-right: 8px;
  white-space: nowrap;
}
</style>
