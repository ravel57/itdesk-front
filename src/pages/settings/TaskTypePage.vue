<template>
  <q-page class="q-pa-md task-type-settings-page">
    <div class="settings-toolbar">
      <q-btn
        unelevated
        color="white"
        text-color="black"
        icon="add"
        label="Добавить тип заявки"
        class="settings-add-btn"
        @click="openCreateDialog"
      />
    </div>

    <q-table
      flat
      bordered
      :rows="taskTypes"
      :columns="columns"
      row-key="id"
      :loading="loading"
      hide-pagination
      :pagination="{ rowsPerPage: 0 }"
      class="settings-table"
      no-data-label="Типы заявок не добавлены"
    >
      <template #body-cell-type="props">
        <q-td :props="props">
          <div class="text-weight-medium">
            {{ props.row.type }}
          </div>
        </q-td>
      </template>

      <template #body-cell-autoApplyChecklist="props">
        <q-td :props="props">
          <q-chip
            dense
            square
            :color="props.row.autoApplyChecklist !== false ? 'positive' : 'grey-5'"
            text-color="white"
          >
            {{ props.row.autoApplyChecklist !== false ? 'Автоматически' : 'Вручную' }}
          </q-chip>
        </q-td>
      </template>

      <template #body-cell-checklistTemplate="props">
        <q-td :props="props">
          {{ normalizeChecklist(props.row.checklistTemplate).length }} пунктов
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="edit"
            @click="openEditDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="taskTypeDialog">
      <q-card class="task-type-dialog">
        <q-toolbar>
          <q-toolbar-title>
            {{ editingTaskType.id ? 'Редактирование типа заявки' : 'Новый тип заявки' }}
          </q-toolbar-title>

          <q-btn
            flat
            round
            dense
            icon="close"
            v-close-popup
          />
        </q-toolbar>

        <q-separator />

        <q-card-section>
          <q-input
            v-model="editingTaskType.type"
            label="Название типа *"
            :rules="[val => !!val || 'Обязательное поле']"
          />

          <q-toggle
            v-model="editingTaskType.autoApplyChecklist"
            label="Автоматически применять чек-лист при выборе типа"
            class="q-mt-md"
          />

          <div class="checklist-header">
            <div>
              <div class="text-subtitle1">
                Стандартный чек-лист
              </div>

              <div class="text-caption text-grey-7">
                Эти пункты будут подставляться в заявку при выборе типа
              </div>
            </div>
          </div>

          <div class="row q-col-gutter-sm items-center q-mb-md">
            <div class="col">
              <q-input
                v-model="newChecklistItemText"
                dense
                outlined
                label="Новый пункт чек-листа"
                @keyup.enter="addChecklistItem"
              />
            </div>

            <div class="col-auto">
              <q-btn
                dense
                round
                color="primary"
                icon="add"
                @click="addChecklistItem"
              />
            </div>
          </div>

          <div
            v-if="normalizeChecklist(editingTaskType.checklistTemplate).length === 0"
            class="empty-checklist"
          >
            Чек-лист пока пустой
          </div>

          <q-list
            v-else
            bordered
            separator
            class="rounded-borders checklist-list"
          >
            <q-item
              v-for="item in editingTaskType.checklistTemplate"
              :key="item.id"
              class="checklist-item"
            >
              <q-item-section side>
                <q-icon name="check_box_outline_blank" color="grey-6" />
              </q-item-section>

              <q-item-section>
                <q-input
                  v-model="item.text"
                  dense
                  borderless
                  placeholder="Пункт чек-листа"
                />
              </q-item-section>

              <q-item-section side>
                <q-btn
                  flat
                  dense
                  round
                  icon="delete"
                  color="negative"
                  @click="removeChecklistItem(item.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            v-if="editingTaskType.id"
            flat
            no-caps
            color="negative"
            label="Удалить"
            @click="openDeleteTaskTypeDialog"
          />

          <q-space />

          <q-btn
            flat
            no-caps
            color="primary"
            label="Закрыть"
            v-close-popup
          />

          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Сохранить"
            @click="saveTaskType"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="deleteTaskTypeDialog"
      persistent
    >
      <q-card class="delete-task-type-dialog">
        <q-card-section>
          <div class="text-h6">
            Удалить тип заявки?
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Тип «{{ editingTaskType.type }}» будет удалён.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            no-caps
            color="primary"
            label="Отмена"
            v-close-popup
          />

          <q-btn
            unelevated
            no-caps
            color="negative"
            label="Удалить"
            @click="deleteTaskType"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import axios from 'axios'

