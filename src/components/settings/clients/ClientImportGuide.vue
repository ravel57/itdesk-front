<template>
  <q-card flat bordered class="client-import-guide q-mb-md">
    <q-card-section class="row items-start no-wrap q-gutter-md">
      <q-avatar color="primary" text-color="white" icon="badge" size="42px"/>
      <div class="col">
        <div class="text-subtitle1 text-weight-medium">Импорт учетных записей из Active Directory</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Выгрузите пользователей PowerShell-командой, загрузите CSV, проверьте таблицу и при необходимости массово
          дополните логины доменом или назначьте организацию. Пароли генерируются только при фактическом импорте.
        </div>

        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-auto">
            <q-btn
              flat
              dense
              color="primary"
              icon="download"
              label="Скачать шаблон CSV"
              @click="downloadImportTemplate"
            />
          </div>
          <div class="col-auto">
            <q-btn
              flat
              dense
              color="primary"
              icon="content_copy"
              label="Скопировать PowerShell"
              @click="copyPowerShell"
            />
          </div>
        </div>

        <q-expansion-item
          dense
          dense-toggle
          switch-toggle-side
          icon="terminal"
          label="Инструкция: выгрузка пользователей из AD"
          header-class="text-primary q-px-none q-mt-sm"
        >
          <div class="client-import-guide__steps q-pb-sm">
            <ol>
              <li>Откройте PowerShell на машине с модулем <b>ActiveDirectory</b>.</li>
              <li>Выполните команду ниже. Файл <code>client-users.csv</code> появится в текущем каталоге.</li>
              <li>Нажмите <b>«Импорт из CSV»</b> и выберите файл.</li>
              <li>В предпросмотре исправьте строки с ошибками. Для <code>sAMAccountName</code> без домена используйте массовое действие <b>«Добавить @домен»</b>.</li>
              <li>После импорта скачайте CSV с логинами и паролями. После закрытия окна повторно получить эти пароли нельзя.</li>
            </ol>
            <div class="powershell-block">
              <div class="powershell-block__title">PowerShell</div>
              <pre>{{ powershellScript }}</pre>
            </div>
            <div class="text-caption text-grey-7 q-mt-sm">
              Для конкретного OU добавьте к <code>Get-ADUser</code> параметр
              <code>-SearchBase "OU=Users,DC=company,DC=local"</code>.
            </div>
          </div>
        </q-expansion-item>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import {POWERSHELL_SCRIPT} from 'src/util/settingsClients/clientImportConstants'
import {copyText} from 'src/util/settingsClients/clientFiles'
import clientNotifyMixin from 'components/settings/clients/clientNotifyMixin'
import clientImportTemplateMixin from 'components/settings/clients/clientImportTemplateMixin'

// Справка по импорту клиентов из Active Directory
export default {
  name: 'ClientImportGuide',

  mixins: [clientNotifyMixin, clientImportTemplateMixin],

  data: () => ({
    powershellScript: POWERSHELL_SCRIPT
  }),

  methods: {
    copyPowerShell() {
      const done = () => this.$q.notify({message: 'PowerShell-команда скопирована', type: 'positive'})
      copyText(this.powershellScript, done)
    }
  }
}
</script>

<style scoped>
.client-import-guide {
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.045), rgba(0, 150, 136, 0.035));
}

.client-import-guide__steps {
  max-width: 1100px;
}

.client-import-guide__steps ol {
  margin: 4px 0 14px;
  padding-left: 22px;
}

.client-import-guide__steps li + li {
  margin-top: 5px;
}

.powershell-block {
  overflow: hidden;
  border-radius: 10px;
  background: #111827;
  color: #d1fae5;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.powershell-block__title {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.06);
  color: #93c5fd;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
}

.powershell-block pre {
  margin: 0;
  padding: 14px;
  overflow: auto;
  white-space: pre;
  font-size: 12px;
  line-height: 1.5;
}
</style>
