<template>
  <q-dialog v-model="dialogVisible" persistent>
    <q-card class="support-line-dialog column no-wrap app-support-line-dialog">
      <q-toolbar class="support-line-dialog__toolbar app-shared-service-dialog__toolbar">
        <q-toolbar-title>{{ isNew ? 'Новая линия' : 'Изменить линию' }}</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="dialogVisible = false"/>
      </q-toolbar>

      <q-tabs
        v-model="dialogTab"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="support-line-dialog__tabs app-shared-service-dialog__tabs"
      >
        <q-tab name="general" label="Основное" no-caps/>
        <q-tab name="team" label="Команда" no-caps/>
        <q-tab name="distribution" label="Распределение" no-caps/>
        <q-tab name="ola" label="OLA" no-caps/>
      </q-tabs>

      <q-separator/>

      <q-tab-panels v-model="dialogTab" animated class="support-line-dialog__panels col app-shared-service-dialog__panels">
        <q-tab-panel name="general" class="support-line-dialog__panel app-shared-service-dialog__panel">
          <div class="support-line-dialog__content q-gutter-y-md">
            <q-input v-model="form.name" outlined label="Название *" autofocus/>
            <q-input v-model="form.description" outlined label="Описание" type="textarea" autogrow/>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input v-model.number="form.level" outlined label="Уровень" type="number" min="1"/>
              </div>
              <div class="col-12 col-sm-4 flex items-center">
                <q-toggle v-model="form.active" label="Активна"/>
              </div>
              <div class="col-12 col-sm-4 flex items-center">
                <q-toggle v-model="form.defaultSelection" label="По умолчанию"/>
              </div>
            </div>

            <q-select
              v-model="form.visibilityMode"
              :options="visibilityOptions"
              outlined
              emit-value
              map-options
              label="Видимость заявок линии"
            />
          </div>
        </q-tab-panel>

        <q-tab-panel name="team" class="support-line-dialog__panel app-shared-service-dialog__panel">
          <div class="support-line-dialog__content q-gutter-y-md">
            <q-select
              v-model="form.responsibleUserId"
              :options="userOptions"
              outlined
              clearable
              emit-value
              map-options
              use-input
              input-debounce="0"
              label="Ответственный за линию"
              @update:model-value="syncTeamSelections"
            />

            <q-select
              v-model="form.memberIds"
              :options="userOptions"
              outlined
              label="Участники линии"
              multiple
              use-chips
              emit-value
              map-options
              use-input
              input-debounce="0"
              @update:model-value="syncTeamSelections"
            />

            <q-select
              v-model="form.observerIds"
              :options="observerOptions"
              outlined
              label="Наблюдатели"
              hint="Видят заявки и показатели линии, но не участвуют в автоматическом назначении"
              multiple
              use-chips
              emit-value
              map-options
              use-input
              input-debounce="0"
              @update:model-value="syncTeamSelections"
            />

            <q-banner rounded class="bg-grey-2 text-grey-9">
              Ответственный автоматически включается в участников линии. Наблюдатели не появляются в списке
              исполнителей.
            </q-banner>
          </div>
        </q-tab-panel>

        <q-tab-panel name="distribution" class="support-line-dialog__panel app-shared-service-dialog__panel">
          <div class="support-line-dialog__content q-gutter-y-md">
            <q-select
              v-model="form.assignmentStrategy"
              :options="assignmentStrategyOptions"
              outlined
              emit-value
              map-options
              label="Стратегия назначения"
            />

            <q-toggle v-model="form.allowSelfAssignment" label="Разрешить участникам брать заявки в работу"/>
            <q-toggle v-model="form.notifyOnNewTask" label="Уведомлять команду о новой заявке без исполнителя"/>

            <q-input
              v-model.number="form.capacityPerMember"
              outlined
              type="number"
              min="0"
              label="Рекомендуемый лимит открытых заявок на участника"
              hint="0 — без ограничения. Пока используется как информационный параметр для интерфейса и аналитики."
            />
          </div>
        </q-tab-panel>

        <q-tab-panel name="ola" class="support-line-dialog__panel app-shared-service-dialog__panel">
          <div class="support-line-dialog__content q-gutter-y-md">
            <div class="row items-start justify-between ola-header app-ola-header">
              <div>
                <div class="text-subtitle1">Внутренний срок линии</div>
                <div class="text-caption text-grey-7">
                  OLA начинается при переводе заявки на линию и не перезапускает клиентский SLA.
                </div>
              </div>
              <q-toggle v-model="form.olaEnabled" label="Использовать OLA"/>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-7">
                <q-input
                  v-model.number="form.olaValue"
                  outlined
                  type="number"
                  min="0"
                  label="Срок"
                  :disable="!form.olaEnabled"
                />
              </div>
              <div class="col-12 col-sm-5">
                <q-select
                  v-model="form.olaUnit"
                  :options="olaUnitOptions"
                  outlined
                  emit-value
                  map-options
                  label="Единица"
                  :disable="!form.olaEnabled"
                />
              </div>
            </div>

            <q-input
              v-model.number="form.olaWarningPercent"
              outlined
              type="number"
              min="1"
              max="100"
              suffix="%"
              label="Предупреждать после расходования"
              :disable="!form.olaEnabled"
            />

            <q-toggle
              v-model="form.olaUseWorkingTime"
              label="Считать только рабочее время"
              :disable="!form.olaEnabled"
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <q-separator/>

      <q-card-actions align="right" class="support-line-dialog__actions app-shared-service-dialog__actions">
        <q-btn
          v-if="!isNew"
          unelevated
          color="negative"
          icon="delete"
          label="Удалить"
          @click="removeLine"
        />
        <q-space/>
        <q-btn flat label="Отмена" @click="dialogVisible = false"/>
        <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveLine"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import supportLineDialogMixin from './supportLineDialogMixin'
import {useStore} from 'stores/store'

// Диалог создания/редактирования линии поддержки. Открывается через ref: openCreate() / openEdit(line).
export default {
  name: 'SupportLineDialog',
  mixins: [supportLineDialogMixin],

  setup() {
    return {store: useStore()}
  }
}
</script>

<style scoped>
.support-line-dialog__content {
  padding: 24px;
}
@media (max-width: 599px) {

  .support-line-dialog__content {
    padding: 16px;
  }
}
</style>
