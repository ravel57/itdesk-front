<template>
  <q-page class="jwt-page q-pa-md">
    <div class="settings-content-header jwt-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">JWT API</div>
        <div class="settings-content-description">
          Создавайте именованные Bearer-токены с ограниченными правами, отслеживайте использование и отзывайте их.
        </div>
      </div>

      <div class="settings-content-actions">
        <q-btn
          flat
          no-caps
          icon="description"
          label="Swagger"
          href="/swagger-ui.html"
          target="_blank"
        />
      </div>
    </div>

    <q-banner rounded class="jwt-warning q-mb-md">
      <template #avatar>
        <q-icon name="shield" color="primary"/>
      </template>
      JWT доступен только администраторам и работает только для API. Значение токена показывается один раз после генерации.
      Для интеграций выбирайте минимально необходимые scopes вместо полного доступа.
    </q-banner>

    <q-card flat bordered class="jwt-card">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium">Новый токен</div>
        <div class="text-caption text-grey-7 q-mt-xs">
          Генерация и управление доступны только из активной веб-сессии администратора.
        </div>
      </q-card-section>

      <q-separator/>

      <q-card-section>
        <div class="jwt-form-grid">
          <q-input
            v-model.trim="tokenName"
            outlined
            dense
            maxlength="120"
            counter
            label="Название *"
            placeholder="Например: Zabbix production"
            class="jwt-name"
          />

          <q-select
            v-model="expiresInHours"
            outlined
            dense
            emit-value
            map-options
            :options="validityOptions"
            label="Срок действия"
            class="jwt-validity"
          />

          <q-select
            v-model="selectedScopes"
            outlined
            dense
            multiple
            use-chips
            emit-value
            map-options
            option-value="value"
            option-label="title"
            :options="scopeOptions"
            :loading="scopesLoading"
            label="Scopes *"
            class="jwt-scopes"
          >
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.title }}</q-item-label>
                  <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="key"
            label="Сгенерировать JWT"
            :disable="!canGenerate"
            :loading="generating"
            @click="generateToken"
          />
        </div>
        <div class="text-caption text-grey-7 q-mt-sm">
          Если выбран <code>api:full</code>, остальные scopes избыточны. Для ограниченного токена удалите <code>api:full</code>.
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="token" flat bordered class="jwt-card q-mt-md">
      <q-card-section class="row items-start justify-between q-col-gutter-md">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">JWT «{{ generatedName }}» создан</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Действует до {{ expiresAtText }} · scopes: {{ generatedScopes.join(', ') || '—' }}.
            После закрытия/обновления страницы значение будет удалено.
          </div>
        </div>
        <div class="col-auto row q-gutter-sm">
          <q-btn
            outline
            no-caps
            color="primary"
            icon="content_copy"
            label="Копировать"
            @click="copyToken"
          />
          <q-btn
            v-if="tokenId"
            outline
            no-caps
            color="negative"
            icon="block"
            label="Отозвать"
            :loading="revokingId === tokenId"
            @click="revokeCurrentToken"
          />
        </div>
      </q-card-section>

      <q-separator/>

      <q-card-section>
        <q-input
          :model-value="token"
          outlined
          readonly
          autogrow
          type="textarea"
          label="Bearer JWT"
          input-class="jwt-token-input"
        />

        <div class="text-caption text-grey-7 q-mt-md q-mb-xs">HTTP-заголовок</div>
        <div class="jwt-code">Authorization: Bearer {{ token }}</div>
      </q-card-section>
    </q-card>

    <q-card flat bordered class="jwt-card q-mt-md">
      <q-card-section class="row items-center justify-between q-col-gutter-md">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">Выпущенные токены</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Сам JWT на сервере не хранится. Сохраняются только безопасные метаданные, scopes, отзыв и сведения о последнем использовании.
          </div>
        </div>
        <div class="col-auto row q-gutter-sm">
          <q-btn flat round dense icon="refresh" :loading="tokensLoading" @click="loadTokens">
            <q-tooltip>Обновить</q-tooltip>
          </q-btn>
          <q-btn
            outline
            no-caps
            color="negative"
            icon="block"
            label="Отозвать все активные"
            :disable="!hasActiveTokens"
            :loading="revokingAll"
            @click="revokeAllTokens"
          />
        </div>
      </q-card-section>

      <q-separator/>

      <q-table
        flat
        row-key="id"
        :rows="tokens"
        :columns="tokenColumns"
        :loading="tokensLoading"
        :pagination="{rowsPerPage: 20}"
        no-data-label="JWT ещё не выпускались"
      >
        <template #body-cell-jti="props">
          <q-td :props="props">
            <span class="jwt-jti">{{ shortJti(props.row.jti) }}</span>
            <q-tooltip>{{ props.row.jti }}</q-tooltip>
          </q-td>
        </template>

        <template #body-cell-scopes="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-badge v-for="scope in props.row.scopes || []" :key="scope" outline color="primary">
                {{ scope }}
              </q-badge>
            </div>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="tokenStatus(props.row).color" outline>
              {{ tokenStatus(props.row).label }}
            </q-badge>
          </q-td>
        </template>

        <template #body-cell-issuedAt="props">
          <q-td :props="props">{{ formatDate(props.row.issuedAt) }}</q-td>
        </template>

        <template #body-cell-expiresAt="props">
          <q-td :props="props">{{ formatDate(props.row.expiresAt) }}</q-td>
        </template>

        <template #body-cell-lastUsedAt="props">
          <q-td :props="props">
            <span>{{ formatDate(props.row.lastUsedAt) }}</span>
            <q-tooltip v-if="props.row.lastUsedAt">
              IP: {{ props.row.lastUsedIp || '—' }}<br>
              Endpoint: {{ props.row.lastEndpoint || '—' }}<br>
              User-Agent: {{ props.row.lastUserAgent || '—' }}<br>
              Зафиксировано использований: {{ props.row.useCount || 0 }}
            </q-tooltip>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <q-btn
              v-if="props.row.active"
              flat
              dense
              no-caps
              color="negative"
              icon="block"
              label="Отозвать"
              :loading="revokingId === props.row.id"
              @click="revokeToken(props.row)"
            />
            <span v-else class="text-grey-6">—</span>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <q-card flat bordered class="jwt-card q-mt-md">
      <q-card-section class="row items-center justify-between q-col-gutter-md">
        <div class="col">
          <div class="text-subtitle1 text-weight-medium">Ключи подписи</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Новые JWT подписываются активным ключом. Ротация не отключает ранее выпущенные токены: старые ключи остаются только для проверки подписи.
          </div>
        </div>
        <div class="col-auto row q-gutter-sm">
          <q-btn flat round dense icon="refresh" :loading="keysLoading" @click="loadKeys">
            <q-tooltip>Обновить</q-tooltip>
          </q-btn>
          <q-btn
            outline
            no-caps
            color="primary"
            icon="autorenew"
            label="Ротировать ключ"
            :loading="rotatingKey"
            @click="rotateSigningKey"
          />
        </div>
      </q-card-section>

      <q-separator/>

      <q-table
        flat
        row-key="keyId"
        :rows="signingKeys"
        :columns="keyColumns"
        :loading="keysLoading"
        :pagination="{rowsPerPage: 10}"
        no-data-label="Ключи ещё не создавались"
      >
        <template #body-cell-createdAt="props">
          <q-td :props="props">{{ formatDate(props.row.createdAt) }}</q-td>
        </template>
        <template #body-cell-retiredAt="props">
          <q-td :props="props">{{ formatDate(props.row.retiredAt) }}</q-td>
        </template>
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="props.row.active ? 'positive' : 'grey-7'" outline>
              {{ props.row.active ? 'Активный' : 'Предыдущий' }}
            </q-badge>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script>
