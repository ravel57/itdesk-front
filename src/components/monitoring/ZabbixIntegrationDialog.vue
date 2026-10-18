<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="value => $emit('update:modelValue', value)">
    <q-card class="zabbix-dialog column no-wrap">
      <q-card-section class="row items-center no-wrap q-pb-sm">
        <div class="text-h6 col">{{ form.id ? 'Интеграция Zabbix' : 'Новая интеграция Zabbix' }}</div>
        <q-btn flat round dense icon="close" aria-label="Закрыть" @click="close"/>
      </q-card-section>

      <q-card-section class="zabbix-dialog__body col q-gutter-md">
        <q-input v-model="form.name" outlined label="Название *" :rules="[required]" hide-bottom-space/>

        <div>
          <div class="text-caption text-grey-7 q-mb-xs">Как ULDesk получает данные</div>
          <q-option-group v-model="form.mode" :options="modeOptions" type="radio">
            <template #label="option">
              <div>
                <div>{{ option.label }}</div>
                <div class="text-caption text-grey-7">{{ option.caption }}</div>
              </div>
            </template>
          </q-option-group>
        </div>

        <template v-if="form.mode === 'API_POLLING'">
          <q-input v-model="form.baseUrl" outlined label="URL Zabbix *" hint="Например https://zabbix.example.com"
                   :rules="[required]"/>
          <!-- Отрицательные отступы q-col-gutter конфликтуют с q-gutter-md родителя, поэтому строка в обёртке -->
          <div>
            <div class="row q-col-gutter-md">
              <q-input v-model="form.username" class="col-6" outlined label="Логин"/>
              <q-input v-model="form.password" class="col-6" outlined type="password" label="Пароль"
                       hint="Пусто — оставить прежний"/>
            </div>
          </div>
          <q-input v-model="form.apiToken" outlined type="password" label="API token"
                   hint="При наличии token логин и пароль не используются"/>
          <q-input v-model.number="form.requestTimeoutSeconds" outlined type="number" min="2" max="120"
                   label="Таймаут, сек."/>
        </template>

        <template v-else>
          <q-input v-model="form.publicUrl" outlined label="Внешний адрес ULDesk *" :rules="[required]"
                   hint="Адрес, по которому сервер Zabbix клиента достучится до ULDesk, например https://desk.example.com"/>
          <q-input v-model="form.baseUrl" outlined label="Адрес Zabbix"
                   hint="Необязательно: для ссылок из ULDesk на события в Zabbix"/>
          <div>
            <div class="row q-col-gutter-md">
              <q-input v-model="form.eventTimezone" class="col-12 col-sm-6" outlined label="Часовой пояс Zabbix"
                       hint="В нём Zabbix передаёт даты событий, например Europe/Moscow"/>
              <q-input v-model.number="form.heartbeatTimeoutMinutes" class="col-12 col-sm-6" outlined type="number"
                       min="0" max="1440" label="Нет связи через, мин"
                       hint="Если Zabbix молчит дольше, статус сервисов — «Неизвестно». 0 — не следить"/>
            </div>
          </div>
          <q-input v-model="form.allowedIps" outlined label="Разрешённые адреса"
                   hint="Адреса и подсети через запятую, например 203.0.113.10, 198.51.100.0/24. Пусто — с любых"/>

          <q-separator/>

          <div v-if="!form.id" class="zabbix-dialog__note">
            Сохраните интеграцию — появятся адрес приёма событий и токен для Zabbix.
          </div>

          <template v-else>
            <div class="row items-center">
              <div class="text-subtitle1 col">Подключение Zabbix</div>
              <q-badge v-if="connectionLabel" :color="connectionColor" :label="connectionLabel"/>
            </div>

            <q-input :model-value="current.eventsUrl || '—'" outlined dense readonly label="Адрес приёма событий">
              <template #append>
                <q-btn flat round dense icon="content_copy" :disable="!current.eventsUrl" @click="copy(current.eventsUrl)">
                  <q-tooltip>Скопировать</q-tooltip>
                </q-btn>
              </template>
            </q-input>
            <q-input :model-value="current.heartbeatUrl || '—'" outlined dense readonly label="Адрес проверки связи">
              <template #append>
                <q-btn flat round dense icon="content_copy" :disable="!current.heartbeatUrl" @click="copy(current.heartbeatUrl)">
                  <q-tooltip>Скопировать</q-tooltip>
                </q-btn>
              </template>
            </q-input>

            <q-banner v-if="issuedToken" rounded class="bg-amber-1 text-amber-10">
              <div class="text-weight-medium q-mb-xs">Токен показывается один раз — сохраните его</div>
              <div class="row items-center no-wrap q-gutter-sm">
                <code class="zabbix-dialog__token col">{{ issuedToken }}</code>
                <q-btn flat dense no-caps icon="content_copy" label="Скопировать" @click="copy(issuedToken)"/>
              </div>
              <div class="text-caption q-mt-xs">
                Скачайте тип оповещений сейчас — токен уже будет подставлен в параметры.
              </div>
            </q-banner>
            <div v-else class="text-caption text-grey-7">
              {{ current.hasWebhookToken
                ? `Токен выпущен ${formatDate(current.webhookTokenIssuedAt)}. Перевыпуск отключит прежний токен.`
                : 'Токен ещё не выпущен.' }}
            </div>

            <div class="row q-gutter-sm">
              <q-btn unelevated no-caps color="primary" icon="key" :loading="issuing"
                     :label="current.hasWebhookToken ? 'Перевыпустить токен' : 'Выпустить токен'" @click="issueToken"/>
              <q-btn outline no-caps color="primary" icon="download" label="Тип оповещений для Zabbix"
                     :disable="!current.eventsUrl" :loading="downloading" @click="downloadMediaType">
                <q-tooltip>YAML для импорта: Оповещения → Способы оповещений → Импорт</q-tooltip>
              </q-btn>
            </div>

            <q-expansion-item dense icon="help_outline" label="Как настроить Zabbix" header-class="text-primary">
              <ol class="zabbix-dialog__steps">
                <li>Импортируйте скачанный файл: <b>Оповещения → Способы оповещений → Импорт</b>. Если токен не был
                  подставлен, впишите его в параметр <code>uldesk_token</code>. Проверьте кнопкой «Тест».</li>
                <li>Создайте пользователя, например <code>uldesk</code>, добавьте ему оповещение «ULDesk» и право
                  чтения нужных групп узлов. В поле «Отправлять на» впишите любое значение, например
                  <code>uldesk</code>: Zabbix требует его заполнить, но веб-хук его не использует. Важности оставьте
                  все — отбор лучше делать в действии.</li>
                <li>Создайте действие на триггеры (важность от «Предупреждение»), отправку этому пользователю, а также
                  включите <b>операции восстановления</b> и <b>операции обновления</b> — без них ULDesk не узнает,
                  что проблема ушла.</li>
                <li>Привяжите события к сервисам: тег <code>uldesk_service=&lt;код сервиса&gt;</code> на триггере или
                  узле, либо узлы и группы узлов в карточке сервиса (вкладка «Мониторинг»).</li>
                <li>Для проверки связи добавьте на узел сервера Zabbix элемент данных типа <b>HTTP agent</b>:
                  URL — адрес проверки связи, заголовок <code>X-ULDesk-Token</code> с токеном, интервал 5m,
                  тип информации — числовой. Ответ <code>1</code> — связь есть.</li>
                <li>Разрешите исходящий HTTPS с сервера Zabbix (или его прокси) на адрес ULDesk. Прокси можно указать
                  в параметре <code>http_proxy</code>.</li>
              </ol>
            </q-expansion-item>
          </template>
        </template>

        <q-toggle v-model="form.active" label="Активна"/>
      </q-card-section>

      <q-separator/>

      <q-card-actions align="right">
        <q-btn flat label="Закрыть" @click="close"/>
        <q-btn color="primary" label="Сохранить" :loading="saving" @click="save"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import { copyToClipboard } from 'quasar'

