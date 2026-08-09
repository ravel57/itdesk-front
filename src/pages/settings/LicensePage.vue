<template>
  <div class="q-pa-md license-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Лицензия</div>
        <div class="settings-content-description">
          Проверяйте срок действия лицензии, занятые места и доступный лимит пользователей.
        </div>
      </div>
    </div>

    <q-card flat bordered class="license-card">
      <q-card-section>
        <div class="license-summary-grid">
          <div class="license-summary-item">
            <div class="license-summary-item__label">Всего лицензий</div>
            <div class="license-summary-item__value">
              {{ licenseInfo.maxUsers }}
            </div>
          </div>

          <div class="license-summary-item">
            <div class="license-summary-item__label">Занято</div>
            <div class="license-summary-item__value">
              {{ licenseInfo.usedUsersCount }}
            </div>
          </div>

          <div
            class="license-summary-item"
            :class="licenseInfo.availableUsersCount <= 0 ? 'license-summary-item--danger' : 'license-summary-item--success'"
          >
            <div class="license-summary-item__label">Доступно</div>
            <div class="license-summary-item__value">
              {{ licenseInfo.availableUsersCount }}
            </div>
          </div>

          <div class="license-summary-item">
            <div class="license-summary-item__label">Действует до</div>
            <div class="license-summary-item__value license-summary-item__value--date">
              {{ licenseUntilText }}
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator/>

      <q-card-section>
        <div class="license-roles-heading q-mb-md">
          <div class="text-subtitle2">Пользователи по ролям</div>
          <div class="text-caption text-grey-7">
            Лицензионное место занимают только роли, которые могут отвечать клиентам.
          </div>
        </div>

        <div class="license-roles">
          <div
            v-for="role in licenseRoleRows"
            :key="role.code"
            class="license-role-row"
            :class="{'license-role-row--free': !role.countsTowardsLicense}"
          >
            <div class="license-role-row__title">
              <q-icon :name="roleIcon(role.code)"/>
              <div>
                <div>{{ role.name }}</div>
                <div
                  class="license-role-row__meta"
                  :class="role.countsTowardsLicense ? 'text-primary' : 'text-grey-6'"
                >
                  {{ role.countsTowardsLicense ? 'Учитывается в лицензии' : 'Не учитывается в лицензии' }}
                </div>
              </div>
            </div>

            <q-badge
              :color="role.countsTowardsLicense ? 'primary' : 'grey-6'"
              rounded
            >
              {{ role.count }}
            </q-badge>
          </div>
        </div>

        <q-linear-progress
          rounded
          size="10px"
          color="primary"
          track-color="grey-3"
          :value="licenseUsageProgress"
          class="q-mt-lg"
        />

        <div class="text-caption text-grey-7 q-mt-sm">
          Использовано {{ licenseInfo.usedUsersCount }} из {{ licenseInfo.maxUsers }} лицензий.
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment/moment'

const FALLBACK_ROLES = [
  {code: 'ADMIN', name: 'Администратор', field: 'adminsCount', countsTowardsLicense: true},
  {code: 'MANAGER', name: 'Менеджер поддержки', field: 'managersCount', countsTowardsLicense: true},
  {code: 'OPERATOR', name: 'Оператор поддержки', field: 'operatorsCount', countsTowardsLicense: true},
  {code: 'OBSERVER', name: 'Менеджер организации', field: 'observersCount', countsTowardsLicense: false},
  {code: 'CLIENT', name: 'Клиент', field: 'clientsCount', countsTowardsLicense: false}
]

export default {
  name: 'LicensePage',

  data: () => ({
    licenseInfo: {
      maxUsers: 0,
      employeesCount: 0,
      usedUsersCount: 0,
      availableUsersCount: 0,
      adminsCount: 0,
      managersCount: 0,
      operatorsCount: 0,
      observersCount: 0,
      clientsCount: 0,
      roleCounts: [],
      licenseUntil: null
    }
  }),

  computed: {
    licenseUntilText() {
      if (!this.licenseInfo.licenseUntil) {
        return '—'
      }

      return moment(this.licenseInfo.licenseUntil).format('DD.MM.YYYY')
    },

    licenseUsageProgress() {
      const maxUsers = Number(this.licenseInfo.maxUsers || this.licenseInfo.employeesCount || 0)
      const usedUsers = Number(this.licenseInfo.usedUsersCount || 0)

      if (maxUsers <= 0) {
        return 0
      }

      return Math.min(1, usedUsers / maxUsers)
    },

    licenseRoleRows() {
      if (Array.isArray(this.licenseInfo.roleCounts) && this.licenseInfo.roleCounts.length) {
        return this.licenseInfo.roleCounts.map(role => ({
          code: role.code,
          name: role.name,
          count: Number(role.count || 0),
          countsTowardsLicense: Boolean(role.countsTowardsLicense)
        }))
      }

      return FALLBACK_ROLES.map(role => ({
        code: role.code,
        name: role.name,
        count: Number(this.licenseInfo[role.field] || 0),
        countsTowardsLicense: role.countsTowardsLicense
      }))
    }
  },

  methods: {
    roleIcon(code) {
      switch (code) {
        case 'ADMIN':
          return 'admin_panel_settings'
        case 'MANAGER':
          return 'manage_accounts'
        case 'OPERATOR':
          return 'support_agent'
        case 'OBSERVER':
          return 'visibility'
        case 'CLIENT':
          return 'person'
        default:
          return 'badge'
      }
    }
  },

  mounted() {
    axios.get('/api/v1/license-info')
      .then(response => {
        this.licenseInfo = {
          ...this.licenseInfo,
          ...response.data,
          maxUsers: Number(response.data.maxUsers || response.data.employeesCount || 0),
          employeesCount: Number(response.data.employeesCount || response.data.maxUsers || 0),
          usedUsersCount: Number(response.data.usedUsersCount || 0),
          availableUsersCount: Number(response.data.availableUsersCount || 0),
          adminsCount: Number(response.data.adminsCount || 0),
          managersCount: Number(response.data.managersCount || 0),
          operatorsCount: Number(response.data.operatorsCount || 0),
          observersCount: Number(response.data.observersCount || 0),
          clientsCount: Number(response.data.clientsCount || 0),
          roleCounts: Array.isArray(response.data.roleCounts) ? response.data.roleCounts : []
        }
      })
  }
}
</script>

<style scoped>
.license-page {
  max-width: 760px;
}

.license-card {
  border-radius: 12px;
}

.license-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 12px;
}

.license-summary-item {
  padding: 14px;
  border: 1px solid #e7e7e7;
  border-radius: 12px;
  background: #fff;
}

.license-summary-item__label {
  color: #777;
  font-size: 12px;
  line-height: 1.2;
}

.license-summary-item__value {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.license-summary-item__value--date {
  font-size: 20px;
}

.license-summary-item--success {
  border-color: rgba(76, 175, 80, .35);
  background: rgba(76, 175, 80, .06);
}

.license-summary-item--danger {
  border-color: rgba(244, 67, 54, .35);
  background: rgba(244, 67, 54, .06);
}

.license-roles-heading {
  display: grid;
  gap: 3px;
}

.license-roles {
  display: grid;
  gap: 10px;
}

.license-role-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 12px;
  border: 1px solid #eeeeee;
  border-radius: 10px;
}

.license-role-row--free {
  background: #fafafa;
}

.license-role-row__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.license-role-row__title > .q-icon {
  font-size: 21px;
}

.license-role-row__meta {
  margin-top: 1px;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 400;
}

@media (max-width: 700px) {
  .license-summary-grid {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}

@media (max-width: 420px) {
  .license-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
