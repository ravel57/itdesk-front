<template>
  <q-page class="q-pa-md task-type-settings-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Типы заявок и чек-листы</div>
        <div class="settings-content-description">
          Управляйте типами заявок, чек-листами и типом, который выбирается по умолчанию.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить тип заявки"
          class="settings-add-btn"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <div class="table-container">
      <q-list
        bordered
        class="rounded-borders settings-list settings-row-list"
        separator
      >
        <q-item header class="text-bold">
          Тип заявки
        </q-item>

        <q-item v-if="loading">
          <q-item-section class="text-grey-7">
            Загрузка...
          </q-item-section>
        </q-item>

        <q-item v-else-if="taskTypes.length === 0">
          <q-item-section class="text-grey-7">
            Типы заявок не добавлены
          </q-item-section>
        </q-item>

        <draggable
          v-else
          :list="taskTypes"
          item-key="id"
          class="list-group"
          ghost-class="ghost"
          handle=".settings-drag-handle"
          @start="dragging = true"
          @end="resortTaskTypes"
        >
          <template #item="{ element }">
            <q-item
              class="list-group-item"
              :class="{ 'not-draggable': true }"
            >
              <q-item-section side class="settings-drag-handle cursor-grab">
                <q-icon name="drag_indicator" color="grey-6"/>
              </q-item-section>
              <q-item-section
                top
                style="justify-content: center"
              >
                <div>
                  {{ element.type }}
                </div>

                <div class="task-type-row-caption">
                  {{ getChecklistItemsLabel(element.checklistTemplate) }} ·
                  {{ element.autoApplyChecklist !== false ? 'автоматически' : 'вручную' }}
                </div>
              </q-item-section>

              <q-item-section
                top
                side
              >
                <q-btn
                  color="primary"
                  dense
                  flat
                  icon="edit"
                  @click.stop="openEditDialog(element)"
                >
                  <q-tooltip>Редактировать тип заявки</q-tooltip>
                </q-btn>
              </q-item-section>

              <q-item-section
                top
                side
              >
                <q-btn
                  :text-color="element.defaultSelection ? 'primary' : 'grey'"
                  dense
                  flat
                  icon="beenhere"
                  @click.stop="setDefaultSelected(element)"
                >
                  <q-tooltip>
                    {{ element.defaultSelection ? 'Используется по умолчанию' : 'Использовать по умолчанию' }}
                  </q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </q-list>
    </div>

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

        <q-separator/>

        <q-card-section>
          <q-input
            v-model="editingTaskType.type"
            label="Название типа *"
            :rules="[val => !!val || 'Обязательное поле']"
          />

          <q-toggle
            v-model="editingTaskType.defaultSelection"
            label="Использовать тип заявки по умолчанию"
            class="q-mt-md"
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
            <draggable
              :list="editingTaskType.checklistTemplate"
              item-key="id"
              handle=".checklist-drag-handle"
              ghost-class="ghost"
              class="checklist-draggable-list"
            >
              <template #item="{ element: item }">
                <q-item class="checklist-item">
                  <q-item-section
                    side
                    class="checklist-drag-handle"
                  >
                    <q-icon
                      name="drag_indicator"
                      color="grey-6"
                    />
                  </q-item-section>
                  <q-item-section side>
                    <q-icon
                      name="check_box_outline_blank"
                      color="grey-6"
                    />
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
                      @click.stop="removeChecklistItem(item.id)"
                    />
                  </q-item-section>
                </q-item>
              </template>
            </draggable>
          </q-list>
        </q-card-section>

        <q-separator/>

        <q-card-actions align="right">
          <q-btn
            v-if="editingTaskType.id"
            unelevated
            no-caps
            color="negative"
            icon="delete"
            label="Удалить"
            @click="openDeleteTaskTypeDialog"
          />

          <q-space/>

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
            icon="delete"
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
import draggable from 'vuedraggable'