const emptyForm = () => ({
  id: null,
  name: '',
  mode: 'WEBHOOK',
  baseUrl: '',
  username: '',
  password: '',
  apiToken: '',
  active: true,
  requestTimeoutSeconds: 15,
  publicUrl: window.location.origin,
  eventTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
  allowedIps: '',
  heartbeatTimeoutMinutes: 15
})

export default {
  name: 'ZabbixIntegrationDialog',

  props: {
    modelValue: { type: Boolean, default: false },
    // Строка из GET /api/v1/zabbix-integrations или null — новая интеграция
    integration: { type: Object, default: null }
  },

  emits: ['update:modelValue', 'saved'],

  data () {
    return {
      form: emptyForm(),
      current: {},
      saving: false,
      issuing: false,
      downloading: false,
      issuedToken: '',
      modeOptions: [
        {
          value: 'WEBHOOK',
          label: 'Веб-хук (Zabbix → ULDesk)',
          caption: 'Zabbix сам отправляет события в ULDesk. Подходит, когда Zabbix в закрытом контуре клиента: нужен только исходящий HTTPS.'
        },
        {
          value: 'API_POLLING',
          label: 'Опрос API (ULDesk → Zabbix)',
          caption: 'ULDesk раз в минуту запрашивает проблемы через API. Zabbix должен быть доступен из сети ULDesk.'
        }
      ]
    }
  },

  computed: {
    connectionLabel () {
      if (!this.current.hasWebhookToken) return ''
      if (this.current.connectionLost) return 'Нет связи'
      if (!this.current.lastEventAt && !this.current.lastHeartbeatAt) return 'Ожидаем Zabbix'
      return 'Связь есть'
    },

    connectionColor () {
      if (this.current.connectionLost) return 'negative'
      if (!this.current.lastEventAt && !this.current.lastHeartbeatAt) return 'grey-7'
      return 'positive'
    }
  },

  watch: {
    modelValue (value) {
      if (value) this.reset()
    }
  },

  methods: {
    required (value) {
      return Boolean(String(value || '').trim()) || 'Обязательное поле'
    },

    reset () {
      const row = this.integration
      this.issuedToken = ''
      this.current = row ? { ...row } : {}
      this.form = row
        ? {
            ...emptyForm(),
            ...row,
            password: '',
            apiToken: '',
            mode: row.mode || 'API_POLLING',
            baseUrl: String(row.baseUrl || '').replace(/\/?api_jsonrpc\.php$/, ''),
            publicUrl: row.publicUrl || window.location.origin,
            eventTimezone: row.eventTimezone || emptyForm().eventTimezone,
            allowedIps: row.allowedIps || ''
          }
        : emptyForm()
    },

    close () {
      this.$emit('update:modelValue', false)
    },

    async save () {
      this.saving = true
      try {
        const id = this.form.id
        const payload = { ...this.form }
        delete payload.id
        const { data } = id
          ? await axios.patch(`/api/v1/zabbix-integration/${id}`, payload)
          : await axios.post('/api/v1/zabbix-integration', payload)
        this.$emit('saved', data)
        if (!id && data?.mode === 'WEBHOOK') {
          // Остаёмся в окне: следующий шаг — выпустить токен
          this.form = { ...this.form, id: data.id }
          this.current = { ...data }
          this.notify('positive', 'Интеграция сохранена. Выпустите токен для Zabbix')
          return
        }
        this.current = { ...data }
        this.close()
        this.notify('positive', 'Интеграция сохранена')
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.saving = false
      }
    },

    issueToken () {
      const run = async () => {
        this.issuing = true
        try {
          const { data } = await axios.post(`/api/v1/zabbix-integration/${this.form.id}/webhook-token`)
          this.issuedToken = data.token
          this.current = {
            ...this.current,
            eventsUrl: data.eventsUrl,
            heartbeatUrl: data.heartbeatUrl,
            hasWebhookToken: true,
            webhookTokenIssuedAt: new Date().toISOString()
          }
          this.$emit('saved', null)
        } catch (error) {
          this.notifyError(error)
        } finally {
          this.issuing = false
        }
      }
      if (!this.current.hasWebhookToken) {
        run()
        return
      }
      this.$q.dialog({
        title: 'Перевыпустить токен?',
        message: 'Прежний токен перестанет работать: Zabbix не сможет отправлять события, пока в нём не обновят токен.',
        cancel: true
      }).onOk(run)
    },

    async downloadMediaType () {
      this.downloading = true
      try {
        const { data } = await axios.post(`/api/v1/zabbix-integration/${this.form.id}/media-type`,
          this.issuedToken ? { token: this.issuedToken } : {})
        const blob = new Blob([data.content], { type: 'application/x-yaml;charset=utf-8' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = data.fileName || 'zbx_mediatype_uldesk.yaml'
        link.click()
        URL.revokeObjectURL(link.href)
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.downloading = false
      }
    },

    async copy (text) {
      try {
        await copyToClipboard(text)
        this.notify('positive', 'Скопировано')
      } catch (error) {
        this.notify('negative', 'Не удалось скопировать')
      }
    },

    formatDate (value) {
      if (!value) return '—'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('ru-RU')
    },

    notify (type, message) {
      this.$q.notify({ type, message })
    },

    notifyError (error) {
      const data = error?.response?.data
      this.notify('negative', data?.message || (typeof data === 'string' && data) || error?.message || 'Ошибка')
    }
  }
}
</script>

<style scoped>
.zabbix-dialog {
  width: 760px;
  max-width: 96vw;
  max-height: 92vh;
}

.zabbix-dialog__body {
  overflow-y: auto;
}

.zabbix-dialog__note {
  padding: 12px 14px;
  border: 1px dashed #c9c9c9;
  border-radius: 8px;
  color: #666;
}

.zabbix-dialog__token {
  padding: 6px 8px;
  overflow-wrap: anywhere;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.05);
  font-size: 13px;
}

.zabbix-dialog__steps {
  margin: 8px 0 4px;
  padding-left: 20px;
  line-height: 1.55;
}

.zabbix-dialog__steps li + li {
  margin-top: 6px;
}
</style>
