<template>
  <q-page class="q-pa-md services-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Сервисы и мониторинг</div>
        <div class="settings-content-description">
          Управляйте каталогом услуг, договорными подключениями, SLA/OLA и интеграциями Zabbix.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn flat round color="primary" icon="refresh" :loading="loading" @click="loadAll"/>
        <q-btn v-if="tab === 'services'" unelevated color="primary" icon="add" label="Сервис" @click="openService()"/>
        <q-btn v-if="tab === 'zabbix'" unelevated color="primary" icon="add" label="Интеграция" @click="openZabbix()"/>
        <q-btn v-if="tab === 'assignments'" unelevated color="primary" icon="add" label="Подключение" @click="openAssignment()"/>
        <q-btn v-if="tab === 'criticalities'" unelevated color="primary" icon="add" label="Критичность" @click="openCriticality()"/>
      </div>
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-primary q-mb-md">
      <q-tab name="services" icon="dns" label="Сервисы"/>
      <q-tab name="assignments" icon="handshake" label="Организации и договоры"/>
      <q-tab name="zabbix" icon="monitor_heart" label="Zabbix"/>
      <q-tab name="criticalities" icon="priority_high" label="Критичности"/>
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="services" class="q-pa-none">
        <q-table
          class="settings-row-table"
          flat bordered row-key="id" :rows="services" :columns="serviceColumns"
          :filter="serviceFilter" :loading="loading" :pagination="{ rowsPerPage: 20 }"
        >
          <template #top-left>
            <q-input v-model="serviceFilter" dense outlined clearable debounce="250"
                     placeholder="Поиск по коду, названию или организации">
              <template #prepend>
                <q-icon name="search"/>
              </template>
            </q-input>
          </template>
          <template #body-cell-name="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.code }} · {{ props.row.name }}</div>
              <div class="text-caption text-grey-7 ellipsis" style="max-width: 420px">{{ props.row.description }}</div>
            </q-td>
          </template>
          <template #body-cell-organizations="props">
            <q-td :props="props">
              <template v-if="serviceOrganizationNames(props.row).length">
                <q-chip v-for="name in serviceOrganizationNames(props.row).slice(0, 3)" :key="name" dense square
                        class="service-organization-chip" :label="name"/>
                <q-chip v-if="serviceOrganizationNames(props.row).length > 3" dense square outline
                        :label="`+${serviceOrganizationNames(props.row).length - 3}`">
                  <q-tooltip>{{ serviceOrganizationNames(props.row).slice(3).join(', ') }}</q-tooltip>
                </q-chip>
              </template>
              <span v-else class="text-grey-7">Все организации</span>
            </q-td>
          </template>
          <template #body-cell-criticality="props">
            <q-td :props="props">{{ props.row.criticality?.name || '—' }}</q-td>
          </template>
          <template #body-cell-monitoring="props">
            <q-td :props="props">
              <q-chip dense :color="monitoringColor(props.row.monitoringStatus)" text-color="white">
                {{ monitoringLabel(props.row.monitoringStatus) }}
              </q-chip>
              <div class="text-caption text-grey-7">{{ props.row.lastMonitoringMessage || '' }}</div>
            </q-td>
          </template>
          <template #body-cell-active="props">
            <q-td :props="props">
              <q-icon :name="props.row.active ? 'check_circle' : 'pause_circle'"
                      :color="props.row.active ? 'positive' : 'grey'" size="sm"/>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="q-gutter-xs">
              <q-btn flat round dense icon="monitor_heart" :loading="checkingId === props.row.id"
                     @click="checkMonitoring(props.row)">
                <q-tooltip>Проверить Zabbix</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="edit" @click="openService(props.row)"/>
              <q-btn flat round dense icon="delete" color="negative" @click="removeService(props.row)"/>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <q-tab-panel name="assignments" class="q-pa-none">
        <q-table class="settings-row-table" flat bordered row-key="id" :rows="assignments" :columns="assignmentColumns" :loading="loading"
                 :pagination="{ rowsPerPage: 20 }">
          <template #body-cell-organization="props">
            <q-td :props="props">
              <div
                class="organization-name-ellipsis"
                style="max-width: 280px"
                :title="props.row.organization?.name || ''"
              >{{ props.row.organization?.name || '—' }}
              </div>
            </q-td>
          </template>
          <template #body-cell-service="props">
            <q-td :props="props">{{ props.row.service?.code }} · {{ props.row.service?.name }}</q-td>
          </template>
          <template #body-cell-validity="props">
            <q-td :props="props">{{ dateRange(props.row.validFrom, props.row.validTo) }}</q-td>
          </template>
          <template #body-cell-sla="props">
            <q-td :props="props">Ответ: {{ minutesLabel(props.row.firstResponseSlaMinutes) }}<br>Решение:
              {{ minutesLabel(props.row.resolutionSlaMinutes) }}
            </q-td>
          </template>
          <template #body-cell-active="props">
            <q-td :props="props">
              <q-icon :name="props.row.active ? 'check_circle' : 'pause_circle'"
                      :color="props.row.active ? 'positive' : 'grey'"/>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round dense icon="edit" @click="openAssignment(props.row)"/>
              <q-btn flat round dense icon="delete" color="negative" @click="removeAssignment(props.row)"/>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <q-tab-panel name="zabbix" class="q-pa-none">
        <q-table class="settings-row-table" flat bordered row-key="id" :rows="zabbixIntegrations" :columns="zabbixColumns" :loading="loading">
          <template #body-cell-mode="props">
            <q-td :props="props">
              <q-badge outline :color="props.row.mode === 'WEBHOOK' ? 'deep-purple-6' : 'blue-7'"
                       :label="props.row.mode === 'WEBHOOK' ? 'Веб-хук' : 'Опрос API'"/>
            </q-td>
          </template>
          <template #body-cell-auth="props">
            <q-td :props="props">
              <template v-if="props.row.mode === 'WEBHOOK'">
                {{ props.row.hasWebhookToken ? 'Токен веб-хука' : 'Токен не выпущен' }}
              </template>
              <template v-else>
                {{ props.row.hasApiToken ? 'API token' : props.row.hasPassword ? 'Логин / пароль' : 'Не настроена' }}
              </template>
            </q-td>
          </template>
          <template #body-cell-lastTest="props">
            <q-td :props="props">
              <q-icon :name="props.row.lastTestSuccess ? 'check_circle' : 'error'"
                      :color="props.row.lastTestSuccess ? 'positive' : 'negative'"/>
              {{ props.row.lastTestMessage || 'Не проверялась' }}
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn v-if="props.row.mode === 'WEBHOOK'" flat round dense icon="receipt_long" @click="openZabbixLog(props.row)">
                <q-tooltip>Журнал приёма</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="network_check" :loading="testingZabbixId === props.row.id"
                     @click="testZabbix(props.row)">
                <q-tooltip>{{ props.row.mode === 'WEBHOOK' ? 'Проверить связь' : 'Проверить подключение' }}</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="edit" @click="openZabbix(props.row)"/>
              <q-btn flat round dense icon="delete" color="negative" @click="removeZabbix(props.row)"/>
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <q-tab-panel name="criticalities" class="q-pa-none">
        <q-list bordered separator class="rounded-borders settings-row-list">
          <q-item header class="text-bold">
            Критичность
          </q-item>

          <q-item v-if="loading && !criticalities.length">
            <q-item-section class="text-grey-7">
              Загрузка...
            </q-item-section>
          </q-item>

          <q-item v-else-if="!criticalities.length">
            <q-item-section class="text-grey-7">
              Критичности не добавлены
            </q-item-section>
          </q-item>

          <draggable
            v-else
            :list="criticalities"
            item-key="id"
            class="list-group"
            ghost-class="ghost"
            handle=".settings-drag-handle"
            @end="resortCriticalities"
          >
            <template #item="{ element }">
              <q-item class="list-group-item">
                <q-item-section side class="settings-drag-handle cursor-grab">
                  <q-icon name="drag_indicator" color="grey-6"/>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="row items-center q-gutter-sm">
                    <span class="text-weight-medium">{{ element.name }}</span>
                    <q-badge v-if="element.defaultSelection" color="primary">По умолчанию</q-badge>
                  </q-item-label>
                  <q-item-label caption>
                    Сервисов: {{ criticalityUsage(element) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row no-wrap">
                    <q-btn
                      flat
                      dense
                      :text-color="element.defaultSelection ? 'primary' : 'grey'"
                      icon="beenhere"
                      @click.stop="setDefaultCriticality(element)"
                    >
                      <q-tooltip>
                        {{ element.defaultSelection ? 'Используется по умолчанию' : 'Использовать по умолчанию' }}
                      </q-tooltip>
                    </q-btn>
                    <q-btn flat dense color="primary" icon="edit" @click.stop="openCriticality(element)">
                      <q-tooltip>Редактировать критичность</q-tooltip>
                    </q-btn>
                    <q-btn flat dense color="negative" icon="delete" @click.stop="removeCriticality(element)">
                      <q-tooltip>Удалить критичность</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </draggable>
        </q-list>
      </q-tab-panel>
    </q-tab-panels>

    <q-dialog v-model="serviceDialog" persistent>
      <q-card class="service-dialog column no-wrap">
        <q-toolbar class="service-dialog__toolbar">
          <q-toolbar-title>{{ serviceForm.id ? 'Изменить сервис' : 'Новый сервис' }}</q-toolbar-title>
          <q-btn flat round dense icon="close" @click="closeService"/>
        </q-toolbar>

        <q-tabs
          v-model="serviceTab"
          dense
          align="left"
          active-color="primary"
          indicator-color="primary"
          class="service-dialog__tabs"
        >
          <q-tab name="general" label="Основное" no-caps/>
          <q-tab name="routing" label="Маршрутизация" no-caps/>
          <q-tab name="sla" label="SLA" no-caps/>
          <q-tab name="priority" label="Приоритеты" no-caps/>
          <q-tab name="ola" label="OLA" no-caps/>
          <q-tab name="monitoring" label="Мониторинг" no-caps/>
        </q-tabs>

        <q-separator/>

        <q-tab-panels v-model="serviceTab" animated class="service-dialog__panels col">
          <q-tab-panel name="general" class="service-dialog__panel">
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
                          class="service-organization-chip" :label="name"/>
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

          <q-tab-panel name="routing" class="service-dialog__panel">
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

          <q-tab-panel name="sla" class="service-dialog__panel">
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

          <q-tab-panel name="priority" class="service-dialog__panel">
            <div class="service-dialog__content">
              <div class="service-dialog__section-header">
                <div>
                  <div class="text-subtitle1">Правила приоритета</div>
                  <div class="text-caption text-grey-7">
                    Первое подходящее правило по порядку задаёт приоритет новой заявки.
                  </div>
                </div>
                <q-btn flat color="primary" icon="add" label="Добавить правило" @click="addPriorityRule"/>
              </div>
              <div v-if="!serviceForm.priorityRules.length" class="service-dialog__empty">
                Правила не добавлены
              </div>
              <q-markup-table v-else flat bordered class="service-dialog__table">
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

          <q-tab-panel name="ola" class="service-dialog__panel">
            <div class="service-dialog__content">
              <div class="service-dialog__section-header">
                <div>
                  <div class="text-subtitle1">OLA по линиям</div>
                  <div class="text-caption text-grey-7">
                    Сколько времени заявка может находиться на каждой линии поддержки.
                  </div>
                </div>
                <q-btn flat color="primary" icon="add" label="Добавить этап" @click="addOlaStage"/>
              </div>
              <div v-if="!serviceForm.olaStages.length" class="service-dialog__empty">
                Этапы OLA не добавлены
              </div>
              <q-markup-table v-else flat bordered class="service-dialog__table">
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

          <q-tab-panel name="monitoring" class="service-dialog__panel">
            <div class="service-dialog__content">
              <div class="service-dialog__section-header">
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

        <q-card-actions align="right" class="service-dialog__actions">
          <q-btn
            v-if="serviceForm.id"
            unelevated
            color="negative"
            icon="delete"
            label="Удалить"
            @click="removeService(serviceForm)"
          />
          <q-space/>
          <q-btn flat label="Отмена" @click="closeService"/>
          <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveService"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <zabbix-integration-dialog v-model="zabbixDialog" :integration="zabbixEditing" @saved="loadAll"/>
    <zabbix-webhook-log-dialog v-model="zabbixLogDialog" :integration="zabbixEditing"/>

    <q-dialog v-model="assignmentDialog" persistent>
      <q-card style="min-width: min(900px, 96vw)">
        <q-card-section>
          <div class="text-h6">Подключение сервиса к организации</div>
        </q-card-section>
        <q-card-section class="row q-col-gutter-md">
          <q-select v-model="assignmentForm.organizationId" class="col-12 col-md-6 organization-select" outlined
                    emit-value map-options
                    :options="organizationOptions" label="Организация *"
                    popup-content-class="organization-select-popup"/>
          <q-select v-model="assignmentForm.serviceId" class="col-12 col-md-6" outlined emit-value map-options
                    :options="serviceOptions" label="Сервис *"/>
          <q-input v-model="assignmentForm.contractNumber" class="col-12 col-md-4" outlined label="Договор"/>
          <q-input v-model="assignmentForm.tariffName" class="col-12 col-md-4" outlined
                   label="Тариф / уровень поддержки"/>
          <q-input v-model="assignmentForm.slaPolicyName" class="col-12 col-md-4" outlined
                   label="Название SLA-политики"/>
          <q-input v-model="assignmentForm.validFrom" class="col-6 col-md-3" outlined type="date" label="Действует с"
                   stack-label/>
          <q-input v-model="assignmentForm.validTo" class="col-6 col-md-3" outlined type="date" label="Действует до"
                   stack-label/>
          <q-input v-model.number="assignmentForm.firstResponseSlaMinutes" class="col-6 col-md-3" outlined type="number"
                   min="0" label="Первый ответ, мин."/>
          <q-input v-model.number="assignmentForm.resolutionSlaMinutes" class="col-6 col-md-3" outlined type="number"
                   min="0" label="Решение, мин."/>
          <q-input v-model="assignmentForm.supportCalendar" class="col-12 col-md-4" outlined label="Календарь"/>
          <q-select v-model="assignmentForm.availableChannels" class="col-12 col-md-8" outlined multiple use-chips
                    emit-value map-options :options="channelOptions" label="Доступные каналы"/>
          <q-toggle v-model="assignmentForm.active" label="Активно"/>
          <q-toggle v-model="assignmentForm.defaultForOrganization" label="Сервис по умолчанию"/>
          <q-input v-model="assignmentForm.notes" class="col-12" outlined type="textarea" autogrow label="Примечания"/>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup/>
          <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveAssignment"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="criticalityDialog">
      <q-card class="criticality-dialog">
        <q-toolbar>
          <q-toolbar-title>
            {{ criticalityForm.id ? 'Редактирование критичности' : 'Новая критичность' }}
          </q-toolbar-title>
          <q-btn flat round dense icon="close" v-close-popup/>
        </q-toolbar>

        <q-separator/>

        <q-card-section>
          <q-input v-model="criticalityForm.name" outlined autofocus label="Название *"
                   @keyup.enter="saveCriticality"/>
          <q-toggle v-model="criticalityForm.defaultSelection" class="q-mt-md"
                    label="Использовать критичность по умолчанию"/>
        </q-card-section>

        <q-separator/>

        <q-card-actions align="right">
          <q-btn flat color="primary" label="Отмена" v-close-popup/>
          <q-btn unelevated color="primary" label="Сохранить" :loading="saving" @click="saveCriticality"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'
import draggable from 'vuedraggable'
import ZabbixIntegrationDialog from 'components/monitoring/ZabbixIntegrationDialog.vue'
import ZabbixWebhookLogDialog from 'components/monitoring/ZabbixWebhookLogDialog.vue'
import {serviceLabelWithOrganizations, serviceOrganizationNames} from 'src/util/serviceOrganizations'

const emptyService = () => ({
  id: null,
  code: '',
  name: '',
  description: '',
  monitoringUrl: '',
  active: true,
  orderNumber: 0,
  criticalityId: null,
  ownerId: null,
  defaultSupportLineId: null,
  defaultPriorityId: null,
  taskTypeIds: [],
  executorIds: [],
  dependencyIds: [],
  firstResponseSlaMinutes: null,
  resolutionSlaMinutes: null,
  supportCalendar: 'GENERAL_SETTINGS',
  pauseSlaOnWaitingClient: true,
  autoAssignDefaultLine: true,
  priorityRules: [],
  olaStages: [],
  zabbixIntegrationId: null,
  zabbixEnabled: false,
  monitoringIdentifiers: {hostIds: '', hostNames: '', hostGroupIds: '', hostGroupNames: ''}
})

const emptyAssignment = () => ({
  id: null,
  organizationId: null,
  serviceId: null,
  contractNumber: '',
  tariffName: '',
  validFrom: null,
  validTo: null,
  supportCalendar: 'GENERAL_SETTINGS',
  slaPolicyName: '',
  firstResponseSlaMinutes: null,
  resolutionSlaMinutes: null,
  availableChannels: ['EMAIL', 'TELEGRAM', 'WHATSAPP', 'PORTAL'],
  active: true,
  defaultForOrganization: false,
  notes: ''
})

const emptyCriticality = () => ({id: null, name: '', orderNumber: null, defaultSelection: false})

export default {
  name: 'ServicesPage',

  components: {draggable, ZabbixIntegrationDialog, ZabbixWebhookLogDialog},

  setup() {
    return {store: useStore()}
  },

  data() {
    return {
      tab: 'services',
      loading: false,
      saving: false,
      checkingId: null,
      testingZabbixId: null,
      routeServiceOpened: false,
      serviceFilter: '',
      services: [],
      assignments: [],
      zabbixIntegrations: [],
      criticalities: [],
      serviceDialog: false,
      serviceTab: 'general',
      zabbixDialog: false,
      assignmentDialog: false,
      criticalityDialog: false,
      serviceForm: emptyService(),
      zabbixEditing: null,
      zabbixLogDialog: false,
      assignmentForm: emptyAssignment(),
      criticalityForm: emptyCriticality(),
      serviceColumns: [
        {name: 'name', label: 'Сервис', field: row => `${row.code} ${row.name}`, align: 'left', sortable: true},
        {name: 'organizations', label: 'Организации', field: row => serviceOrganizationNames(row).join(', '), align: 'left'},
        {
          name: 'criticality',
          label: 'Критичность',
          field: row => row.criticality?.name || '',
          align: 'left',
          sortable: true
        },
        {
          name: 'owner',
          label: 'Владелец',
          field: row => [row.owner?.lastname, row.owner?.firstname].filter(Boolean).join(' ') || row.owner?.username || '—',
          align: 'left'
        },
        {name: 'defaultLine', label: 'Линия', field: row => row.defaultSupportLine?.name || '—', align: 'left'},
        {name: 'monitoring', label: 'Мониторинг', field: 'monitoringStatus', align: 'left'},
        {name: 'active', label: 'Активен', field: 'active', align: 'center'},
        {name: 'actions', label: '', field: 'id', align: 'right'}
      ],
      assignmentColumns: [
        {
          name: 'organization',
          label: 'Организация',
          field: row => row.organization?.name || '',
          align: 'left',
          sortable: true
        },
        {name: 'service', label: 'Сервис', field: row => row.service?.name || '', align: 'left', sortable: true},
        {
          name: 'contract',
          label: 'Договор / тариф',
          field: row => [row.contractNumber, row.tariffName].filter(Boolean).join(' · ') || '—',
          align: 'left'
        },
        {name: 'validity', label: 'Период', field: 'validFrom', align: 'left'},
        {name: 'sla', label: 'SLA', field: 'resolutionSlaMinutes', align: 'left'},
        {name: 'active', label: 'Активно', field: 'active', align: 'center'},
        {name: 'actions', label: '', field: 'id', align: 'right'}
      ],
      zabbixColumns: [
        {name: 'name', label: 'Название', field: 'name', align: 'left', sortable: true},
        {name: 'mode', label: 'Режим', field: 'mode', align: 'left'},
        {
          name: 'url',
          label: 'Адрес',
          field: row => (row.mode === 'WEBHOOK' ? row.eventsUrl || 'адрес появится после выпуска токена' : row.baseUrl),
          align: 'left'
        },
        {name: 'auth', label: 'Авторизация', field: 'hasApiToken', align: 'left'},
        {name: 'lastTest', label: 'Последняя проверка', field: 'lastTestMessage', align: 'left'},
        {name: 'actions', label: '', field: 'id', align: 'right'}
      ],
      channelOptions: ['EMAIL', 'TELEGRAM', 'WHATSAPP', 'PORTAL', 'PHONE'].map(value => ({label: value, value}))
    }
  },

  computed: {
    criticalityOptions() {
      return this.criticalities.map(x => ({label: x.name, value: x.id}))
    },
    userOptions() {
      return this.store.users.map(x => ({
        label: [x.lastname, x.firstname].filter(Boolean).join(' ') || x.username,
        value: x.id
      }))
    },

    supportLineOptions() {
      return this.store.supportLines.map(x => ({label: x.name, value: x.id}))
    },

    priorityOptions() {
      return this.store.priorities.map(x => ({label: x.name, value: x.id}))
    },

    taskTypeOptions() {
      return this.store.taskTypes.map(x => ({label: x.type || x.name, value: x.id}))
    },

    dependencyOptions() {
      return this.services.filter(x => x.id !== this.serviceForm.id).map(x => ({
        label: serviceLabelWithOrganizations(x, this.services),
        value: x.id
      }))
    },

    zabbixOptions() {
      return this.zabbixIntegrations.map(x => ({label: x.name, value: x.id}))
    },

    organizationOptions() {
      return this.store.organizations.map(x => ({label: x.name, value: x.id}))
    },

    serviceOptions() {
      return this.services.map(x => ({label: serviceLabelWithOrganizations(x, this.services), value: x.id}))
    }
  },

  mounted() {
    // ?tab=zabbix — переход из уведомления о связи с Zabbix
    if (['services', 'assignments', 'zabbix', 'criticalities'].includes(this.$route.query.tab)) {
      this.tab = this.$route.query.tab
    }
    this.store.fetchData();
    this.loadAll()
  },

  methods: {
    serviceOrganizationNames(service) {
      return serviceOrganizationNames(service, this.services)
    },

    required: value => Boolean(value && String(value).trim()) || 'Обязательное поле',
    notifyError(error) {
      this.$q.notify({
        type: 'negative',
        message: error?.response?.data?.message || error?.response?.data || error?.message || 'Операция не выполнена'
      })
    },

    notifyOk(message) {
      this.$q.notify({type: 'positive', message})
    },

    async loadAll() {
      this.loading = true
      try {
        const [services, assignments, zabbix, criticalities] = await Promise.all([
          axios.get('/api/v1/services?includeInactive=true'), axios.get('/api/v1/organization-service-assignments'),
          axios.get('/api/v1/zabbix-integrations'), axios.get('/api/v1/service-criticalities')
        ])
        this.services = Array.isArray(services.data) ? services.data : []
        this.store.services = this.services.filter(item => item.active)
        this.assignments = Array.isArray(assignments.data) ? assignments.data : []
        this.zabbixIntegrations = Array.isArray(zabbix.data) ? zabbix.data : []
        this.criticalities = Array.isArray(criticalities.data) ? criticalities.data : []
        if (!this.routeServiceOpened) {
          this.routeServiceOpened = true
          const serviceId = Number(this.$route.query.serviceId)
          const service = Number.isFinite(serviceId) ? this.services.find(item => Number(item.id) === serviceId) : null
          if (service) this.openService(service)
        }
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.loading = false
      }
    },

    openService(row = null) {
      if (!row) {
        this.serviceForm = emptyService()
      } else {
        this.serviceForm = {
          ...emptyService(),
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description,
          monitoringUrl: row.monitoringUrl || '',
          active: row.active,
          orderNumber: row.orderNumber,
          criticalityId: row.criticality?.id || null,
          ownerId: row.owner?.id || null,
          defaultSupportLineId: row.defaultSupportLine?.id || null,
          defaultPriorityId: row.defaultPriority?.id || null,
          taskTypeIds: (row.taskTypes || []).map(x => x.id),
          executorIds: (row.executors || []).map(x => x.id),
          dependencyIds: (row.dependencies || []).map(x => x.id),
          firstResponseSlaMinutes: row.firstResponseSlaMinutes,
          resolutionSlaMinutes: row.resolutionSlaMinutes,
          supportCalendar: row.supportCalendar || 'GENERAL_SETTINGS',
          pauseSlaOnWaitingClient: row.pauseSlaOnWaitingClient !== false,
          autoAssignDefaultLine: row.autoAssignDefaultLine !== false,
          priorityRules: JSON.parse(JSON.stringify(row.priorityRules || [])),
          olaStages: JSON.parse(JSON.stringify(row.olaStages || [])),
          zabbixIntegrationId: row.zabbixIntegration?.id || null,
          zabbixEnabled: Boolean(row.zabbixEnabled),
          monitoringIdentifiers: {hostIds: '', hostNames: '', hostGroupIds: '', hostGroupNames: '', ...(row.monitoringIdentifiers || {})}
        }
      }
      this.serviceTab = 'general'
      this.serviceDialog = true
    },

    closeService() {
      this.serviceDialog = false
      if (this.$route.query.serviceId) {
        const query = {...this.$route.query}
        delete query.serviceId
        this.$router.replace({query})
      }
    },

    addPriorityRule() {
      this.serviceForm.priorityRules.push({
        orderNumber: this.serviceForm.priorityRules.length,
        taskTypeId: null,
        keyword: '',
        priorityId: null,
        active: true
      })
    },

    addOlaStage() {
      this.serviceForm.olaStages.push({
        orderNumber: this.serviceForm.olaStages.length,
        supportLineId: null,
        durationSeconds: 3600,
        useWorkingTime: true,
        warningPercent: 80,
        active: true
      })
    },

    async saveService() {
      if (!this.serviceForm.code?.trim() || !this.serviceForm.name?.trim()) {
        this.serviceTab = 'general'
        this.notifyError(new Error('Код и название сервиса обязательны'))
        return
      }
      this.saving = true
      try {
        const id = this.serviceForm.id;
        const payload = {...this.serviceForm};
        delete payload.id
        if (id) await axios.patch(`/api/v1/service/${id}`, payload); else await axios.post('/api/v1/service', payload)
        this.closeService();
        await this.loadAll();
        this.notifyOk('Сервис сохранён')
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.saving = false
      }
    },

    removeService(row) {
      this.$q.dialog({
        title: 'Удалить сервис?',
        message: 'Если сервис используется, он будет деактивирован.',
        cancel: true
      }).onOk(async () => {
        try {
          await axios.delete(`/api/v1/service/${row.id}`);
          if (this.serviceDialog && this.serviceForm.id === row.id) this.closeService()
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    async checkMonitoring(row) {
      this.checkingId = row.id;
      try {
        const {data} = await axios.post(`/api/v1/service/${row.id}/monitoring/check`);
        await this.loadAll();
        this.$q.notify({
          type: data.status === 'OK' ? 'positive' : 'warning',
          message: data.message || 'Проверка завершена'
        })
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.checkingId = null
      }
    },

    openZabbix(row = null) {
      this.zabbixEditing = row
      this.zabbixDialog = true
    },

    openZabbixLog(row) {
      this.zabbixEditing = row
      this.zabbixLogDialog = true
    },

    async testZabbix(row) {
      this.testingZabbixId = row.id;
      try {
        const {data} = await axios.post(`/api/v1/zabbix-integration/${row.id}/test`);
        await this.loadAll();
        this.$q.notify({
          type: data.success ? 'positive' : 'negative',
          message: data.message
        })
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.testingZabbixId = null
      }
    },

    removeZabbix(row) {
      this.$q.dialog({title: 'Удалить интеграцию?', cancel: true}).onOk(async () => {
        try {
          await axios.delete(`/api/v1/zabbix-integration/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    openAssignment(row = null) {
      this.assignmentForm = row ? {
        ...emptyAssignment(),
        ...row,
        organizationId: row.organization?.id,
        serviceId: row.service?.id
      } : emptyAssignment();
      this.assignmentDialog = true
    },

    async saveAssignment() {
      if (!this.assignmentForm.organizationId || !this.assignmentForm.serviceId) return this.notifyError(new Error('Организация и сервис обязательны'));
      this.saving = true;
      try {
        const id = this.assignmentForm.id;
        const payload = {...this.assignmentForm};
        delete payload.id;
        delete payload.organization;
        delete payload.service;
        delete payload.effective;
        if (id) await axios.patch(`/api/v1/organization-service-assignment/${id}`, payload); else await axios.post('/api/v1/organization-service-assignment', payload);
        this.assignmentDialog = false;
        await this.loadAll();
        this.notifyOk('Подключение сохранено')
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.saving = false
      }
    },

    removeAssignment(row) {
      this.$q.dialog({title: 'Удалить подключение?', cancel: true}).onOk(async () => {
        try {
          await axios.delete(`/api/v1/organization-service-assignment/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    openCriticality(row = null) {
      this.criticalityForm = row ? {...row} : emptyCriticality();
      this.criticalityDialog = true
    },
    async saveCriticality() {
      if (!this.criticalityForm.name?.trim()) return;
      this.saving = true;
      try {
        if (this.criticalityForm.id) await axios.patch('/api/v1/service-criticality', this.criticalityForm); else await axios.post('/api/v1/service-criticality', this.criticalityForm);
        this.criticalityDialog = false;
        await this.loadAll()
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.saving = false
      }
    },

    async resortCriticalities() {
      try {
        const {data} = await axios.patch('/api/v1/service-criticalities/resort', this.criticalities.map(item => item.id))
        if (Array.isArray(data)) this.criticalities = data
      } catch (e) {
        this.notifyError(e)
        await this.loadAll()
      }
    },

    async setDefaultCriticality(row) {
      if (row.defaultSelection) return
      try {
        await axios.patch('/api/v1/service-criticality', {...row, defaultSelection: true})
        await this.loadAll()
      } catch (e) {
        this.notifyError(e)
      }
    },

    criticalityUsage(row) {
      return this.services.filter(service => service.criticality?.id === row.id).length
    },

    removeCriticality(row) {
      this.$q.dialog({
        title: 'Удалить критичность?',
        message: `Критичность «${row.name}» будет снята со всех сервисов.`,
        cancel: {flat: true, noCaps: true, label: 'Отмена'},
        ok: {unelevated: true, noCaps: true, color: 'negative', label: 'Удалить'}
      }).onOk(async () => {
        try {
          await axios.delete(`/api/v1/service-criticality/${row.id}`);
          await this.loadAll()
        } catch (e) {
          this.notifyError(e)
        }
      })
    },

    monitoringColor(status) {
      return ({
        OK: 'positive',
        WARNING: 'warning',
        CRITICAL: 'negative',
        UNAVAILABLE: 'grey-8',
        NOT_CONFIGURED: 'grey'
      })[status] || 'grey'
    },

    monitoringLabel(status) {
      return ({
        OK: 'Работает',
        WARNING: 'Предупреждение',
        CRITICAL: 'Критично',
        UNAVAILABLE: 'Недоступен',
        NOT_CONFIGURED: 'Не настроен'
      })[status] || status || 'Не настроен'
    },

    dateRange(from, to) {
      return `${from || '—'} — ${to || '∞'}`
    },

    minutesLabel(value) {
      return value == null ? 'по сервису' : `${value} мин.`
    }
  }
}
</script>

<style scoped>
.service-organization-chip {
  max-width: 220px;
}

.service-dialog__organizations {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 4px;
}

.service-dialog__organizations > .text-caption {
  flex: 0 0 100%;
}

.services-page {
  width: 100%;
}

.service-dialog {
  width: 860px;
  max-width: 96vw;
  height: 600px;
  max-height: 92vh;
  overflow: hidden;
}

.service-dialog__toolbar {
  min-height: 52px;
  padding: 0 16px;
}

.service-dialog__tabs {
  flex: 0 0 auto;
  padding: 0 4px;
}

.service-dialog__panels {
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.service-dialog__panel {
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow-y: auto;
}

.service-dialog__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.service-dialog__section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.service-dialog__empty {
  padding: 14px;
  border: 1px dashed #c9c9c9;
  border-radius: 8px;
  color: #777;
  background: #fafafa;
}

.service-dialog__table {
  border-radius: 8px;
}

.service-dialog__table thead th {
  color: #737b89;
  font-size: 12px;
  font-weight: 600;
}

.service-dialog__order {
  width: 90px;
}

.service-dialog__actions {
  flex: 0 0 auto;
  min-height: 58px;
  padding: 10px 8px 10px 16px;
}

.criticality-dialog {
  width: 480px;
  max-width: calc(100vw - 32px);
}

@media (max-width: 700px) {
  .service-dialog {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .service-dialog__content {
    padding: 16px;
  }
}
</style>
