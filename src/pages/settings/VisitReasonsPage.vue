<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Причины выездов</div>
        <div class="settings-content-description">
          Причины используются при добавлении выезда. Для срочной причины автоматически подставляется цена срочного выезда организации.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить причину"
          @click="openCreateDialog"
        />
      </div>
    </div>

    <q-list
      bordered
      separator
      class="rounded-borders q-mt-md settings-row-list"
    >
      <q-item header class="text-bold">
        <q-item-section>Название</q-item-section>
        <q-item-section side>Тип</q-item-section>
        <q-item-section side style="width: 48px" />
      </q-item>

      <draggable
        :list="visitReasons"
        item-key="id"
        ghost-class="ghost"
        handle=".visit-reason-drag-handle"
        @end="saveOrder"
      >
        <template #item="{ element }">
          <q-item class="visit-reason-row">
            <q-item-section avatar class="visit-reason-drag-handle cursor-move">
              <q-icon name="drag_indicator" color="grey-6" />
            </q-item-section>
            <q-item-section>
              {{ element.name }}
            </q-item-section>
            <q-item-section side>
              <q-chip
                v-if="element.urgent"
                dense
                square
                color="orange-2"
                text-color="orange-10"
                label="Срочная"
              />
              <span v-else class="text-caption text-grey-6">Обычная</span>
            </q-item-section>
            <q-item-section side>
              <q-btn
                color="primary"
                dense
                flat
                icon="edit"
                @click="openEditDialog(element)"
              />
            </q-item-section>
          </q-item>
        </template>
      </draggable>

      <q-item v-if="!loading && visitReasons.length === 0">
        <q-item-section class="text-grey-7">
          Причины выездов не настроены.
        </q-item-section>
      </q-item>

      <q-inner-loading :showing="loading">
        <q-spinner color="primary" size="32px" />
      </q-inner-loading>
    </q-list>
  </div>

  <q-dialog
    v-model="dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ isNewReason ? 'Новая причина выезда' : 'Изменить причину выезда' }}
        </div>
        <q-btn flat round dense icon="close" @click="closeDialog" />
      </q-toolbar>

      <q-card-section style="padding-top: 0">
        <q-input
          ref="reasonName"
          v-model="dialogName"
          label="Название *"
          :rules="[val => Boolean(String(val || '').trim()) || 'Обязательное поле']"
        />
        <q-toggle
          v-model="dialogUrgent"
          color="primary"
          label="Срочная причина"
        />
        <div class="text-caption text-grey-7 q-mt-xs">
          Если включено, при выборе этой причины в форме выезда будет автоматически предложена цена срочного выезда.
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="!isNewReason"
          unelevated
          no-caps
          color="negative"
          icon="delete"
          label="Удалить"
          @click="deleteReason"
        />
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          @click="closeDialog"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          :loading="saving"
          @click="saveReason"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'

export default {
  name: 'VisitReasonsPage',

  components: { draggable },

  data: () => ({
    visitReasons: [],
    loading: false,
    saving: false,
    dialogVisible: false,
    isNewReason: true,
    reasonId: null,
    dialogName: '',
    dialogUrgent: false
  }),

  mounted() {
    this.loadVisitReasons()
  },

  methods: {
    loadVisitReasons() {
      this.loading = true
      axios.get('/api/v1/visit-reasons')
        .then(response => {
          this.visitReasons = Array.isArray(response.data) ? response.data : []
        })
        .catch(this.notifyError)
        .finally(() => {
          this.loading = false
        })
    },

    openCreateDialog() {
      this.isNewReason = true
      this.reasonId = null
      this.dialogName = ''
      this.dialogUrgent = false
      this.dialogVisible = true
      setTimeout(() => this.$refs.reasonName?.focus(), 250)
    },

    openEditDialog(reason) {
      this.isNewReason = false
      this.reasonId = reason.id
      this.dialogName = reason.name || ''
      this.dialogUrgent = reason.urgent === true
      this.dialogVisible = true
      setTimeout(() => this.$refs.reasonName?.focus(), 250)
    },

    closeDialog() {
      if (!this.saving) {
        this.dialogVisible = false
      }
    },

    saveReason() {
      const name = String(this.dialogName || '').trim()
      if (!name) {
        this.$q.notify({
          message: 'Заполните название причины',
          type: 'negative',
          position: 'top-right'
        })
        return
      }

      const existing = this.visitReasons.find(item => item.id === this.reasonId)
      const payload = {
        id: this.isNewReason ? null : this.reasonId,
        name,
        urgent: this.dialogUrgent === true,
        orderNumber: this.isNewReason ? null : existing?.orderNumber
      }

      this.saving = true
      const request = this.isNewReason
        ? axios.post('/api/v1/visit-reason', payload)
        : axios.patch('/api/v1/visit-reason', payload)

      request
        .then(() => {
          this.dialogVisible = false
          this.loadVisitReasons()
        })
        .catch(this.notifyError)
        .finally(() => {
          this.saving = false
        })
    },

    deleteReason() {
      if (!this.reasonId) {
        return
      }
      this.saving = true
      axios.delete(`/api/v1/visit-reason/${this.reasonId}`)
        .then(() => {
          this.dialogVisible = false
          this.loadVisitReasons()
        })
        .catch(this.notifyError)
        .finally(() => {
          this.saving = false
        })
    },

    saveOrder() {
      const ordered = this.visitReasons.map((reason, index) => ({
        ...reason,
        orderNumber: index
      }))
      this.visitReasons = ordered
      axios.patch('/api/v1/visit-reasons/resort', ordered)
        .then(response => {
          this.visitReasons = Array.isArray(response.data) ? response.data : ordered
        })
        .catch(error => {
          this.notifyError(error)
          this.loadVisitReasons()
        })
    },

    notifyError(error) {
      this.$q.notify({
        message: error?.response?.data?.message || error?.response?.data || error?.message || 'Не удалось выполнить операцию',
        type: 'negative',
        position: 'top-right',
        actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
      })
    }
  }
}
</script>

<style scoped>
.visit-reason-row {
  min-height: 52px;
}

.visit-reason-row:hover {
  background-color: #f5f5f5;
}

.visit-reason-drag-handle {
  min-width: 36px;
}
</style>
