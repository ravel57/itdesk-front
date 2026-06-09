<template>
  <q-page padding class="organizations-page">
    <div class="organizations-header">
      <div class="organizations-title-block">
        <div class="text-h5 text-weight-medium">
          Организации
        </div>
        <div class="text-grey-7">
          Клиенты, сотрудники, заявки, SLA и договорные лимиты обслуживания
        </div>
      </div>

      <div class="organizations-controls">
        <q-input
          v-model="searchRequest"
          outlined
          dense
          clearable
          placeholder="Поиск по организации, сотруднику, заявке"
          class="organizations-search"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-select
          v-if="!isShowTableMode"
          v-model="sortType"
          :options="sortOptions"
          outlined
          dense
          emit-value
          map-options
          label="Сортировка"
          class="organizations-sort"
        />

        <q-toggle
          v-model="isShowTableMode"
          color="grey"
          left-label
          checked-icon="list"
          unchecked-icon="dashboard"
          size="50px"
          keep-color
        >
          <q-tooltip>
            Режим отображения: {{ isShowTableMode ? 'Таблица' : 'Карточки' }}
          </q-tooltip>
        </q-toggle>
      </div>
    </div>

    <div class="organizations-summary">
      <q-card flat bordered class="summary-card">
        <q-card-section>
          <div class="summary-label">Организации</div>
          <div class="summary-value">{{ organizationRows.length }}</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="summary-card">
        <q-card-section>
          <div class="summary-label">Сотрудники клиентов</div>
          <div class="summary-value">{{ totalEmployees }}</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="summary-card">
        <q-card-section>
          <div class="summary-label">Открытые заявки</div>
          <div class="summary-value">{{ totalOpenTasks }}</div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="summary-card">
        <q-card-section>
          <div class="summary-label">Просроченные SLA</div>
          <div class="summary-value" :class="totalOverdueSla > 0 ? 'text-negative' : ''">
            {{ totalOverdueSla }}
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="organizations-page-content">
      <q-card
        v-if="sortedFilteredOrganizations.length > 0"
        flat
        bordered
        class="organizations-list-card"
      >
        <q-card-section class="organizations-list-title">
          <div>
            <div class="text-subtitle1 text-weight-medium">
              {{ isShowTableMode ? 'Таблица организаций' : 'Карточки организаций' }}
            </div>
            <div class="text-caption text-grey-7">
              Найдено: {{ sortedFilteredOrganizations.length }}. Нажмите на организацию, чтобы открыть карточку.
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <div v-if="!isShowTableMode" class="organizations-cards">
          <q-card
            v-for="row in sortedFilteredOrganizations"
            :key="row.key"
            flat
            bordered
            clickable
            class="organization-card cursor-pointer"
            :class="{ 'organization-card--selected': selectedOrganizationKey === row.key }"
            @click.stop="openOrganizationDialog(row.organization)"
          >
            <q-card-section>
              <div class="row items-start justify-between no-wrap q-gutter-sm">
                <div class="organization-card-main">
                  <div class="text-subtitle1 text-weight-medium shorten-text">
                    {{ row.name }}
                  </div>
                  <div class="text-caption text-grey-7 shorten-text">
                    {{ row.contractLabel }}
                  </div>
                </div>

                <q-chip
                  dense
                  square
                  :color="row.slaLoading ? 'grey-5' : row.overdueTasks > 0 ? 'negative' : 'positive'"
                  text-color="white"
                >
                  {{ row.slaLoading ? 'Проверка SLA' : row.overdueTasks > 0 ? 'Есть просрочки' : 'ОК' }}
                </q-chip>
              </div>

              <div class="organization-card-stats q-mt-md">
                <div class="organization-stat">
                  <div class="organization-stat-value">{{ row.employees }}</div>
                  <div class="organization-stat-label">сотрудников</div>
                </div>

                <div class="organization-stat">
                  <div class="organization-stat-value">{{ row.openTasks }}</div>
                  <div class="organization-stat-label">открытых</div>
                </div>

                <div class="organization-stat">
                  <div class="organization-stat-value">{{ row.tasks }}</div>
                  <div class="organization-stat-label">всего заявок</div>
                </div>
              </div>

              <div class="q-mt-md">
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">SLA</span>
                  <span class="text-caption text-weight-medium">{{ row.minSlaLabel }}</span>
                </div>
                <q-linear-progress
                  v-if="row.minSlaPercent !== null"
                  :value="row.minSlaPercent"
                  :color="row.minSlaColor"
                  rounded
                  size="8px"
                />
                <div v-else class="text-caption text-grey-6">
                  Нет активного SLA
                </div>
              </div>

              <div v-if="row.visits.enabled" class="q-mt-md">
                <div class="row items-center justify-between q-mb-xs">
                  <span class="text-caption text-grey-7">Выезды</span>
                  <span class="text-caption text-weight-medium">{{ row.visits.label }}</span>
                </div>
                <q-linear-progress
                  :value="row.visits.percent"
                  :color="row.visits.color"
                  rounded
                  size="8px"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <q-table
          v-else
          flat
          :rows="sortedFilteredOrganizations"
          :columns="organizationColumns"
          row-key="key"
          :pagination="organizationPagination"
          class="organizations-table"
          @row-click="openOrganizationRow"
        >
          <template #body-cell-name="props">
            <q-td :props="props">
              <div class="text-weight-medium">{{ props.row.name }}</div>
              <div class="text-caption text-grey-7">{{ props.row.contractLabel }}</div>
            </q-td>
          </template>

          <template #body-cell-tasks="props">
            <q-td :props="props">
              <div>{{ props.row.openTasks }} открытых</div>
              <div class="text-caption text-grey-7">{{ props.row.tasks }} всего</div>
            </q-td>
          </template>

          <template #body-cell-sla="props">
            <q-td :props="props">
              <div :class="props.row.overdueTasks > 0 ? 'text-negative text-weight-medium' : ''">
                {{ props.row.minSlaLabel }}
              </div>
              <div class="text-caption text-grey-7">{{ props.row.slaAgreementLabel }}</div>
            </q-td>
          </template>

          <template #body-cell-visits="props">
            <q-td :props="props">
              <span v-if="props.row.visits.enabled">{{ props.row.visits.label }}</span>
              <span v-else class="text-grey-6">Не настроены</span>
            </q-td>
          </template>
        </q-table>
      </q-card>

      <div v-else class="empty-organizations-state">
        <div class="text-center">
          <div class="text-h6">Организации не найдены</div>
          <div class="text-grey-7 q-mt-xs">Измените строку поиска или настройки фильтрации.</div>
          <q-btn
            v-if="searchRequest"
            class="q-mt-md"
            color="primary"
            outline
            icon="close"
            label="Сбросить поиск"
            @click="searchRequest = ''"
          />
        </div>
      </div>
    </div>
  </q-page>

  <q-dialog
    v-model="organizationDialog"
    no-route-dismiss
    @hide="closeOrganizationDialog"
  >
    <q-card
      v-if="selectedOrganization"
      ref="organizationInfoCard"
      class="organization-dialog-card"
    >
      <q-toolbar class="justify-between">
        <div>
          <div class="text-h6 text-weight-medium">
            {{ selectedOrganizationName }}
          </div>
          <div class="text-caption text-grey-7">
            {{ selectedOrganizationContractLabel }}
          </div>
        </div>

        <div class="row q-gutter-xs items-center">
          <q-chip dense square color="primary" text-color="white">
            {{ selectedOrganizationEmployees.length }} сотрудников
          </q-chip>
          <q-chip dense square color="grey-8" text-color="white">
            {{ selectedOrganizationOpenTasksCount }} открытых заявок
          </q-chip>
          <q-chip
            v-if="selectedOrganizationOverdueTasks.length > 0"
            dense
            square
            color="negative"
            text-color="white"
          >
            {{ selectedOrganizationOverdueTasks.length }} SLA просрочено
          </q-chip>
        </div>

        <q-btn flat round dense icon="close" v-close-popup />
      </q-toolbar>

      <q-separator />

      <div class="organization-dialog-body">

        <q-separator />

        <q-card-section class="organization-overview-section">
          <div class="organization-info-grid">
            <q-card flat bordered class="info-block">
              <q-card-section>
                <div class="info-block-title">
                  Договорённости по SLA
                </div>

                <div class="info-row">
                  <span>Правило SLA</span>
                  <b>{{ getOrganizationSlaAgreementLabel(selectedOrganization) }}</b>
                </div>

                <div class="info-row">
                  <span>Первый ответ</span>
                  <b>{{ getOrganizationFirstResponseSlaLabel(selectedOrganization) }}</b>
                </div>

                <div class="info-row">
                  <span>Решение заявки</span>
                  <b>{{ getOrganizationResolutionSlaLabel(selectedOrganization) }}</b>
                </div>

                <div class="info-row">
                  <span>Календарь</span>
                  <b>{{ getOrganizationSlaCalendarLabel(selectedOrganization) }}</b>
                </div>

                <div class="info-row">
                  <span>Пауза при ожидании клиента</span>
                  <b>{{ getOrganizationPauseSlaOnWaitingClientLabel(selectedOrganization) }}</b>
                </div>

                <div class="info-row">
                  <span>Ближайший SLA</span>
                  <b :class="selectedOrganizationMinimalSla?.overdue ? 'text-negative' : ''">
                    {{ selectedOrganizationMinimalSla?.label || 'Нет активного SLA' }}
                  </b>
                </div>

                <q-linear-progress
                  v-if="selectedOrganizationMinimalSla?.percent !== null"
                  :value="selectedOrganizationMinimalSla.percent"
                  :color="selectedOrganizationMinimalSla.color"
                  rounded
                  size="8px"
                  class="q-mt-sm"
                />
              </q-card-section>
            </q-card>

            <q-card flat bordered class="info-block">
              <q-card-section>
                <div class="info-block-title">
                  <span>Выезды</span>
                  <q-space />

                  <q-btn
                    v-if="selectedOrganization?.id"
                    dense
                    flat
                    color="primary"
                    icon="history"
                    label="История"
                    :loading="selectedOrganizationVisitHistoryLoading"
                    @click="openVisitHistoryDialog(selectedOrganization)"
                  />
                </div>

                <template v-if="selectedOrganizationVisitStats.enabled">
                  <div class="info-row">
                    <span>Пакет</span>
                    <b>{{ selectedOrganizationVisitStats.used }} / {{ selectedOrganizationVisitStats.limit }}</b>
                  </div>

                  <div class="info-row">
                    <span>Осталось</span>
                    <b :class="selectedOrganizationVisitStats.left <= 0 ? 'text-negative' : ''">
                      {{ selectedOrganizationVisitStats.left }}
                    </b>
                  </div>

                  <div class="info-row">
                    <span>Сверх пакета</span>
                    <b :class="selectedOrganizationVisitStats.overLimit > 0 ? 'text-negative' : ''">
                      {{ selectedOrganizationVisitStats.overLimit }}
                    </b>
                  </div>

                  <div class="info-row">
                    <span>Цена сверх пакета</span>
                    <b>{{ selectedOrganizationVisitStats.extraPriceLabel }}</b>
                  </div>

                  <div class="info-row">
                    <span>Цена срочного выезда</span>
                    <b>{{ getOrganizationUrgentVisitPriceLabel(selectedOrganization) }}</b>
                  </div>

                  <div class="info-row">
                    <span>Обновление лимита</span>
                    <b>{{ selectedOrganizationVisitStats.resetLabel }}</b>
                  </div>

                  <q-linear-progress
                    :value="selectedOrganizationVisitStats.percent"
                    :color="selectedOrganizationVisitStats.color"
                    rounded
                    size="8px"
                    class="q-mt-sm"
                  />
                </template>

                <template v-else>
                  <div class="text-grey-7">
                    Пакет выездов для этой организации не настроен.
                  </div>
                </template>
              </q-card-section>
            </q-card>

            <q-card flat bordered class="info-block info-block--wide organization-folded-info">
              <q-list>
                <q-expansion-item
                  icon="business"
                  label="Общая информация"
                  header-class="text-weight-medium"
                >
                  <q-card-section class="organization-folded-section">
                    <div class="info-row">
                      <span>Название</span>
                      <b>{{ selectedOrganizationName }}</b>
                    </div>

                    <div class="info-row">
                      <span>Активность</span>
                      <b>{{ getOrganizationActiveLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Тариф / пакет</span>
                      <b>{{ getOrganizationTariff(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Договор</span>
                      <b>{{ selectedOrganizationContractLabel }}</b>
                    </div>

                    <div class="info-row">
                      <span>Ответственный</span>
                      <b>{{ getOrganizationResponsible(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Сотрудники</span>
                      <b>{{ selectedOrganizationEmployees.length }}</b>
                    </div>

                    <div class="info-row">
                      <span>Открытые заявки</span>
                      <b>{{ selectedOrganizationOpenTasksCount }}</b>
                    </div>

                    <div class="info-row">
                      <span>Последняя активность</span>
                      <b>{{ selectedOrganizationLastActivity }}</b>
                    </div>
                  </q-card-section>
                </q-expansion-item>

                <q-separator />

                <q-expansion-item
                  icon="more_horiz"
                  label="Дополнительно"
                  header-class="text-weight-medium"
                >
                  <q-card-section class="organization-folded-section">
                    <div class="info-row">
                      <span>ИНН</span>
                      <b>{{ getOrganizationInnLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>КПП</span>
                      <b>{{ getOrganizationKppLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Внешний ID</span>
                      <b>{{ getOrganizationExternalIdLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Основной адрес</span>
                      <b>{{ getOrganizationMainAddressLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Адреса / объекты</span>
                      <b>{{ getOrganizationAddressLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Каналы связи</span>
                      <b>{{ getOrganizationChannelsLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Приоритет клиента</span>
                      <b>{{ getOrganizationPriorityLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Менеджер</span>
                      <b>{{ getOrganizationManagerNameLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Телефон менеджера</span>
                      <b>{{ getOrganizationManagerPhoneLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Email менеджера</span>
                      <b>{{ getOrganizationManagerEmailLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Срок договора</span>
                      <b>{{ getOrganizationContractPeriodLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Абонентская плата</span>
                      <b>{{ getOrganizationMonthlyFeeLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Описание</span>
                      <b>{{ getOrganizationCommentLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Условия выездов</span>
                      <b>{{ getOrganizationVisitCommentLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Цена сверхпакетного выезда</span>
                      <b>{{ getOrganizationExtraVisitPriceLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Цена срочного выезда</span>
                      <b>{{ getOrganizationUrgentVisitPriceLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>День сброса лимита выездов</span>
                      <b>{{ getOrganizationVisitResetDayLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Удалённая поддержка</span>
                      <b>{{ getOrganizationRemoteSupportLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Комментарий SLA</span>
                      <b>{{ getOrganizationSlaCommentLabel(selectedOrganization) }}</b>
                    </div>

                    <div class="info-row">
                      <span>Внутренний комментарий</span>
                      <b>{{ getOrganizationInternalCommentLabel(selectedOrganization) }}</b>
                    </div>
                  </q-card-section>
                </q-expansion-item>
              </q-list>
            </q-card>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="details-section-header">
            <div>
              <div class="text-subtitle1 text-weight-medium">
                Сотрудники организации
              </div>
              <div class="text-caption text-grey-7">
                Контакты клиента, которые могут писать в чат и создавать обращения
              </div>
            </div>
          </div>

          <q-list bordered separator class="rounded-borders">
            <q-item
              v-for="client in selectedOrganizationEmployees"
              :key="client.id || getClientName(client)"
              clickable
              @click="openClientChat(client)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  {{ getClientInitials(client) }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ getClientName(client) }}</q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="row items-center q-gutter-xs">
                  <q-chip dense square color="grey-2" text-color="dark">
                    {{ getClientOpenTasksCountText(client) }}
                  </q-chip>
                  <q-icon name="chevron_right" />
                </div>
              </q-item-section>
            </q-item>

            <q-item v-if="selectedOrganizationEmployees.length === 0">
              <q-item-section>
                <q-item-label class="text-grey-7">
                  У организации пока нет сотрудников / клиентов
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-section>
          <div class="details-section-header">
            <div>
              <div class="text-subtitle1 text-weight-medium">
                Заявки по выбранной организации
              </div>
              <div class="text-caption text-grey-7">
                Открытые, закрытые, просроченные и выездные заявки
              </div>
            </div>

            <q-toggle
              v-model="showCompletedTasks"
              color="primary"
              dense
              left-label
              label="Показывать закрытые"
            />
          </div>

          <q-table
            flat
            bordered
            :rows="selectedOrganizationVisibleTasks"
            :loading="organizationTasksLoading"
            :columns="taskColumns"
            row-key="id"
            :pagination="taskPagination"
            class="organization-tasks-table"
            @row-click="(_, row) => openTask(row)"
          >
            <template #body-cell-title="props">
              <q-td :props="props">
                <div class="text-weight-medium">{{ getTaskTitle(props.row) }}</div>
                <div class="text-caption text-grey-7">
                  {{ getTaskTypeName(props.row) }}
                  <span v-if="isVisitTask(props.row)"> · Выезд</span>
                </div>
              </q-td>
            </template>

            <template #body-cell-status="props">
              <q-td :props="props">
                <q-chip
                  dense
                  square
                  :color="isTaskClosed(props.row) ? 'grey-5' : 'primary'"
                  text-color="white"
                >
                  {{ getTaskStatusName(props.row) }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-sla="props">
              <q-td :props="props">
                <span :class="isTaskSlaOverdue(props.row) ? 'text-negative text-weight-medium' : ''">
                  {{ getTaskSlaLabel(props.row) }}
                </span>
              </q-td>
            </template>

            <template #body-cell-deadline="props">
              <q-td :props="props">
                {{ getTaskDeadlineLabel(props.row) }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </div>
    </q-card>
  </q-dialog>

  <organization-visit-dialog
    v-model="addVisitDialog"
    :organization="selectedOrganization"
    :task-options="visitTaskOptions"
    @saved="onOrganizationVisitSaved"
  />

  <q-dialog v-model="visitHistoryDialog">
    <q-card style="min-width: 900px; max-width: 95vw;">
      <q-card-section>
        <div class="row items-center justify-between q-gutter-md">
          <div>
            <div class="text-h6">
              История выездов
            </div>
            <div class="text-caption text-grey-7">
              {{ getOrganizationName(visitHistoryOrganization) }}
            </div>
          </div>

          <q-btn
            flat
            round
            dense
            icon="refresh"
            :loading="selectedOrganizationVisitHistoryLoading"
            @click="loadOrganizationVisitHistory(visitHistoryOrganization)"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-table
          flat
          bordered
          dense
          row-key="id"
          :rows="selectedOrganizationVisitHistory"
          :columns="visitHistoryColumns"
          :loading="selectedOrganizationVisitHistoryLoading"
          :pagination="visitHistoryPagination"
        >
          <template #body-cell-visitDate="props">
            <q-td :props="props">
              {{ formatDateTime(props.row.visitDate) }}
            </q-td>
          </template>

          <template #body-cell-task="props">
            <q-td :props="props">
            <span v-if="props.row.taskId">
              #{{ props.row.taskId }} {{ props.row.taskTitle || '' }}
            </span>
              <span v-else class="text-grey-6">
              —
            </span>
            </q-td>
          </template>

          <template #body-cell-counted="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                :color="props.row.countedInPackage ? props.row.overLimit ? 'negative' : 'primary' : 'grey-5'"
                text-color="white"
              >
                {{ props.row.countedInPackage ? props.row.overLimit ? 'Сверх пакета' : 'Списан' : 'Не списан' }}
              </q-chip>
            </q-td>
          </template>

          <template #body-cell-price="props">
            <q-td :props="props">
              {{ formatMoney(props.row.price) }}
            </q-td>
          </template>

          <template #body-cell-comment="props">
            <q-td :props="props">
              {{ props.row.comment || '—' }}
            </q-td>
          </template>

          <template #no-data>
            <div class="full-width text-center text-grey-7 q-pa-md">
              История выездов пока пустая
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Закрыть"
          @click="visitHistoryDialog = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import axios from 'axios'
import moment from 'moment'
import OrganizationVisitDialog from 'components/organization/OrganizationVisitDialog.vue'

export default {
  name: 'OrganizationsPage',

  components: { OrganizationVisitDialog },

  data: () => ({
    searchRequest: '',
    selectedOrganizationKey: null,
    selectedOrganizationModel: null,
    organizationDialog: false,
    isShowTableMode: false,
    showCompletedTasks: false,
    sortType: 'NAME',
    sortOptions: [
      { label: 'По названию', value: 'NAME' },
      { label: 'По открытым заявкам', value: 'OPEN_TASKS' },
      { label: 'По просроченным SLA', value: 'OVERDUE_SLA' },
      { label: 'По использованию выездов', value: 'VISITS_USAGE' },
      { label: 'По последней активности', value: 'LAST_ACTIVITY' }
    ],
    organizationColumns: [
      { name: 'name', label: 'Организация', field: 'name', align: 'left', sortable: true },
      { name: 'employees', label: 'Сотрудники', field: 'employees', align: 'left', sortable: true },
      { name: 'tasks', label: 'Заявки', field: 'openTasks', align: 'left', sortable: true },
      { name: 'sla', label: 'SLA', field: 'minSlaSortValue', align: 'left', sortable: true },
      { name: 'visits', label: 'Выезды', field: row => row.visits.used, align: 'left', sortable: true }
    ],
    taskColumns: [
      { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
      { name: 'title', label: 'Название', field: row => row.title || row.name || '', align: 'left', sortable: true },
      { name: 'status', label: 'Статус', field: row => row.status?.name || '', align: 'left', sortable: true },
      { name: 'priority', label: 'Приоритет', field: row => row.priority?.name || '', align: 'left', sortable: true },
      { name: 'executor', label: 'Исполнитель', field: row => row.executor?.firstname || '', align: 'left', sortable: true },
      { name: 'sla', label: 'SLA', field: row => row.id || '', align: 'left' },
      { name: 'deadline', label: 'Дедлайн', field: row => row.deadline || '', align: 'left', sortable: true }
    ],
    organizationPagination: {
      rowsPerPage: 10
    },
    taskPagination: {
      rowsPerPage: 8
    },
    slaInfoByTaskId: {},
    slaInfoLoadingByTaskId: {},
    slaInfoLoadFailedByTaskId: {},
    addingVisit: false,
    visitHistoryDialog: false,
    visitHistoryLoading: false,
    visitHistoryOrganization: null,
    visitHistoryRows: [],
    visitHistoryPagination: {
      rowsPerPage: 8
    },
    visitHistoryColumns: [
      { name: 'visitDate', label: 'Дата', field: 'visitDate', align: 'left', sortable: true },
      { name: 'type', label: 'Тип', field: 'type', align: 'left', sortable: true },
      { name: 'task', label: 'Заявка', field: 'taskTitle', align: 'left' },
      { name: 'counted', label: 'Пакет', field: 'countedInPackage', align: 'left', sortable: true },
      { name: 'price', label: 'Стоимость', field: 'price', align: 'left', sortable: true },
      { name: 'comment', label: 'Комментарий', field: 'comment', align: 'left' }
    ],
    addVisitDialog: false,
    visitSaving: false,
    visitHistoryByOrganizationId: {},
    visitHistoryLoadingByOrganizationId: {},
    visitForm: {
      visitDate: null,
      type: 'Плановый выезд',
      comment: '',
      price: null,
      countedInPackage: true,
      selectedTask: null
    },
    nowTs: Date.now(),
    slaTimer: null,
    organizationInfoCardHeight: null,
    organizationInfoResizeObserver: null,
    organizationTaskStatsById: {},
    organizationTasks: [],
    organizationTasksLoading: false,
    organizationTasksLoadedOnce: false,
    organizationTasksLoadSeq: 0,
    organizationTasksPageSize: 100,
  }),

  computed: {
    organizationsSource () {
      return this.normalizeOrganizations(this.store.organizations || [])
    },

    clientsSource () {
      return this.store.clients || []
    },

    tasksSource () {
      if (this.organizationTasksLoadedOnce) {
        return this.organizationTasks
      }
      return this.store.getTasks || []
    },

    organizationRows () {
      return this.organizationsSource.map(organization => this.buildOrganizationRow(organization))
    },

    sortedFilteredOrganizations () {
      const query = this.searchRequest.trim().toLowerCase()
      let rows = this.organizationRows

      if (query) {
        rows = rows.filter(row => {
          return [
            row.name,
            row.contractLabel,
            row.slaAgreementLabel,
            ...row.employeesList.map(client => this.getClientName(client)),
            ...row.tasksList.map(task => this.getTaskTitle(task))
          ].join(' ').toLowerCase().includes(query)
        })
      }

      return [...rows].sort((a, b) => {
        if (this.sortType === 'OPEN_TASKS') {
          return b.openTasks - a.openTasks
        }
        if (this.sortType === 'OVERDUE_SLA') {
          return b.overdueTasks - a.overdueTasks
        }
        if (this.sortType === 'VISITS_USAGE') {
          return b.visits.percent - a.visits.percent
        }
        if (this.sortType === 'LAST_ACTIVITY') {
          return b.lastActivityTs - a.lastActivityTs
        }
        return a.name.localeCompare(b.name, 'ru')
      })
    },

    selectedOrganization () {
      if (this.selectedOrganizationModel) {
        return this.selectedOrganizationModel
      }
      return this.organizationsSource.find(organization => this.getOrganizationKey(organization) === this.selectedOrganizationKey) || null
    },

    selectedOrganizationName () {
      return this.getOrganizationName(this.selectedOrganization)
    },

    selectedOrganizationEmployees () {
      return this.getOrganizationClients(this.selectedOrganization)
    },

    selectedOrganizationTasks () {
      return this.getOrganizationTasks(this.selectedOrganization)
    },

    selectedOrganizationOpenTasks () {
      return this.selectedOrganizationTasks.filter(task => !this.isTaskClosed(task))
    },

    selectedOrganizationTaskStats () {
      return this.getOrganizationTaskStats(this.selectedOrganization)
    },

    selectedOrganizationOpenTasksCount () {
      return Number(this.selectedOrganizationTaskStats.openTasks || 0)
    },

    selectedOrganizationTotalTasksCount () {
      return Number(this.selectedOrganizationTaskStats.totalTasks || 0)
    },

    selectedOrganizationVisibleTasks () {
      if (this.showCompletedTasks) {
        return this.selectedOrganizationTasks
      }
      return this.selectedOrganizationOpenTasks
    },

    selectedOrganizationOverdueTasks () {
      return this.selectedOrganizationOpenTasks.filter(task => this.isTaskSlaOverdue(task))
    },

    selectedOrganizationContractLabel () {
      return this.getOrganizationContractLabel(this.selectedOrganization)
    },

    selectedOrganizationVisitStats () {
      return this.getOrganizationVisitStats(this.selectedOrganization)
    },

    selectedOrganizationMinimalSla () {
      return this.getOrganizationMinimalSla(this.selectedOrganization)
    },

    selectedOrganizationLastActivity () {
      return this.formatDateTime(this.getOrganizationLastActivityTs(this.selectedOrganization))
    },

    totalEmployees () {
      return this.organizationRows.reduce((sum, row) => sum + row.employees, 0)
    },

    totalOpenTasks () {
      return this.organizationRows.reduce((sum, row) => sum + row.openTasks, 0)
    },

    totalOverdueSla () {
      return this.organizationRows.reduce((sum, row) => sum + row.overdueTasks, 0)
    },

    isMobile () {
      return this.$q.screen.width < 1023
    },

    organizationsListCardStyle () {
      if (this.isMobile || !this.organizationInfoCardHeight) {
        return {}
      }
      return {
        height: `${this.organizationInfoCardHeight}px`
      }
    },

    selectedOrganizationVisitHistory () {
      const organizationId = this.selectedOrganization?.id
      if (!organizationId) {
        return []
      }
      return this.visitHistoryByOrganizationId[organizationId] || []
    },

    selectedOrganizationVisitHistoryLoading () {
      const organizationId = this.selectedOrganization?.id
      if (!organizationId) {
        return false
      }
      return Boolean(this.visitHistoryLoadingByOrganizationId[organizationId])
    },

    visitTaskOptions () {
      return this.selectedOrganizationTasks.map(task => ({
        label: `#${task.id} ${this.getTaskTitle(task)}`,
        value: task.id,
        taskTitle: this.getTaskTitle(task)
      }))
    },

    openTaskSlaPreloadKey () {
      return this.tasksSource
        .filter(task => task?.id && !this.isTaskClosed(task) && this.hasTaskSlaSource(task))
        .map(task => String(task.id))
        .sort((left, right) => Number(left) - Number(right))
        .join(',')
    },
  },

  watch: {
    sortedFilteredOrganizations: {
      deep: true,
      handler (rows) {
        if (!this.selectedOrganizationKey) {
          return
        }

        if (!rows.some(row => row.key === this.selectedOrganizationKey)) {
          this.selectedOrganizationKey = null
          this.organizationDialog = false
        }
      }
    },

    selectedOrganizationKey () {
      this.preloadSlaInfosForOrganization(this.selectedOrganization)
      this.loadOrganizationVisitHistory(this.selectedOrganization)
    },

    openTaskSlaPreloadKey: {
      immediate: true,
      handler () {
        this.preloadSlaInfosForAllOpenTasks()
      }
    },

    isShowTableMode (value) {
      localStorage.setItem('organizationsTableMode', value ? 'true' : 'false')
    }
  },

  mounted () {
    document.title = 'ULDESK : Организации'
    this.isShowTableMode = localStorage.getItem('organizationsTableMode') === 'true'
    this.slaTimer = setInterval(() => {
      this.nowTs = Date.now()
    }, 1000)
    this.selectInitialOrganization()
    Promise.all([
      this.loadOrganizationTaskStats(),
      this.loadOrganizationTasksForPage(true)
    ]).then(() => {
      this.$nextTick(() => {
        this.preloadSlaInfosForAllOpenTasks()
      })
    })
  },

  beforeUnmount () {
    clearInterval(this.slaTimer)
    if (this.organizationInfoResizeObserver) {
      this.organizationInfoResizeObserver.disconnect()
      this.organizationInfoResizeObserver = null
    }
  },

  methods: {
    normalizeOrganizations (organizations) {
      const map = new Map()

      organizations.forEach(organization => {
        if (!organization) {
          return
        }
        map.set(this.getOrganizationKey(organization), organization)
      })

      this.clientsSource.forEach(client => {
        const organization = client?.organization
        if (!organization) {
          return
        }
        const key = this.getOrganizationKey(organization)
        if (!map.has(key)) {
          map.set(key, organization)
        }
      })

      return [...map.values()].filter(organization => this.getOrganizationName(organization))
    },

    buildOrganizationRow (organization) {
      const employeesList = this.getOrganizationClients(organization)
      const tasksList = this.getOrganizationTasks(organization)
      const openTasks = tasksList.filter(task => !this.isTaskClosed(task))
      const taskStats = this.getOrganizationTaskStats(organization)
      const totalTasks = Number(taskStats.totalTasks || 0)
      const openTasksCount = Number(taskStats.openTasks || 0)
      const overdueTasksCount = Number(taskStats.overdueTasks || 0)

      const slaLoading = this.hasLoadingSlaInfoForTasks(openTasks)
      const overdueTasks = openTasks.filter(task => this.isTaskSlaOverdue(task))
      const minimalSla = this.getOrganizationMinimalSla(organization)
      const visits = this.getOrganizationVisitStats(organization)
      const lastActivityTs = this.getOrganizationLastActivityTs(organization)

      return {
        key: this.getOrganizationKey(organization),
        organization,
        name: this.getOrganizationName(organization),
        contractLabel: this.getOrganizationContractLabel(organization),
        slaAgreementLabel: this.getOrganizationSlaAgreementLabel(organization),
        employees: employeesList.length,
        employeesList,
        tasks: totalTasks,
        tasksList,
        openTasks: openTasksCount,
        overdueTasks: overdueTasksCount || overdueTasks.length,
        slaLoading,
        visits,
        minSlaLabel: minimalSla.label,
        minSlaPercent: minimalSla.percent,
        minSlaColor: minimalSla.color,
        minSlaSortValue: minimalSla.leftMs ?? Number.MAX_SAFE_INTEGER,
        lastActivityTs
      }
    },

    selectInitialOrganization () {
      const organizationFromUrl = this.$route?.query?.organization ||
        this.$route?.query?.organizationId ||
        this.$route?.query?.organizationid

      if (!organizationFromUrl) {
        return
      }

      const value = String(organizationFromUrl)
      const found = this.organizationsSource.find(organization => {
        return this.getOrganizationKey(organization) === value ||
          String(organization.id || '') === value ||
          this.getOrganizationName(organization) === value
      })

      if (found) {
        this.openOrganizationDialog(found, true)
      }
    },

    selectOrganization (organization, updateRoute = true) {
      if (!organization) {
        this.selectedOrganizationKey = null
        this.selectedOrganizationModel = null
        return
      }

      const organizationKey = this.getOrganizationKey(organization)
      const organizationRouteValue = organization.id !== undefined && organization.id !== null
        ? String(organization.id)
        : organizationKey

      this.selectedOrganizationKey = organizationKey
      this.selectedOrganizationModel = organization

      if (updateRoute && String(this.$route?.query?.organization || '') !== organizationRouteValue) {
        const query = { ...this.$route.query }
        delete query.organizationId
        delete query.organizationid
        query.organization = organizationRouteValue

        const navigation = this.$router.replace({
          path: this.$route.path,
          query
        })

        if (navigation?.catch) {
          navigation.catch(() => {})
        }
      }
    },

    openOrganizationRow (event, row) {
      this.openOrganizationDialog(row?.organization)
    },

    openOrganizationDialog (organization, updateRoute = true) {
      if (!organization) {
        return
      }

      this.selectOrganization(organization, updateRoute)

      this.$nextTick(() => {
        this.organizationDialog = true
      })
    },

    closeOrganizationDialog () {
      this.organizationDialog = false
      this.selectedOrganizationKey = null
      this.selectedOrganizationModel = null

      if (!this.$route?.query?.organization) {
        return
      }

      const query = { ...this.$route.query }
      delete query.organization
      delete query.organizationId
      delete query.organizationid

      const navigation = this.$router.replace({
        path: this.$route.path,
        query
      })

      if (navigation?.catch) {
        navigation.catch(() => {})
      }
    },

    getOrganizationKey (organization) {
      if (!organization) {
        return ''
      }
      if (organization.id !== undefined && organization.id !== null) {
        return `id:${organization.id}`
      }
      return `name:${this.getOrganizationName(organization).toLowerCase()}`
    },

    isSameOrganization (left, right) {
      if (!left || !right) {
        return false
      }
      if (left.id !== undefined && right.id !== undefined && left.id !== null && right.id !== null) {
        return Number(left.id) === Number(right.id)
      }
      return this.getOrganizationName(left).toLowerCase() === this.getOrganizationName(right).toLowerCase()
    },

    getOrganizationName (organization) {
      return organization?.name || organization?.title || organization?.shortName || 'Без названия'
    },

    getOrganizationClients (organization) {
      if (!organization) {
        return []
      }
      return this.clientsSource.filter(client => this.isSameOrganization(client?.organization, organization))
    },

    getOrganizationTasks (organization) {
      if (!organization) {
        return []
      }
      return this.tasksSource.filter(task => this.isSameOrganization(this.getTaskOrganization(task), organization))
    },

    getTaskOrganization (task) {
      return task?.client?.organization || task?.organization || null
    },

    getOrganizationContractLabel (organization) {
      if (!organization) {
        return 'Договор не указан'
      }
      const contractNumber = organization.contractNumber || organization.contractNo || organization.contract?.number
      const contractDate = organization.contractDate || organization.contract?.date || organization.contractStartDate
      const dateLabel = contractDate ? this.formatDate(contractDate) : ''

      if (contractNumber && dateLabel) {
        return `Договор № ${contractNumber} от ${dateLabel}`
      }
      if (contractNumber) {
        return `Договор № ${contractNumber}`
      }
      if (dateLabel) {
        return `Договор от ${dateLabel}`
      }
      return 'Договор не указан'
    },

    getOrganizationTariff (organization) {
      return organization?.tariffName ||
        organization?.tariff?.name ||
        organization?.servicePackageName ||
        organization?.packageName ||
        'Не указан'
    },

    getOrganizationResponsible (organization) {
      if (organization?.managerName) {
        return organization.managerName
      }

      const responsible = organization?.responsible || organization?.manager || organization?.accountManager
      if (!responsible) {
        return 'Не указан'
      }
      if (typeof responsible === 'string') {
        return responsible
      }
      return [responsible.firstname, responsible.lastname]
        .filter(Boolean)
        .join(' ') || responsible.username || responsible.name || 'Не указан'
    },

    getOrganizationSlaAgreementLabel (organization) {
      return organization?.slaAgreementName ||
        organization?.slaPolicyName ||
        organization?.sla?.name ||
        organization?.settings?.slaAgreementName ||
        'По настройкам SLA в заявках / приоритетах'
    },

    getOrganizationFirstResponseSlaLabel (organization) {
      const value = organization?.firstResponseSlaMinutes ||
        organization?.slaFirstResponseMinutes ||
        organization?.settings?.firstResponseSlaMinutes ||
        organization?.sla?.firstResponseMinutes

      if (Number.isFinite(Number(value))) {
        return this.formatMinutes(Number(value))
      }

      const duration = organization?.firstResponseSlaDuration || organization?.sla?.firstResponseDuration
      if (duration) {
        return this.formatDurationMs(this.parseIsoDurationToMs(duration))
      }

      return 'Из общих настроек'
    },

    getOrganizationResolutionSlaLabel (organization) {
      const value = organization?.resolutionSlaMinutes ||
        organization?.taskResolutionSlaMinutes ||
        organization?.settings?.resolutionSlaMinutes ||
        organization?.sla?.resolutionMinutes

      if (Number.isFinite(Number(value))) {
        return this.formatMinutes(Number(value))
      }

      const valueHours = organization?.slaResolutionHours || organization?.resolutionSlaHours || organization?.settings?.resolutionSlaHours
      if (Number.isFinite(Number(valueHours))) {
        return this.formatMinutes(Number(valueHours) * 60)
      }

      const duration = organization?.resolutionSlaDuration || organization?.sla?.duration || organization?.slaDuration
      if (duration) {
        return this.formatDurationMs(this.parseIsoDurationToMs(duration))
      }

      return 'Из настроек типа / приоритета заявки'
    },

    getOrganizationAddressLabel (organization) {
      if (organization?.serviceAddresses) {
        return organization.serviceAddresses
      }

      const addresses = organization?.addresses || organization?.objects || organization?.locations
      if (Array.isArray(addresses) && addresses.length > 0) {
        return addresses
          .map(address => typeof address === 'string' ? address : address.name || address.address || address.title)
          .filter(Boolean)
          .slice(0, 3)
          .join(', ')
      }
      return organization?.mainAddress || organization?.address || organization?.legalAddress || 'Не указаны'
    },

    getOrganizationChannelsLabel (organization) {
      if (organization?.communicationChannels) {
        return organization.communicationChannels
      }

      const employees = this.getOrganizationClients(organization)
      const channels = [...new Set(employees.map(client => client.sourceChannel || client.messageFrom).filter(Boolean))]
      if (channels.length === 0) {
        return 'Не указаны'
      }
      return channels.join(', ')
    },

    getOrganizationPriorityLabel (organization) {
      const value = organization?.priorityLevel || organization?.priority?.name || organization?.priorityName || organization?.criticality
      const labels = {
        LOW: 'Низкий',
        NORMAL: 'Обычный',
        HIGH: 'Высокий',
        CRITICAL: 'Критичный'
      }
      return labels[value] || value || 'Обычный'
    },

    getOrganizationCommentLabel (organization) {
      return organization?.comment || organization?.description || organization?.note || 'Нет комментария'
    },

    getOrganizationValueLabel (value, fallback = 'Не указано') {
      return value !== undefined && value !== null && String(value).trim() !== '' ? value : fallback
    },

    getOrganizationActiveLabel (organization) {
      return organization?.active === false ? 'Неактивна' : 'Активна'
    },

    getOrganizationInnLabel (organization) {
      return this.getOrganizationValueLabel(organization?.inn)
    },

    getOrganizationKppLabel (organization) {
      return this.getOrganizationValueLabel(organization?.kpp)
    },

    getOrganizationExternalIdLabel (organization) {
      return this.getOrganizationValueLabel(organization?.externalId)
    },

    getOrganizationMainAddressLabel (organization) {
      return this.getOrganizationValueLabel(organization?.mainAddress || organization?.address || organization?.legalAddress)
    },

    getOrganizationManagerNameLabel (organization) {
      return this.getOrganizationValueLabel(organization?.managerName || this.getOrganizationResponsible(organization))
    },

    getOrganizationManagerPhoneLabel (organization) {
      return this.getOrganizationValueLabel(organization?.managerPhone)
    },

    getOrganizationManagerEmailLabel (organization) {
      return this.getOrganizationValueLabel(organization?.managerEmail)
    },

    getOrganizationContractPeriodLabel (organization) {
      const start = organization?.contractStartDate ? this.formatDate(organization.contractStartDate) : ''
      const end = organization?.contractEndDate ? this.formatDate(organization.contractEndDate) : ''

      if (start && end) {
        return `${start} — ${end}`
      }
      if (start) {
        return `с ${start}`
      }
      if (end) {
        return `до ${end}`
      }
      return 'Не указан'
    },

    getOrganizationMonthlyFeeLabel (organization) {
      return this.formatMoney(organization?.monthlyFee)
    },

    getOrganizationVisitCommentLabel (organization) {
      return this.getOrganizationValueLabel(organization?.visitComment, 'Нет условий')
    },

    getOrganizationExtraVisitPriceLabel (organization) {
      return this.formatMoney(organization?.extraVisitPrice)
    },

    getOrganizationUrgentVisitPriceLabel (organization) {
      return this.formatMoney(organization?.urgentVisitPrice)
    },

    getOrganizationVisitResetDayLabel (organization) {
      const value = organization?.visitResetDay
      if (Number.isFinite(Number(value)) && Number(value) > 0) {
        return `${Number(value)} число каждого месяца`
      }
      return 'Ежемесячно'
    },

    getOrganizationRemoteSupportLabel (organization) {
      return organization?.includedRemoteSupport === false ? 'Не входит' : 'Входит'
    },

    getOrganizationSlaCalendarLabel (organization) {
      const value = organization?.slaWorkCalendar
      const labels = {
        GENERAL_SETTINGS: 'Из общих настроек',
        BUSINESS_HOURS: 'Рабочее время',
        CALENDAR_24_7: '24/7'
      }
      return labels[value] || value || 'Из общих настроек'
    },

    getOrganizationPauseSlaOnWaitingClientLabel (organization) {
      return organization?.pauseSlaOnWaitingClient === false ? 'Нет' : 'Да'
    },

    getOrganizationSlaCommentLabel (organization) {
      return this.getOrganizationValueLabel(organization?.slaComment, 'Нет комментария')
    },

    getOrganizationInternalCommentLabel (organization) {
      return this.getOrganizationValueLabel(organization?.internalComment, 'Нет комментария')
    },

    getOrganizationLastActivityTs (organization) {
      const employees = this.getOrganizationClients(organization)
      const tasks = this.getOrganizationTasks(organization)
      const dates = []

      employees.forEach(client => {
        if (client.lastMessage?.date) {
          dates.push(new Date(client.lastMessage.date).getTime())
        }
        if (client.updatedAt) {
          dates.push(new Date(client.updatedAt).getTime())
        }
      })

      tasks.forEach(task => {
        if (task.updatedAt) {
          dates.push(new Date(task.updatedAt).getTime())
        }
        if (task.createdAt) {
          dates.push(new Date(task.createdAt).getTime())
        }
      })

      const validDates = dates.filter(date => Number.isFinite(date))
      if (validDates.length === 0) {
        return 0
      }
      return Math.max(...validDates)
    },

    getOrganizationVisitStats (organization) {
      if (!organization || organization.useVisitsLimit !== true) {
        return this.emptyVisitStats()
      }

      const limitRaw = this.firstFiniteNumber([
        organization.monthlyVisitsLimit,
        organization.visitsLimit,
        organization.visitLimit,
        organization.includedVisits,
        organization.servicePackage?.visitsLimit,
        organization.settings?.monthlyVisitsLimit
      ])

      const usedRaw = this.firstFiniteNumber([
        organization.monthlyVisitsUsed,
        organization.visitsUsed,
        organization.usedVisits,
        organization.servicePackage?.visitsUsed,
        organization.settings?.monthlyVisitsUsed
      ])

      const limit = limitRaw !== null ? limitRaw : 0
      const used = usedRaw !== null ? usedRaw : 0
      const left = Math.max(0, limit - used)
      const overLimit = Math.max(0, used - limit)
      const percent = limit > 0 ? Math.min(1, used / limit) : 0

      const extraPrice = this.firstFiniteNumber([
        organization.extraVisitPrice,
        organization.visitOverLimitPrice,
        organization.visitPrice,
        organization.servicePackage?.extraVisitPrice,
        organization.settings?.extraVisitPrice
      ])

      const resetDate = organization.visitsResetDate || organization.visitResetDate || organization.servicePackage?.visitsResetDate

      return {
        enabled: true,
        limit,
        used,
        left,
        overLimit,
        percent,
        color: overLimit > 0 ? 'negative' : percent >= 0.8 ? 'orange' : 'primary',
        label: `${used} / ${limit}`,
        extraPriceLabel: extraPrice !== null ? `${extraPrice.toLocaleString('ru-RU')} ₽` : 'Не указана',
        resetLabel: resetDate ? this.formatDate(resetDate) : this.getOrganizationVisitResetDayLabel(organization)
      }
    },

    emptyVisitStats () {
      return {
        enabled: false,
        limit: 0,
        used: 0,
        left: 0,
        overLimit: 0,
        percent: 0,
        color: 'grey',
        label: 'Не настроены',
        extraPriceLabel: 'Не указана',
        resetLabel: 'Не указана'
      }
    },

    getCurrentMonthVisitTasks (organization) {
      const startOfMonth = moment().startOf('month')
      const endOfMonth = moment().endOf('month')

      return this.getOrganizationTasks(organization).filter(task => {
        if (!this.isVisitTask(task)) {
          return false
        }
        const date = task.closedAt || task.completedAt || task.createdAt
        if (!date) {
          return true
        }
        return moment(date).isBetween(startOfMonth, endOfMonth, undefined, '[]')
      })
    },

    isVisitTask (task) {
      if (!task) {
        return false
      }
      if (task.visit === true || task.fieldVisit === true || task.onsite === true || task.outboundVisit === true) {
        return true
      }
      const source = [
        task.serviceType,
        task.workFormat,
        task.executionFormat,
        task.type?.name,
        task.type,
        task.title,
        task.name,
        task.description
      ].filter(Boolean).join(' ').toLowerCase()

      return source.includes('выезд') || source.includes('на месте') || source.includes('onsite')
    },

    getOrganizationMinimalSla (organization) {
      const openTasks = this.getOrganizationTasks(organization).filter(item => !this.isTaskClosed(item))

      if (this.hasLoadingSlaInfoForTasks(openTasks)) {
        return {
          task: null,
          label: 'Проверка SLA...',
          percent: null,
          color: 'grey',
          overdue: false,
          leftMs: null
        }
      }

      const task = this.getMinimalSlaTask(openTasks)
      if (!task) {
        return {
          task: null,
          label: 'Нет активного SLA',
          percent: null,
          color: 'grey',
          overdue: false,
          leftMs: null
        }
      }

      const leftMs = this.getSlaLeftMs(task)
      const totalMs = this.getSlaTotalMs(task)
      const percent = totalMs > 0 && leftMs !== null ? Math.max(0, Math.min(1, leftMs / totalMs)) : null
      const overdue = leftMs !== null && leftMs <= 0

      return {
        task,
        label: leftMs === null ? 'SLA задан' : overdue ? 'Просрочено' : this.formatDurationMs(leftMs),
        percent,
        color: overdue ? 'negative' : percent !== null && percent <= 0.25 ? 'negative' : percent !== null && percent <= 0.5 ? 'orange' : 'positive',
        overdue,
        leftMs
      }
    },

    getMinimalSlaTask (tasks) {
      const withSla = (tasks || []).filter(task => this.hasTaskSla(task) && !this.isTaskSlaInfoLoading(task))
      if (withSla.length === 0) {
        return null
      }
      return withSla.reduce((best, task) => {
        const bestLeft = this.getSlaLeftMs(best)
        const taskLeft = this.getSlaLeftMs(task)
        return taskLeft !== null && (bestLeft === null || taskLeft < bestLeft) ? task : best
      }, withSla[0])
    },

    hasTaskSlaSource (task) {
      if (!task) {
        return false
      }

      return !!(
        task.sla?.id ||
        task.sla?.startDate ||
        task.sla?.duration ||
        task.slaStartDate ||
        task.slaDuration ||
        task.slaInfo ||
        task.slaStatus ||
        task.slaExpired === true ||
        task.slaOverdue === true ||
        task.slaViolated === true
      )
    },

    hasTaskSla (task) {
      if (!task) {
        return false
      }

      const loadedInfo = this.getLoadedSlaInfo(task)
      if (loadedInfo) {
        return this.isSlaInfoActive(loadedInfo)
      }

      return this.hasTaskSlaSource(task)
    },

    getLoadedSlaInfo (task) {
      if (!task?.id) {
        return null
      }
      return this.slaInfoByTaskId[task.id] || null
    },

    getSlaInfo (task) {
      return this.getLoadedSlaInfo(task) || task?.slaInfo || task?.slaStatus || null
    },

    isTaskSlaInfoLoading (task) {
      return Boolean(task?.id && this.hasTaskSlaSource(task) && this.slaInfoLoadingByTaskId[task.id])
    },

    hasLoadingSlaInfoForTasks (tasks) {
      return (tasks || []).some(task => this.isTaskSlaInfoLoading(task))
    },

    isSlaInfoActive (info) {
      if (!info || info.active === false || info.enabled === false || info.hasSla === false || info.exists === false) {
        return false
      }

      const remainingSeconds = Number(info.remainingSeconds)
      const deadlineMs = info.deadline ? new Date(info.deadline).getTime() : NaN

      return Number.isFinite(remainingSeconds) ||
        Number.isFinite(deadlineMs) ||
        info.overdue === true ||
        info.slaOverdue === true ||
        info.slaExpired === true ||
        info.slaViolated === true
    },

    getSlaLeftMsFromInfo (info) {
      if (!this.isSlaInfoActive(info)) {
        return null
      }

      const remainingSeconds = Number(info.remainingSeconds)
      const deadlineMs = info.deadline ? new Date(info.deadline).getTime() : NaN

      if (Number.isFinite(remainingSeconds)) {
        return Math.max(0, remainingSeconds * 1000)
      }
      if (Number.isFinite(deadlineMs)) {
        return Math.max(0, deadlineMs - this.nowTs)
      }

      return null
    },

    isSlaInfoOverdue (info) {
      if (!this.isSlaInfoActive(info)) {
        return false
      }

      if (info.overdue === true || info.slaOverdue === true || info.slaExpired === true || info.slaViolated === true) {
        return true
      }

      const leftMs = this.getSlaLeftMsFromInfo(info)
      return leftMs !== null && leftMs <= 0
    },

    async preloadSlaInfosForAllOpenTasks () {
      await this.preloadSlaInfosForTasks(this.tasksSource.filter(task => !this.isTaskClosed(task)))
    },

    async preloadSlaInfosForOrganization (organization) {
      await this.preloadSlaInfosForTasks(this.getOrganizationTasks(organization).filter(task => !this.isTaskClosed(task)))
    },

    async preloadSlaInfosForTasks (tasks) {
      const taskIds = (tasks || [])
        .filter(task => task?.id && this.hasTaskSlaSource(task))
        .map(task => task.id)
      const uniqIds = [...new Set(taskIds)]
      await Promise.all(uniqIds.map(id => this.loadSlaInfoForTaskId(id)))
    },

    async loadSlaInfoForTaskId (taskId) {
      if (!taskId || this.slaInfoByTaskId[taskId] || this.slaInfoLoadingByTaskId[taskId]) {
        return
      }

      this.slaInfoLoadingByTaskId = {
        ...this.slaInfoLoadingByTaskId,
        [taskId]: true
      }

      try {
        const response = await axios.get(`/api/v1/task/${taskId}/sla/info`)
        this.slaInfoByTaskId = {
          ...this.slaInfoByTaskId,
          [taskId]: response.data || {}
        }

        const failed = { ...this.slaInfoLoadFailedByTaskId }
        delete failed[taskId]
        this.slaInfoLoadFailedByTaskId = failed
      } catch (e) {
        this.slaInfoLoadFailedByTaskId = {
          ...this.slaInfoLoadFailedByTaskId,
          [taskId]: true
        }
      } finally {
        const loading = { ...this.slaInfoLoadingByTaskId }
        delete loading[taskId]
        this.slaInfoLoadingByTaskId = loading
      }
    },

    getSlaLeftMs (task) {
      if (!task) {
        return null
      }

      const loadedInfo = this.getLoadedSlaInfo(task)
      if (loadedInfo) {
        return this.getSlaLeftMsFromInfo(loadedInfo)
      }

      const info = task.slaInfo || task.slaStatus
      if (info) {
        const leftMsFromInfo = this.getSlaLeftMsFromInfo(info)
        if (leftMsFromInfo !== null) {
          return leftMsFromInfo
        }
      }

      if (task.id && this.hasTaskSlaSource(task) && this.slaInfoLoadFailedByTaskId[task.id] !== true) {
        return null
      }

      const startDate = task.sla?.startDate || task.slaStartDate || task.createdAt
      const duration = task.sla?.duration || task.slaDuration
      if (!startDate || !duration) {
        return null
      }

      const startMs = new Date(startDate).getTime()
      const durationMs = this.parseIsoDurationToMs(duration)
      if (!Number.isFinite(startMs) || durationMs <= 0) {
        return null
      }

      return Math.max(0, startMs + durationMs - this.nowTs)
    },

    getSlaTotalMs (task) {
      const loadedInfo = this.getLoadedSlaInfo(task)
      if (loadedInfo) {
        const deadlineMs = loadedInfo.deadline ? new Date(loadedInfo.deadline).getTime() : NaN
        const createdAtMs = task?.createdAt ? new Date(task.createdAt).getTime() : NaN
        if (Number.isFinite(deadlineMs) && Number.isFinite(createdAtMs) && deadlineMs > createdAtMs) {
          return deadlineMs - createdAtMs
        }
        return 0
      }

      const duration = task?.sla?.duration || task?.slaDuration
      const durationMs = this.parseIsoDurationToMs(duration)
      if (durationMs > 0) {
        return durationMs
      }

      const info = this.getSlaInfo(task)
      const deadlineMs = info?.deadline ? new Date(info.deadline).getTime() : NaN
      const createdAtMs = task?.createdAt ? new Date(task.createdAt).getTime() : NaN
      if (Number.isFinite(deadlineMs) && Number.isFinite(createdAtMs) && deadlineMs > createdAtMs) {
        return deadlineMs - createdAtMs
      }

      return 0
    },

    isTaskSlaOverdue (task) {
      if (!task || this.isTaskSlaInfoLoading(task)) {
        return false
      }

      const loadedInfo = this.getLoadedSlaInfo(task)
      if (loadedInfo) {
        return this.isSlaInfoOverdue(loadedInfo)
      }

      if (task.id && this.hasTaskSlaSource(task) && this.slaInfoLoadFailedByTaskId[task.id] !== true) {
        return false
      }

      const leftMs = this.getSlaLeftMs(task)
      if (leftMs !== null && leftMs <= 0) {
        return true
      }
      return task?.slaExpired === true || task?.slaOverdue === true || task?.slaViolated === true
    },

    getTaskSlaLabel (task) {
      if (this.isTaskSlaInfoLoading(task)) {
        return 'Проверка SLA...'
      }
      if (!this.hasTaskSla(task)) {
        return '—'
      }
      const leftMs = this.getSlaLeftMs(task)
      if (leftMs === null) {
        return 'SLA задан'
      }
      if (leftMs <= 0) {
        return 'Просрочено'
      }
      return this.formatDurationMs(leftMs)
    },

    parseIsoDurationToMs (duration) {
      if (!duration) {
        return 0
      }
      if (typeof duration.asMilliseconds === 'function') {
        const ms = duration.asMilliseconds()
        return Number.isFinite(ms) && ms > 0 ? ms : 0
      }
      if (typeof duration === 'number') {
        return duration * 1000
      }
      if (typeof duration === 'object') {
        if (Number.isFinite(duration.seconds)) {
          return duration.seconds * 1000
        }
        if (Number.isFinite(duration.milliseconds)) {
          return duration.milliseconds
        }
        if (Number.isFinite(duration._milliseconds)) {
          return duration._milliseconds
        }
      }
      if (typeof duration === 'string') {
        const asNumber = Number(duration)
        if (Number.isFinite(asNumber) && asNumber > 0) {
          return asNumber * 1000
        }
        const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
        if (match) {
          const days = Number(match[1] || 0)
          const hours = Number(match[2] || 0)
          const minutes = Number(match[3] || 0)
          const seconds = Number(match[4] || 0)
          return (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000
        }
      }
      return 0
    },

    formatDurationMs (ms) {
      if (!Number.isFinite(ms) || ms < 0) {
        return '—'
      }
      const totalMinutes = Math.ceil(ms / 60000)
      if (totalMinutes < 60) {
        return `${totalMinutes} мин`
      }
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      if (hours < 24) {
        return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`
      }
      const days = Math.floor(hours / 24)
      const restHours = hours % 24
      return restHours > 0 ? `${days} д ${restHours} ч` : `${days} д`
    },

    formatMinutes (minutes) {
      return this.formatDurationMs(minutes * 60000)
    },

    getTaskTitle (task) {
      return task?.title || task?.name || `Заявка #${task?.id || ''}`
    },

    getTaskTypeName (task) {
      const type = task?.type
      if (!type) {
        return 'Без типа'
      }
      if (typeof type === 'string') {
        return type
      }
      return type.name || 'Без типа'
    },

    getTaskStatusName (task) {
      return task?.status?.name || 'Без статуса'
    },

    getTaskDeadlineLabel (task) {
      return task?.deadline ? this.formatDateTime(task.deadline) : '—'
    },

    isTaskClosed (task) {
      if (!task) {
        return false
      }
      if (task.completed === true) {
        return true
      }
      const statusName = (task.status?.name || '').toLowerCase()
      return ['закрыта', 'закрыто', 'выполнена', 'выполнено', 'решена', 'решено'].includes(statusName)
    },

    getClientName (client) {
      return [client?.lastname, client?.firstname]
        .filter(Boolean)
        .join(' ') || client?.username || client?.name || 'Без имени'
    },

    getClientInitials (client) {
      const name = this.getClientName(client).trim()
      if (!name) {
        return '?'
      }
      return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase()
    },

    getClientOpenTasksCount (client) {
      return this.getClientTasks(client)
        .filter(task => !this.isTaskClosed(task))
        .length
    },

    getClientTasks (client) {
      if (!client) {
        return []
      }
      return this.tasksSource.filter(task => this.isTaskBelongsToClient(task, client))
    },

    isTaskBelongsToClient (task, client) {
      if (!task || !client) {
        return false
      }
      const taskClientId = this.getTaskClientId(task)
      const clientId = this.getClientId(client)
      if (taskClientId !== null && clientId !== null) {
        return taskClientId === clientId
      }
      const taskClient = task.client || task.clientDto || null
      if (taskClient) {
        return this.getClientName(taskClient) === this.getClientName(client)
      }
      return false
    },

    getTaskClientId (task) {
      return this.firstFiniteNumber([
        task?.client?.id,
        task?.clientId,
        task?.client_id,
        task?.client?.clientId
      ])
    },

    getClientId (client) {
      return this.firstFiniteNumber([
        client?.id,
        client?.clientId,
        client?.client_id
      ])
    },

    getClientOpenTasksCountText (client) {
      const count = this.getClientOpenTasksCount(client)
      return `${count} ${this.getOpenTaskWord(count)}`
    },

    getOpenTaskWord (count) {
      const value = Math.abs(Number(count || 0))
      const lastTwo = value % 100
      const lastOne = value % 10
      if (lastTwo >= 11 && lastTwo <= 14) {
        return 'откр. заявок'
      }
      if (lastOne === 1) {
        return 'откр. заявка'
      }
      if (lastOne >= 2 && lastOne <= 4) {
        return 'откр. заявки'
      }
      return 'откр. заявок'
    },

    upsertOrganizationInStore (organization) {
      if (!organization?.id) {
        return
      }
      const index = this.store.organizations.findIndex(item => Number(item.id) === Number(organization.id))
      if (index >= 0) {
        this.store.organizations.splice(index, 1, organization)
      } else {
        this.store.organizations.push(organization)
      }
    },

    openClientChat (client) {
      if (!client?.id) {
        return
      }
      this.$router.push(`/chats/${client.id}`)
    },

    openTask (task) {
      if (!task?.id) {
        return
      }
      this.$router.push({
        path: '/tasks',
        query: {
          task: task.id
        }
      })
    },

    firstFiniteNumber (values) {
      for (const value of values) {
        const number = Number(value)
        if (Number.isFinite(number)) {
          return number
        }
      }
      return null
    },

    formatDate (value) {
      if (!value) {
        return '—'
      }
      const date = moment(value)
      return date.isValid() ? date.format('DD.MM.YYYY') : '—'
    },

    formatDateTime (value) {
      if (!value) {
        return '—'
      }
      const date = moment(value)
      return date.isValid() ? date.format('DD.MM.YYYY HH:mm') : '—'
    },

    openAddVisitDialog () {
      this.visitForm = {
        visitDate: moment().format('YYYY-MM-DDTHH:mm'),
        type: 'Плановый выезд',
        comment: '',
        price: null,
        countedInPackage: Boolean(this.selectedOrganizationVisitStats.enabled),
        selectedTask: null
      }
      this.addVisitDialog = true
    },

    loadOrganizationVisitHistory (organization) {
      if (!organization?.id) {
        return
      }

      const organizationId = organization.id

      this.visitHistoryLoadingByOrganizationId = {
        ...this.visitHistoryLoadingByOrganizationId,
        [organizationId]: true
      }

      axios.get(`/api/v1/organization/${organizationId}/visits`)
        .then(response => {
          this.visitHistoryByOrganizationId = {
            ...this.visitHistoryByOrganizationId,
            [organizationId]: response.data || []
          }
        })
        .catch(e => {
          this.$q.notify({
            message: e.response?.data?.message || e.response?.data || e.message || 'Не удалось загрузить историю выездов',
            type: 'negative',
            position: 'top-right',
            actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
          })
        })
        .finally(() => {
          this.visitHistoryLoadingByOrganizationId = {
            ...this.visitHistoryLoadingByOrganizationId,
            [organizationId]: false
          }
        })
    },

    onOrganizationVisitSaved ({ organization: savedOrganization, visit: savedVisit }) {
      const organization = this.selectedOrganization
      const organizationId = savedOrganization?.id || organization?.id

      if (savedOrganization) {
        this.upsertOrganizationInStore(savedOrganization)
        this.selectedOrganizationKey = this.getOrganizationKey(savedOrganization)
        this.selectedOrganizationModel = savedOrganization
      }

      if (savedVisit && organizationId) {
        const currentHistory = this.visitHistoryByOrganizationId[organizationId] || []
        this.visitHistoryByOrganizationId = {
          ...this.visitHistoryByOrganizationId,
          [organizationId]: [savedVisit, ...currentHistory]
        }
      } else if (organization) {
        this.loadOrganizationVisitHistory(organization)
      }
      this.refreshOrganizationTasksData()
      this.$q.notify({
        message: 'Выезд добавлен',
        type: 'positive',
        position: 'top-right',
        actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
      })
    },

    submitOrganizationVisit () {
      const organization = this.selectedOrganization
      if (!organization?.id) {
        return
      }
      const selectedTask = this.visitForm.selectedTask
      const payload = {
        visitDate: this.visitForm.visitDate || null,
        type: this.visitForm.type || 'Выезд',
        comment: this.visitForm.comment || null,
        price: this.visitForm.price || null,
        countedInPackage: this.visitForm.countedInPackage,
        taskId: selectedTask?.value || null,
        taskTitle: selectedTask?.taskTitle || null
      }
      this.visitSaving = true
      axios.post(`/api/v1/organization/${organization.id}/visits`, payload)
        .then(response => {
          const savedOrganization = response.data?.organization
          const savedVisit = response.data?.visit
          if (savedOrganization) {
            this.upsertOrganizationInStore(savedOrganization)
            this.selectedOrganizationKey = this.getOrganizationKey(savedOrganization)
          }
          if (savedVisit) {
            const currentHistory = this.visitHistoryByOrganizationId[organization.id] || []
            this.visitHistoryByOrganizationId = {
              ...this.visitHistoryByOrganizationId,
              [organization.id]: [savedVisit, ...currentHistory]
            }
          } else {
            this.loadOrganizationVisitHistory(organization)
          }
          this.refreshOrganizationTasksData()
          this.addVisitDialog = false
          this.$q.notify({
            message: 'Выезд добавлен',
            type: 'positive',
            position: 'top-right',
            actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
          })
        })
        .catch(e => {
          this.$q.notify({
            message: e.response?.data?.message || e.response?.data || e.message || 'Не удалось добавить выезд',
            type: 'negative',
            position: 'top-right',
            actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
          })
        })
        .finally(() => {
          this.visitSaving = false
        })
    },

    formatMoney (value) {
      const number = Number(value)
      if (!Number.isFinite(number)) {
        return '—'
      }
      return `${number.toLocaleString('ru-RU')} ₽`
    },

    openVisitHistoryDialog (organization) {
      if (!organization?.id) {
        return
      }
      this.visitHistoryOrganization = organization
      this.visitHistoryDialog = true
      this.loadOrganizationVisitHistory(organization)
    },

    getOrganizationInfoCardElement () {
      const ref = this.$refs.organizationInfoCard
      return ref?.$el || ref || null
    },

    initOrganizationInfoResizeObserver () {
      if (this.organizationInfoResizeObserver) {
        this.organizationInfoResizeObserver.disconnect()
      }

      this.$nextTick(() => {
        const element = this.getOrganizationInfoCardElement()

        if (!element || typeof ResizeObserver === 'undefined') {
          return
        }

        this.organizationInfoResizeObserver = new ResizeObserver(() => {
          this.updateOrganizationInfoCardHeight()
        })

        this.organizationInfoResizeObserver.observe(element)
        this.updateOrganizationInfoCardHeight()
      })
    },

    updateOrganizationInfoCardHeight () {
      this.$nextTick(() => {
        const element = this.getOrganizationInfoCardElement()

        if (!element) {
          this.organizationInfoCardHeight = null
          return
        }

        this.organizationInfoCardHeight = Math.ceil(element.getBoundingClientRect().height)
      })
    },

    loadOrganizationTaskStats () {
      return axios.get('/api/v1/organizations/task-stats')
        .then(response => {
          this.organizationTaskStatsById = response.data || {}
        })
        .catch(e => {
          this.$q.notify({
            message: e.message || 'Не удалось загрузить статистику организаций',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
    },

    refreshOrganizationTasksData () {
      this.loadOrganizationTaskStats()
      if (typeof this.loadOrganizationTasksForPage === 'function') {
        this.loadOrganizationTasksForPage(true)
      }
    },

    async loadOrganizationTasksForPage (reset = false) {
      const requestSeq = ++this.organizationTasksLoadSeq
      if (reset) {
        this.organizationTasks = []
        this.organizationTasksLoadedOnce = false
      }
      this.organizationTasksLoading = true
      const loadedTasks = []
      let page = 1
      let isEnd = false

      try {
        while (!isEnd && requestSeq === this.organizationTasksLoadSeq) {
          const response = await axios.post('/api/v1/tasks-page', {
            page,
            size: this.organizationTasksPageSize,
            includeCompleted: true,
            search: '',
            filterJoinOperator: 'AND',
            filterChain: [],
            requiredFilterChain: [],
            sortSlug: 'creating',
            ascendingSort: false
          })
          const data = response.data || {}
          const tasks = Array.isArray(data.tasks) ? data.tasks : []
          loadedTasks.push(
            ...tasks.map(task => this.normalizeOrganizationTask(task))
          )
          isEnd = Boolean(data.isEnd) || tasks.length === 0
          page += 1
        }
        if (requestSeq !== this.organizationTasksLoadSeq) {
          return
        }
        this.organizationTasks = this.uniqueTasksById(loadedTasks)
        this.organizationTasksLoadedOnce = true
      } catch (e) {
        this.$q.notify({
          message: e.message || 'Не удалось загрузить заявки организаций',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
      } finally {
        if (requestSeq === this.organizationTasksLoadSeq) {
          this.organizationTasksLoading = false
        }
      }
    },

    normalizeOrganizationTask (task) {
      if (!task) {
        return task
      }
      if (this.store && typeof this.store.normalizeTaskPageTask === 'function') {
        return this.store.normalizeTaskPageTask(task)
      }
      return task
    },

    uniqueTasksById (tasks) {
      const map = new Map()
      ;(tasks || []).forEach(task => {
        if (!task || task.id === undefined || task.id === null) {
          return
        }
        map.set(Number(task.id), task)
      })
      return [...map.values()]
    },

    getOrganizationTaskStats (organization) {
      if (!organization || !organization.id) {
        return {
          openTasks: 0,
          totalTasks: 0
        }
      }
      return this.organizationTaskStatsById[organization.id] || {
        openTasks: 0,
        totalTasks: 0
      }
    },

    getOrganizationOpenTasksCount (organization) {
      return Number(this.getOrganizationTaskStats(organization).openTasks || 0)
    },

    getOrganizationTotalTasksCount (organization) {
      return Number(this.getOrganizationTaskStats(organization).totalTasks || 0)
    },
  },

  setup () {
    const store = useStore()
    const route = useRoute()
    return { store, route }
  }
}
</script>

<style scoped>
.organizations-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 24px;
  overflow: visible;
}

.organizations-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.organizations-title-block {
  min-width: 220px;
}

.organizations-controls {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.organizations-search {
  width: 360px;
  max-width: 100%;
}

.organizations-sort {
  width: 240px;
  max-width: 100%;
}

.organizations-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.summary-card {
  min-height: 92px;
  border-radius: 12px;
}

.summary-label {
  color: #6b7280;
  font-size: 13px;
}

.summary-value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 600;
}

.organizations-page-content {
  flex: 0 0 auto;
  min-height: 0;
  overflow: visible;
}

.organizations-list-card {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 0;
  border-radius: 12px;
  overflow: visible;
}

.organizations-list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.organizations-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
  flex: 0 0 auto;
  min-height: 0;
  padding: 12px;
  overflow: visible;
}

.organization-card {
  height: 100%;
  border-radius: 10px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.organization-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.organization-card--selected {
  border-color: var(--q-primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.organization-card-main {
  min-width: 0;
}

.organization-card-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.organization-stat {
  padding: 8px;
  background: #f6f7f9;
  border-radius: 8px;
}

.organization-stat-value {
  font-size: 18px;
  font-weight: 600;
}

.organization-stat-label {
  color: #6b7280;
  font-size: 12px;
}

.organizations-table {
  flex: 1 1 auto;
  min-height: 0;
  cursor: pointer;
}

.organizations-table :deep(.q-table__middle) {
  flex: 1 1 auto;
  min-height: 0;
}

.organization-dialog-card {
  width: 1180px;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.organization-dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.organization-details-card {
  border-radius: 12px;
}

.organization-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-block {
  border-radius: 10px;
}

.info-block--wide {
  grid-column: 1 / -1;
}

.organization-overview-section {
  padding-top: 16px;
}

.organization-folded-info {
  overflow: hidden;
}

.organization-folded-section {
  padding-top: 0;
  padding-left: 56px;
  padding-right: 20px;
  padding-bottom: 16px;
}

.info-block-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid #eef0f2;
}

.info-row:last-child {
  border-bottom: 0;
}

.info-row span {
  color: #6b7280;
}

.info-row b {
  text-align: right;
  font-weight: 600;
}

.details-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.shorten-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-organizations-state {
  height: 100%;
  min-height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1200px) {
  .organizations-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1023px) {
  .organizations-page {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .organizations-header {
    flex-direction: column;
  }

  .organizations-controls,
  .organizations-search,
  .organizations-sort {
    width: 100%;
  }

  .organizations-page-content {
    overflow: visible;
  }

  .organizations-list-card {
    height: auto;
  }

  .organizations-cards {
    grid-template-columns: 1fr;
    max-height: none;
    overflow: visible;
  }

  .organization-info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .organizations-summary {
    grid-template-columns: 1fr;
  }

  .details-section-header,
  .organizations-list-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .organization-dialog-card {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
