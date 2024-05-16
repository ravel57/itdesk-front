<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить статус"
      @click="this.newStatus"
    />
    <q-list
      bordered
      class="rounded-borders"
      separator
      style="margin-top: 8px"
    >
      <q-item-label header class="text-bold">Название</q-item-label>
      <draggable
        :list="this.store.statuses"
        item-key="id"
        class="list-group"
        ghost-class="ghost"
        @start="dragging = true"
        @end="dragging = false"
      >
        <template #item="{ element }">
          <q-item
            class="list-group-item"
            :class="{ 'not-draggable': true }"
            style="cursor: grab"
          >
            <q-item-section
              top
              style="justify-content: center"
            >
              {{ element.name }}
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
                @click="editStatus(element)"
              />
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
                @click="setDefaultSelected(element)"
                @mouseover="this.showTooltipSetDefault = true"
                @mouseup="this.showTooltipSetDefault = false"
              >
                <q-tooltip v-if="this.showTooltipSetDefault">Использовать по умолчанию</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>
        </template>
      </draggable>
    </q-list>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogStatusName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewStatus"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="this.dialogDeleteStatus"
        />
        <q-btn
          color="white"
          label="Закрыть"
          text-color="primary"
          @click="this.dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="this.dialogSaveNewOrUpdateStatus"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import { useStore } from 'stores/store'
import draggable from 'vuedraggable'
import { watch } from 'vue'

export default {
  name: 'StatusesPage',

  components: {
    draggable
  },

  data: () => ({
    dialogVisible: false,
    dialogStatusName: '',
    showTooltipSetDefault: false,
    isNewStatus: false,
    statusId: null, // for update
    dragging: true
  }),

  methods: {
    editStatus (row) {
      this.isNewStatus = false
      this.dialogVisible = true
      this.dialogStatusName = row.name
      this.statusId = row.id
    },

    newStatus () {
      this.dialogVisible = true
      this.isNewStatus = true
      this.dialogStatusName = ''
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateStatus () {
      const status = {
        id: this.isNewStatus ? null : this.statusId,
        name: this.dialogStatusName
      }
      if (this.isNewStatus) {
        axios.post('/api/v1/new-status', status)
          .then(response => {
            this.store.statuses.push(response.data)
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
      } else {
        axios.post('/api/v1/update-status', status)
          .then(response => {
            this.store.statuses[this.store.statuses.indexOf(this.store.statuses.find(status => status.id === this.statusId))] = response.data
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

    dialogDeleteStatus () {
      axios.delete(`/api/v1/status/${this.statusId}`)
        .then(() => {
          this.store.statuses = this.store.statuses.filter(status => status.id !== this.statusId)
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

    setDefaultSelected (row) {
      this.store.statuses.forEach(status => {
        status.defaultSelection = false
      })
      row.defaultSelection = true
      axios.post('/api/v1/update-status/set-default', row)
        .then(response => {
          const priorities = this.store.priorities
          this.store.priorities[priorities.indexOf(priorities.find(priority => priority.id === this.priorityId))] = response.data
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
    watch(() => store.statuses, () => {
      axios.post('/api/v1/update-status/resort', store.statuses)
    }, { deep: true })
    return { store }
  }
}
</script>

<style scoped>
.list-group-item:hover {
  background-color: #e3e3e3;
}
</style>
