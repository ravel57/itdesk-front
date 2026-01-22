<template>
  <div class="q-pa-md">
    <q-btn
      icon="add"
      label="Добавить тригер"
      @click="this.newTrigger"
    />
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
        :list="this.store.triggers"
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
                @click="editTrigger(element)"
              />
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
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="this.isNewTrigger ? 'Новый статус' : 'Изменить статус'" />
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        <q-input
          v-model="this.dialogTriggerName"
          label="Название"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          ref="dialogTriggerName"
        />
        <q-input
          v-model="this.dialogTriggerDescription"
          label="Описание"
        />
        <q-select
          id="task-executor"
          v-model="this.selectedTriggerType"
          label="Событие"
          :options="this.store.triggerTypes"
        />
          <!--@filter="filterUsers"-->
        <q-input
          v-model="this.dialogTriggerExpression"
          label="Выражение условия"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
        <q-input
          v-model="this.dialogTriggerAction"
          label="Выражение действия"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          v-if="!this.isNewTrigger"
          color="white"
          label="Удалить"
          text-color="primary"
          @click="this.dialogDeleteTrigger"
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
          @click="this.dialogSaveNewOrUpdateTrigger"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import draggable from 'vuedraggable'
import axios from 'axios'
import { useStore } from 'stores/store'
import { watch } from 'vue'

export default {
  name: 'AutomatizationPage',

  components: {
    draggable
  },

  data: () => ({
    isNewTigger: true,
    dialogVisible: false,
    dialogTriggerName: '',
    dialogTriggerDescription: '',
    dialogTriggerExpression: '',
    dialogTriggerAction: '',
    selectedTriggerType: '',
    showTooltipSetDefault: false,
    isNewTrigger: false,
    triggerId: null, // for update
    dragging: true
  }),

  methods: {
    editTrigger (row) {
      this.isNewTigger = false
      this.dialogVisible = true
      this.dialogTriggerName = row.name
      this.dialogTriggerDescription = row.description
      this.dialogTriggerExpression = row.expression
      this.dialogTriggerAction = row.action
      this.selectedTriggerType = row.triggerType
      this.triggerId = row.id
    },

    newTrigger () {
      this.dialogVisible = true
      this.isNewTrigger = true
      this.dialogTriggerName = ''
      this.dialogTriggerDescription = ''
      this.dialogTriggerExpression = ''
      this.dialogTriggerAction = ''
      this.selectedTriggerType = ''
      setTimeout(() => this.$refs.dialogTriggerName.focus(), 250)
    },

    dialogClose () {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateTrigger () {
      const trigger = {
        id: this.isNewTrigger ? null : this.triggerId,
        name: this.dialogTriggerName,
        description: this.dialogTriggerDescription,
        expression: this.dialogTriggerExpression,
        action: this.dialogTriggerAction,
        triggerType: this.selectedTriggerType,
        orderNumber: this.isNewTrigger ? null : this.store.triggers.find(trigger => trigger.id === this.triggerId).orderNumber
      }
      if (trigger.name.length === 0) {
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
      if (this.isNewTrigger) {
        axios.post('/api/v1/trigger', trigger)
          .then(response => {
            this.store.triggers.push(response.data)
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
        axios.patch('/api/v1/trigger', trigger)
          .then(response => {
            this.store.triggers[this.store.triggers.indexOf(this.store.triggers.find(trigger => trigger.id === this.triggerId))] = response.data
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

    dialogDeleteTrigger () {
      axios.delete(`/api/v1/trigger/${this.triggerId}`)
        .then(() => {
          this.store.triggers = this.store.triggers.filter(trigger => trigger.id !== this.triggerId)
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

    // filterUsers (val, update) {
    //   update(() => {
    //     if (val) {
    //       this.filteredUsers = this.store.users
    //         .filter(user =>
    //           ['ADMIN', 'OPERATOR'].includes(user.authorities[0]) && this.getUserName(user).toLowerCase().includes(val.toLowerCase())
    //         )
    //         .map(user => this.getUserName(user))
    //     } else {
    //       this.filteredUsers = this.store.users
    //         .filter(user => ['ADMIN', 'OPERATOR'].includes(user.authorities[0]))
    //         .map(user => this.getUserName(user))
    //     }
    //   })
    // }
  },

  setup () {
    const store = useStore()
    watch(() => store.triggers, () => {
      axios.patch('/api/v1/triggers/resort', store.triggers)
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
