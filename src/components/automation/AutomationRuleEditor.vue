<template>
  <div class="automation-rule-editor q-mt-sm">
    <template v-if="groupKey">
      <div class="row items-center">
        <q-select dense outlined class="col" :model-value="groupKey"
                  :options="[{label:'Все условия выполняются',value:'all'},{label:'Хотя бы одно выполняется',value:'any'}]"
                  emit-value map-options @update:model-value="setGroup"/>
        <q-btn flat dense round icon="add" aria-label="Добавить условие" @click="add"/>
      </div>
      <div v-for="(child, index) in modelValue[groupKey]" :key="index" class="rule-child">
        <q-btn flat dense round icon="close" aria-label="Удалить условие" class="float-right" @click="remove(index)"/>
        <automation-rule-editor :model-value="child" :variables="variables"
                                @update:model-value="replace(index, $event)"/>
      </div>
    </template>
    <template v-else-if="modelValue.not">
      <q-banner dense class="bg-orange-1">Следующее условие НЕ выполняется</q-banner>
      <automation-rule-editor :model-value="modelValue.not" :variables="variables"
                              @update:model-value="$emit('update:modelValue', {not:$event})"/>
    </template>
    <template v-else>
      <automation-value-editor label="Проверяемое значение" :model-value="modelValue.left" :variables="variables"
                               @update:model-value="patch('left', $event)"/>
      <q-select dense outlined class="q-my-sm" label="Сравнение" :model-value="modelValue.operator" :options="operators"
                emit-value map-options @update:model-value="patch('operator', $event)"/>
      <automation-value-editor v-if="!['true','null','notNull','empty','notEmpty'].includes(modelValue.operator)"
                               label="С чем сравнить" :model-value="modelValue.right" :variables="variables"
                               @update:model-value="patch('right', $event)"/>
      <q-btn flat dense icon="add" label="Добавить ещё условие"
             @click="$emit('update:modelValue', {all:[modelValue, {left:'=',operator:'=',right:null}]})"/>
    </template>
  </div>
</template>

<script>
import AutomationValueEditor from './AutomationValueEditor.vue'

export default {
  name: 'AutomationRuleEditor',
  components: { AutomationValueEditor },
  props: {
    modelValue: {
      type: Object,
      required: true
    },
    variables: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  computed: {
    groupKey () {
      return this.modelValue.all ? 'all' : this.modelValue.any ? 'any' : ''
    },
    operators () {
      return [{
        label: 'Равно',
        value: '='
      }, {
        label: 'Не равно',
        value: '!='
      }, {
        label: 'Больше',
        value: '>'
      }, {
        label: 'Не меньше',
        value: '>='
      }, {
        label: 'Меньше',
        value: '<'
      }, {
        label: 'Не больше',
        value: '<='
      }, {
        label: 'Входит в список',
        value: 'in'
      }, {
        label: 'Условие истинно',
        value: 'true'
      }, {
        label: 'Не задано (null)',
        value: 'null'
      }, {
        label: 'Задано (не null)',
        value: 'notNull'
      }, {
        label: 'Пусто',
        value: 'empty'
      }, {
        label: 'Не пусто',
        value: 'notEmpty'
      }]
    }
  },
  methods: {
    patch (key, value) {
      this.$emit('update:modelValue', {
        ...this.modelValue,
        [key]: value
      })
    },
    setGroup (key) {
      this.$emit('update:modelValue', { [key]: this.modelValue[this.groupKey] })
    },
    replace (index, value) {
      const children = [...this.modelValue[this.groupKey]]
      children[index] = value
      this.$emit('update:modelValue', { [this.groupKey]: children })
    },
    remove (index) {
      const children = this.modelValue[this.groupKey].filter((_, i) => i !== index)
      this.$emit('update:modelValue', { [this.groupKey]: children })
    },
    add () {
      this.$emit('update:modelValue', {
        [this.groupKey]: [...this.modelValue[this.groupKey], {
          left: '=',
          operator: '=',
          right: null
        }]
      })
    }
  }
}
</script>

<style scoped>
.rule-child {
  border-left: 2px solid #d8dfec;
  margin-top: 10px;
  padding-left: 8px;
}
</style>