export default {
  data: () => ({
    loading: false,
    taskTypes: [],
    taskTypeDialog: false,
    deleteTaskTypeDialog: false,
    editingTaskType: {
      id: null,
      type: '',
      checklistTemplate: [],
      autoApplyChecklist: true
    },
    newChecklistItemText: '',

    columns: [
      {
        name: 'type',
        label: 'Тип заявки',
        field: 'type',
        align: 'left',
        sortable: true
      },
      {
        name: 'checklistTemplate',
        label: 'Чек-лист',
        field: 'checklistTemplate',
        align: 'left'
      },
      {
        name: 'autoApplyChecklist',
        label: 'Применение',
        field: 'autoApplyChecklist',
        align: 'left'
      },
      {
        name: 'actions',
        label: '',
        field: 'actions',
        align: 'right'
      }
    ]
  }),

  mounted () {
    this.loadTaskTypes()
  },

  methods: {
    loadTaskTypes () {
      this.loading = true

      return axios.get('/api/v1/task-types')
        .then(response => {
          this.taskTypes = response.data || []
        })
        .catch(e => this.notifyError(e.message))
        .finally(() => {
          this.loading = false
        })
    },

    openCreateDialog () {
      this.editingTaskType = {
        id: null,
        type: '',
        checklistTemplate: [],
        autoApplyChecklist: true
      }

      this.newChecklistItemText = ''
      this.taskTypeDialog = true
    },

    openEditDialog (taskType) {
      this.editingTaskType = JSON.parse(JSON.stringify({
        ...taskType,
        checklistTemplate: this.normalizeChecklist(taskType.checklistTemplate),
        autoApplyChecklist: taskType.autoApplyChecklist !== false
      }))

      this.newChecklistItemText = ''
      this.taskTypeDialog = true
    },

    saveTaskType () {
      if (!this.editingTaskType.type?.trim()) {
        this.notifyError('Название типа заявки обязательно')
        return
      }

      const payload = {
        ...this.editingTaskType,
        type: this.editingTaskType.type.trim(),
        checklistTemplate: this.normalizeChecklist(this.editingTaskType.checklistTemplate),
        autoApplyChecklist: this.editingTaskType.autoApplyChecklist !== false
      }

      const request = payload.id
        ? axios.patch(`/api/v1/task-types/${payload.id}`, payload)
        : axios.post('/api/v1/task-types', payload)

      request
        .then(() => {
          this.$q.notify({
            type: 'positive',
            message: 'Тип заявки сохранён',
            position: 'top-right'
          })

          this.taskTypeDialog = false
          this.loadTaskTypes()
        })
        .catch(e => this.notifyError(e.message))
    },

    deleteTaskType () {
      if (!this.editingTaskType.id) {
        this.deleteTaskTypeDialog = false
        this.taskTypeDialog = false
        return
      }

      axios.delete(`/api/v1/task-types/${this.editingTaskType.id}`)
        .then(() => {
          this.$q.notify({
            type: 'positive',
            message: 'Тип заявки удалён',
            position: 'top-right'
          })

          this.deleteTaskTypeDialog = false
          this.taskTypeDialog = false
          this.loadTaskTypes()
        })
        .catch(e => this.notifyError(e.message))
    },

    addChecklistItem () {
      const text = this.newChecklistItemText.trim()

      if (!text) {
        return
      }

      if (!Array.isArray(this.editingTaskType.checklistTemplate)) {
        this.editingTaskType.checklistTemplate = []
      }

      this.editingTaskType.checklistTemplate.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text,
        completed: false
      })

      this.newChecklistItemText = ''
    },

    removeChecklistItem (id) {
      this.editingTaskType.checklistTemplate = this.editingTaskType.checklistTemplate
        .filter(item => item.id !== id)
    },

    normalizeChecklist (checklist) {
      if (!Array.isArray(checklist)) {
        return []
      }

      return checklist
        .filter(item => item && item.text !== undefined && item.text !== null)
        .map(item => ({
          id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          text: String(item.text).trim(),
          completed: Boolean(item.completed)
        }))
        .filter(item => item.text.length > 0)
    },

    notifyError (message) {
      this.$q.notify({
        type: 'negative',
        message,
        position: 'top-right'
      })
    },

    openDeleteTaskTypeDialog () {
      if (!this.editingTaskType.id) {
        this.taskTypeDialog = false
        return
      }

      this.deleteTaskTypeDialog = true
    },
  }
}
</script>

<style scoped>
.task-type-settings-page {
  width: 100%;
}

.settings-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.settings-add-btn {
  min-width: 190px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}

.settings-table {
  width: 100%;
  background: white;
}

.task-type-dialog {
  width: 720px;
  max-width: calc(100vw - 32px);
}

.checklist-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-top: 22px;
  margin-bottom: 12px;
}

.empty-checklist {
  padding: 14px;
  border: 1px dashed #c9c9c9;
  border-radius: 8px;
  color: #777;
  background: #fafafa;
}

.checklist-list {
  max-height: 360px;
  overflow-y: auto;
}

.checklist-item {
  min-height: 44px;
}

.delete-task-type-dialog {
  width: 420px;
  max-width: calc(100vw - 32px);
}
</style>
