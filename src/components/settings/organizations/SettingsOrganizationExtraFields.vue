<template>
  <q-list bordered class="rounded-borders organization-extra-list">
    <!-- eslint-disable vue/no-mutating-props -->
    <q-expansion-item
      default-opened
      icon="badge"
      label="Реквизиты и адреса"
      header-class="text-weight-medium"
    >
      <div class="q-pa-md row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.inn" label="ИНН" outlined dense/>
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.kpp" label="КПП" outlined dense/>
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.externalId" label="Внешний ID / код клиента" outlined dense/>
        </div>
        <div class="col-12 col-md-8">
          <q-input v-model="dialog.mainAddress" label="Основной адрес" outlined dense/>
        </div>
        <div class="col-12 col-md-4">
          <q-select
            v-model="dialog.priorityLevel"
            :options="priorityLevelOptions"
            emit-value
            map-options
            label="Приоритет клиента"
            outlined
            dense
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model="dialog.serviceAddresses"
            type="textarea"
            autogrow
            label="Адреса / объекты обслуживания"
            hint="Каждый адрес можно писать с новой строки"
            outlined
            dense
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model="dialog.communicationChannels"
            type="textarea"
            autogrow
            label="Каналы связи"
            hint="Email, телефон, Telegram, WhatsApp, портал"
            outlined
            dense
          />
        </div>
      </div>
    </q-expansion-item>

    <q-separator/>

    <q-expansion-item
      icon="support_agent"
      label="Ответственный менеджер"
      header-class="text-weight-medium"
    >
      <div class="q-pa-md row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.managerName" label="Ответственный менеджер" outlined dense/>
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.managerPhone" label="Телефон менеджера" outlined dense/>
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.managerEmail" label="Email менеджера" outlined dense/>
        </div>
      </div>
    </q-expansion-item>

    <q-separator/>

    <q-expansion-item
      icon="description"
      label="Договор и тариф"
      header-class="text-weight-medium"
    >
      <div class="q-pa-md row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.contractNumber" label="Номер договора" outlined dense/>
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.contractStartDate" type="date" label="Дата начала договора" outlined dense
                   stack-label/>
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.contractEndDate" type="date" label="Дата окончания договора" outlined dense
                   stack-label/>
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.tariffName" label="Тариф" outlined dense/>
        </div>
        <div class="col-12 col-md-4">
          <q-input v-model="dialog.servicePackageName" label="Пакет обслуживания" outlined dense/>
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model.number="dialog.monthlyFee"
            type="number"
            label="Абонентская плата"
            outlined
            dense
            suffix="₽"
          />
        </div>
        <div class="col-12">
          <q-input
            v-model="dialog.description"
            type="textarea"
            autogrow
            label="Краткое описание договорённостей"
            outlined
            dense
          />
        </div>
      </div>
    </q-expansion-item>

    <q-separator/>

    <q-expansion-item
      icon="directions_car"
      label="Дополнительные настройки выездов"
      header-class="text-weight-medium"
    >
      <div class="q-pa-md row q-col-gutter-md">
        <div class="col-12 col-md-4">
          <q-input
            v-model.number="dialog.extraVisitPrice"
            type="number"
            min="0"
            label="Выезд сверх пакета"
            suffix="₽"
            outlined
            dense
            :disable="!dialog.useVisitsLimit"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model.number="dialog.urgentVisitPrice"
            type="number"
            min="0"
            label="Срочный выезд"
            suffix="₽"
            outlined
            dense
            :disable="!dialog.useVisitsLimit"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model.number="dialog.visitResetDay"
            type="number"
            min="1"
            max="31"
            label="День сброса лимита"
            outlined
            dense
            :disable="!dialog.useVisitsLimit"
          />
        </div>
        <div class="col-12">
          <q-toggle
            v-model="dialog.includedRemoteSupport"
            label="Удалённая поддержка входит в абонентскую плату"
            color="primary"
          />
        </div>
      </div>
    </q-expansion-item>

    <q-separator/>

    <!--              <q-expansion-item-->
    <!--                icon="timer"-->
    <!--                label="SLA"-->
    <!--                header-class="text-weight-medium"-->
    <!--              >-->
    <!--                <div class="q-pa-md row q-col-gutter-md">-->
    <!--                  <div class="col-12 col-md-4">-->
    <!--                    <q-input v-model="dialog.slaAgreementName" label="Название SLA / регламента" outlined dense />-->
    <!--                  </div>-->
    <!--                  <div class="col-12 col-md-4">-->
    <!--                    <q-input-->
    <!--                      v-model.number="dialog.slaFirstResponseMinutes"-->
    <!--                      type="number"-->
    <!--                      min="0"-->
    <!--                      label="Первый ответ"-->
    <!--                      suffix="мин"-->
    <!--                      outlined-->
    <!--                      dense-->
    <!--                    />-->
    <!--                  </div>-->
    <!--                  <div class="col-12 col-md-4">-->
    <!--                    <q-input-->
    <!--                      v-model.number="dialog.slaResolutionHours"-->
    <!--                      type="number"-->
    <!--                      min="0"-->
    <!--                      label="Решение"-->
    <!--                      suffix="ч"-->
    <!--                      outlined-->
    <!--                      dense-->
    <!--                    />-->
    <!--                  </div>-->
    <!--                  <div class="col-12 col-md-6">-->
    <!--                    <q-select-->
    <!--                      v-model="dialog.slaWorkCalendar"-->
    <!--                      :options="slaCalendarOptions"-->
    <!--                      emit-value-->
    <!--                      map-options-->
    <!--                      label="Как считать SLA"-->
    <!--                      outlined-->
    <!--                      dense-->
    <!--                    />-->
    <!--                  </div>-->
    <!--                  <div class="col-12 col-md-6">-->
    <!--                    <q-toggle-->
    <!--                      v-model="dialog.pauseSlaOnWaitingClient"-->
    <!--                      label="Ставить SLA на паузу при ожидании клиента"-->
    <!--                      color="primary"-->
    <!--                    />-->
    <!--                  </div>-->

    <!--                  <div class="col-12">-->
    <!--                    <div class="text-subtitle2 q-mb-sm">SLA по приоритетам из настроек</div>-->
    <!--                    <q-markup-table flat bordered dense>-->
    <!--                      <thead>-->
    <!--                      <tr>-->
    <!--                        <th class="text-left">Приоритет</th>-->
    <!--                        <th class="text-left">Значение</th>-->
    <!--                        <th class="text-left">Единица</th>-->
    <!--                      </tr>-->
    <!--                      </thead>-->
    <!--                      <tbody>-->
    <!--                      <tr v-for="priority in priorities" :key="priority.id">-->
    <!--                        <td class="text-left">-->
    <!--                          {{ priority.name }}-->
    <!--                        </td>-->
    <!--                        <td class="text-left sla-value-cell">-->
    <!--                          <q-input-->
    <!--                            v-model.number="dialogPrioritySla[priority.id].value"-->
    <!--                            type="number"-->
    <!--                            min="0"-->
    <!--                            dense-->
    <!--                            outlined-->
    <!--                          />-->
    <!--                        </td>-->
    <!--                        <td class="text-left sla-unit-cell">-->
    <!--                          <q-select-->
    <!--                            v-model="dialogPrioritySla[priority.id].unit"-->
    <!--                            :options="slaUnitOptions"-->
    <!--                            emit-value-->
    <!--                            map-options-->
    <!--                            dense-->
    <!--                            outlined-->
    <!--                          />-->
    <!--                        </td>-->
    <!--                      </tr>-->
    <!--                      <tr v-if="priorities.length === 0">-->
    <!--                        <td colspan="3" class="text-center text-grey-7 q-pa-md">-->
    <!--                          Приоритеты не найдены-->
    <!--                        </td>-->
    <!--                      </tr>-->
    <!--                      </tbody>-->
    <!--                    </q-markup-table>-->
    <!--                  </div>-->

    <!--                  <div class="col-12">-->
    <!--                    <q-input-->
    <!--                      v-model="dialog.slaComment"-->
    <!--                      type="textarea"-->
    <!--                      autogrow-->
    <!--                      label="Комментарий по SLA"-->
    <!--                      outlined-->
    <!--                      dense-->
    <!--                    />-->
    <!--                  </div>-->
    <!--                </div>-->
    <!--              </q-expansion-item>-->
    <!--              <q-separator />-->

    <q-expansion-item
      icon="notes"
      label="Внутренние заметки"
      header-class="text-weight-medium"
    >
      <div class="q-pa-md">
        <q-input
          v-model="dialog.internalComment"
          type="textarea"
          autogrow
          label="Внутренний комментарий"
          outlined
          dense
        />
      </div>
    </q-expansion-item>
  </q-list>
</template>

<script>
import {PRIORITY_LEVEL_OPTIONS} from 'src/util/settingsOrganizations/organizationDefaults'

// Вкладка «Дополнительно» диалога организации: реквизиты, менеджер, договор, выезды, заметки.
// dialog — объект формы из SettingsOrganizationDialog: поля правятся по месту через v-model
// (так же, как раньше на странице), поэтому правило vue/no-mutating-props отключено в шаблоне.
export default {
  name: 'SettingsOrganizationExtraFields',

  props: {
    dialog: {type: Object, required: true}
  },

  data: () => ({
    priorityLevelOptions: PRIORITY_LEVEL_OPTIONS
  })
}
</script>

<style scoped>
.organization-extra-list :deep(.q-item) {
  padding: 16px 20px;
}

.organization-extra-list :deep(.q-expansion-item__content > .q-pa-md) {
  padding: 20px 24px;
}

.organization-extra-list :deep(.q-expansion-item__content) {
  background: var(--app-surface, #fff);
}

.sla-value-cell {
  width: 180px;
}

.sla-unit-cell {
  width: 180px;
}
</style>
