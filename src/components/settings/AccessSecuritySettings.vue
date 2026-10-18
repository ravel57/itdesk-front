<template>
  <q-card flat bordered class="settings-card">
    <q-card-section class="settings-block">
      <div class="settings-block__header">
        <div>
          <div class="text-subtitle1">Разделы менеджера организации</div>
          <div class="text-caption text-grey-7">
            Что видит менеджер организации в своих организациях. Чаты доступны всегда.
            Изменения действуют сразу, без повторного входа.
          </div>
        </div>
      </div>
      <div class="column q-mt-sm">
        <q-toggle
          v-for="feature in observerFeatures"
          :key="feature.code"
          :model-value="feature.enabled"
          :label="feature.label"
          :disable="savingObserver"
          @update:model-value="value => toggleObserverFeature(feature, value)"
        />
      </div>
    </q-card-section>
  </q-card>

  <q-card flat bordered class="settings-card">
    <q-card-section class="settings-block">
      <div class="settings-block__header">
        <div>
          <div class="text-subtitle1">Безопасность</div>
          <div class="text-caption text-grey-7">
            Двухфакторная аутентификация: после пароля вводится код из приложения-аутентификатора
            (Google Authenticator, Яндекс Ключ, 1Password и др.).
          </div>
        </div>
      </div>
      <q-toggle
        class="q-mt-sm"
        :model-value="mfaRequiredForAdmins"
        label="Обязательна для администраторов"
        :disable="savingSecurity"
        @update:model-value="toggleMfaRequired"
      />
    </q-card-section>
  </q-card>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AccessSecuritySettings',

  data: () => ({
    observerFeatures: [],
    savingObserver: false,
    mfaRequiredForAdmins: true,
    savingSecurity: false
  }),

  mounted () {
    axios.get('/api/v1/settings/observer-access')
      .then(({ data }) => {
        this.observerFeatures = Array.isArray(data) ? data : []
      })
      .catch(error => this.notifyError(error))
    axios.get('/api/v1/settings/security')
      .then(({ data }) => {
        this.mfaRequiredForAdmins = Boolean(data?.mfaRequiredForAdmins)
      })
      .catch(error => this.notifyError(error))
  },

  methods: {
    toggleObserverFeature (feature, enabled) {
      const features = this.observerFeatures
        .filter(item => (item.code === feature.code ? enabled : item.enabled))
        .map(item => item.code)
      this.savingObserver = true
      axios.patch('/api/v1/settings/observer-access', { features })
        .then(({ data }) => {
          this.observerFeatures = Array.isArray(data) ? data : this.observerFeatures
          this.$q.notify({
            type: 'positive',
            message: 'Разделы менеджера организации сохранены'
          })
        })
        .catch(error => this.notifyError(error))
        .finally(() => {
          this.savingObserver = false
        })
    },

    toggleMfaRequired (required) {
      this.savingSecurity = true
      axios.patch('/api/v1/settings/security', { mfaRequiredForAdmins: required })
        .then(({ data }) => {
          this.mfaRequiredForAdmins = Boolean(data?.mfaRequiredForAdmins)
          this.$q.notify({
            type: 'positive',
            message: 'Настройки безопасности сохранены'
          })
        })
        .catch(error => this.notifyError(error))
        .finally(() => {
          this.savingSecurity = false
        })
    },

    notifyError (error) {
      this.$q.notify({
        type: 'negative',
        message: error?.response?.data?.message || 'Не удалось сохранить настройки'
      })
    }
  }
}
</script>

<style scoped>
.settings-card {
  border-radius: 12px;
}

.settings-block__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
</style>