import axios from 'axios'
import { copyToClipboard } from 'quasar'

export default {
  name: 'JwtSettingsPage',

  data: () => ({
    tokenName: '',
    expiresInHours: 24,
    selectedScopes: ['api:full'],
    scopeOptions: [],
    scopesLoading: false,
    generating: false,
    token: '',
    tokenId: null,
    generatedName: '',
    generatedScopes: [],
    expiresAt: null,
    tokens: [],
    tokensLoading: false,
    revokingId: null,
    revokingAll: false,
    signingKeys: [],
    keysLoading: false,
    rotatingKey: false,
    validityOptions: [
      {label: '1 час', value: 1},
      {label: '24 часа', value: 24},
      {label: '7 дней', value: 168},
      {label: '30 дней', value: 720},
      {label: '90 дней', value: 2160}
    ],
    tokenColumns: [
      {name: 'name', label: 'Название', field: 'name', align: 'left', sortable: true},
      {name: 'jti', label: 'ID', field: 'jti', align: 'left'},
      {name: 'scopes', label: 'Scopes', field: 'scopes', align: 'left'},
      {name: 'username', label: 'Владелец', field: 'username', align: 'left', sortable: true},
      {name: 'issuedAt', label: 'Выпущен', field: 'issuedAt', align: 'left', sortable: true},
      {name: 'expiresAt', label: 'Истекает', field: 'expiresAt', align: 'left', sortable: true},
      {name: 'lastUsedAt', label: 'Последнее использование', field: 'lastUsedAt', align: 'left', sortable: true},
      {name: 'status', label: 'Статус', field: 'active', align: 'left'},
      {name: 'actions', label: '', field: 'id', align: 'right'}
    ],
    keyColumns: [
      {name: 'keyId', label: 'kid', field: 'keyId', align: 'left'},
      {name: 'createdAt', label: 'Создан', field: 'createdAt', align: 'left', sortable: true},
      {name: 'retiredAt', label: 'Выведен из активных', field: 'retiredAt', align: 'left', sortable: true},
      {name: 'status', label: 'Статус', field: 'active', align: 'left'}
    ]
  }),

  computed: {
    expiresAtText() {
      return this.formatDate(this.expiresAt)
    },

    hasActiveTokens() {
      return this.tokens.some(item => item.active)
    },

    canGenerate() {
      return this.tokenName.trim().length > 0 && this.selectedScopes.length > 0
    }
  },

  mounted() {
    this.loadScopes()
    this.loadTokens()
    this.loadKeys()
  },

  beforeUnmount() {
    this.clearToken()
  },

  methods: {
    async generateToken() {
      if (!this.canGenerate) {
        return
      }
      this.generating = true
      this.clearToken()
      try {
        const response = await axios.post('/api/v1/jwt/generate', {
          name: this.tokenName.trim(),
          expiresInHours: this.expiresInHours,
          scopes: this.selectedScopes
        })
        this.token = response.data?.token || ''
        this.tokenId = response.data?.tokenId || null
        this.generatedName = response.data?.name || this.tokenName.trim()
        this.generatedScopes = Array.isArray(response.data?.scopes) ? response.data.scopes : []
        this.expiresAt = response.data?.expiresAt || null
        if (!this.token || !this.tokenId) {
          throw new Error('Backend не вернул JWT')
        }
        this.$q.notify({
          type: 'positive',
          message: `JWT «${this.generatedName}» сгенерирован`,
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
        this.tokenName = ''
        await Promise.all([this.loadTokens(), this.loadKeys()])
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.errorMessage(error, 'Не удалось создать JWT'),
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      } finally {
        this.generating = false
      }
    },

    async loadScopes() {
      this.scopesLoading = true
      try {
        const response = await axios.get('/api/v1/jwt/scopes')
        this.scopeOptions = Array.isArray(response.data) ? response.data : []
        if (!this.scopeOptions.length) {
          this.scopeOptions = [{value: 'api:full', title: 'Полный доступ к API', description: ''}]
        }
      } catch (error) {
        this.scopeOptions = [{value: 'api:full', title: 'Полный доступ к API', description: ''}]
        this.$q.notify({
          type: 'negative',
          message: this.errorMessage(error, 'Не удалось загрузить JWT scopes'),
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      } finally {
        this.scopesLoading = false
      }
    },

    async loadTokens() {
      this.tokensLoading = true
      try {
        const response = await axios.get('/api/v1/jwt/tokens')
        this.tokens = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.errorMessage(error, 'Не удалось загрузить JWT'),
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      } finally {
        this.tokensLoading = false
      }
    },

    async loadKeys() {
      this.keysLoading = true
      try {
        const response = await axios.get('/api/v1/jwt/keys')
        this.signingKeys = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        this.$q.notify({
          type: 'negative',
          message: this.errorMessage(error, 'Не удалось загрузить ключи JWT'),
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      } finally {
        this.keysLoading = false
      }
    },

    rotateSigningKey() {
      this.$q.dialog({
        title: 'Ротировать ключ подписи?',
        message: 'Новые JWT будут подписываться новым ключом. Уже выпущенные токены продолжат работать до истечения или отзыва.',
        persistent: true,
        ok: {label: 'Ротировать', color: 'primary', noCaps: true},
        cancel: {label: 'Отмена', flat: true, noCaps: true}
      }).onOk(async () => {
        this.rotatingKey = true
        try {
          await axios.post('/api/v1/jwt/keys/rotate')
          await this.loadKeys()
          this.$q.notify({
            type: 'positive',
            message: 'Ключ подписи JWT ротирован',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: this.errorMessage(error, 'Не удалось ротировать ключ JWT'),
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        } finally {
          this.rotatingKey = false
        }
      })
    },

    revokeCurrentToken() {
      const row = this.tokens.find(item => item.id === this.tokenId)
      if (row) {
        this.revokeToken(row)
      }
    },

    revokeToken(row) {
      if (!row?.id || !row.active) {
        return
      }
      this.$q.dialog({
        title: 'Отозвать JWT?',
        message: `Токен «${row.name || this.shortJti(row.jti)}» сразу перестанет работать. Это действие нельзя отменить.`,
        persistent: true,
        ok: {label: 'Отозвать', color: 'negative', noCaps: true},
        cancel: {label: 'Отмена', flat: true, noCaps: true}
      }).onOk(async () => {
        this.revokingId = row.id
        try {
          await axios.post(`/api/v1/jwt/tokens/${row.id}/revoke`)
          if (row.id === this.tokenId) {
            this.clearToken()
          }
          await this.loadTokens()
          this.$q.notify({
            type: 'positive',
            message: 'JWT отозван',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
          })
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: this.errorMessage(error, 'Не удалось отозвать JWT'),
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
          })
        } finally {
          this.revokingId = null
        }
      })
    },

    revokeAllTokens() {
      if (!this.hasActiveTokens) {
        return
      }
      this.$q.dialog({
        title: 'Отозвать все активные JWT?',
        message: 'Все выпущенные и ещё действующие API-токены немедленно перестанут работать. Веб-сессии пользователей останутся активными.',
        cancel: {label: 'Отмена', flat: true, noCaps: true},
        ok: {label: 'Отозвать все', color: 'negative', noCaps: true},
        persistent: true
      }).onOk(async () => {
        this.revokingAll = true
        try {
          const response = await axios.post('/api/v1/jwt/tokens/revoke-all')
          this.clearToken()
          await this.loadTokens()
          const revoked = response.data?.revoked ?? 0
          this.$q.notify({
            type: 'positive',
            message: `Отозвано JWT: ${revoked}`,
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        } catch (error) {
          this.$q.notify({
            type: 'negative',
            message: this.errorMessage(error, 'Не удалось отозвать JWT'),
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        } finally {
          this.revokingAll = false
        }
      })
    },

    async copyToken() {
      if (!this.token) {
        return
      }
      try {
        await copyToClipboard(this.token)
        this.$q.notify({
          type: 'positive',
          message: 'JWT скопирован',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      } catch (e) {
        this.$q.notify({
          type: 'negative',
          message: 'Не удалось скопировать JWT',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      }
    },

    clearToken() {
      this.token = ''
      this.tokenId = null
      this.generatedName = ''
      this.generatedScopes = []
      this.expiresAt = null
    },

    tokenStatus(row) {
      if (row?.revokedAt) {
        return {label: 'Отозван', color: 'negative'}
      }
      if (!row?.active || (row?.expiresAt && new Date(row.expiresAt).getTime() <= Date.now())) {
        return {label: 'Истёк', color: 'grey-7'}
      }
      return {label: 'Активен', color: 'positive'}
    },

    formatDate(value) {
      if (!value) {
        return '—'
      }
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('ru-RU')
    },

    shortJti(value) {
      if (!value) {
        return '—'
      }
      return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-8)}` : value
    },

    errorMessage(error, fallback) {
      return error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
    }
  }
}
</script>

<style scoped>
.jwt-page {
  max-width: 1320px;
}

.jwt-header {
  align-items: flex-start;
}

.jwt-warning {
  color: #37314f;
  background: rgba(90, 53, 240, 0.07);
  border: 1px solid rgba(90, 53, 240, 0.16);
}

.jwt-card {
  border-radius: 12px;
}

.jwt-form-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 200px minmax(320px, 1.5fr) auto;
  align-items: start;
  gap: 12px;
}

.jwt-code,
.jwt-jti,
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}

.jwt-code {
  padding: 12px 14px;
  overflow-wrap: anywhere;
  font-size: 12px;
  line-height: 1.5;
  color: #29303d;
  background: #f5f6fa;
  border: 1px solid #e7eaf0;
  border-radius: 8px;
}

.jwt-jti {
  font-size: 12px;
}

:deep(.jwt-token-input) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (max-width: 1050px) {
  .jwt-form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 650px) {
  .jwt-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
