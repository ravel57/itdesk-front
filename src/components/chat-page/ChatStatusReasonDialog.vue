<template>
  <q-dialog
    v-model="statusReasonDialog"
    persistent
  >
    <q-card class="app-inline app-dialog-medium">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ statusReasonDialogTitle }}
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          @click="cancelStatusReasonDialog"
        />
      </q-toolbar>

      <q-card-section>
        <div class="text-body2 q-mb-md">
          {{ statusReasonDialogMessage }}
        </div>

        <q-input
          v-model="statusReasonText"
          type="textarea"
          autogrow
          autofocus
          label="Причина *"
          :error="statusReasonError"
          error-message="Обязательное поле"
          @keyup.ctrl.enter="confirmStatusReasonDialog"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="primary"
          label="Отмена"
          @click="cancelStatusReasonDialog"
        />

        <q-btn
          color="primary"
          label="Продолжить"
          @click="confirmStatusReasonDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { getStatusChangeReasonTitle, needStatusChangeReason } from 'src/util/chatPage/statusReason'

// Диалог «Причина» при закрытии/заморозке/возврате заявки. Родитель вызывает
// request(oldStatusName, newStatusName) и получает Promise с причиной
// ('' — причина не нужна, null — отмена).
export default {
  name: 'ChatStatusReasonDialog',

  data: () => ({
    statusReasonDialog: false,
    statusReasonDialogTitle: '',
    statusReasonDialogMessage: '',
    statusReasonText: '',
    statusReasonError: false,
    statusReasonResolve: null
  }),

  methods: {
    request(oldStatusName, newStatusName) {
      if (!needStatusChangeReason(oldStatusName, newStatusName)) {
        return Promise.resolve('')
      }
      this.statusReasonDialogTitle = getStatusChangeReasonTitle(oldStatusName, newStatusName)
      this.statusReasonDialogMessage = `Статус: «${oldStatusName}» → «${newStatusName}»`
      this.statusReasonText = ''
      this.statusReasonError = false
      this.statusReasonDialog = true
      return new Promise(resolve => {
        this.statusReasonResolve = resolve
      })
    },

    confirmStatusReasonDialog() {
      const reason = String(this.statusReasonText || '').trim()
      if (!reason) {
        this.statusReasonError = true
        return
      }
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(reason)
      }
      this.clearStatusReasonDialog()
    },

    cancelStatusReasonDialog() {
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(null)
      }
      this.clearStatusReasonDialog()
    },

    clearStatusReasonDialog() {
      this.statusReasonDialogTitle = ''
      this.statusReasonDialogMessage = ''
      this.statusReasonText = ''
      this.statusReasonError = false
      this.statusReasonResolve = null
    },
  }
}
</script>
