<template>
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
              color="primary"
              icon="download"
              label="Шаблон CSV"
              @click="downloadImportTemplate"
            />
            <q-btn
              unelevated
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
              <q-btn flat dense color="primary" label="Выбрать валидные" @click="selectValidImportRows"/>
              <q-btn flat dense color="grey-7" label="Снять выбор" @click="clearImportSelection"/>
              <q-btn flat dense color="primary" icon="refresh" label="Другой файл" @click="resetImportToFile"/>
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
          <q-btn flat color="primary" label="Отмена" @click="closeImportDialog"/>
          <q-btn
            unelevated
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
          <q-btn unelevated color="primary" label="Готово" @click="closeImportDialog"/>
        </q-card-actions>
      </template>
    </q-card>
  </q-dialog>
</template>

<script>
import clientNotifyMixin from 'components/settings/clients/clientNotifyMixin'
import clientImportTemplateMixin from 'components/settings/clients/clientImportTemplateMixin'
import clientImportMixin from 'components/settings/clients/clientImportMixin'

// Полноэкранный диалог импорта клиентов из CSV. Открывается через openImportDialog().
// Логика — в clientImportMixin; событие imported — после успешного импорта.
export default {
  name: 'ClientImportDialog',

  mixins: [clientNotifyMixin, clientImportTemplateMixin, clientImportMixin],

  props: {
    organizationOptions: {type: Array, default: () => []}
  },

  emits: ['imported']
}
</script>

<style scoped>
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
  .import-drop-card,
  .import-result-card {
    padding: 20px;
  }
}
</style>
