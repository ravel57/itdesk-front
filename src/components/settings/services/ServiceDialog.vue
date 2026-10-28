<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="service-dialog column no-wrap app-service-dialog">
      <q-toolbar class="service-dialog__toolbar app-shared-service-dialog__toolbar">
        <q-toolbar-title>{{ serviceForm.id ? 'Изменить сервис' : 'Новый сервис' }}</q-toolbar-title>
        <q-btn flat round dense icon="close" @click="closeService"/>
      </q-toolbar>

      <q-tabs
        v-model="serviceTab"
        dense
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="service-dialog__tabs app-shared-service-dialog__tabs"
      >
        <q-tab name="general" label="Основное" no-caps/>
        <q-tab name="routing" label="Маршрутизация" no-caps/>
        <q-tab name="sla" label="SLA" no-caps/>
        <q-tab name="priority" label="Приоритеты" no-caps/>
        <q-tab name="ola" label="OLA" no-caps/>
        <q-tab name="monitoring" label="Мониторинг" no-caps/>
      </q-tabs>

      <q-separator/>

      <q-tab-panels v-model="serviceTab" animated class="service-dialog__panels col app-shared-service-dialog__panels">
        <q-tab-panel name="general" class="service-dialog__panel app-shared-service-dialog__panel">
          <div class="service-dialog__content">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input v-model="serviceForm.code" outlined label="Код *" autofocus/>
              </div>
              <div class="col-12 col-sm-8">
                <q-input v-model="serviceForm.name" outlined label="Название *"/>
              </div>
            </div>
            <q-input v-model="serviceForm.description" outlined type="textarea" autogrow label="Описание"/>
            <div v-if="serviceForm.id" class="service-dialog__organizations">
              <div class="text-caption text-grey-7">Организации (подключения на вкладке «Организации и договоры»)</div>
              <template v-if="serviceOrganizationNames(serviceForm).length">
                <q-chip v-for="name in serviceOrganizationNames(serviceForm)" :key="name" dense square
                        class="service-organization-chip app-shared-service-organization-chip" :label="name"/>
              </template>
              <span v-else class="text-grey-7">Не подключён ни к одной организации — доступен всем</span>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select v-model="serviceForm.criticalityId" outlined clearable emit-value map-options
                          :options="criticalityOptions" label="Критичность"/>
              </div>
              <div class="col-12 col-sm-6">
                <q-select v-model="serviceForm.ownerId" outlined clearable emit-value map-options
                          :options="userOptions" label="Владелец"/>
              </div>
            </div>
            <q-toggle v-model="serviceForm.active" label="Активен"/>
          </div>
        </q-tab-panel>

        <q-tab-panel name="routing" class="service-dialog__panel app-shared-service-dialog__panel">
          <div class="service-dialog__content">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select v-model="serviceForm.defaultSupportLineId" outlined clearable emit-value map-options
                          :options="supportLineOptions" label="Линия по умолчанию"/>
              </div>
              <div class="col-12 col-sm-6">
                <q-select v-model="serviceForm.defaultPriorityId" outlined clearable emit-value map-options
                          :options="priorityOptions" label="Приоритет по умолчанию"/>
              </div>
            </div>
            <q-select v-model="serviceForm.taskTypeIds" outlined multiple use-chips emit-value map-options
                      :options="taskTypeOptions" label="Разрешённые типы заявок"/>
            <q-select v-model="serviceForm.executorIds" outlined multiple use-chips emit-value map-options
                      :options="userOptions" label="Команда сервиса"/>
            <q-select v-model="serviceForm.dependencyIds" outlined multiple use-chips emit-value map-options
                      :options="dependencyOptions" label="Зависимые сервисы"/>
            <q-toggle v-model="serviceForm.autoAssignDefaultLine" label="Автоматически назначать линию по умолчанию"/>
          </div>
        </q-tab-panel>

        <q-tab-panel name="sla" class="service-dialog__panel app-shared-service-dialog__panel">
          <div class="service-dialog__content">
            <div>
              <div class="text-subtitle1">Нормативы сервиса</div>
              <div class="text-caption text-grey-7">Пустое значение — используются общие правила SLA.</div>
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input v-model.number="serviceForm.firstResponseSlaMinutes" outlined type="number" min="0"
                         label="Первый ответ, минут"/>
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model.number="serviceForm.resolutionSlaMinutes" outlined type="number" min="0"
                         label="Решение, минут"/>
              </div>
            </div>
            <q-input v-model="serviceForm.supportCalendar" outlined label="Календарь поддержки"
                     hint="GENERAL_SETTINGS — общий календарь"/>
            <q-toggle v-model="serviceForm.pauseSlaOnWaitingClient" label="Пауза при ожидании клиента"/>
          </div>
        </q-tab-panel>

        <q-tab-panel name="priority" class="service-dialog__panel app-shared-service-dialog__panel">
          <div class="service-dialog__content">
            <div class="service-dialog__section-header app-shared-settings-block__header">
              <div>
                <div class="text-subtitle1">Правила приоритета</div>
                <div class="text-caption text-grey-7">
                  Первое подходящее правило по порядку задаёт приоритет новой заявки.
                </div>
              </div>
              <q-btn flat color="primary" icon="add" label="Добавить правило" @click="addPriorityRule"/>
            </div>
            <div v-if="!serviceForm.priorityRules.length" class="service-dialog__empty app-empty-state">
              Правила не добавлены
            </div>
            <q-markup-table v-else flat bordered class="service-dialog__table app-rounded-8">
              <thead>
              <tr>
                <th class="text-left">Порядок</th>
                <th class="text-left">Тип заявки</th>
                <th class="text-left">Ключевое слово / regex</th>
                <th class="text-left">Приоритет</th>
                <th class="text-center">Активно</th>
                <th/>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(rule, index) in serviceForm.priorityRules" :key="index">
                <td class="service-dialog__order">
                  <q-input v-model.number="rule.orderNumber" dense borderless type="number"/>
                </td>
                <td>
                  <q-select v-model="rule.taskTypeId" dense borderless clearable emit-value map-options
                            :options="taskTypeOptions" placeholder="Любой"/>
                </td>
                <td>
                  <q-input v-model="rule.keyword" dense borderless placeholder="ошибка или regex:ошибк(а|и)"/>
                </td>
                <td>
                  <q-select v-model="rule.priorityId" dense borderless emit-value map-options
                            :options="priorityOptions"/>
                </td>
                <td class="text-center">
                  <q-toggle v-model="rule.active" dense/>
                </td>
                <td class="text-right">
                  <q-btn flat round dense icon="delete" color="negative"
                         @click="serviceForm.priorityRules.splice(index, 1)"/>
                </td>
              </tr>
              </tbody>
            </q-markup-table>
          </div>
        </q-tab-panel>

        <q-tab-panel name="ola" class="service-dialog__panel app-shared-service-dialog__panel">
          <div class="service-dialog__content">
            <div class="service-dialog__section-header app-shared-settings-block__header">
              <div>
                <div class="text-subtitle1">OLA по линиям</div>
                <div class="text-caption text-grey-7">
                  Сколько времени заявка может находиться на каждой линии поддержки.
                </div>
              </div>
              <q-btn flat color="primary" icon="add" label="Добавить этап" @click="addOlaStage"/>
            </div>
            <div v-if="!serviceForm.olaStages.length" class="service-dialog__empty app-empty-state">
              Этапы OLA не добавлены
            </div>
            <q-markup-table v-else flat bordered class="service-dialog__table app-rounded-8">
              <thead>
              <tr>
                <th class="text-left">Порядок</th>
                <th class="text-left">Линия</th>
                <th class="text-left">Длительность, сек.</th>
                <th class="text-center">Рабочее время</th>
                <th class="text-left">Предупреждение, %</th>
                <th class="text-center">Активно</th>
                <th/>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(stage, index) in serviceForm.olaStages" :key="index">
                <td class="service-dialog__order">
                  <q-input v-model.number="stage.orderNumber" dense borderless type="number"/>
                </td>
                <td>
                  <q-select v-model="stage.supportLineId" dense borderless emit-value map-options
                            :options="supportLineOptions"/>
                </td>
                <td>
                  <q-input v-model.number="stage.durationSeconds" dense borderless type="number" min="1"/>
                </td>
                <td class="text-center">
                  <q-toggle v-model="stage.useWorkingTime" dense/>
                </td>
                <td>
                  <q-input v-model.number="stage.warningPercent" dense borderless type="number" min="1" max="100"/>
                </td>
                <td class="text-center">
                  <q-toggle v-model="stage.active" dense/>
                </td>
                <td class="text-right">
                  <q-btn flat round dense icon="delete" color="negative"
                         @click="serviceForm.olaStages.splice(index, 1)"/>
                </td>
              </tr>
              </tbody>
            </q-markup-table>
          </div>
        </q-tab-panel>

        <q-tab-panel name="monitoring" class="service-dialog__panel app-shared-service-dialog__panel">
          <div class="service-dialog__content">
            <div class="service-dialog__section-header app-shared-settings-block__header">
              <div>
                <div class="text-subtitle1">Мониторинг Zabbix</div>
                <div class="text-caption text-grey-7">
                  Хосты и группы, по которым определяется состояние сервиса. Значения — через запятую.
                  Для интеграции через веб-хук проще всего поставить в Zabbix тег
                  <code>uldesk_service={{ serviceForm.code || 'код сервиса' }}</code> на триггер или узел.
                </div>
              </div>
              <q-toggle v-model="serviceForm.zabbixEnabled" label="Мониторинг включён"/>
            </div>
            <q-select v-model="serviceForm.zabbixIntegrationId" outlined clearable emit-value map-options
                      :options="zabbixOptions" label="Интеграция Zabbix" :disable="!serviceForm.zabbixEnabled"/>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input v-model="serviceForm.monitoringIdentifiers.hostIds" outlined label="Host ID"
                         :disable="!serviceForm.zabbixEnabled"/>
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="serviceForm.monitoringIdentifiers.hostNames" outlined label="Host names"
                         :disable="!serviceForm.zabbixEnabled"/>
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="serviceForm.monitoringIdentifiers.hostGroupIds" outlined label="Host group ID"
                         :disable="!serviceForm.zabbixEnabled" hint="Для опроса API"/>
              </div>
              <div class="col-12">
                <q-input v-model="serviceForm.monitoringIdentifiers.hostGroupNames" outlined label="Группы узлов (названия)"
                         :disable="!serviceForm.zabbixEnabled"
                         hint="Для веб-хука: Zabbix передаёт названия групп, а не ID"/>
              </div>
            </div>
            <q-input v-model="serviceForm.monitoringUrl" outlined label="Ссылка на мониторинг / дашборд"/>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <q-separator/>

      <q-card-actions align="right" class="service-dialog__actions app-shared-service-dialog__actions">
        <q-btn
          v-if="serviceForm.id"
          unelevated
          color="negative"
          icon="delete"
          label="Удалить"
          @click="$emit('remove', serviceForm)"
        />
        <q-space/>
        <q-btn flat label="Отмена" @click="closeService"/>
        <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveService"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import serviceDialogMixin from './serviceDialogMixin'

// Диалог создания/редактирования сервиса (вкладки: основное, маршрутизация, SLA, приоритеты, OLA, мониторинг).
// Открытие — через v-model; service — строка таблицы или null для нового сервиса.
// События: update:modelValue, close (закрыть с очисткой маршрута), saved (сервис сохранён), remove (удалить сервис).
export default {
  name: 'ServiceDialog',

  mixins: [serviceDialogMixin],

  props: {
    modelValue: {type: Boolean, default: false},
    service: {type: Object, default: null},
    services: {type: Array, default: () => []},
    criticalities: {type: Array, default: () => []},
    zabbixIntegrations: {type: Array, default: () => []}
  },

  emits: ['update:modelValue', 'close', 'saved', 'remove'],

  setup() {
    return {store: useStore()}
  }
}
</script>

<style scoped>
.service-dialog__organizations {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 4px;
}

.service-dialog__organizations > .text-caption {
  flex: 0 0 100%;
}

.service-dialog__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.service-dialog__table thead th {
  color: var(--app-text-muted, #737b89);
  font-size: 12px;
  font-weight: 600;
}

.service-dialog__order {
  width: 90px;
}
@media (max-width: 700px) {

  .service-dialog__content {
    padding: 16px;
  }
}
</style>
