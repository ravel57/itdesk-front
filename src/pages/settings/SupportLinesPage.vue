<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-sm">
      <div>
        <div class="text-h6">Линии технической поддержки</div>
        <div class="text-caption text-grey-7">
          Заявка принадлежит линии, а исполнитель выбирается из участников этой линии.
        </div>
      </div>
      <q-btn icon="add" label="Добавить линию" @click="openCreate"/>
    </div>

    <q-list bordered separator class="rounded-borders support-lines-list">
      <draggable
        :list="store.supportLines"
        item-key="id"
        handle=".drag-handle"
        @end="saveOrder"
      >
        <template #item="{ element }">
          <q-item>
            <q-item-section avatar class="drag-handle cursor-grab">
              <q-icon name="drag_indicator" color="grey-6"/>
            </q-item-section>
            <q-item-section>
              <q-item-label>
                {{ element.name }}
                <q-badge v-if="element.active === false" color="grey" class="q-ml-sm">Отключена</q-badge>
              </q-item-label>
              <q-item-label caption>
                Уровень L{{ element.level || 1 }} · Участников: {{ (element.members || []).length }}
              </q-item-label>
              <q-item-label v-if="element.description" caption>{{ element.description }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row no-wrap">
                <q-btn
                  :text-color="element.defaultSelection ? 'primary' : 'grey'"
                  flat
                  dense
                  icon="beenhere"
                  @click.stop="setDefault(element)"
                >
                  <q-tooltip>
                    {{ element.defaultSelection ? 'Используется по умолчанию' : 'Использовать по умолчанию' }}
                  </q-tooltip>
                </q-btn>
                <q-btn flat dense icon="edit" color="primary" @click.stop="openEdit(element)"/>
              </div>
            </q-item-section>
          </q-item>
        </template>
      </draggable>
    </q-list>
  </div>

  <q-dialog v-model="dialogVisible" persistent>
    <q-card style="width: 680px; max-width: 95vw;">
      <q-toolbar>
        <q-toolbar-title>{{ isNew ? 'Новая линия' : 'Изменить линию' }}</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="dialogVisible = false"/>
      </q-toolbar>
      <q-card-section class="q-gutter-md">
        <q-input v-model="form.name" label="Название *" autofocus/>
        <q-input v-model="form.description" label="Описание" type="textarea" autogrow/>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-4">
            <q-input v-model.number="form.level" label="Уровень" type="number" min="1"/>
          </div>
          <div class="col-12 col-sm-4 flex items-center">
            <q-toggle v-model="form.active" label="Активна"/>
          </div>
          <div class="col-12 col-sm-4 flex items-center">
            <q-toggle v-model="form.defaultSelection" label="По умолчанию"/>
          </div>
        </div>
        <q-select
          v-model="form.memberIds"
          :options="userOptions"
          label="Участники линии"
          multiple
          use-chips
          emit-value
          map-options
          use-input
          input-debounce="0"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-if="!isNew" flat color="negative" label="Удалить" @click="removeLine"/>
        <q-space/>
        <q-btn flat label="Отмена" @click="dialogVisible = false"/>
        <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveLine"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'
import { useStore } from 'stores/store'

export default {
  name: 'SupportLinesPage',
  components: { draggable },

  data: () => ({
    dialogVisible: false,
    isNew: true,
    saving: false,
    form: {
      id: null,
      name: '',
      description: '',
      level: 1,
      active: true,
      defaultSelection: false,
      memberIds: [],
      orderNumber: 0
    }
  }),

  computed: {
    userOptions () {
      return (this.store.users || [])
        .filter(user => user?.id && ['ADMIN', 'OPERATOR'].some(role => (user.authorities || []).includes(role)))
        .map(user => ({
          value: user.id,
          label: this.userName(user)
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    }
  },

  methods: {
    userName (user) {
      const fullName = `${user?.lastname || ''} ${user?.firstname || ''}`.trim()
      return fullName || user?.username || `Пользователь ${user?.id}`
    },

    openCreate () {
      this.isNew = true
      this.form = {
        id: null,
        name: '',
        description: '',
        level: 1,
        active: true,
        defaultSelection: this.store.supportLines.length === 0,
        memberIds: [],
        orderNumber: this.store.supportLines.length
      }
      this.dialogVisible = true
    },

    openEdit (line) {
      this.isNew = false
      this.form = {
        id: line.id,
        name: line.name || '',
        description: line.description || '',
        level: Number(line.level || 1),
        active: line.active !== false,
        defaultSelection: line.defaultSelection === true,
        memberIds: (line.members || []).map(member => member.id),
        orderNumber: line.orderNumber || 0
      }
      this.dialogVisible = true
    },

    buildPayload () {
      return {
        id: this.form.id,
        name: this.form.name.trim(),
        description: this.form.description,
        level: Number(this.form.level || 1),
        active: this.form.active,
        defaultSelection: this.form.defaultSelection,
        orderNumber: this.form.orderNumber,
        members: this.form.memberIds.map(id => ({ id }))
      }
    },

    saveLine () {
      if (!this.form.name.trim()) {
        this.$q.notify({ type: 'negative', message: 'Укажите название линии', position: 'top-right' })
        return
      }
      this.saving = true
      const request = this.isNew
        ? axios.post('/api/v1/support-line', this.buildPayload())
        : axios.patch('/api/v1/support-line', this.buildPayload())
      request
        .then(({ data }) => {
          const index = this.store.supportLines.findIndex(line => line.id === data.id)
          if (index === -1) this.store.supportLines.push(data)
          else this.store.supportLines.splice(index, 1, data)
          if (data.defaultSelection) {
            this.store.supportLines = this.store.supportLines.map(line => ({
              ...line,
              defaultSelection: line.id === data.id
            }))
          }
          this.dialogVisible = false
        })
        .catch(error => this.showError(error))
        .finally(() => { this.saving = false })
    },

    removeLine () {
      axios.delete(`/api/v1/support-line/${this.form.id}`)
        .then(() => {
          this.store.supportLines = this.store.supportLines.filter(line => line.id !== this.form.id)
          this.dialogVisible = false
        })
        .catch(error => this.showError(error))
    },

    setDefault (line) {
      axios.patch('/api/v1/support-line/set-default', line)
        .then(({ data }) => {
          this.store.supportLines = this.store.supportLines.map(item => ({
            ...item,
            defaultSelection: item.id === data.id
          }))
        })
        .catch(error => this.showError(error))
    },

    saveOrder () {
      this.store.supportLines = this.store.supportLines.map((line, index) => ({ ...line, orderNumber: index }))
      axios.patch('/api/v1/support-lines/resort', this.store.supportLines)
        .then(({ data }) => { this.store.supportLines = data })
        .catch(error => this.showError(error))
    },

    showError (error) {
      this.$q.notify({
        type: 'negative',
        position: 'top-right',
        message: error?.response?.data?.message || error?.message || 'Ошибка сохранения'
      })
    }
  },

  mounted () {
    if (!this.store.supportLines.length) {
      axios.get('/api/v1/support-lines').then(({ data }) => { this.store.supportLines = data || [] })
    }
  },

  setup () {
    return { store: useStore() }
  }
}
</script>

<style scoped>
.cursor-grab {
  cursor: grab;
}

.support-lines-list {
  margin-top: 8px;
}
</style>
