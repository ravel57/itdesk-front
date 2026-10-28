<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @hide="clearSecurityDialogState"
  >
    <q-card class="plugin-security-dialog">
      <q-card-section class="plugin-security-header">
        <div>
          <div class="text-h6">Доступы и секреты</div>
          <div class="text-caption text-grey-7">
            {{ securityPlugin?.name || securityPlugin?.key }}
            <span v-if="securityPlugin?.key">({{ securityPlugin.key }})</span>
          </div>
        </div>

        <div class="row items-center q-gutter-xs">
          <q-btn
            flat
            round
            dense
            icon="refresh"
            title="Обновить доступы и секреты"
            :loading="securityLoading"
            @click="loadPluginSecurity"
          />
          <q-btn flat round dense icon="close" v-close-popup/>
        </div>
      </q-card-section>

      <q-linear-progress v-if="securityLoading" indeterminate color="primary"/>
      <q-separator/>

      <q-card-section class="plugin-security-section">
        <div class="plugin-security-section-header app-plugin-security-section-header">
          <div>
            <div class="text-subtitle1">Разрешения</div>
            <div class="text-caption text-grey-7">
              Манифест только запрашивает доступ. Каждое разрешение одобряется администратором отдельно.
            </div>
          </div>
        </div>

        <q-banner
          v-if="pendingPermissions.length"
          dense
          rounded
          class="bg-amber-1 text-amber-10 q-mb-md"
        >
          Есть разрешения, ожидающие решения администратора: {{ pendingPermissions.length }}.
        </q-banner>

        <q-list
          v-if="pluginPermissions.length"
          bordered
          separator
          class="rounded-borders"
        >
          <q-item
            v-for="permission in pluginPermissions"
            :key="permission.permission"
            class="plugin-permission-row"
          >
            <q-item-section>
              <q-item-label>{{ permission.description || permission.permission }}</q-item-label>
              <q-item-label caption class="plugin-code">
                {{ permission.permission }}
              </q-item-label>
              <q-item-label
                v-if="permission.approved && (permission.approvedBy || permission.approvedAt)"
                caption
                class="q-mt-xs"
              >
                Одобрено
                <span v-if="permission.approvedBy">: {{ permission.approvedBy }}</span>
                <span v-if="permission.approvedAt"> · {{ permission.approvedAt }}</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="plugin-permission-actions">
                <q-badge
                  :color="permission.approved ? 'positive' : 'warning'"
                  :label="permission.approved ? 'Одобрено' : 'Ожидает'"
                />

                <q-btn
                  v-if="permission.approved"
                  dense
                  outline
                  color="negative"
                  label="Отозвать"
                  :loading="isPermissionBusy(permission.permission)"
                  :disable="hasAnyPermissionAction"
                  @click="revokePermission(permission)"
                />
                <q-btn
                  v-else
                  dense
                  unelevated
                  color="positive"
                  label="Одобрить"
                  :loading="isPermissionBusy(permission.permission)"
                  :disable="hasAnyPermissionAction"
                  @click="approvePermission(permission)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else-if="!securityLoading" class="text-grey-6 q-py-sm">
          Плагин не запросил дополнительных разрешений.
        </div>
      </q-card-section>

      <q-separator/>

      <q-card-section class="plugin-security-section">
        <div class="text-subtitle1">Секреты</div>
        <div class="text-caption text-grey-7 q-mb-md">
          Значение никогда не читается обратно из backend. Поле всегда пустое; сохранение заменяет текущее значение.
        </div>

        <q-banner
          v-if="pluginSecrets.length"
          dense
          rounded
          class="bg-blue-1 text-blue-9 q-mb-md"
        >
          Секрет хранится зашифрованно и используется broker'ом только для адресов, объявленных плагином.
        </q-banner>

        <div v-if="pluginSecrets.length" class="plugin-secrets-list">
          <q-card
            v-for="secret in pluginSecrets"
            :key="secret.name"
            flat
            bordered
            class="plugin-secret-card"
          >
            <q-card-section>
              <div class="plugin-secret-heading app-plugin-secret-heading">
                <div>
                  <div class="text-subtitle2">{{ secret.title || secret.name }}</div>
                  <div class="text-caption plugin-code">{{ secret.name }}</div>
                </div>
                <q-badge
                  :color="secret.configured ? 'positive' : 'grey'"
                  :label="secret.configured ? 'Настроен' : 'Не задан'"
                />
              </div>

              <div v-if="secret.description" class="text-caption text-grey-7 q-mt-sm">
                {{ secret.description }}
              </div>

              <div v-if="secret.sendTo.length" class="q-mt-sm">
                <div class="text-caption text-grey-7 q-mb-xs">Разрешённые назначения:</div>
                <div class="secret-destinations">
                  <q-badge
                    v-for="destination in secret.sendTo"
                    :key="destination"
                    outline
                    color="primary"
                    :label="destination"
                  />
                </div>
              </div>

              <div class="plugin-secret-editor q-mt-md">
                <q-input
                  v-model="secretValues[secret.name]"
                  outlined
                  dense
                  :type="isSecretVisible(secret.name) ? 'text' : 'password'"
                  :label="secret.configured ? 'Новое значение' : 'Значение *'"
                  autocomplete="new-password"
                  spellcheck="false"
                  :disable="isSecretBusy(secret.name)"
                  @keyup.enter="savePluginSecret(secret)"
                >
                  <template #append>
                    <q-icon
                      :name="isSecretVisible(secret.name) ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      @click="toggleSecretVisibility(secret.name)"
                    />
                  </template>
                </q-input>

                <div class="plugin-secret-actions">
                  <q-btn
                    unelevated
                    color="primary"
                    icon="save"
                    :label="secret.configured ? 'Заменить' : 'Сохранить'"
                    :loading="isSecretBusy(secret.name)"
                    :disable="!hasSecretValue(secret.name) || hasAnySecretAction"
                    @click="savePluginSecret(secret)"
                  />
                  <q-btn
                    v-if="secret.configured"
                    outline
                    color="negative"
                    icon="delete_outline"
                    label="Удалить значение"
                    :loading="isSecretBusy(secret.name)"
                    :disable="hasAnySecretAction"
                    @click="deletePluginSecret(secret)"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div v-else-if="!securityLoading" class="text-grey-6 q-py-sm">
          Плагин не объявил настраиваемых секретов.
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import {getErrorMessage, normalizePluginPermissions, normalizePluginSecrets} from 'src/util/settingsPlugins/pluginNormalizers'
import pluginsNotifyMixin from './pluginsNotifyMixin'
import pluginPermissionsMixin from './pluginPermissionsMixin'
import pluginSecretsMixin from './pluginSecretsMixin'

