<template>
  <q-select
    v-bind="$attrs"
    :model-value="modelValue"
    :options="filteredOptions"
    option-value="value"
    option-label="label"
    emit-value
    map-options
    use-input
    fill-input
    hide-selected
    input-debounce="0"
    @filter="filter"
    @update:model-value="value => $emit('update:modelValue', value)"
  >
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
          <q-item-label v-if="scope.opt.group" caption>{{ scope.opt.group }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">Нет подходящих событий</q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script>
// Выбор одного события автоматизации с вводом и фильтрацией по названию, разделу и коду
const normalize = value => String(value || '').toLowerCase().replace(/ё/g, 'е').trim()

export default {
  name: 'AutomationEventSelect',
  inheritAttrs: false,

  props: {
    modelValue: { type: String, default: null },
    // [{ value, label, group }] из GET /api/v1/trigger-types/options
    options: { type: Array, default: () => [] }
  },

  emits: ['update:modelValue'],

  data () {
    return {
      needle: ''
    }
  },

  computed: {
    filteredOptions () {
      const needle = this.needle
      if (!needle) return this.options
      return this.options.filter(option =>
        [option.label, option.group, option.value].some(text => normalize(text).includes(needle)))
    }
  },

  methods: {
    filter (value, update) {
      update(() => {
        const needle = normalize(value)
        // При открытии в поле уже стоит название выбранного события — показываем весь список
        const selected = this.options.find(option => option.value === this.modelValue)
        this.needle = selected && needle === normalize(selected.label) ? '' : needle
      })
    }
  }
}
</script>
