<template>
  <q-dialog
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
    persistent
  >
    <q-card style="width: 500px">
      <q-card-section class="row items-center q-pb-none text-h6">
        <q-toolbar class="justify-between">
          <div class="text-h6">Настройка колонок таблицы</div>
          <div class="">
            <q-btn
              flat
              round
              dense
              icon="close"
              v-close-popup
            />
          </div>
        </q-toolbar>
      </q-card-section>
      <q-card-section class="row items-center">
        <q-list
          bordered
          class="rounded-borders settings-row-list"
          style="width: 100%"
          separator
        >
          <draggable
            :list="this.columns"
            item-key="id"
            class="list-group"
            ghost-class="ghost"
            handle=".settings-drag-handle"
            style="width: 100%"
            @start="dragging = true"
            @end="dragging = false; this.onTableColumnsEdited()"
          >
            <template #item="{ element }">
              <q-item
                class="list-group-item"
                :class="{ 'not-draggable': true }"
              >
                <q-item-section side class="settings-drag-handle cursor-grab">
                  <q-icon name="drag_indicator" color="grey-6"/>
                </q-item-section>
                <q-item-section>
                  {{ element.label }}
                </q-item-section>
                <q-item-section side>
                  <q-checkbox
                    v-model="element.active"
                    dense
                    color="primary"
                    @update:model-value="this.onTableColumnsEdited"
                  >
                    <q-tooltip>
                      {{ element.active ? 'Скрыть колонку' : 'Отобразить колонку' }}
                    </q-tooltip>
                  </q-checkbox>
                </q-item-section>
              </q-item>
            </template>
          </draggable>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="this.customized"
          flat
          color="primary"
          icon="restart_alt"
          label="Как в карточках"
          @click="this.resetTableColumnsToCardConfig"
        >
          <q-tooltip>Вернуть столбцы, соответствующие настройкам карточек заявок</q-tooltip>
        </q-btn>
        <q-space/>
        <q-btn label="Применить" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import draggable from 'vuedraggable'
import { taskCardConfig } from 'src/util/taskCardConfig'
import {
  TABLE_CUSTOMIZED_KEY,
  TABLE_SETTINGS_KEY,
  tableColumnsFromCardConfig
} from 'src/util/taskTableColumns'

// Диалог настройки колонок таблицы заявок: порядок и видимость колонок, сохранение в localStorage.
// Список колонок (columns) редактируется на месте (drag-n-drop и чекбоксы меняют элементы массива страницы),
// сброс к настройкам карточек отдаётся родителю через update:columns.
export default {
  components: {draggable},

  props: {
    // Показ диалога (v-model)
    modelValue: {
      type: Boolean,
      default: false
    },
    // Колонки таблицы (v-model:columns): [{id, label, active, ...}]
    columns: {
      type: Array,
      required: true
    },
    // Колонки изменены пользователем и больше не следуют настройкам карточек (v-model:customized)
    customized: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue', 'update:columns', 'update:customized'],

  data: () => ({
    dragging: false
  }),

  methods: {
    onTableColumnsEdited() {
      this.$emit('update:customized', true)
      try {
        localStorage.setItem(TABLE_CUSTOMIZED_KEY, 'true')
        localStorage.setItem(TABLE_SETTINGS_KEY, JSON.stringify(this.columns))
      } catch {
        // localStorage недоступен — настройка действует до перезагрузки страницы
      }
    },

    resetTableColumnsToCardConfig() {
      this.$emit('update:customized', false)
      try {
        localStorage.removeItem(TABLE_CUSTOMIZED_KEY)
        localStorage.removeItem(TABLE_SETTINGS_KEY)
      } catch {
        // localStorage недоступен — ничего не сохраняем
      }
      this.$emit('update:columns', tableColumnsFromCardConfig(taskCardConfig.value))
    }
  }
}
</script>
