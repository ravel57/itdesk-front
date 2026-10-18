<template>
  <q-page class="q-pa-md incident-templates-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Шаблоны обновлений инцидентов</div>
        <div class="settings-content-description">
          Готовые тексты для записей в таймлайне инцидента. Порядок в списке совпадает с порядком
          в диалоге «Новая запись».
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить шаблон"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <q-list
      bordered
      separator
      class="rounded-borders settings-row-list"
    >
      <q-item header class="text-bold">
        Шаблон
      </q-item>

      <q-item v-if="loading && !templates.length">
        <q-item-section class="text-grey-7">
          Загрузка...
        </q-item-section>
      </q-item>

      <q-item v-else-if="!templates.length">
        <q-item-section class="text-grey-7">
          Шаблоны не добавлены
        </q-item-section>
      </q-item>

      <draggable
        v-else
        :list="templates"
        item-key="id"
        class="list-group"
        ghost-class="ghost"
        handle=".settings-drag-handle"
        @end="resortTemplates"
      >
        <template #item="{ element }">
          <q-item class="list-group-item">
            <q-item-section side class="settings-drag-handle cursor-grab">
              <q-icon name="drag_indicator" color="grey-6"/>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ element.title }}</q-item-label>
              <q-item-label caption class="template-row-text">{{ element.text }}</q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row no-wrap">
                <q-btn flat dense color="primary" icon="edit" @click.stop="openEditDialog(element)">
                  <q-tooltip>Редактировать шаблон</q-tooltip>
                </q-btn>
                <q-btn flat dense color="negative" icon="delete" @click.stop="removeTemplate(element)">
                  <q-tooltip>Удалить шаблон</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </template>
      </draggable>
    </q-list>

    <q-dialog v-model="templateDialog">
      <q-card class="incident-template-dialog">
        <q-toolbar>
          <q-toolbar-title>
            {{ form.id ? 'Редактирование шаблона' : 'Новый шаблон' }}
          </q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>

        <q-separator/>

        <q-card-section class="q-gutter-y-md">
          <q-input
            v-model="form.title"
            outlined
            autofocus
            maxlength="255"
            label="Название *"
          />
          <q-input
            v-model="form.text"
            outlined
            type="textarea"
            autogrow
            label="Текст *"
            hint="Подставляется в поле «Текст» записи таймлайна"
          />
        </q-card-section>

        <q-separator/>

        <q-card-actions align="right">
          <q-btn flat no-caps color="primary" label="Отмена" v-close-popup/>
          <q-btn unelevated no-caps color="primary" label="Сохранить" :loading="saving" @click="saveTemplate"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'

const emptyTemplate = () => ({id: null, title: '', text: ''})

export default {
  name: 'IncidentUpdateTemplatesPage',

  components: {draggable},

  data: () => ({
    loading: false,
    saving: false,
    templates: [],
    templateDialog: false,
    form: emptyTemplate()
  }),

  mounted() {
    this.loadTemplates()
  },

  methods: {
    async loadTemplates() {
      this.loading = true
      try {
        const {data} = await axios.get('/api/v1/incident-update-templates')
        this.templates = Array.isArray(data) ? data : []
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.loading = false
      }
    },

    openCreateDialog() {
      this.form = emptyTemplate()
      this.templateDialog = true
    },

    openEditDialog(template) {
      this.form = {id: template.id, title: template.title, text: template.text}
      this.templateDialog = true
    },

    async saveTemplate() {
      if (!this.form.title?.trim() || !this.form.text?.trim()) {
        this.notifyError(new Error('Название и текст шаблона обязательны'))
        return
      }
      this.saving = true
      try {
        const payload = {title: this.form.title.trim(), text: this.form.text.trim()}
        if (this.form.id) {
          await axios.patch(`/api/v1/incident-update-template/${this.form.id}`, payload)
        } else {
          await axios.post('/api/v1/incident-update-template', payload)
        }
        this.templateDialog = false
        this.notifyOk('Шаблон сохранён')
        await this.loadTemplates()
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.saving = false
      }
    },

    removeTemplate(template) {
      this.$q.dialog({
        title: 'Удалить шаблон?',
        message: `Шаблон «${template.title}» будет удалён. Уже опубликованные записи таймлайна не изменятся.`,
        cancel: {flat: true, noCaps: true, label: 'Отмена'},
        ok: {unelevated: true, noCaps: true, color: 'negative', label: 'Удалить'}
      }).onOk(async () => {
        try {
          await axios.delete(`/api/v1/incident-update-template/${template.id}`)
          this.notifyOk('Шаблон удалён')
          await this.loadTemplates()
        } catch (error) {
          this.notifyError(error)
        }
      })
    },

    async resortTemplates() {
      try {
        const {data} = await axios.patch('/api/v1/incident-update-templates/resort', this.templates.map(item => item.id))
        if (Array.isArray(data)) this.templates = data
      } catch (error) {
        this.notifyError(error)
        await this.loadTemplates()
      }
    },

    notifyOk(message) {
      this.$q.notify({type: 'positive', message})
    },

    notifyError(error) {
      this.$q.notify({
        type: 'negative',
        message: error?.response?.data?.message || error?.message || 'Операция не выполнена'
      })
    }
  }
}
</script>

<style scoped>
.incident-templates-page {
  width: 100%;
}

.incident-template-dialog {
  width: 640px;
  max-width: calc(100vw - 32px);
}

.template-row-text {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: pre-line;
}
</style>
