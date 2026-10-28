<template>
  <q-card-section class="organization-overview-section">
    <div class="organization-info-grid">
<!--            <q-card flat bordered class="info-block">
        <q-card-section> FIXME
          <div class="info-block-title">
            Соглашения по SLA
          </div>

          <div class="info-row">
            <span>Правило SLA</span>
            <b>{{ getOrganizationSlaAgreementLabel(organization) }}</b>
          </div>

          <div class="info-row">
            <span>Первый ответ</span>
            <b>{{ getOrganizationFirstResponseSlaLabel(organization) }}</b>
          </div>

          <div class="info-row">
            <span>Решение заявки</span>
            <b>{{ getOrganizationResolutionSlaLabel(organization) }}</b>
          </div>

          <div class="info-row">
            <span>Календарь</span>
            <b>{{ getOrganizationSlaCalendarLabel(organization) }}</b>
          </div>

          <div class="info-row">
            <span>Пауза при ожидании клиента</span>
            <b>{{ getOrganizationPauseSlaOnWaitingClientLabel(organization) }}</b>
          </div>

          <div class="info-row">
            <span>Ближайший SLA</span>
            <b :class="minimalSla?.overdue ? 'text-negative' : ''">
              {{ minimalSla?.label || 'Нет активного SLA' }}
            </b>
          </div>

          <q-linear-progress
            v-if="minimalSla?.percent !== null"
            :value="minimalSla.percent"
            :color="minimalSla.color"
            rounded
            size="8px"
            class="q-mt-sm"
          />
        </q-card-section>
      </q-card>-->

      <q-card flat bordered class="info-block info-block--wide">
        <q-card-section>
          <div class="info-block-title">
            <span>Выезды</span>
            <q-space />

            <q-btn
              v-if="organization?.id"
              dense
              flat
              color="primary"
              icon="history"
              label="История"
              :loading="visitHistoryLoading"
              @click="$emit('open-visit-history', organization)"
            />
          </div>

          <template v-if="visitStats.enabled">
            <div class="info-row">
              <span>Пакет</span>
              <b>{{ visitStats.used }} / {{ visitStats.limit }}</b>
            </div>

            <div class="info-row">
              <span>Осталось</span>
              <b :class="visitStats.left <= 0 ? 'text-negative' : ''">
                {{ visitStats.left }}
              </b>
            </div>

            <div class="info-row">
              <span>Сверх пакета</span>
              <b :class="visitStats.overLimit > 0 ? 'text-negative' : ''">
                {{ visitStats.overLimit }}
              </b>
            </div>

            <div class="info-row">
              <span>Цена сверх пакета</span>
              <b>{{ visitStats.extraPriceLabel }}</b>
            </div>

            <div class="info-row">
              <span>Цена срочного выезда</span>
              <b>{{ getOrganizationUrgentVisitPriceLabel(organization) }}</b>
            </div>

            <div class="info-row">
              <span>Обновление лимита</span>
              <b>{{ visitStats.resetLabel }}</b>
            </div>

            <q-linear-progress
              :value="visitStats.percent"
              :color="visitStats.color"
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
                <b
                  class="organization-info-name organization-name-ellipsis"
                  :title="name"
                >{{ name }}</b>
              </div>

              <div class="info-row">
                <span>Активность</span>
                <b>{{ getOrganizationActiveLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Тариф / пакет</span>
                <b>{{ getOrganizationTariff(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Договор</span>
                <b>{{ contractLabel }}</b>
              </div>

              <div class="info-row">
                <span>Ответственный</span>
                <b>{{ getOrganizationResponsible(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Сотрудники</span>
                <b>{{ employees.length }}</b>
              </div>

              <div class="info-row">
                <span>Открытые заявки</span>
                <b>{{ openTasksCount }}</b>
              </div>

              <div class="info-row">
                <span>Последняя активность</span>
                <b>{{ lastActivity }}</b>
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
                <b>{{ getOrganizationInnLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>КПП</span>
                <b>{{ getOrganizationKppLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Внешний ID</span>
                <b>{{ getOrganizationExternalIdLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Основной адрес</span>
                <b>{{ getOrganizationMainAddressLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Адреса / объекты</span>
                <b>{{ getOrganizationAddressLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Каналы связи</span>
                <b>{{ getOrganizationChannelsLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Приоритет клиента</span>
                <b>{{ getOrganizationPriorityLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Менеджер</span>
                <b>{{ getOrganizationManagerNameLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Телефон менеджера</span>
                <b>{{ getOrganizationManagerPhoneLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Email менеджера</span>
                <b>{{ getOrganizationManagerEmailLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Срок договора</span>
                <b>{{ getOrganizationContractPeriodLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Абонентская плата</span>
                <b>{{ getOrganizationMonthlyFeeLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Описание</span>
                <b>{{ getOrganizationCommentLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Условия выездов</span>
                <b>{{ getOrganizationVisitCommentLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Цена сверхпакетного выезда</span>
                <b>{{ getOrganizationExtraVisitPriceLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Цена срочного выезда</span>
                <b>{{ getOrganizationUrgentVisitPriceLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>День сброса лимита выездов</span>
                <b>{{ getOrganizationVisitResetDayLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Удалённая поддержка</span>
                <b>{{ getOrganizationRemoteSupportLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Комментарий SLA</span>
                <b>{{ getOrganizationSlaCommentLabel(organization) }}</b>
              </div>

              <div class="info-row">
                <span>Внутренний комментарий</span>
                <b>{{ getOrganizationInternalCommentLabel(organization) }}</b>
              </div>
            </q-card-section>
          </q-expansion-item>
        </q-list>
      </q-card>
    </div>
  </q-card-section>
</template>

<script>
import {
  formatDate,
  formatMoney,
  getOrganizationValueLabel,
  getOrganizationVisitResetDayLabel
} from 'src/util/organizationHelpers'

export default {
  name: 'OrganizationInfoSection',

  props: {
    organization: {
      type: Object,
      default: null
    },
    name: {
      type: String,
      default: ''
    },
    contractLabel: {
      type: String,
      default: ''
    },
    // сотрудники выбранной организации
    employees: {
      type: Array,
      default: () => []
    },
    openTasksCount: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: String,
      default: ''
    },
    visitStats: {
      type: Object,
      required: true
    },
    visitHistoryLoading: {
      type: Boolean,
      default: false
    }
  },

  emits: ['open-visit-history'],

  methods: {
    // чистые хелперы: src/util/organizationHelpers.js
    formatDate,
    formatMoney,
    getOrganizationValueLabel,
    getOrganizationVisitResetDayLabel,

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

      const employees = this.employees
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

    getOrganizationRemoteSupportLabel (organization) {
      return organization?.includedRemoteSupport === false ? 'Не входит' : 'Входит'
    },

    getOrganizationSlaCommentLabel (organization) {
      return this.getOrganizationValueLabel(organization?.slaComment, 'Нет комментария')
    },

    getOrganizationInternalCommentLabel (organization) {
      return this.getOrganizationValueLabel(organization?.internalComment, 'Нет комментария')
    },
  }
}
</script>

<style scoped>
.organization-overview-section {
  padding-top: 16px;
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

.organization-folded-info {
  overflow: hidden;
}

.organization-folded-section {
  padding-top: 0;
  padding-left: 56px;
  padding-right: 20px;
  padding-bottom: 16px;
}

.organization-info-name {
  flex: 0 1 70%;
  min-width: 0;
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

@media (max-width: 1023px) {
  .organization-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
