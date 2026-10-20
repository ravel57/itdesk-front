<template>
  <div class="q-mt-md">
    <template v-if="draft.type === 'OPERATION'">
      <q-banner v-if="error" class="bg-red-1 text-negative">{{ error }}</q-banner>
      <div v-if="operation" class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle2"><q-icon :name="operation.icon || 'widgets'" class="q-mr-xs"/>{{ operation.label }}</div>
        <q-btn flat dense no-caps label="Заменить шаг" @click="choosingOperation = !choosingOperation"/>
      </div>
      <template v-if="!operation || choosingOperation">
      <q-select outlined dense clearable label="Что должен делать шаг"
                :model-value="selectedGroup" :options="operationGroups" emit-value map-options
                @update:model-value="selectGroup"/>
      <q-select v-if="selectedGroup" outlined dense use-input fill-input hide-selected input-debounce="0"
                label="Выберите действие" class="q-mt-sm"
                :model-value="draft.config.operation" :options="filteredOperations" option-value="id"
                option-label="label" emit-value map-options @filter="filterOperations"
                @update:model-value="selectOperation">
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section>
              <q-item-label>{{ scope.opt.label }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      </template>
      <q-banner v-if="operation" rounded class="bg-blue-1 text-blue-10 q-mt-sm">{{ operation.description }}</q-banner>
      <q-expansion-item v-for="field in operation?.fields || []" :key="draft.id + field.key" dense default-opened
                        :label="field.label" header-class="automation-field-header" class="q-mt-sm">
        <div class="text-caption text-grey-7 q-mb-xs">{{ field.help }}</div>
        <automation-value-editor :model-value="argumentValue(field)" :variables="argumentVariables(field)"
                                 :script="field.type === 'script'" :value-type="field.valueType || ''" :required="field.required"
                                 :entity-options="field.options || catalogOptions(field.entityCatalog || field.key)"
                                 :field-options="field.key === 'fields' && draft.config.operation === 'task.update' ? taskFields : []"
                                 @update:model-value="setArgument(field.key, $event)" @change="changed"/>
      </q-expansion-item>
      <q-input v-model="draft.config.resultVariable" outlined dense label="Сохранить результат как" prefix="var."
               class="q-mt-md" hint="Дальше результат можно использовать в условиях и действиях." @change="changed" autogrow type="textarea"/>
      <q-banner v-if="operation" rounded class="bg-grey-2 q-mt-sm"><b>Что вернёт шаг:</b> {{ operation.result }}
      </q-banner>
      <q-toggle v-model="draft.config.background" label="Выполнить в фоне и продолжить с результатом" class="q-mt-sm"
                @update:model-value="changed"/>
      <q-expansion-item dense label="Повторить шаг при ошибке" header-class="automation-field-header" class="q-mt-sm">
        <q-input v-model.number="draft.config.maxAttempts" type="number" min="1" max="5" outlined dense
                 label="Максимум попыток" @change="changed"/>
        <q-input v-model.number="draft.config.retryDelaySeconds" type="number" min="1" max="3600" outlined dense
                 label="Пауза перед повтором, секунд" class="q-mt-sm" @change="changed"/>
        <div class="text-caption q-mt-sm">Продолжение сохраняется в очереди, пауза увеличивается при каждой попытке.
          Внутри цикла и встроенного подпроцесса используйте одну попытку.
        </div>
      </q-expansion-item>
      <q-expansion-item v-if="operation && operation.effect !== 'PURE' && operation.effect !== 'CONTROL'" dense
                        label="Тестовые данные шага" header-class="automation-field-header" class="q-mt-sm">
        <p class="text-caption">Эти значения используются только при проверке. Для анализа ответ обязателен; для чтения
          данных и создания сущности он заменяет обычный тестовый результат.</p>
        <q-banner v-if="testContext?.input" dense class="bg-grey-2 q-my-sm">Входные данные этого шага уже получены.
          Можно выбрать вариант ниже или задать свой результат.
        </q-banner>
        <template v-if="draft.config.operation === 'ai.decide'">
          <q-select v-if="draft.config.arguments?.kind !== 'noul'" outlined dense label="Какой ответ проверить"
                    :options="testOptions" emit-value map-options :model-value="draft.config.testResult?.choice"
                    @update:model-value="chooseTestAnswer"/>
          <q-input outlined dense type="number" min="0" max="1" step="0.05"
                   :label="draft.config.arguments?.kind === 'noul' ? 'Вероятность ответа ДА' : 'Уверенность выбранного ответа'"
                   :model-value="draft.config.testResult?.probability ?? 0.9" class="q-mt-sm"
                   @update:model-value="setTestProbability(Number($event))" @change="changed"/>
          <q-btn flat dense no-caps label="Проверить недоступность Jev"
                 @click="draft.config.testResult = {available:false,status:'UNAVAILABLE'}; changed()"/>
        </template>
        <q-btn v-if="draft.config.operation === 'ai.generate'" flat dense no-caps label="Подставить пример текста"
               @click="draft.config.testResult = {text:'Пример подготовленной подсказки'}; changed()"/>
        <automation-value-editor :model-value="draft.config.testResult" :variables="variables"
                                 @update:model-value="draft.config.testResult = $event" @change="changed"/>
      </q-expansion-item>
    </template>
    <template v-else-if="draft.type === 'PARAMETERS'">
      <q-banner class="bg-blue-1 text-blue-10">Меняйте значения здесь. Все шаги сценария используют эти настройки.
      </q-banner>
      <template v-for="(parameter, index) in draft.config.parameters || []" :key="index">
        <q-separator v-if="index > 0" class="q-my-md"/>
        <div class="q-mt-md">
        <q-input v-model="parameter.label" outlined dense label="Название настройки" @change="changed" autogrow type="textarea"/>
        <div class="text-caption text-grey-7 q-my-xs">{{ parameter.help }}</div>
        <automation-value-editor :model-value="parameter.value" :variables="[]"
                                 @update:model-value="parameter.value = $event" @change="changed"/>
        <q-expansion-item dense label="Описание и имя для использования в графе" header-class="automation-field-header">
          <q-input v-model="parameter.name" outlined dense label="Имя"
                   :prefix="'var.' + (draft.config.resultVariable || 'settings') + '.'" @change="changed" autogrow type="textarea"/>
          <q-input v-model="parameter.help" outlined dense autogrow type="textarea" label="Подсказка" @change="changed"/>
          <q-btn flat dense no-caps color="negative" label="Удалить настройку"
                 @click="draft.config.parameters.splice(index, 1); changed()"/>
        </q-expansion-item>
        </div>
      </template>
      <q-btn outline no-caps dense icon="add" label="Добавить настройку" class="q-mt-md" @click="addParameter"/>
    </template>
    <template v-else-if="draft.type === 'FOR_EACH'">
      <q-banner class="bg-blue-1 text-blue-10">Выход «Обработать элемент» выполняется для каждого элемента списка до
        узла «Следующий элемент». После всего списка работает выход «Готово».
      </q-banner>
      <automation-expression-input v-model="draft.config.itemsExpression" outlined dense label="Какой список обработать"
                                   :variables="variables" class="q-mt-md" @change="changed" autogrow type="textarea"/>
      <q-input v-model="draft.config.itemVariable" outlined dense label="Текущий элемент" prefix="var." class="q-mt-sm"
               @change="changed" autogrow type="textarea"/>
      <q-select v-model="draft.config.endNodeId" outlined dense label="Узел завершения одной итерации"
                :options="nodes.filter(n => n.type === 'LOOP_END').map(n => ({label:n.label,value:n.id}))" emit-value
                map-options class="q-mt-sm" @update:model-value="changed"/>
      <q-input v-model.number="draft.config.maxItems" outlined dense type="number" min="1" max="1000"
               label="Максимум элементов" class="q-mt-sm" @change="changed"/>
      <q-expansion-item dense label="Собрать результаты обработки" header-class="automation-field-header" class="q-mt-sm">
        <automation-expression-input v-model="draft.config.collectExpression" outlined dense
                                     label="Какое значение брать после каждого элемента" :variables="variables"
                                     @change="changed" autogrow type="textarea"/>
        <q-input v-model="draft.config.resultVariable" outlined dense label="Итоговый список" prefix="var."
                 class="q-mt-sm" @change="changed" autogrow type="textarea"/>
      </q-expansion-item>
    </template>
    <template v-else-if="draft.type === 'SUBFLOW'">
      <q-select v-model="draft.config.triggerId" outlined dense label="Какой сценарий вызвать"
                :options="triggers.map(t => ({label:t.name,value:t.id}))" emit-value map-options
                @update:model-value="changed"/>
      <q-select v-model="draft.config.mode" outlined dense label="Режим"
                :options="[{label:'Встроенный: дождаться результата',value:'INLINE'},{label:'В фоне: отдельный запуск',value:'ASYNC'}]"
                emit-value map-options class="q-mt-sm" @update:model-value="changed"/>
      <q-toggle v-model="draft.config.localVariables" label="Изолировать переменные подпроцесса" class="q-mt-sm"
                @update:model-value="changed"/>
      <template v-if="draft.config.localVariables">
        <div class="text-subtitle2 q-mt-md">Передать входные значения</div>
        <automation-value-editor :model-value="draft.config.inputs || {}" :variables="variables"
                                 @update:model-value="draft.config.inputs = $event" @change="changed"/>
        <template v-if="draft.config.mode !== 'ASYNC'">
          <div class="text-subtitle2 q-mt-md">Вернуть значения родителю</div>
          <automation-value-editor :model-value="draft.config.outputs || {}" :variables="variables"
                                   @update:model-value="draft.config.outputs = $event" @change="changed"/>
        </template>
      </template>
      <q-banner class="bg-blue-1 text-blue-10 q-mt-md">Имя поля на входе становится переменной подпроцесса. На выходе
        укажите имя переменной родителя и выражение из результата подпроцесса. Фоновый режим запускается отдельно и не
        возвращает немедленный результат.
      </q-banner>
    </template>
    <q-banner v-else class="bg-blue-1 text-blue-10">Здесь заканчивается обработка одного элемента. Цикл сам перейдёт к
      следующему.
    </q-banner>
  </div>
</template>

<script>
function draftNode (node) {
  const draft = JSON.parse(JSON.stringify(node))
  if (draft.type === 'OPERATION') {
    draft.config.background ??= false
    draft.config.maxAttempts ??= 1
    draft.config.retryDelaySeconds ??= 2
  }
  return draft
}

import { operationConfig } from 'src/util/automationNodeCatalog'
import { inferExpressionType } from 'src/util/automationVariableTypes'
import AutomationValueEditor from './AutomationValueEditor.vue'
import AutomationExpressionInput from './AutomationExpressionInput.vue'

export default {
  name: 'AutomationOperationInspector',
  components: {
    AutomationValueEditor,
    AutomationExpressionInput
  },
  props: {
    node: {
      type: Object,
      required: true
    },
    catalog: {
      type: Array,
      default: () => []
    },
    variables: {
      type: Array,
      default: () => []
    },
    nodes: {
      type: Array,
      default: () => []
    },
    triggers: {
      type: Array,
      default: () => []
    },
    entityCatalogs: {
      type: Object,
      default: () => ({})
    },
    error: {
      type: String,
      default: ''
    },
    testContext: {
      type: Object,
      default: null
    }
  },
  emits: ['change', 'update:config', 'update:label'],
  data () {
    const draft = draftNode(this.node)
    const currentOperation = this.catalog.find(o => o.id === draft.config.operation)
    return {
      choosingOperation: false,
      filteredOperations: this.catalog.filter(o => o.group === currentOperation?.group),
      draft,
      selectedGroup: currentOperation?.group || null
    }
  },
  computed: {
    operationGroups () {
      const seen = new Set()
      const groups = []
      for (const o of this.catalog) {
        if (!seen.has(o.group)) {
          seen.add(o.group)
          groups.push(o.group)
        }
      }
      return groups.map(group => ({
        label: group,
        value: group
      }))
    },
    testOptions () {
      const candidates = this.testContext?.input?.candidates || []
      const values = candidates.map(c => ({
        label: c.name || c.title || String(c.id),
        value: String(c.id)
      }))
      for (const [value, label] of Object.entries(this.draft.config.arguments?.options || {})) {
        values.push({
          value,
          label
        })
      }
      return values
    },
    taskFields () {
      return [{
        label: 'Название',
        value: 'name'
      }, {
        label: 'Описание',
        value: 'description'
      }, {
        label: 'Сервис',
        value: 'serviceId'
      }, {
        label: 'Тип заявки',
        value: 'typeId'
      }, {
        label: 'Приоритет',
        value: 'priorityId'
      }, {
        label: 'Линия поддержки',
        value: 'lineId'
      }, {
        label: 'Статус',
        value: 'status'
      }, {
        label: 'Исполнитель',
        value: 'assigneeId'
      }, {
        label: 'Снять исполнителя',
        value: 'clearAssignee'
      }].map(f => ({
        ...f,
        options: this.catalogOptions(f.value),
        valueType: f.value === 'clearAssignee' ? 'boolean' : f.value.endsWith('Id') ? 'number' : 'text'
      }))
    },
    operation () {
      return this.catalog.find(o => o.id === this.draft.config.operation)
    }
  },
  watch: {
    catalog (value) {
      if (!this.selectedGroup) {
        const op = value.find(o => o.id === this.draft.config.operation)
        if (op) this.selectedGroup = op.group
      }
      this.filteredOperations = value.filter(o => o.group === this.selectedGroup)
    },
    node: {
      deep: true,
      handler (value) {
        if (JSON.stringify(value) !== JSON.stringify(this.draft)) {
          this.draft = draftNode(value)
          this.selectedGroup = this.catalog.find(operation => operation.id === value.config.operation)?.group || null
          this.filteredOperations = this.catalog.filter(operation => operation.group === this.selectedGroup)
        }
      }
    }
  },
  methods: {
    argumentValue (field) {
      const value = this.draft.config.arguments?.[field.key]
      if (field.legacyItemPath && typeof value === 'string' && /^[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*$/.test(value) && !value.startsWith('var.')) {
        return 'var.item.' + value
      }
      return value
    },
    argumentVariables (field) {
      if (!field.contextSource) return this.variables
      const environment = Object.fromEntries(this.variables.filter(variable => typeof variable === 'object' && !variable.name.includes('.'))
        .map(({ name, ...schema }) => [name, schema]))
      const source = this.draft.config.arguments?.[field.contextSource]
      const item = inferExpressionType(source, environment).element || { type: 'UNKNOWN' }
      return [
        ...this.variables.filter(variable => {
          const name = typeof variable === 'string' ? variable : variable.name
          return name !== 'item' && !name.startsWith('item.')
        }),
        { name: 'item', ...item },
        ...Object.entries(item.fields || {}).map(([name, type]) => ({ name: 'item.' + name, ...type }))
      ]
    },
    chooseTestAnswer (choice) {
      const value = (this.testContext?.input?.candidates || []).find(candidate => String(candidate.id) === String(choice)) || null
      this.draft.config.testResult = {
        available: true,
        status: 'OK',
        choice,
        probability: this.draft.config.testResult?.probability ?? 0.9,
        value
      }
      this.changed()
    },
    setTestProbability (probability) {
      this.draft.config.testResult = {
        ...(this.draft.config.testResult || {}),
        available: true,
        status: 'OK',
        probability
      }
      this.changed()
    },
    catalogOptions (key) {
      const name = ({
        serviceId: 'services',
        typeId: 'taskTypes',
        lineId: 'supportLines',
        priorityId: 'priorities',
        ownerId: 'users',
        userId: 'users',
        assigneeId: 'users',
        status: 'statuses'
      })[key] || key
      return (this.entityCatalogs[name] || []).filter(item => item.active !== false && item.enabled !== false).map(item => ({
        label: item.name || item.type || item.username,
        value: ['statuses', 'tags'].includes(name) ? item.name : item.id
      }))
    },
    changed () {
      this.$emit('update:config', JSON.parse(JSON.stringify(this.draft.config)))
      this.$emit('change')
    },
    setArgument (key, value) {
      this.draft.config.arguments ||= {}
      const field = this.operation?.fields.find(field => field.key === key)
      this.draft.config.arguments[key] = field?.legacyItemPath && typeof value === 'string' && value.trim()
        ? '=' + value.replace(/^=/, '') : value
    },
    filterOperations (value, update) {
      update(() => {
        const term = value.toLowerCase()
        const pool = this.catalog.filter(o => o.group === this.selectedGroup)
        this.filteredOperations = term ? pool.filter(o => o.label.toLowerCase().includes(term)) : pool
      })
    },
    selectGroup (group) {
      this.selectedGroup = group
      this.filteredOperations = this.catalog.filter(o => o.group === group)
    },
    selectOperation (id) {
      const spec = this.catalog.find(o => o.id === id)
      if (!spec) return
      const previous = this.draft.config.operation
      if (previous === id) {
        this.choosingOperation = false
        return
      }
      const previousLabel = this.catalog.find(o => o.id === previous)?.label
      if (['Операция', 'Выберите шаг', previousLabel].includes(this.node.label)) this.$emit('update:label', spec.label)
      this.draft.config = {...this.draft.config, ...operationConfig(spec)}
      if (previous !== id) delete this.draft.config.testResult
      this.choosingOperation = false
      this.changed()
    },
    addParameter () {
      this.draft.config.parameters ||= []
      this.draft.config.parameters.push({
        name: 'parameter' + (this.draft.config.parameters.length + 1),
        label: 'Новая настройка',
        value: 1,
        type: 'number',
        help: ''
      })
      this.changed()
    }
  }
}
</script>

<style scoped>
:deep(.automation-field-header) {
  padding-left: 0;
  min-height: 32px;
}

:deep(.automation-field-header .q-item__label) {
  font-weight: 700;
  font-size: 13px;
  color: #37404d;
  text-transform: uppercase;
  letter-spacing: .03em;
}
</style>