export default {
  components: {draggable},

  data: () => ({
    loading: false,
    dragging: false,
    taskTypes: [],
    taskTypeDialog: false,
    deleteTaskTypeDialog: false,
    editingTaskType: {
      id: null,
      type: '',
      defaultSelection: false,
      checklistTemplate: [],
      autoApplyChecklist: true
    },
    newChecklistItemText: '',
  }),

  mounted() {
    this.loadTaskTypes()
  },

  methods: {
    loadTaskTypes() {
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

    resortTaskTypes() {
      this.dragging = false
      axios.patch('/api/v1/task-types/resort', this.taskTypes)
        .then(response => {
          this.taskTypes = response.data || this.taskTypes
        })
        .catch(e => {
          this.notifyError(e.message)
          this.loadTaskTypes()
        })
    },

    openCreateDialog() {
      this.editingTaskType = {
        id: null,
        type: '',
        defaultSelection: false,
        checklistTemplate: [],
        autoApplyChecklist: true
      }
      this.newChecklistItemText = ''
      this.taskTypeDialog = true
    },

    openEditDialog(taskType) {
      this.editingTaskType = JSON.parse(JSON.stringify({
        ...taskType,
        defaultSelection: taskType.defaultSelection === true,
        checklistTemplate: this.normalizeChecklist(taskType.checklistTemplate),
        autoApplyChecklist: taskType.autoApplyChecklist !== false
      }))
      this.newChecklistItemText = ''
      this.taskTypeDialog = true
    },

    saveTaskType() {
      if (!this.editingTaskType.type?.trim()) {
        this.notifyError('Название типа заявки обязательно')
        return
      }
      const payload = {
        ...this.editingTaskType,
        type: this.editingTaskType.type.trim(),
        defaultSelection: this.editingTaskType.defaultSelection === true,
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
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          this.taskTypeDialog = false
          this.loadTaskTypes()
        })
        .catch(e => this.notifyError(e.message))
    },

    deleteTaskType() {
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
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          this.deleteTaskTypeDialog = false
          this.taskTypeDialog = false
          this.loadTaskTypes()
        })
        .catch(e => this.notifyError(e.message))
    },

    addChecklistItem() {
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

    removeChecklistItem(id) {
      this.editingTaskType.checklistTemplate = this.editingTaskType.checklistTemplate
        .filter(item => item.id !== id)
    },

    normalizeChecklist(checklist) {
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

    notifyError(message) {
      this.$q.notify({
        type: 'negative',
        message,
        position: 'top-right',
        actions: [{
          icon: 'close',
          color: 'white',
          dense: true,
          handler: () => undefined
        }]
      })
    },

    openDeleteTaskTypeDialog() {
      if (!this.editingTaskType.id) {
        this.taskTypeDialog = false
        return
      }
      this.deleteTaskTypeDialog = true
    },

    setDefaultSelected(taskType) {
      if (!taskType?.id || taskType.defaultSelection) {
        return
      }
      const previousTaskTypes = JSON.parse(JSON.stringify(this.taskTypes))
      this.taskTypes.forEach(item => {
        item.defaultSelection = item.id === taskType.id
      })
      axios.patch('/api/v1/task-types/set-default', {
        ...taskType,
        defaultSelection: true
      })
        .then(() => {
          this.loadTaskTypes()
        })
        .catch(e => {
          this.taskTypes = previousTaskTypes
          this.notifyError(e.message)
        })
    },

    getChecklistItemsLabel(checklist) {
      const count = this.normalizeChecklist(checklist).length
      return `${count} ${this.declineRuNumber(count, 'пункт', 'пункта', 'пунктов')}`
    },

    declineRuNumber(value, one, few, many) {
      const number = Math.abs(Number(value)) % 100
      const lastDigit = number % 10
      if (number >= 11 && number <= 19) {
        return many
      }
      if (lastDigit === 1) {
        return one
      }
      if (lastDigit >= 2 && lastDigit <= 4) {
        return few
      }
      return many
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

.table-container {
  width: 100%;
}

.settings-list {
  width: 100%;
  margin-top: 8px;
  background: white;
}

.task-type-list-header {
  display: grid;
  grid-template-columns: 1fr 160px 1fr 1fr auto;
  align-items: center;
}

.list-group-item:hover {
  background-color: #e3e3e3;
}

.list-group-item {
  min-height: 48px;
}

.task-type-row-caption {
  margin-top: 2px;
  color: #777;
  font-size: 12px;
  line-height: 16px;
}

.not-draggable {
  user-select: none;
}

.checklist-draggable-list {
  width: 100%;
}

.checklist-drag-handle {
  cursor: grab;
  user-select: none;
}

.checklist-drag-handle:active {
  cursor: grabbing;
}
</style>
