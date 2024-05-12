<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить тег"
      @click="this.dialogNewTag"
    />
    <div class="table-container">
      <q-table
        :rows="this.store.tags"
        :columns="columns"
        row-key="id"
        full-width
        :rows-per-page-options="[10, 20, 50]"
        rows-per-page-label="Строк на странице"
      >
        <template v-slot:body-cell-edit="props">
          <q-td :props="props">
            <q-btn
            color="primary"
            dense
            flat
            icon="edit"
            @click="editRow(props.row)"
           />
          </q-td>
        </template>
      </q-table>
    </div>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card>
      <q-card-section>
        <q-input
          v-model="this.dialogName"
          label="Название"
        />
        <q-input
          v-model="this.dialogDescription"
          label="Описание"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewTag"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeleteTag"
        />
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewOrUpdateTag"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'

export default {
  name: 'TagsComponent',

  data: () => ({
    columns: [
      { name: 'name', label: 'Название', align: 'left', field: 'name' },
      { name: 'description', label: 'Описание', align: 'left', field: 'description' },
      { name: 'edit', label: '', align: 'center', field: 'edit' }
    ],

    dialogVisible: false,
    dialogName: '',
    dialogDescription: '',

    isNewTag: true,
    tagId: null // for updates
  }),

  methods: {
    editRow (row) {
      this.isNewTag = false
      this.dialogVisible = true
      this.dialogName = row.name
      this.dialogDescription = row.description
      this.tagId = row.id
    },

    dialogNewTag () {
      this.dialogVisible = true
      this.isNewTag = true
    },

    dialogClose () {
      this.dialogVisible = false
      this.dialogName = ''
      this.dialogDescription = ''
    },

    dialogSaveNewOrUpdateTag () {
      const newTag = {
        id: null,
        name: this.dialogName,
        description: this.dialogDescription
      }
      axios.post('/api/v1/new-tag', newTag)
        .then(response => {
          this.store.tags.push(response.data)
          this.dialogClose()
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
    },

    dialogDeleteTag () {
      const bot = this.telegramBots[this.telegramBots.indexOf(this.telegramBots.find(bot => bot.id === this.telegramBotId))]
      console.log(bot)
      axios.post('/api/v1/delete-tag', bot)
        .then(response => {
          const bots = this.telegramBots
          this.telegramBots[bots.indexOf(bots.find(bot => bot.id === this.telegramBotId))] = response.data
          this.dialogClose()
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
    }
  },

  setup () {
    const store = useStore()
    return { store }
  }
}
</script>

<style scoped>
.table-container {
  width: 100%;
}

.edit-button-container {
  display: flex;
  justify-content: center;
}
</style>