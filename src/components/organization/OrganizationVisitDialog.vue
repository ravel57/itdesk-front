<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="updateModelValue"
  >
    <q-card class="organization-visit-dialog-card">
      <q-toolbar class="organization-visit-dialog-toolbar justify-between">
        <div>
          <div class="text-h6">
            Добавить выезд
          </div>
          <div class="text-caption text-grey-7">
            {{ organizationName }}
          </div>
          <div
            v-if="selectedTaskLabel"
            class="text-caption text-grey-7 q-mt-xs"
          >
            Заявка: {{ selectedTaskLabel }}
          </div>
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          :disable="saving"
          @click="closeDialog"
        />
      </q-toolbar>

      <q-separator />

      <q-card-section class="organization-visit-dialog-body q-gutter-md">
        <q-banner
          v-if="!organization?.id"
          rounded
          class="bg-red-1 text-negative"
        >
          У выбранной заявки нет организации. Выезд можно добавить только к организации.
        </q-banner>

        <div
          v-if="visitStats.enabled"
          class="organization-visit-package"
        >
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-caption text-grey-7">
              Пакет выездов
            </div>
            <div class="text-caption text-weight-medium">
              {{ visitStats.used }} / {{ visitStats.limit }}
            </div>
          </div>

          <q-linear-progress
            :value="visitStats.percent"
            :color="visitStats.color"
            rounded
            size="8px"
          />

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-12 col-sm-4">
              <div class="visit-stat-cell">
                <div class="text-caption text-grey-7">Осталось</div>
                <div :class="visitStats.left <= 0 ? 'text-negative text-weight-bold' : 'text-weight-bold'">
                  {{ visitStats.left }}
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="visit-stat-cell">
                <div class="text-caption text-grey-7">Сверх пакета</div>
                <div :class="visitStats.overLimit > 0 ? 'text-negative text-weight-bold' : 'text-weight-bold'">
                  {{ visitStats.overLimit }}
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="visit-stat-cell">
                <div class="text-caption text-grey-7">Цена сверх пакета</div>
                <div class="text-weight-bold">
                  {{ visitStats.extraPriceLabel }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <q-input
          v-model="visitForm.visitDate"
          outlined
          dense
          type="datetime-local"
          label="Дата и время выезда"
        />

        <q-select
          v-model="visitForm.type"
          outlined
          dense
          emit-value
          map-options
          label="Тип выезда"
          :options="visitTypeOptions"
          @update:model-value="onVisitTypeChanged"
        />

        <q-select
          v-model="visitForm.selectedTask"
          outlined
          dense
          clearable
          label="Связанная заявка"
          :options="normalizedTaskOptions"
          :disable="lockTask"
        />

        <q-input
          v-model.number="visitForm.price"
          outlined
          dense
          type="number"
          label="Стоимость"
          suffix="₽"
        />

        <q-toggle
          v-model="visitForm.countedInPackage"
          color="primary"
          label="Списать из пакета выездов"
          :disable="!visitStats.enabled"
        />

        <q-input
          v-model="visitForm.comment"
          outlined
          dense
          type="textarea"
          autogrow
          label="Комментарий"
          placeholder="Что сделали, куда выезжали, кто был на объекте"
        />
      </q-card-section>

      <q-separator />

      <q-card-actions
        align="right"
        class="organization-visit-dialog-actions"
      >
        <q-btn
          flat
          label="Отмена"
          :disable="saving"
          @click="closeDialog"
        />

        <q-btn
          unelevated
          color="primary"
          label="Добавить"
          :loading="saving"
          :disable="!organization?.id"
          @click="submitVisit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import moment from 'moment'

export default {
  name: 'OrganizationVisitDialog',

  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    organization: {
      type: Object,
      default: null
    },
    selectedTask: {
      type: Object,
      default: null
    },
    taskOptions: {
      type: Array,
      default: () => []
    },
    lockTask: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:modelValue', 'saved'],

  data: () => ({
    saving: false,
    visitForm: {
      visitDate: null,
      type: 'Плановый выезд',
      comment: '',
      price: null,
      countedInPackage: true,
      selectedTask: null
    },
    visitTypeOptions: [
      { label: 'Плановый выезд', value: 'Плановый выезд' },
      { label: 'Срочный выезд', value: 'Срочный выезд' },
      { label: 'Регламентные работы', value: 'Регламентные работы' },
      { label: 'Аварийный выезд', value: 'Аварийный выезд' }
    ]
  }),

  computed: {
    organizationName () {
      return this.organization?.name || 'Организация не выбрана'
    },

    selectedTaskLabel () {
      return this.normalizeTaskOption(this.selectedTask)?.label || ''
    },

    normalizedTaskOptions () {
      const options = []
      const selectedTask = this.normalizeTaskOption(this.selectedTask)

      if (selectedTask) {
        options.push(selectedTask)
      }

      if (!this.lockTask) {
        this.taskOptions
          .map(option => this.normalizeTaskOption(option))
          .filter(Boolean)
          .forEach(option => {
            if (!options.some(item => String(item.value) === String(option.value))) {
              options.push(option)
            }
          })
      }

      return options
    },

    visitStats () {
      return this.getOrganizationVisitStats(this.organization)
    }
  },

  watch: {
    modelValue (value) {
      if (value) {
        this.resetForm()
      }
    },

    selectedTask: {
      deep: true,
      handler () {
        if (this.modelValue) {
          this.visitForm.selectedTask = this.normalizeTaskOption(this.selectedTask)
        }
      }
    },

    organization: {
      deep: true,
      handler () {
        if (this.modelValue) {
          this.visitForm.countedInPackage = Boolean(this.visitStats.enabled)
        }
      }
    }
  },

  methods: {
    updateModelValue (value) {
      this.$emit('update:modelValue', value)
    },

    closeDialog () {
      if (this.saving) {
        return
      }
      this.$emit('update:modelValue', false)
    },

    resetForm () {
      this.visitForm = {
        visitDate: moment().format('YYYY-MM-DDTHH:mm'),
        type: 'Плановый выезд',
        comment: '',
        price: null,
        countedInPackage: Boolean(this.visitStats.enabled),
        selectedTask: this.normalizeTaskOption(this.selectedTask)
      }
    },

    normalizeTaskOption (task) {
      if (!task) {
        return null
      }

      if (task.value !== undefined && task.value !== null) {
        const taskTitle = task.taskTitle || task.title || task.name || 'Без названия'
        return {
          label: task.label || `#${task.value} ${taskTitle}`,
          value: task.value,
          taskTitle
        }
      }

      if (task.id !== undefined && task.id !== null) {
        const taskTitle = task.taskTitle || task.title || task.name || 'Без названия'
        return {
          label: task.label || `#${task.id} ${taskTitle}`,
          value: task.id,
          taskTitle
        }
      }

      return null
    },

    onVisitTypeChanged (value) {
      if (this.visitForm.price !== null && this.visitForm.price !== undefined && this.visitForm.price !== '') {
        return
      }

      const normalizedType = String(value || '').toLowerCase()

      if (normalizedType.includes('сроч') || normalizedType.includes('авар')) {
        const urgentPrice = Number(this.organization?.urgentVisitPrice)
        if (Number.isFinite(urgentPrice) && urgentPrice > 0) {
          this.visitForm.price = urgentPrice
        }
      }
    },

    submitVisit () {
      if (!this.organization?.id) {
        this.$q.notify({
          message: 'Не выбрана организация для выезда',
          type: 'negative',
          position: 'top-right',
          actions: [{ icon: 'close', color: 'white', dense: true, handler: () => undefined }]
        })
        return
      }

      const selectedTask = this.normalizeTaskOption(this.visitForm.selectedTask)
      const payload = {
        visitDate: this.visitForm.visitDate || null,
        type: this.visitForm.type || 'Выезд',
        comment: this.visitForm.comment || null,
        price: this.visitForm.price || null,
        countedInPackage: Boolean(this.visitForm.countedInPackage),
        taskId: selectedTask?.value || null,
        taskTitle: selectedTask?.taskTitle || null
      }

      this.saving = true

      axios.post(`/api/v1/organization/${this.organization.id}/visits`, payload)
        .then(response => {
          const savedOrganization = response.data?.organization || response.data?.savedOrganization || null
          const savedVisit = response.data?.visit || response.data?.organizationVisit || null

          this.$emit('saved', {
            organization: savedOrganization,
            visit: savedVisit,
            response: response.data,
            payload
          })
          this.$emit('update:modelValue', false)
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
          this.saving = false
        })
    },

    getOrganizationVisitStats (organization) {
      if (!organization || organization.useVisitsLimit !== true) {
        return this.emptyVisitStats()
      }

      const limit = this.firstNumber([
        organization.monthlyVisitsLimit,
        organization.visitsLimit,
        organization.visitLimit,
        organization.includedVisits,
        organization.servicePackage?.visitsLimit,
        organization.settings?.monthlyVisitsLimit
      ], 0)

      const used = this.firstNumber([
        organization.monthlyVisitsUsed,
        organization.visitsUsed,
        organization.usedVisits,
        organization.servicePackage?.visitsUsed,
        organization.settings?.monthlyVisitsUsed
      ], 0)

      const left = Math.max(limit - used, 0)
      const overLimit = Math.max(used - limit, 0)
      const percent = limit > 0 ? Math.min(used / limit, 1) : 0
      const extraPrice = this.firstNumber([
        organization.extraVisitPrice,
        organization.visitOverLimitPrice,
        organization.visitPrice,
        organization.servicePackage?.extraVisitPrice,
        organization.settings?.extraVisitPrice
      ], null)

      return {
        enabled: true,
        limit,
        used,
        left,
        overLimit,
        percent,
        color: overLimit > 0 ? 'orange' : 'primary',
        extraPriceLabel: this.formatMoney(extraPrice)
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
        extraPriceLabel: '—'
      }
    },

    firstNumber (values, fallback = 0) {
      for (const value of values) {
        const number = Number(value)
        if (Number.isFinite(number)) {
          return number
        }
      }
      return fallback
    },

    formatMoney (value) {
      const number = Number(value)
      if (!Number.isFinite(number)) {
        return '—'
      }
      return `${number.toLocaleString('ru-RU')} ₽`
    }
  }
}
</script>

<style scoped>
.organization-visit-dialog-card {
  min-width: 560px;
  max-width: 95vw;
  border-radius: 14px;
}

.organization-visit-dialog-toolbar {
  padding: 18px 20px;
}

.organization-visit-dialog-body {
  padding: 20px 24px;
}

.organization-visit-dialog-actions {
  padding: 16px 20px;
  gap: 10px;
}

.organization-visit-package {
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  background: #fafafa;
}

.visit-stat-cell {
  padding: 10px 12px;
  border-radius: 10px;
  background: white;
}

@media (max-width: 599px) {
  .organization-visit-dialog-card {
    min-width: calc(100vw - 24px);
  }
}
</style>
