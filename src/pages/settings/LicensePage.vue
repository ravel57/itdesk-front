<template>
  <div class="q-pa-md license-page">
    <q-card flat bordered class="license-card">
      <q-card-section>
        <div class="text-h6">Лицензия</div>
        <div class="text-grey-7 q-mt-xs">
          Информация о сроке действия и доступных местах пользователей
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="license-summary-grid">
          <div class="license-summary-item">
            <div class="license-summary-item__label">Всего лицензий</div>
            <div class="license-summary-item__value">
              {{ this.licenseInfo.maxUsers }}
            </div>
          </div>

          <div class="license-summary-item">
            <div class="license-summary-item__label">Занято</div>
            <div class="license-summary-item__value">
              {{ this.licenseInfo.usedUsersCount }}
            </div>
          </div>

          <div
            class="license-summary-item"
            :class="this.licenseInfo.availableUsersCount <= 0 ? 'license-summary-item--danger' : 'license-summary-item--success'"
          >
            <div class="license-summary-item__label">Доступно</div>
            <div class="license-summary-item__value">
              {{ this.licenseInfo.availableUsersCount }}
            </div>
          </div>

          <div class="license-summary-item">
            <div class="license-summary-item__label">Действует до</div>
            <div class="license-summary-item__value license-summary-item__value--date">
              {{ this.licenseUntilText }}
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-subtitle2 q-mb-md">Занято по ролям</div>

        <div class="license-roles">
          <div class="license-role-row">
            <div class="license-role-row__title">
              <q-icon name="admin_panel_settings" />
              Администраторы
            </div>

            <q-badge color="primary" rounded>
              {{ this.licenseInfo.adminsCount }}
            </q-badge>
          </div>

          <div class="license-role-row">
            <div class="license-role-row__title">
              <q-icon name="support_agent" />
              Операторы
            </div>

            <q-badge color="primary" rounded>
              {{ this.licenseInfo.operatorsCount }}
            </q-badge>
          </div>
        </div>

        <q-linear-progress
          rounded
          size="10px"
          color="primary"
          track-color="grey-3"
          :value="this.licenseUsageProgress"
          class="q-mt-lg"
        />

        <div class="text-caption text-grey-7 q-mt-sm">
          Использовано {{ this.licenseInfo.usedUsersCount }} из {{ this.licenseInfo.maxUsers }} лицензий.
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment/moment'

export default {
  name: 'LicensePage',

  data: () => ({
    licenseInfo: {
      maxUsers: 0,
      employeesCount: 0,
      usedUsersCount: 0,
      availableUsersCount: 0,
      adminsCount: 0,
      operatorsCount: 0,
      licenseUntil: null
    }
  }),

  computed: {
    licenseUntilText () {
      if (!this.licenseInfo.licenseUntil) {
        return '—'
      }

      return moment(this.licenseInfo.licenseUntil).format('DD.MM.YYYY')
    },

    licenseUsageProgress () {
      const maxUsers = Number(this.licenseInfo.maxUsers || this.licenseInfo.employeesCount || 0)
      const usedUsers = Number(this.licenseInfo.usedUsersCount || 0)

      if (maxUsers <= 0) {
        return 0
      }

      return Math.min(1, usedUsers / maxUsers)
    }
  },

  mounted () {
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
          operatorsCount: Number(response.data.operatorsCount || 0)
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

.license-role-row__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
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
