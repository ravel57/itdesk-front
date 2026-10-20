<template>
  <div class="automation-value-editor">
    <div class="column q-gutter-xs">
      <q-select dense outlined :label="label || 'Значение'" :model-value="kind" :options="script ? kinds.filter(option => option.value === 'expression') : kinds" :readonly="script"
                emit-value map-options @update:model-value="changeKind"/>
      <automation-expression-input v-if="kind === 'expression'" outlined dense label="Скрипт / выражение"
                                   hint="Подсказки — по мере набора, вставка — по Tab."
                                   :variables="variables" :model-value="script ? String(modelValue ?? '').replace(/^=/, '') : String(modelValue).slice(1)" autogrow type="textarea"
                                   @update:model-value="update(script ? $event : '=' + $event)" @change="$emit('change')"/>
      <q-select v-else-if="['text', 'number'].includes(kind) && entityOptions.length" outlined dense
                label="Выберите значение" :model-value="modelValue" :options="entityOptions" emit-value map-options
                @update:model-value="update($event)"/>
      <automation-expression-input v-else-if="kind === 'text'" outlined dense autogrow type="textarea"
               suggestion-mode="TEMPLATE"
               label="Текст / шаблон {{ поле }}" :variables="variables" :model-value="modelValue" @update:model-value="update($event)"
               @change="$emit('change')"/>
      <q-input v-else-if="kind === 'number'" outlined dense type="number" label="Число"
               :model-value="modelValue" @update:model-value="update($event === '' ? 0 : Number($event))"
               @change="$emit('change')"/>
      <div v-else-if="kind === 'boolean'" class="row items-center q-gutter-xs">
        <span class="text-caption text-grey-7">Нет</span>
        <q-toggle label="Да" :model-value="modelValue" @update:model-value="update($event)"/>
      </div>
      <div v-else-if="kind === 'null'" class="text-caption q-pa-sm">Значение не задано</div>
    </div>
    <q-expansion-item v-if="kind === 'object' || kind === 'array'" default-opened dense
                      :label="kind === 'object' ? 'Поля объекта' : 'Элементы списка'" class="q-pl-sm">
      <div v-for="(value, key) in modelValue" :key="key" class="automation-value-child q-mt-sm">
        <div class="row items-center q-gutter-xs">
          <q-select v-if="kind === 'object' && fieldOptions.length" dense outlined class="col"
                    label="Какое поле изменить" :model-value="key" :options="fieldOptions" emit-value map-options
                    @update:model-value="rename(key, $event)"/>
          <q-input v-else-if="kind === 'object'" dense outlined class="col" label="Имя поля" :model-value="key"
                   @change="rename(key, $event)" autogrow type="textarea"/>
          <span v-else class="text-caption col">Элемент {{ Number(key) + 1 }}</span>
          <q-btn flat dense round icon="close" aria-label="Удалить значение" @click="remove(key)"/>
        </div>
        <automation-value-editor :model-value="value" :variables="variables"
                                 :value-type="fieldOptions.find(f => f.value === key)?.valueType || ''"
                                 :entity-options="fieldOptions.find(f => f.value === key)?.options || []"
                                 @update:model-value="replace(key, $event)" @change="$emit('change')"/>
      </div>
      <q-btn flat dense no-caps icon="add" :label="kind === 'object' ? 'Добавить поле' : 'Добавить элемент'"
             @click="add"/>
    </q-expansion-item>
  </div>
</template>

<script>
import AutomationExpressionInput from './AutomationExpressionInput.vue'

export default {
  name: 'AutomationValueEditor',
  components: { AutomationExpressionInput },
  props: {
    modelValue: { default: null },
    script: { type: Boolean, default: false },
    valueType: { type: String, default: '' },
    required: { type: Boolean, default: false },
    label: {
      type: String,
      default: ''
    },
    variables: {
      type: Array,
      default: () => []
    },
    fieldOptions: {
      type: Array,
      default: () => []
    },
    entityOptions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'change'],
  computed: {
    kind () {
      if (this.script) return 'expression'
      if (this.modelValue == null) return 'null'
      if (Array.isArray(this.modelValue)) return 'array'
      if (typeof this.modelValue === 'object') return 'object'
      if (typeof this.modelValue === 'string') return this.modelValue.startsWith('=') ? 'expression' : 'text'
      return typeof this.modelValue
    },
    kinds () {
      const options = [{
        label: this.entityOptions.length && typeof this.entityOptions[0].value === 'string' ? 'Из справочника' : 'Текст',
        value: 'text'
      }, {
        label: this.entityOptions.length ? 'Из справочника' : 'Число',
        value: 'number'
      }, {
        label: 'Да / нет',
        value: 'boolean'
      }, {
        label: 'Скрипт',
        value: 'expression'
      }, {
        label: 'Объект',
        value: 'object'
      }, {
        label: 'Список',
        value: 'array'
      }, {
        label: 'Не задано',
        value: 'null'
      }]
      if (!this.valueType) return options
      return options.filter(option => option.value === this.valueType || option.value === 'expression' ||
        (option.value === 'null' && !this.required) || option.value === this.kind)
    }
  },
  methods: {
    update (value) {
      this.$emit('update:modelValue', value)
      this.$emit('change')
    },
    changeKind (kind) {
      this.update(({
        text: this.entityOptions.find(o => typeof o.value === 'string')?.value || '',
        number: this.entityOptions.find(o => typeof o.value === 'number')?.value ?? 0,
        boolean: false,
        expression: '=',
        object: {},
        array: [],
        null: null
      })[kind])
      this.$emit('change')
    },
    replace (key, value) {
      const result = Array.isArray(this.modelValue) ? [...this.modelValue] : { ...this.modelValue }
      result[key] = value
      this.update(result)
    },
    remove (key) {
      const result = Array.isArray(this.modelValue) ? [...this.modelValue] : { ...this.modelValue }
      if (Array.isArray(result)) {
        result.splice(Number(key), 1)
      } else {
        delete result[key]
      }
      this.update(result)
      this.$emit('change')
    },
    rename (key, name) {
      if (!name || name === key || Object.hasOwn(this.modelValue, name)) return
      const result = Object.fromEntries(Object.entries(this.modelValue).map(([k, v]) => [k === key ? name : k, v]))
      this.update(result)
      this.$emit('change')
    },
    add () {
      const result = Array.isArray(this.modelValue) ? [...this.modelValue, ''] : { ...this.modelValue }
      if (!Array.isArray(result) && this.fieldOptions.length) {
        const next = this.fieldOptions.find(f => !Object.hasOwn(result, f.value))
        if (!next) return
        result[next.value] = null
      } else if (!Array.isArray(result)) {
        let i = 1
        while (Object.hasOwn(result, 'field' + i)) i++
        result['field' + i] = ''
      }
      this.update(result)
      this.$emit('change')
    }
  }
}
</script>

<style scoped>
.automation-value-child {
  border-left: 2px solid #d8dfec;
  padding-left: 8px;
}

.automation-value-editor {
  min-width: 0;
}
</style>