// Диалог «Доступы и секреты» плагина: разрешения (pluginPermissionsMixin) и секреты (pluginSecretsMixin).
// Открытие — через v-model; plugin — строка таблицы плагинов. Состояние сбрасывается и загружается при каждом открытии.
export default {
  name: 'PluginSecurityDialog',

  mixins: [pluginsNotifyMixin, pluginPermissionsMixin, pluginSecretsMixin],

  props: {
    modelValue: {type: Boolean, default: false},
    plugin: {type: Object, default: null}
  },

  emits: ['update:modelValue'],

  data: () => ({
    securityPlugin: null,
    securityLoading: false
  }),

  watch: {
    modelValue(opened) {
      if (opened) {
        this.openPluginSecurity(this.plugin)
      }
    }
  },

  methods: {
    async openPluginSecurity(plugin) {
      this.securityPlugin = plugin
      this.pluginPermissions = []
      this.pluginSecrets = []
      this.permissionActions = {}
      this.secretActions = {}
      this.secretValues = {}
      this.secretVisibility = {}
      await this.loadPluginSecurity()
    },

    clearSecurityDialogState() {
      // Не держим введённые секреты в памяти дольше открытого диалога.
      this.secretValues = {}
      this.secretVisibility = {}
      this.permissionActions = {}
      this.secretActions = {}
      this.pluginPermissions = []
      this.pluginSecrets = []
      this.securityPlugin = null
      this.securityLoading = false
    },

    async loadPluginSecurity() {
      const pluginKey = this.securityPlugin?.key
      if (!pluginKey) {
        return
      }

      this.securityLoading = true
      const encodedKey = encodeURIComponent(pluginKey)

      try {
        const [permissionsResult, secretsResult] = await Promise.allSettled([
          axios.get(`/api/v1/plugins/${encodedKey}/permissions`),
          axios.get(`/api/v1/plugins/${encodedKey}/secrets`)
        ])

        if (permissionsResult.status === 'fulfilled') {
          this.pluginPermissions = normalizePluginPermissions(permissionsResult.value.data)
        } else {
          this.pluginPermissions = []
          this.notifyNegative(getErrorMessage(permissionsResult.reason, 'Не удалось загрузить разрешения плагина'))
        }

        if (secretsResult.status === 'fulfilled') {
          this.pluginSecrets = normalizePluginSecrets(secretsResult.value.data)
          this.secretValues = Object.fromEntries(this.pluginSecrets.map(secret => [secret.name, '']))
          this.secretVisibility = {}
        } else {
          this.pluginSecrets = []
          this.secretValues = {}
          this.notifyNegative(getErrorMessage(secretsResult.reason, 'Не удалось загрузить секреты плагина'))
        }
      } finally {
        this.securityLoading = false
      }
    }
  }
}
</script>

<style scoped>
.plugin-security-dialog {
  width: min(920px, 96vw);
  max-width: 96vw;
  max-height: 92vh;
  overflow-y: auto;
}

.plugin-security-section {
  padding-top: 18px;
  padding-bottom: 18px;
}

.plugin-security-section-actions,
.plugin-permission-actions,
.plugin-secret-actions,
.secret-destinations {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.plugin-permission-row {
  min-height: 78px;
}

.plugin-permission-actions {
  justify-content: flex-end;
}

.plugin-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  overflow-wrap: anywhere;
}

.plugin-secrets-list {
  display: grid;
  gap: 12px;
}

.plugin-secret-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

@media (max-width: 700px) {

  .plugin-permission-actions,
  .plugin-secret-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .plugin-secret-editor {
    grid-template-columns: 1fr;
  }
}
</style>
