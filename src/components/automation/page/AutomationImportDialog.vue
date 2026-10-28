<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" @hide="this.resetImport">
    <q-card class="automation-import-dialog">
      <q-toolbar>
        <q-toolbar-title class="text-h6">Импорт автоматизаций из JSON</q-toolbar-title>
        <q-btn flat round dense icon="close" :disable="this.importing" v-close-popup/>
      </q-toolbar>
      <q-card-section class="q-pt-none q-gutter-y-sm">
        <q-banner dense rounded class="bg-blue-1 text-blue-10 automation-import-ai">
          <template #avatar><q-icon name="smart_toy" color="primary"/></template>
          Нет готового файла? Скачайте инструкцию, отдайте её любой нейросети и опишите, что должна делать
          автоматизация — нейросеть соберёт граф в формате JSON, который можно импортировать здесь.
          <template #action>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              icon="download"
              label="Скачать инструкцию (.md)"
              href="/automation-ai-instructions.md"
              download="uldesk-automation-ai-instructions.md"
            />
          </template>
        </q-banner>
        <q-file
          v-model="this.importFile"
          dense
          outlined
          accept=".json,application/json"
          label="Выберите файл .json"
          clearable
          @update:model-value="this.onImportFileChosen"
        >
          <template #prepend><q-icon name="upload_file"/></template>
        </q-file>
        <q-input
          v-model="this.importText"
          type="textarea"
          outlined
          dense
          rows="8"
          label="…или вставьте JSON сюда"
          input-class="automation-import-text"
          @update:model-value="this.parseImportText"
        />
        <q-banner v-if="this.importErrors.length" dense rounded class="automation-workflow-validation automation-workflow-validation-error">
          <div v-for="error in this.importErrors" :key="error">
            <q-icon name="error" class="q-mr-xs"/>{{ error }}
          </div>
        </q-banner>
        <div v-if="this.importItems.length">
          <div class="text-caption text-grey-7">Будет создано (все копии — выключенными, проверьте и включите вручную):</div>
          <q-list dense bordered separator class="rounded-borders q-mt-xs">
            <q-item v-for="(item, index) in this.importItems" :key="index">
              <q-item-section>
                <q-item-label>{{ item.name }}</q-item-label>
                <q-item-label caption>{{ this.store.triggerTypeLabels[item.triggerType] || item.triggerType }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div class="text-caption text-grey-7">
          Ссылки на сервисы, линии, теги и пользователей в графе не переносятся автоматически: они остаются
          такими, как в исходной системе, поэтому после импорта откройте автоматизацию и проверьте выбранные значения.
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat color="primary" label="Отмена" :disable="this.importing" v-close-popup/>
        <q-btn
          unelevated
          color="primary"
          :label="this.importItems.length ? `Импортировать (${this.importItems.length})` : 'Импортировать'"
          :disable="!this.importItems.length"
          :loading="this.importing"
          @click="this.runImport"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'
import {parseImport, uniqueName} from 'src/util/automationTransfer'

// Диалог импорта автоматизаций из JSON. Видимостью управляет родитель через v-model;
// после создания правил сообщает родителю событием `imported` (перестроить дерево).
export default {
  name: 'AutomationImportDialog',

  props: {
    modelValue: {type: Boolean, default: false}
  },

  emits: ['update:modelValue', 'imported'],

  data: () => ({
    importFile: null,
    importText: '',
    importItems: [],
    importErrors: [],
    importing: false
  }),

  methods: {
    onImportFileChosen(file) {
      if (!file) {
        this.importText = ''
        this.parseImportText('')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        this.importText = String(reader.result || '')
        this.parseImportText(this.importText)
      }
      reader.onerror = () => { this.importErrors = ['Не удалось прочитать файл'] }
      reader.readAsText(file)
    },

    parseImportText(text) {
      if (!String(text || '').trim()) {
        this.importItems = []
        this.importErrors = []
        return
      }
      const result = parseImport(text, this.store.triggerTypes)
      this.importItems = result.items
      this.importErrors = result.errors
    },

    resetImport() {
      this.importFile = null
      this.importText = ''
      this.importItems = []
      this.importErrors = []
    },

    async runImport() {
      if (!this.importItems.length || this.importing) return
      this.importing = true
      const failures = []
      let created = 0
      try {
        const names = this.store.triggers.map(item => item.name)
        for (const item of this.importItems) {
          const taken = names.some(name => String(name || '').trim().toLowerCase() === item.name.trim().toLowerCase())
          const name = taken ? uniqueName(item.name, names, 'импорт') : item.name.trim()
          try {
            if (item.workflowDefinition) {
              const validation = await axios.post('/api/v1/automation/validate', {workflowDefinition: item.workflowDefinition})
              if (validation.data?.valid === false) throw new Error(validation.data.errors?.[0] || 'Граф содержит ошибки')
            }
            const response = await axios.post('/api/v1/trigger', {...item, name, automationRuleStatus: 'DISABLED'})
            this.store.triggers.push(response.data)
            names.push(name)
            created += 1
          } catch (e) {
            failures.push(`«${item.name}»: ${e.response?.data?.message || e.message}`)
          }
        }
        this.$emit('imported')
      } finally {
        this.importing = false
      }
      if (created) {
        this.$q.notify({type: 'positive', message: `Импортировано автоматизаций: ${created}. Они выключены — проверьте и включите.`})
      }
      if (failures.length) {
        this.importErrors = failures
        this.importItems = this.importItems.filter(item => failures.some(line => line.startsWith(`«${item.name}»`)))
      } else {
        this.$emit('update:modelValue', false)
      }
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.automation-import-dialog {
  width: 620px;
  max-width: 94vw;
}

.automation-import-dialog :deep(.automation-import-text) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

/* Баннер ошибок — те же правила, что и у баннера проверки графа в редакторе (AutomatizationPage) */
.automation-workflow-validation {
  margin-top: 16px;
  white-space: pre-wrap;
}

.automation-workflow-validation > div + div {
  margin-top: 6px;
}

.automation-workflow-validation-error {
  border: 1px solid #ef9a9a;
  background: #ffebee;
  color: #c62828;
}
</style>
