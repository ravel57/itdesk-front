<template>
  <q-dialog v-model="passwordDialogVisible" persistent backdrop-filter="blur(4px)">
    <q-card style="width: 480px; max-width: 92vw">
      <q-toolbar>
        <q-icon name="key" color="primary" size="24px" class="q-mr-sm"/>
        <div class="text-h6">Сменить пароль клиента</div>
        <q-space/>
        <q-btn flat round dense icon="close" @click="closePasswordDialog"/>
      </q-toolbar>
      <q-card-section class="q-pt-none">
        <div class="text-body2 text-grey-7 q-mb-md">
          Новый пароль для <b>{{ dialogUsername }}</b>. Текущий пароль посмотреть нельзя.
        </div>
        <q-input
          v-model="newClientPassword"
          outlined
          :type="showClientPassword ? 'text' : 'password'"
          label="Новый пароль *"
          :rules="[value => String(value || '').length >= 8 || 'Минимум 8 символов']"
        >
          <template #append>
            <q-icon
              :name="showClientPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showClientPassword = !showClientPassword"
            />
          </template>
        </q-input>
        <q-input
          v-model="confirmClientPassword"
          outlined
          :type="showClientPassword ? 'text' : 'password'"
          label="Повторите пароль *"
          :rules="[value => value === newClientPassword || 'Пароли не совпадают']"
          class="q-mt-sm"
        />
        <q-btn
          flat
          dense
          color="primary"
          icon="casino"
          label="Сгенерировать надежный пароль"
          @click="generateClientPassword"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat color="primary" label="Отмена" @click="closePasswordDialog"/>
        <q-btn
          unelevated
          color="primary"
          label="Сменить пароль"
          :loading="passwordSaving"
          @click="changeClientPassword"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import {generateStrongPassword} from 'src/util/settingsClients/clientPassword'
import clientNotifyMixin from 'components/settings/clients/clientNotifyMixin'

// Диалог смены пароля клиентской учётной записи. Открывается через open({userId, username}).
export default {
  name: 'ClientPasswordDialog',

  mixins: [clientNotifyMixin],

  data: () => ({
    userId: null,
    dialogUsername: '',
    passwordDialogVisible: false,
    newClientPassword: '',
    confirmClientPassword: '',
    showClientPassword: false,
    passwordSaving: false
  }),

  methods: {
    open({userId, username}) {
      this.userId = userId
      this.dialogUsername = username
      this.openPasswordDialog()
    },

    openPasswordDialog() {
      this.newClientPassword = ''
      this.confirmClientPassword = ''
      this.showClientPassword = false
      this.passwordDialogVisible = true
    },

    closePasswordDialog() {
      this.passwordDialogVisible = false
      this.newClientPassword = ''
      this.confirmClientPassword = ''
      this.showClientPassword = false
    },

    generateClientPassword() {
      const password = generateStrongPassword()
      this.newClientPassword = password
      this.confirmClientPassword = password
      this.showClientPassword = true
    },

    changeClientPassword() {
      if (String(this.newClientPassword || '').length < 8) {
        this.notifyError('Пароль должен содержать минимум 8 символов')
        return
      }
      if (this.newClientPassword !== this.confirmClientPassword) {
        this.notifyError('Пароли не совпадают')
        return
      }
      if (!this.userId) {
        this.notifyError('Не выбран пользователь')
        return
      }

      this.passwordSaving = true
      axios.post(`/api/v1/user/${this.userId}/change-password`, {password: this.newClientPassword})
        .then(() => {
          this.$q.notify({message: 'Пароль клиента изменён', type: 'positive'})
          this.closePasswordDialog()
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
        .finally(() => {
          this.passwordSaving = false
        })
    }
  }
}
</script>
