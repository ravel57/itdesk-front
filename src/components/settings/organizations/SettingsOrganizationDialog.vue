<template>
  <q-dialog
    v-model="dialogVisible"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width organization-dialog">
      <q-toolbar class="justify-between organization-dialog-toolbar">
        <div class="text-h6">
          {{ isNewOrganization ? 'Новая организация' : 'Настройки организации' }}
        </div>
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>

      <q-separator/>

      <q-card-section class="q-pa-none">
        <q-tabs
          v-model="dialogTab"
          dense
          class="text-grey organization-dialog-tabs"
          active-color="primary"
          indicator-color="primary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="main" label="Основное"/>
          <q-tab name="visits" label="Выезды"/>
          <q-tab name="extra" label="Дополнительно"/>
        </q-tabs>

        <q-separator/>

        <q-tab-panels
          v-model="dialogTab"
          animated
          class="organization-tab-panels"
        >
          <q-tab-panel name="main" class="organization-tab-panel q-gutter-md">
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-md-8">
                <q-input
                  v-model="dialog.name"
                  label="Название организации *"
                  outlined
                  dense
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                  ref="dialogName"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-toggle
                  v-model="dialog.active"
                  label="Организация активна"
                  color="primary"
                />
              </div>
            </div>

            <q-banner rounded class="bg-grey-2 text-grey-9 organization-info-banner">
              <template #avatar>
                <q-icon name="groups" color="primary"/>
              </template>
              Сотрудники организации берутся из карточек клиентов, у которых выбрана эта организация.
              Сейчас привязано: <b>{{ organizationClientsCount(dialog) }}</b>
              {{ pluralize(organizationClientsCount(dialog), ['сотрудник', 'сотрудника', 'сотрудников']) }}.
            </q-banner>
          </q-tab-panel>

          <q-tab-panel name="visits" class="organization-tab-panel q-gutter-md">
            <q-toggle
              v-model="dialog.useVisitsLimit"
              label="Учитывать пакет выездов для этой организации"
              color="primary"
            />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="dialog.monthlyVisitsLimit"
                  type="number"
                  min="0"
                  label="Выездов в месяц"
                  outlined
                  dense
                  :disable="!dialog.useVisitsLimit"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="dialog.visitsUsed"
                  type="number"
                  min="0"
                  label="Использовано в периоде"
                  outlined
                  dense
                  :disable="!dialog.useVisitsLimit"
                />
              </div>

              <div class="col-12">
                <q-input
                  v-model="dialog.visitComment"
                  type="textarea"
                  autogrow
                  label="Условия выездов"
                  outlined
                  dense
                  :disable="!dialog.useVisitsLimit"
                />
              </div>
            </div>

            <q-banner rounded class="bg-grey-2 text-grey-9 organization-info-banner">
              <template #avatar>
                <q-icon name="directions_car" color="primary"/>
              </template>
              Эти поля нужны, чтобы в карточке заявки можно было списывать выезд из пакета или помечать его как
              сверхпакетный.
            </q-banner>
          </q-tab-panel>

          <q-tab-panel name="extra" class="organization-tab-panel">
            <SettingsOrganizationExtraFields :dialog="dialog"/>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator/>

      <q-card-actions align="right" class="organization-dialog-actions">
        <q-btn
          v-if="!isNewOrganization"
          unelevated
          color="negative"
          icon="delete"
          label="Удалить"
          @click="dialogDeleteOrganization"
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
          :loading="saving"
          @click="dialogSaveNewOrUpdateOrganization"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import SettingsOrganizationExtraFields from 'components/settings/organizations/SettingsOrganizationExtraFields.vue'
import settingsOrganizationHelpersMixin from 'components/settings/organizations/settingsOrganizationHelpersMixin'
import settingsOrganizationSlaMixin from 'components/settings/organizations/settingsOrganizationSlaMixin'
import settingsOrganizationDialogMixin from 'components/settings/organizations/settingsOrganizationDialogMixin'

// Диалог создания / настройки / удаления организации со своим состоянием.
// Родитель открывает его через ref: dialogNewOrganizationShow() и editRow(row).
// Событие saved — организация сохранена и список в сторе обновлён.
export default {
  name: 'SettingsOrganizationDialog',

  components: {SettingsOrganizationExtraFields},

  mixins: [settingsOrganizationHelpersMixin, settingsOrganizationSlaMixin, settingsOrganizationDialogMixin],

  emits: ['saved'],

  mounted() {
    this.loadSla()
    this.loadPrioritiesIfNeeded()
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>
.dialog-width {
  width: min(1120px, 96vw);
  max-width: 1120px;
}

.organization-dialog {
  max-height: 92vh;
}

.organization-dialog-toolbar {
  padding: 20px 24px;
}

.organization-dialog-tabs {
  padding: 0 24px;
}

.organization-tab-panel {
  padding: 24px 28px;
}

.organization-dialog-actions {
  padding: 18px 24px;
  gap: 12px;
}

.organization-tab-panels {
  min-height: 460px;
  max-height: 68vh;
  overflow-y: auto;
}

.organization-info-banner {
  padding: 18px 20px;
}
</style>
