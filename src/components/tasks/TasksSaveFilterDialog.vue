<template>
  <q-dialog
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div
          class="text-h6"
          v-text="this.selectedSavedFilter ? 'Пересохранить шаблон фильтров?' : 'Сохранить шаблон фильтров?'"
        />
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section class="app-inline app-padding-top-0">
        <q-input
          label="Название *"
          :model-value="this.name"
          @update:model-value="this.$emit('update:name', $event)"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogNewFilterName"
        />
        <q-select
          v-if="this.canManageGlobalFilters"
          :model-value="this.scope"
          @update:model-value="this.$emit('update:scope', $event)"
          :options="this.filterScopeOptions"
          label="Доступ *"
          emit-value
          map-options
          outlined
          dense
          class="q-mb-md"
        />
        <div v-else class="text-caption text-grey-7 q-mb-md">
          Доступ: персональный
        </div>
        <div class="app-inline app-margin-bottom-8">
          Условие между фильтрами: {{ this.filterJoinOperator === 'AND' ? 'И' : 'ИЛИ' }}
        </div>
        <div class="app-inline app-text-pre-wrap"
          v-for="(filter, index) in this.filterChain"
          :key="index"
        >
          {{ `${filter.label} : ${this.getFilterSelectedOptionsText(filter)}` }}
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="primary"
          label="Отмена"
          @click="this.$emit('cancel')"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="this.$emit('save')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
// Диалог сохранения / пересохранения шаблона фильтров.
// Состояние (название, доступ, видимость) принадлежит странице, сам запрос на сервер выполняет страница
// по событию save. Страница вызывает focusName() после открытия диалога.
export default {
  props: {
    // Показ диалога (v-model)
    modelValue: {
      type: Boolean,
      default: false
    },
    // Название шаблона (v-model:name)
    name: {
      type: String,
      default: ''
    },
    // Доступ: 'PERSONAL' | 'GLOBAL' (v-model:scope)
    scope: {
      type: String,
      default: 'PERSONAL'
    },
    // Выбранный сохранённый фильтр ('' если нет) — определяет заголовок «Сохранить» / «Пересохранить»
    selectedSavedFilter: {
      type: [String, Number],
      default: ''
    },
    canManageGlobalFilters: {
      type: Boolean,
      default: false
    },
    filterJoinOperator: {
      type: String,
      default: 'AND'
    },
    // Текущая цепочка фильтров (только для отображения)
    filterChain: {
      type: Array,
      default: () => []
    },
    // (filter) => строка с выбранными значениями фильтра
    getFilterSelectedOptionsText: {
      type: Function,
      required: true
    }
  },

  emits: ['update:modelValue', 'update:name', 'update:scope', 'cancel', 'save'],

  computed: {
    filterScopeOptions() {
      return [
        {label: 'Персональный — только мне', value: 'PERSONAL'},
        {label: 'Глобальный — всей команде', value: 'GLOBAL'}
      ]
    }
  },

  methods: {
    focusName() {
      this.$refs.dialogNewFilterName.focus()
    }
  }
}
</script>
