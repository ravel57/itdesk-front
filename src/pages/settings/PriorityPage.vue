<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить приоритет"
      @click="this.dialogNewPriorityShow"
    />
    <div class="table-container">
      <q-list
        bordered
        class="rounded-borders"
        separator
        style="margin-top: 8px"
      >
        <q-item header class="text-bold">
          Название
        </q-item>
        <draggable
          :list="this.store.priorities"
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
                  @click="this.updatePriority(element)"
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
              <q-item-section
                top
                side
              >
                <q-btn
                  :text-color="element.critical ? 'primary' : 'grey'"
                  dense
                  flat
                  icon="priority_high"
                  @click="setCritical(element)"
                  @mouseover="this.showTooltipPriorityHigh = true"
                  @mouseup="this.showTooltipPriorityHigh = false"
                >
                  <q-tooltip v-if="this.showTooltipPriorityHigh">Установить критичный приоритет</q-tooltip>
                </q-btn>
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </q-list>
    </div>
  </div>
  <q-dialog
    v-model="this.dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="this.isNewPriority ? 'Новый приоритет' : 'Изменить приоритет'" />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogName"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewPriority"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="dialogDeletePriority"
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
          @click="dialogSaveNewOrUpdatePriority"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import axios from 'axios'
import { watch } from 'vue'
import draggable from 'vuedraggable'

export default {
  name: 'PriorityPage',

  components: { draggable },

  data: () => ({
    dialogVisible: false,
    dialogName: '',

    isNewPriority: true,
    priorityId: null, // for updates
    dragging: true,
    showTooltipSetDefault: false,
    showTooltipPriorityHigh: false
  }),

  methods: {
    dialogNewPriorityShow () {
      this.dialogVisible = true
      this.isNewPriority = true
      this.dialogName = ''
      setTimeout(() => this.$refs.dialogName.focus(), 250)
    },

    updatePriority (row) {
      this.isNewPriority = false
      this.dialogVisible = true
      this.dialogName = row.name
      this.priorityId = row.id
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogDeletePriority () {
      axios.delete(`/api/v1/priority/${this.priorityId}`)
        .then(() => {
          this.store.priorities = this.store.priorities.filter(priority => priority.id !== this.priorityId)
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

    dialogSaveNewOrUpdatePriority () {
      const priority = {
        id: this.isNewPriority ? null : this.priorityId,
        name: this.dialogName,
        orderNumber: this.isNewPriority ? null : this.store.priorities.find(priority => priority.id === this.priorityId).orderNumber,
        defaultSelection: this.isNewPriority ? null : this.store.priorities.find(priority => priority.id === this.priorityId).defaultSelection
      }
      if (priority.name.length === 0) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        return
      }
      if (this.isNewPriority) {
        axios.post('/api/v1/priority', priority)
          .then(response => {
            this.store.priorities.push(response.data)
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
        axios.patch('/api/v1/priority', priority)
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

    setDefaultSelected (row) {
      this.store.priorities.forEach(priority => { priority.defaultSelection = false })
      row.defaultSelection = true
      axios.patch('/api/v1/priority/set-default', row)
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
    },

    setCritical (row) {
      this.store.priorities.forEach(priority => { priority.critical = false })
      row.critical = true
      axios.patch('/api/v1/priority/set-high-priority', row)
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
    watch(() => store.priorities, () => {
      axios.patch('/api/v1/priorities/resort', store.priorities)
    }, { deep: true })
    return { store }
  }
}
</script>

<style scoped>
.table-container {
  width: 100%;
}

.list-group-item:hover {
  background-color: #e3e3e3;
}
</style>
