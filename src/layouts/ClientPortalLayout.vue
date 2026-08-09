<template>
  <q-layout view="hHh lpR fFf" class="client-portal-layout">
    <q-header class="client-portal-header">
      <q-toolbar class="client-portal-toolbar">
        <div class="client-portal-brand" @click="$router.push('/portal')">
          <logo-component class="client-portal-logo" />
          <div>
            <div class="client-portal-title">Клиентский портал</div>
            <div class="client-portal-subtitle">Чат с поддержкой</div>
          </div>
        </div>

        <q-space />

        <div class="client-portal-user gt-xs">
          <div class="text-weight-medium">{{ displayName }}</div>
          <div
            class="text-caption organization-name-ellipsis"
            :title="profile?.organizationName || profile?.username || ''"
          >{{ profile?.organizationName || profile?.username || '' }}</div>
        </div>
        <q-btn flat round icon="settings" aria-label="Настройки">
          <q-tooltip>Настройки</q-tooltip>
          <q-menu anchor="bottom right" self="top right">
            <q-list style="min-width: 200px">
              <q-item clickable v-close-popup @click="openPasswordDialog">
                <q-item-section avatar>
                  <q-icon name="password" color="primary"/>
                </q-item-section>
                <q-item-section>Изменить пароль</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-btn flat round icon="logout" aria-label="Выйти" @click="logout">
          <q-tooltip>Выйти</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view @profile-loaded="profile = $event" />
    </q-page-container>

    <q-dialog v-model="passwordDialogOpen" persistent>
      <q-card class="client-portal-password-dialog">
        <q-toolbar>
          <q-icon name="password" color="primary" size="24px" class="q-mr-sm"/>
          <q-toolbar-title class="text-subtitle1 text-weight-medium">
            Изменить пароль
          </q-toolbar-title>
          <q-btn flat round dense icon="close" aria-label="Закрыть" :disable="passwordSaving" @click="closePasswordDialog"/>
        </q-toolbar>

        <q-separator/>

        <q-card-section class="q-pt-lg">
          <q-form ref="passwordForm" class="column q-gutter-md" @submit.prevent="changePassword">
            <q-input
              v-model="newPassword"
              outlined
              autofocus
              label="Новый пароль *"
              autocomplete="new-password"
              :type="showNewPassword ? 'text' : 'password'"
              :disable="passwordSaving"
              :rules="[requiredPasswordRule]"
            >
              <template #append>
                <q-icon
                  :name="showNewPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showNewPassword = !showNewPassword"
                />
              </template>
            </q-input>

            <q-input
              v-model="newPasswordConfirm"
              outlined
              label="Повторите новый пароль *"
              autocomplete="new-password"
              :type="showPasswordConfirm ? 'text' : 'password'"
              :disable="passwordSaving"
              :rules="[requiredPasswordRule, passwordMatchRule]"
            >
              <template #append>
                <q-icon
                  :name="showPasswordConfirm ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPasswordConfirm = !showPasswordConfirm"
                />
              </template>
            </q-input>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="Отмена" :disable="passwordSaving" @click="closePasswordDialog"/>
          <q-btn
            unelevated
            color="primary"
            label="Сохранить"
            :loading="passwordSaving"
            :disable="!canChangePassword"
            @click="changePassword"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script>
import axios from 'axios'
import LogoComponent from 'components/Logo.vue'

export default {
  name: 'ClientPortalLayout',
  components: { LogoComponent },

  data: () => ({
    profile: null,
    passwordDialogOpen: false,
    newPassword: '',
    newPasswordConfirm: '',
    showNewPassword: false,
    showPasswordConfirm: false,
    passwordSaving: false
  }),

  computed: {
    displayName () {
      const name = `${this.profile?.firstname || ''} ${this.profile?.lastname || ''}`.trim()
      return name || this.profile?.clientName || 'Клиент'
    },

    canChangePassword () {
      return Boolean(this.newPassword) &&
        Boolean(this.newPasswordConfirm) &&
        this.newPassword === this.newPasswordConfirm &&
        !this.passwordSaving
    }
  },

  methods: {
    requiredPasswordRule (value) {
      return Boolean(String(value || '').length) || 'Обязательное поле'
    },

    passwordMatchRule (value) {
      return value === this.newPassword || 'Пароли не совпадают'
    },

    openPasswordDialog () {
      this.newPassword = ''
      this.newPasswordConfirm = ''
      this.showNewPassword = false
      this.showPasswordConfirm = false
      this.passwordDialogOpen = true
    },

    closePasswordDialog () {
      if (this.passwordSaving) {
        return
      }
      this.passwordDialogOpen = false
      this.newPassword = ''
      this.newPasswordConfirm = ''
      this.showNewPassword = false
      this.showPasswordConfirm = false
      this.$refs.passwordForm?.resetValidation?.()
    },

    async changePassword () {
      if (this.passwordSaving) {
        return
      }

      const valid = await this.$refs.passwordForm?.validate?.()
      if (valid === false || !this.canChangePassword) {
        return
      }

      this.passwordSaving = true
      try {
        await axios.post('/api/v1/user/change-password', {
          password: this.newPassword
        })
        this.passwordDialogOpen = false
        this.newPassword = ''
        this.newPasswordConfirm = ''
        this.$q.notify({
          type: 'positive',
          message: 'Пароль изменён',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      } catch (error) {
        const message = error?.response?.data?.message ||
          (typeof error?.response?.data === 'string' ? error.response.data : '') ||
          'Не удалось изменить пароль'
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
      } finally {
        this.passwordSaving = false
      }
    },

    logout () {
      window.location.assign('/logout')
    }
  }
}
</script>

<style scoped>
.client-portal-layout {
  background: #f5f6fa;
}

.client-portal-header {
  background: var(--q-primary);
  color: white;
}

.client-portal-toolbar {
  min-height: 64px;
  max-width: 1180px;
  margin: 0 auto;
  width: 100%;
  padding: 0 20px;
}

.client-portal-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
}

.client-portal-logo {
  height: 36px;
  max-width: 150px;
}

.client-portal-title {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.2;
}

.client-portal-subtitle {
  font-size: 12px;
  opacity: 0.78;
}

.client-portal-user {
  width: min(320px, 35vw);
  min-width: 0;
  text-align: right;
  margin-right: 10px;
  line-height: 1.2;
}

.client-portal-password-dialog {
  width: min(430px, calc(100vw - 32px));
}
</style>
