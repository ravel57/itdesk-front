<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Клиенты</div>
        <div class="settings-content-description">
          Управляйте учетными записями клиентов и их привязкой к организациям.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="upload_file"
          label="Импорт из CSV"
          @click="openImportDialog"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          label="Добавить клиента"
          @click="dialogNewClient"
        />
        <q-input
          v-model="clientSearch"
          dense
          outlined
          clearable
          debounce="150"
          placeholder="Поиск клиентов"
          class="settings-search"
        >
          <template #prepend>
            <q-icon name="search"/>
          </template>
        </q-input>
      </div>
    </div>

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
                no-caps
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
                no-caps
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

    <div class="table-container">
      <q-table
        class="settings-row-table"
        :rows="filteredClientUsers"
        :columns="columns"
        row-key="id"
        full-width
        :rows-per-page-options="[10, 20, 50]"
        rows-per-page-label="Строк на странице"
      >
        <template #body-cell-organization="props">
          <q-td :props="props">
            <div
              class="organization-name-ellipsis"
              style="max-width: 320px"
              :title="props.row.organizationName || ''"
            >{{ props.row.organizationName || '—' }}</div>
          </q-td>
        </template>

        <template #body-cell-edit="props">
          <q-td>
            <q-btn
              color="primary"
              dense
              flat
              icon="edit"
              @click="editClient(props.row)"
            >
              <q-tooltip>Изменить клиента</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </div>
  </div>

  <q-dialog
    v-model="dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ isNewClient ? 'Новый клиент' : 'Изменить клиента' }}
        </div>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>

      <q-card-section class="q-pt-none">
        <q-input
          ref="lastname"
          v-model="dialogLastName"
          label="Фамилия *"
          :rules="[requiredRule]"
        />
        <q-input
          v-model="dialogFirstName"
          label="Имя *"
          :rules="[requiredRule]"
        />
        <q-input
          v-model="dialogUsername"
          label="e-mail (username) *"
          :disable="!isNewClient"
          :rules="[requiredRule]"
        />
        <q-input
          v-if="isNewClient"
          v-model="dialogPassword"
          label="Пароль *"
          type="password"
          :rules="[requiredRule]"
        />

        <q-toggle
          v-if="isNewClient"
          v-model="dialogLinkExistingClient"
          label="Привязать к существующей карточке клиента"
          class="q-mt-sm"
          @update:model-value="onLinkExistingClientChanged"
        />

        <q-select
          v-if="shouldSelectExistingClient"
          v-model="dialogClientId"
          :options="filteredClientOptions"
          option-label="label"
          option-value="id"
          emit-value
          map-options
          use-input
          :clearable="isNewClient"
          :disable="!isNewClient"
          input-debounce="0"
          label="Карточка клиента *"
          :hint="isNewClient
            ? 'Начните вводить имя, организацию, e-mail, телефон или ID клиента'
            : 'Карточку клиента нельзя изменить после создания учётной записи'"
          :rules="[value => Boolean(value) || 'Выберите клиента']"
          @filter="filterClientOptions"
          @popup-show="resetClientOptions"
          @update:model-value="onClientCardChanged"
        />

        <div
          v-if="isNewClient && !dialogLinkExistingClient"
          class="text-caption text-grey-7 q-mt-sm"
        >
          При сохранении будет создана новая карточка клиента с указанными ФИО, e-mail и организацией.
        </div>

        <q-select
          v-model="dialogOrganizationId"
          :options="organizationOptions"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          use-input
          input-debounce="0"
          label="Организация *"
          class="organization-select"
          popup-content-class="organization-select-popup"
          hint="Организация обязательна для клиентской учётной записи"
          :rules="[value => Boolean(value) || 'Выберите организацию']"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="!isNewClient"
          outline
          no-caps
          color="primary"
          icon="key"
          label="Сменить пароль"
          @click="openPasswordDialog"
        />
        <q-btn
          v-if="!isNewClient"
          unelevated
          no-caps
          color="negative"
          icon="delete"
          label="Удалить клиента"
          @click="dialogDeleteClient"
        />
        <q-space/>
        <q-btn
          color="white"
          label="Отмена"
          text-color="primary"
          @click="dialogClose"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="dialogSaveNewOrUpdateClient"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

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
          no-caps
          color="primary"
          icon="casino"
          label="Сгенерировать надежный пароль"
          @click="generateClientPassword"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat no-caps color="primary" label="Отмена" @click="closePasswordDialog"/>
        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Сменить пароль"
          :loading="passwordSaving"
          @click="changeClientPassword"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="importDialogVisible"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="client-import-dialog column no-wrap">
      <q-toolbar class="client-import-dialog__toolbar">
        <q-icon name="upload_file" color="primary" size="28px" class="q-mr-sm"/>
        <div>
          <div class="text-h6">Импорт клиентских учетных записей</div>
          <div class="text-caption text-grey-7">
            CSV → предпросмотр и редактирование → создание учетных записей → одноразовая выгрузка паролей
          </div>
        </div>
        <q-space/>
        <q-btn flat round dense icon="close" @click="closeImportDialog"/>
      </q-toolbar>
      <q-separator/>

      <q-card-section v-if="importStage === 'select'" class="col scroll import-select-stage">
        <div class="import-drop-card">
          <q-icon name="description" color="primary" size="48px"/>
          <div class="text-h6 q-mt-sm">Выберите CSV-файл</div>
          <div class="text-body2 text-grey-7 text-center q-mt-xs q-mb-md">
            Поддерживаются экспортированные поля AD: sAMAccountName, UserPrincipalName, GivenName, Surname, mail,
            telephoneNumber, Company, Department, Title.
          </div>
          <q-file
            v-model="importFile"
            outlined
            accept=".csv,text/csv"
            label="CSV-файл"
            class="full-width"
            max-file-size="10485760"
          >
            <template #prepend><q-icon name="attach_file"/></template>
          </q-file>
          <div class="row q-gutter-sm q-mt-md justify-center">
            <q-btn
              flat
              no-caps
              color="primary"
              icon="download"
              label="Шаблон CSV"
              @click="downloadImportTemplate"
            />
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="preview"
              label="Открыть предпросмотр"
              :disable="!importFile"
              :loading="importLoading"
              @click="loadImportPreview"
            />
          </div>
        </div>
      </q-card-section>

      <template v-else-if="importStage === 'preview'">
        <q-card-section class="q-pb-sm">
          <div class="row items-center q-col-gutter-md">
            <div class="col-12 col-md-auto">
              <q-chip color="blue-1" text-color="primary" icon="table_rows">
                {{ importRows.length }} строк
              </q-chip>
              <q-chip color="green-1" text-color="positive" icon="check_circle">
                {{ selectedValidRowsCount }} готово
              </q-chip>
              <q-chip v-if="selectedInvalidRowsCount" color="red-1" text-color="negative" icon="error">
                {{ selectedInvalidRowsCount }} с ошибками
              </q-chip>
            </div>
            <q-space/>
            <div class="col-12 col-md-auto row q-gutter-sm">
              <q-btn flat dense no-caps color="primary" label="Выбрать валидные" @click="selectValidImportRows"/>
              <q-btn flat dense no-caps color="grey-7" label="Снять выбор" @click="clearImportSelection"/>
              <q-btn flat dense no-caps color="primary" icon="refresh" label="Другой файл" @click="resetImportToFile"/>
            </div>
          </div>

          <q-card flat bordered class="bulk-actions q-mt-md">
            <q-card-section class="q-pa-sm">
              <div class="row items-end q-col-gutter-sm">
                <div class="col-12 col-md-4">
                  <q-input
                    v-model="bulkDomain"
                    dense
                    outlined
                    label="Домен для коротких логинов"
                    placeholder="company.ru"
                  >
                    <template #prepend><q-icon name="alternate_email"/></template>
                  </q-input>
                </div>
                <div class="col-12 col-md-auto">
                  <q-btn
                    outline
                    no-caps
                    color="primary"
                    label="Добавить @домен"
                    :disable="!bulkDomain || selectedImportRowsCount === 0"
                    @click="applyBulkDomain"
                  />
                </div>
                <div class="col-12 col-md-4">
                  <q-select
                    v-model="bulkOrganizationId"
                    :options="organizationOptions"
                    option-label="name"
                    option-value="id"
                    emit-value
                    map-options
                    dense
                    outlined
                    clearable
                    label="Организация выбранным строкам"
                  />
                </div>
                <div class="col-12 col-md-auto">
                  <q-btn
                    outline
                    no-caps
                    color="primary"
                    label="Назначить"
                    :disable="!bulkOrganizationId || selectedImportRowsCount === 0"
                    @click="applyBulkOrganization"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-card-section>

        <q-separator/>
        <q-card-section class="col q-pa-none scroll">
          <q-table
            flat
            dense
            class="import-preview-table"
            :rows="importRows"
            :columns="importColumns"
            row-key="rowNumber"
            :rows-per-page-options="[20, 50, 100, 0]"
            rows-per-page-label="Строк на странице"
          >
            <template #header-cell-selected="props">
              <q-th :props="props">
                <q-checkbox
                  :model-value="allImportRowsSelected"
                  dense
                  @update:model-value="toggleAllImportRows"
                />
              </q-th>
            </template>
            <template #body-cell-selected="props">
              <q-td :props="props">
                <q-checkbox v-model="props.row.selected" dense/>
              </q-td>
            </template>
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :color="getImportRowState(props.row).color"
                  :text-color="getImportRowState(props.row).textColor"
                  :icon="getImportRowState(props.row).icon"
                >
                  {{ getImportRowState(props.row).label }}
                  <q-tooltip max-width="380px">{{ getImportRowState(props.row).message }}</q-tooltip>
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-username="props">
              <q-td :props="props" class="import-edit-cell import-edit-cell--username">
                <q-input v-model="props.row.username" dense borderless placeholder="login@domain.ru"/>
              </q-td>
            </template>
            <template #body-cell-firstname="props">
              <q-td :props="props" class="import-edit-cell">
                <q-input v-model="props.row.firstname" dense borderless placeholder="Имя"/>
              </q-td>
            </template>
            <template #body-cell-lastname="props">
              <q-td :props="props" class="import-edit-cell">
                <q-input v-model="props.row.lastname" dense borderless placeholder="Фамилия"/>
              </q-td>
            </template>
            <template #body-cell-organization="props">
              <q-td :props="props" class="import-edit-cell import-edit-cell--organization">
                <q-select
                  v-model="props.row.organization"
                  :options="organizationOptions"
                  option-label="name"
                  option-value="name"
                  emit-value
                  map-options
                  dense
                  borderless
                  clearable
                  options-dense
                  placeholder="Организация"
                />
              </q-td>
            </template>
            <template #body-cell-email="props">
              <q-td :props="props" class="import-edit-cell import-edit-cell--email">
                <q-input v-model="props.row.email" dense borderless placeholder="mail@domain.ru"/>
              </q-td>
            </template>
            <template #body-cell-phoneNumber="props">
              <q-td :props="props" class="import-edit-cell">
                <q-input v-model="props.row.phoneNumber" dense borderless placeholder="Телефон"/>
              </q-td>
            </template>
            <template #body-cell-moreInfo="props">
              <q-td :props="props" class="import-edit-cell import-edit-cell--info">
                <q-input v-model="props.row.moreInfo" dense borderless placeholder="Должность / описание"/>
              </q-td>
            </template>
            <template #body-cell-remove="props">
              <q-td :props="props">
                <q-btn flat dense round color="negative" icon="delete_outline" @click="removeImportRow(props.row)">
                  <q-tooltip>Убрать строку из предпросмотра</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-card-section>

        <q-separator/>
        <q-card-actions class="q-pa-md">
          <div class="text-caption text-grey-7">
            Выбрано: {{ selectedImportRowsCount }}. Пароли будут сгенерированы сервером только для новых учетных записей.
          </div>
          <q-space/>
          <q-btn flat no-caps color="primary" label="Отмена" @click="closeImportDialog"/>
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="person_add"
            label="Импортировать выбранных"
            :disable="selectedImportRowsCount === 0 || selectedInvalidRowsCount > 0"
            :loading="importLoading"
            @click="commitClientImport"
          />
        </q-card-actions>
      </template>

      <template v-else-if="importStage === 'result'">
        <q-card-section class="col scroll import-result-stage">
          <div class="import-result-card">
            <q-avatar color="positive" text-color="white" icon="check" size="64px"/>
            <div class="text-h5 q-mt-md">Импорт завершен</div>
            <div class="row q-gutter-md q-mt-md justify-center">
              <q-card flat bordered class="import-stat-card">
                <q-card-section><div class="text-h4 text-positive">{{ importResult.created || 0 }}</div><div class="text-caption">создано</div></q-card-section>
              </q-card>
              <q-card flat bordered class="import-stat-card">
                <q-card-section><div class="text-h4 text-grey-8">{{ importResult.skipped || 0 }}</div><div class="text-caption">пропущено</div></q-card-section>
              </q-card>
            </div>

            <q-banner v-if="importCredentials.length" rounded class="bg-amber-1 text-brown-9 q-mt-lg credentials-warning">
              <template #avatar><q-icon name="key" color="amber-9"/></template>
              <b>Сохраните пароли сейчас.</b> Они возвращаются только в ответе на этот импорт и не сохраняются на фронтенде после закрытия окна.
              <template #action>
                <q-btn
                  unelevated
                  no-caps
                  color="amber-9"
                  text-color="white"
                  icon="download"
                  label="Скачать CSV с логинами и паролями"
                  @click="downloadImportCredentials"
                />
              </template>
            </q-banner>

            <q-table
              v-if="importCredentials.length"
              flat
              bordered
              dense
              class="q-mt-md credentials-table"
              title="Созданные учетные записи"
              :rows="importCredentials"
              :columns="credentialColumns"
              row-key="username"
              :rows-per-page-options="[20, 50, 0]"
            >
              <template #body-cell-password="props">
                <q-td :props="props">
                  <code>{{ props.row.password }}</code>
                </q-td>
              </template>
            </q-table>

            <q-list v-if="importResult.issues?.length" bordered separator class="rounded-borders q-mt-md text-left">
              <q-item-label header>Замечания импорта</q-item-label>
              <q-item v-for="(issue, index) in importResult.issues" :key="`${issue.row}-${index}`">
                <q-item-section avatar>
                  <q-icon :name="issue.level === 'ERROR' ? 'error' : 'info'" :color="issue.level === 'ERROR' ? 'negative' : 'primary'"/>
                </q-item-section>
                <q-item-section>
                  <q-item-label>Строка {{ issue.row }}</q-item-label>
                  <q-item-label caption>{{ issue.message }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>
        <q-separator/>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn unelevated no-caps color="primary" label="Готово" @click="closeImportDialog"/>
        </q-card-actions>
      </template>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import axios from 'axios'

const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export default {
  name: 'ClientsSettingsPage',

  data: () => ({
    columns: [
      {name: 'username', label: 'E-mail', align: 'left', field: 'username'},
      {name: 'firstname', label: 'Имя', align: 'left', field: 'firstname'},
      {name: 'lastname', label: 'Фамилия', align: 'left', field: 'lastname'},
      {
        name: 'organization',
        label: 'Организация',
        align: 'left',
        field: row => row.organizationName || '—'
      },
      {
        name: 'clientCard',
        label: 'Карточка клиента',
        align: 'left',
        field: row => row.clientCardLabel || '—'
      },
      {name: 'edit', label: '', align: 'center', field: 'edit'}
    ],

    importColumns: [
      {name: 'selected', label: '', align: 'center', field: 'selected', style: 'width: 44px'},
      {name: 'rowNumber', label: '# CSV', align: 'right', field: 'rowNumber', style: 'width: 64px'},
      {name: 'status', label: 'Статус', align: 'left', field: 'status', style: 'width: 130px'},
      {name: 'username', label: 'Логин *', align: 'left', field: 'username'},
      {name: 'firstname', label: 'Имя *', align: 'left', field: 'firstname'},
      {name: 'lastname', label: 'Фамилия *', align: 'left', field: 'lastname'},
      {name: 'organization', label: 'Организация *', align: 'left', field: 'organization'},
      {name: 'email', label: 'E-mail карточки', align: 'left', field: 'email'},
      {name: 'phoneNumber', label: 'Телефон', align: 'left', field: 'phoneNumber'},
      {name: 'moreInfo', label: 'Информация', align: 'left', field: 'moreInfo'},
      {name: 'remove', label: '', align: 'center', field: 'remove'}
    ],

    credentialColumns: [
      {name: 'username', label: 'Логин', align: 'left', field: 'username'},
      {name: 'password', label: 'Пароль', align: 'left', field: 'password'},
      {name: 'lastname', label: 'Фамилия', align: 'left', field: 'lastname'},
      {name: 'firstname', label: 'Имя', align: 'left', field: 'firstname'},
      {name: 'organization', label: 'Организация', align: 'left', field: 'organization'}
    ],

    powershellScript: `Import-Module ActiveDirectory

Get-ADUser -Filter 'Enabled -eq $true' -Properties GivenName,Surname,mail,telephoneNumber,Company,Department,Title |
  Select-Object @{N='username';E={$_.SamAccountName}},
                @{N='firstname';E={$_.GivenName}},
                @{N='lastname';E={$_.Surname}},
                @{N='email';E={$_.mail}},
                @{N='phoneNumber';E={$_.telephoneNumber}},
                @{N='organization';E={if ($_.Company) {$_.Company} else {$_.Department}}},
                @{N='moreInfo';E={$_.Title}} |
  Export-Csv -Path '.\\client-users.csv' -NoTypeInformation -Encoding UTF8`,

    clientSearch: '',

    dialogVisible: false,
    dialogUsername: '',
    dialogPassword: '',
    dialogFirstName: '',
    dialogLastName: '',
    dialogClientId: null,
    dialogOrganizationId: null,
    dialogLinkExistingClient: true,
    filteredClientOptions: [],

    isNewClient: true,
    userId: null,

    passwordDialogVisible: false,
    newClientPassword: '',
    confirmClientPassword: '',
    showClientPassword: false,
    passwordSaving: false,

    importDialogVisible: false,
    importStage: 'select',
    importFile: null,
    importLoading: false,
    importRows: [],
    importResult: {},
    importCredentials: [],
    bulkDomain: '',
    bulkOrganizationId: null
  }),

  computed: {
    clientUsers() {
      return (this.store.users || [])
        .filter(user => user?.authorities?.[0] === 'CLIENT')
        .map(user => {
          const client = this.getClientById(user.clientId)
          return {
            ...user,
            organizationName: client?.organization?.name || '',
            clientCardLabel: client ? this.getClientDisplayName(client) : (user.clientId ? `Клиент #${user.clientId}` : ''),
            clientSearchValues: [
              client?.id,
              client?.email,
              client?.phoneNumber
            ]
          }
        })
    },

    filteredClientUsers() {
      const needle = this.normalizeSearch(this.clientSearch)
      if (!needle) {
        return this.clientUsers
      }

      return this.clientUsers.filter(user => this.matchesSearch([
        user.id,
        user.clientId,
        user.username,
        user.firstname,
        user.lastname,
        user.organizationName,
        user.clientCardLabel,
        ...(user.clientSearchValues || [])
      ], needle))
    },

    shouldSelectExistingClient() {
      return !this.isNewClient || this.dialogLinkExistingClient
    },

    clientOptions() {
      return (this.store.clients || [])
        .filter(client => client?.id)
        .map(client => {
          const name = this.getClientDisplayName(client)
          const organizationName = client.organization?.name || ''
          const organizationSuffix = organizationName ? ` — ${organizationName}` : ''
          const email = client.email || ''
          const phone = client.phoneNumber || ''
          return {
            id: client.id,
            label: `${name}${organizationSuffix}`,
            organizationId: client.organization?.id || null,
            searchText: [client.id, name, organizationName, email, phone]
              .filter(value => value !== null && value !== undefined && String(value).trim())
              .join(' ')
              .toLocaleLowerCase('ru-RU')
          }
        })
        .sort((left, right) => left.label.localeCompare(right.label, 'ru'))
    },

    organizationOptions() {
      return (this.store.organizations || [])
        .filter(organization => organization?.id)
        .map(organization => ({
          id: organization.id,
          name: organization.name || `Организация ${organization.id}`
        }))
        .sort((left, right) => left.name.localeCompare(right.name, 'ru'))
    },

    selectedImportRows() {
      return this.importRows.filter(row => row.selected)
    },

    selectedImportRowsCount() {
      return this.selectedImportRows.length
    },

    selectedInvalidRowsCount() {
      return this.selectedImportRows.filter(row => this.getImportRowState(row).level === 'error').length
    },

    selectedValidRowsCount() {
      return this.selectedImportRows.filter(row => this.getImportRowState(row).level !== 'error').length
    },

    allImportRowsSelected() {
      return this.importRows.length > 0 && this.importRows.every(row => row.selected)
    },

    someImportRowsSelected() {
      const selected = this.selectedImportRowsCount
      return selected > 0 && selected < this.importRows.length
    }
  },

  mounted() {
    this.resetClientOptions()
    this.loadManageableUsers()
  },

  watch: {
    'store.clients': {
      deep: true,
      handler() {
        this.resetClientOptions()
      }
    }
  },

  methods: {
    normalizeSearch(value) {
      return String(value || '').trim().toLocaleLowerCase('ru-RU')
    },

    matchesSearch(values, needle) {
      return values
        .filter(value => value !== null && value !== undefined)
        .some(value => this.normalizeSearch(value).includes(needle))
    },

    requiredRule(value) {
      return Boolean(value && String(value).length > 0) || 'Обязательное поле'
    },

    loadManageableUsers() {
      axios.get('/api/v1/users/manage')
        .then(response => {
          this.store.users = Array.isArray(response.data) ? response.data : []
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    dialogNewClient() {
      this.dialogVisible = true
      this.isNewClient = true
      this.userId = null
      this.dialogUsername = ''
      this.dialogLastName = ''
      this.dialogFirstName = ''
      this.dialogPassword = ''
      this.dialogClientId = null
      this.dialogOrganizationId = null
      this.dialogLinkExistingClient = true
      this.resetClientOptions()
      setTimeout(() => this.$refs.lastname?.focus(), 250)
    },

    editClient(row) {
      const client = this.getClientById(row.clientId)
      this.dialogVisible = true
      this.isNewClient = false
      this.userId = row.id
      this.dialogUsername = row.username
      this.dialogLastName = row.lastname || ''
      this.dialogFirstName = row.firstname || ''
      this.dialogPassword = ''
      this.dialogClientId = row.clientId || null
      this.dialogOrganizationId = client?.organization?.id || null
      this.dialogLinkExistingClient = true
      this.resetClientOptions()
    },

    dialogClose() {
      this.dialogVisible = false
    },

    dialogSaveNewOrUpdateClient() {
      const clientUser = {
        id: this.isNewClient ? null : this.userId,
        username: this.isNewClient ? this.dialogUsername : null,
        password: this.isNewClient ? this.dialogPassword : null,
        lastname: this.dialogLastName,
        firstname: this.dialogFirstName,
        authorities: 'Клиент',
        availableOrganizationIds: [],
        clientId: this.shouldSelectExistingClient ? this.dialogClientId : null,
        createNewClientCard: this.isNewClient && !this.dialogLinkExistingClient,
        clientOrganizationId: this.dialogOrganizationId
      }

      const missingRequiredField =
        (this.isNewClient && !clientUser.username) ||
        (this.isNewClient && !clientUser.password) ||
        !clientUser.lastname ||
        !clientUser.firstname ||
        !clientUser.clientOrganizationId ||
        (this.shouldSelectExistingClient && !clientUser.clientId)

      if (missingRequiredField) {
        this.notifyError('Не заполнены обязательные поля')
        return
      }

      if (this.isNewClient && !EMAIL_REGEX.test(this.dialogUsername)) {
        this.notifyError('Почта указана некорректно')
        return
      }

      const request = this.isNewClient
        ? axios.post('/api/v1/user', clientUser)
        : axios.patch('/api/v1/user', clientUser)

      request
        .then(response => {
          const savedUser = response.data
          const index = this.store.users.findIndex(item => item.id === savedUser.id)
          if (index === -1) {
            this.store.users.push(savedUser)
          } else {
            this.store.users.splice(index, 1, savedUser)
          }

          this.applyOrganizationToLocalClient(savedUser.clientId)
          this.refreshClients()
          this.dialogClose()
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    dialogDeleteClient() {
      const clientName = `${this.dialogLastName || ''} ${this.dialogFirstName || ''}`.trim() || this.dialogUsername || 'клиента'
      this.$q.dialog({
        title: 'Удалить клиентскую учётную запись?',
        message: `Учётная запись «${clientName}» будет отключена. Карточка клиента и переписка останутся в системе.`,
        cancel: {label: 'Отмена', flat: true, color: 'primary'},
        ok: {label: 'Удалить', color: 'negative', icon: 'delete', unelevated: true, noCaps: true},
        persistent: true
      }).onOk(() => {
        axios.delete(`/api/v1/delete-user/${this.userId}`)
          .then(() => {
            this.store.users = this.store.users.filter(user => user.id !== this.userId)
            this.dialogClose()
            this.$q.notify({
              message: 'Клиентская учётная запись удалена',
              type: 'positive',
              position: 'top-right'
            })
          })
          .catch(error => this.notifyError(this.getErrorMessage(error)))
      })
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
      const lower = 'abcdefghijkmnopqrstuvwxyz'
      const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
      const digits = '23456789'
      const special = '!@#$%*-_'
      const all = lower + upper + digits + special
      const chars = [
        this.secureRandomChar(lower),
        this.secureRandomChar(upper),
        this.secureRandomChar(digits),
        this.secureRandomChar(special)
      ]
      while (chars.length < 16) {
        chars.push(this.secureRandomChar(all))
      }
      for (let i = chars.length - 1; i > 0; i--) {
        const j = this.secureRandomIndex(i + 1)
        ;[chars[i], chars[j]] = [chars[j], chars[i]]
      }
      const password = chars.join('')
      this.newClientPassword = password
      this.confirmClientPassword = password
      this.showClientPassword = true
    },

    secureRandomChar(source) {
      return source[this.secureRandomIndex(source.length)]
    },

    secureRandomIndex(max) {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const array = new Uint32Array(1)
        crypto.getRandomValues(array)
        return array[0] % max
      }
      return Math.floor(Math.random() * max)
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
          this.$q.notify({message: 'Пароль клиента изменён', type: 'positive', position: 'top-right'})
          this.closePasswordDialog()
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
        .finally(() => {
          this.passwordSaving = false
        })
    },

    openImportDialog() {
      this.resetImportState()
      this.importDialogVisible = true
    },

    closeImportDialog() {
      this.importDialogVisible = false
      this.resetImportState()
    },

    resetImportState() {
      this.importStage = 'select'
      this.importFile = null
      this.importLoading = false
      this.importRows = []
      this.importResult = {}
      this.importCredentials = []
      this.bulkDomain = ''
      this.bulkOrganizationId = null
    },

    resetImportToFile() {
      this.importStage = 'select'
      this.importFile = null
      this.importRows = []
      this.importResult = {}
      this.importCredentials = []
    },

    loadImportPreview() {
      if (!this.importFile) {
        return
      }
      const formData = new FormData()
      formData.append('file', this.importFile)
      this.importLoading = true
      axios.post('/api/v1/client-users/import-csv/preview', formData, {
        headers: {'Content-Type': 'multipart/form-data'}
      })
        .then(response => {
          const rows = Array.isArray(response.data?.rows) ? response.data.rows : []
          this.importRows = rows.map(row => ({
            ...row,
            selected: Boolean(row.selected),
            originalUsername: row.username || '',
            originalStatus: row.status || '',
            originalMessage: row.message || ''
          }))
          this.importStage = 'preview'
          if (!rows.length) {
            this.$q.notify({message: 'В CSV нет строк для импорта', type: 'warning', position: 'top-right'})
          }
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
        .finally(() => {
          this.importLoading = false
        })
    },

    getImportRowState(row) {
      const username = String(row?.username || '').trim()
      const firstname = String(row?.firstname || '').trim()
      const lastname = String(row?.lastname || '').trim()
      const organization = String(row?.organization || '').trim()
      const errors = []
      if (!username) {
        errors.push('не указан логин')
      } else if (!EMAIL_REGEX.test(username)) {
        errors.push('логин должен быть в формате name@domain.zone')
      }
      if (!firstname) errors.push('не указано имя')
      if (!lastname) errors.push('не указана фамилия')
      if (!organization) errors.push('не указана организация')

      if (errors.length) {
        return {
          level: 'error', label: 'Ошибка', message: errors.join('; '),
          color: 'red-1', textColor: 'negative', icon: 'error'
        }
      }

      if (row.originalStatus === 'WARNING' && username === row.originalUsername) {
        return {
          level: 'warning', label: 'Проверить', message: row.originalMessage || 'Строка требует внимания',
          color: 'amber-2', textColor: 'brown-9', icon: 'warning'
        }
      }

      const orgExists = this.organizationOptions.some(item => this.normalizeSearch(item.name) === this.normalizeSearch(organization))
      if (!orgExists) {
        return {
          level: 'error', label: 'Ошибка', message: 'Организация не найдена. Выберите организацию из списка.',
          color: 'red-1', textColor: 'negative', icon: 'error'
        }
      }

      return {
        level: 'ready', label: 'Готово', message: 'Строка готова к импорту',
        color: 'green-1', textColor: 'positive', icon: 'check_circle'
      }
    },

    applyBulkDomain() {
      const domain = String(this.bulkDomain || '').trim().replace(/^@+/, '')
      if (!domain) return
      this.importRows.forEach(row => {
        if (!row.selected) return
        const username = String(row.username || '').trim()
        if (username && !username.includes('@')) {
          row.username = `${username}@${domain}`.toLowerCase()
        }
      })
    },

    applyBulkOrganization() {
      const organization = this.organizationOptions.find(item => Number(item.id) === Number(this.bulkOrganizationId))
      if (!organization) return
      this.importRows.forEach(row => {
        if (row.selected) {
          row.organization = organization.name
        }
      })
    },

    selectValidImportRows() {
      this.importRows.forEach(row => {
        row.selected = this.getImportRowState(row).level !== 'error'
      })
    },

    clearImportSelection() {
      this.importRows.forEach(row => {
        row.selected = false
      })
    },

    toggleAllImportRows(value) {
      this.importRows.forEach(row => {
        row.selected = Boolean(value)
      })
    },

    removeImportRow(row) {
      this.importRows = this.importRows.filter(item => item !== row)
    },

    commitClientImport() {
      if (!this.selectedImportRowsCount || this.selectedInvalidRowsCount) {
        return
      }
      const rows = this.importRows.map(row => ({
        rowNumber: row.rowNumber,
        selected: Boolean(row.selected),
        username: String(row.username || '').trim(),
        firstname: String(row.firstname || '').trim(),
        lastname: String(row.lastname || '').trim(),
        email: String(row.email || '').trim(),
        phoneNumber: String(row.phoneNumber || '').trim(),
        organization: String(row.organization || '').trim(),
        moreInfo: String(row.moreInfo || '').trim()
      }))

      this.importLoading = true
      axios.post('/api/v1/client-users/import-csv', { rows })
        .then(response => {
          this.importResult = response.data || {}
          this.importCredentials = Array.isArray(response.data?.credentials) ? response.data.credentials : []
          this.importStage = 'result'
          this.loadManageableUsers()
          this.refreshClients()
        })
        .catch(error => this.notifyError(this.getErrorMessage(error)))
        .finally(() => {
          this.importLoading = false
        })
    },

    downloadImportTemplate() {
      axios.get('/api/v1/client-users/import-csv/template', {responseType: 'blob'})
        .then(response => this.downloadBlob(response.data, 'client-users-import-template.csv', 'text/csv;charset=utf-8'))
        .catch(error => this.notifyError(this.getErrorMessage(error)))
    },

    downloadImportCredentials() {
      if (!this.importCredentials.length) {
        return
      }
      const columns = ['username', 'password', 'lastname', 'firstname', 'organization']
      const lines = [columns.join(';')]
      this.importCredentials.forEach(row => {
        lines.push(columns.map(column => this.escapeCsvValue(row[column])).join(';'))
      })
      const csv = `\uFEFF${lines.join('\r\n')}`
      this.downloadBlob(new Blob([csv], {type: 'text/csv;charset=utf-8'}), 'client-import-credentials.csv')
    },

    escapeCsvValue(value) {
      const stringValue = String(value ?? '')
      if (/[;"\r\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    },

    downloadBlob(data, filename, mimeType) {
      const blob = data instanceof Blob ? data : new Blob([data], {type: mimeType || 'application/octet-stream'})
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },

    copyPowerShell() {
      const done = () => this.$q.notify({message: 'PowerShell-команда скопирована', type: 'positive', position: 'top-right'})
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(this.powershellScript).then(done).catch(() => this.copyTextFallback(this.powershellScript, done))
        return
      }
      this.copyTextFallback(this.powershellScript, done)
    },

    copyTextFallback(text, onDone) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      document.execCommand('copy')
      textarea.remove()
      onDone()
    },

    onLinkExistingClientChanged(linkExisting) {
      this.dialogClientId = null
      if (linkExisting) {
        this.dialogOrganizationId = null
      }
    },

    onClientCardChanged(clientId) {
      const client = this.getClientById(clientId)
      this.dialogOrganizationId = client?.organization?.id || null
    },

    getClientById(clientId) {
      return (this.store.clients || []).find(client => Number(client?.id) === Number(clientId)) || null
    },

    getClientDisplayName(client) {
      return `${client?.lastname || ''} ${client?.firstname || ''}`.trim() || `Клиент #${client?.id}`
    },

    resetClientOptions() {
      this.filteredClientOptions = [...this.clientOptions]
    },

    filterClientOptions(value, update) {
      update(() => {
        const needle = String(value || '').trim().toLocaleLowerCase('ru-RU')
        this.filteredClientOptions = needle
          ? this.clientOptions.filter(client => client.searchText.includes(needle))
          : [...this.clientOptions]
      })
    },

    applyOrganizationToLocalClient(clientId) {
      const client = this.getClientById(clientId)
      const organization = (this.store.organizations || [])
        .find(item => Number(item?.id) === Number(this.dialogOrganizationId))
      if (client && organization) {
        client.organization = organization
      }
    },

    refreshClients() {
      axios.get('/api/v1/clients')
        .then(response => {
          if (Array.isArray(response.data)) {
            this.store.clients = response.data
          }
        })
        .catch(() => undefined)
    },

    notifyError(message) {
      this.$q.notify({
        message,
        type: 'negative',
        position: 'top-right',
        actions: [{icon: 'close', color: 'white', dense: true}]
      })
    },

    getErrorMessage(error) {
      const data = error?.response?.data
      if (typeof data === 'string' && data.trim()) {
        return data
      }
      return data?.error || data?.message || error?.message || 'Не удалось выполнить операцию'
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.table-container {
  width: 100%;
}

.settings-search {
  width: 320px;
  max-width: 100%;
}

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

.client-import-dialog {
  background: #f7f9fc;
}

.client-import-dialog__toolbar {
  min-height: 70px;
  background: white;
  padding-left: 20px;
  padding-right: 16px;
}

.import-select-stage,
.import-result-stage {
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-drop-card,
.import-result-card {
  width: min(920px, 100%);
  padding: 32px;
  border: 1px dashed #b7c6d9;
  border-radius: 16px;
  background: white;
  text-align: center;
}

.import-drop-card :deep(.q-field) {
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
}

.bulk-actions {
  border-radius: 10px;
  background: white;
}

.import-preview-table {
  min-width: 1450px;
}

.import-preview-table :deep(thead tr th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f2f5f9;
  font-weight: 600;
}

.import-edit-cell {
  min-width: 150px;
  background: rgba(255, 255, 255, .8);
}

.import-edit-cell--username,
.import-edit-cell--email {
  min-width: 220px;
}

.import-edit-cell--organization {
  min-width: 200px;
}

.import-edit-cell--info {
  min-width: 240px;
}

.import-edit-cell :deep(.q-field__control) {
  padding: 0 4px;
}

.import-edit-cell :deep(.q-field__native) {
  font-size: 13px;
}

.import-stat-card {
  min-width: 130px;
}

.credentials-warning {
  text-align: left;
}

.credentials-table {
  text-align: left;
}

@media (max-width: 900px) {
  .settings-content-actions {
    width: 100%;
  }

  .settings-search {
    width: 100%;
  }

  .import-drop-card,
  .import-result-card {
    padding: 20px;
  }
}
</style>
