<template>
  <div class="general-settings">
    <q-card flat class="settings-card">
      <q-card-section class="column q-gutter-lg">
        <div class="settings-block">
          <div class="settings-block__header">
            <div>
              <div class="text-subtitle1">Часовой пояс</div>
              <div class="text-caption text-grey-7">
                Используется для отображения времени, аналитики и расчета рабочих интервалов.
              </div>
            </div>
          </div>

          <q-select
            v-model="form.timezone"
            outlined
            dense
            use-input
            input-debounce="0"
            label="Часовой пояс"
            :options="filteredTimezones"
            @filter="filterTimezones"
          />
        </div>

        <q-separator />

        <div class="settings-block">
          <div class="settings-block__header">
            <div>
              <div class="text-subtitle1">Рабочее время</div>
            </div>
            <q-toggle
              v-model="form.workingTimeEnabled"
              label="Учитывать рабочее время"
            />
          </div>

          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.workdayStart"
                outlined
                dense
                type="time"
                label="Начало рабочего дня"
                :disable="!form.workingTimeEnabled"
              />
            </div>

            <div class="col-12 col-sm-6">
              <q-input
                v-model="form.workdayEnd"
                outlined
                dense
                type="time"
                label="Конец рабочего дня"
                :disable="!form.workingTimeEnabled"
              />
            </div>
          </div>

          <div class="days-grid q-mt-md">
            <q-checkbox v-model="form.mondayEnabled" label="Пн" :disable="!form.workingTimeEnabled" />
            <q-checkbox v-model="form.tuesdayEnabled" label="Вт" :disable="!form.workingTimeEnabled" />
            <q-checkbox v-model="form.wednesdayEnabled" label="Ср" :disable="!form.workingTimeEnabled" />
            <q-checkbox v-model="form.thursdayEnabled" label="Чт" :disable="!form.workingTimeEnabled" />
            <q-checkbox v-model="form.fridayEnabled" label="Пт" :disable="!form.workingTimeEnabled" />
            <q-checkbox v-model="form.saturdayEnabled" label="Сб" :disable="!form.workingTimeEnabled" />
            <q-checkbox v-model="form.sundayEnabled" label="Вс" :disable="!form.workingTimeEnabled" />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn
          flat
          label="Сбросить"
          :disable="loading || saving"
          @click="load"
        />

        <q-btn
          color="primary"
          label="Сохранить"
          :loading="saving"
          :disable="loading"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
import { useStore } from 'stores/store'

const FALLBACK_TIMEZONES = [
  'Europe/Moscow',
  'Europe/Riga',
  'Europe/Kaliningrad',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'UTC'
]

export default {
  name: 'GeneralSettingsTab',

  data () {
    return {
      store: useStore(),
      loading: false,
      saving: false,
      timezones: [],
      filteredTimezones: [],
      form: {
        timezone: 'Europe/Moscow',
        workingTimeEnabled: true,
        workdayStart: '09:00',
        workdayEnd: '18:00',
        mondayEnabled: true,
        tuesdayEnabled: true,
        wednesdayEnabled: true,
        thursdayEnabled: true,
        fridayEnabled: true,
        saturdayEnabled: false,
        sundayEnabled: false
      }
    }
  },

  mounted () {
    this.initTimezones()
    this.load()
  },

  methods: {
    initTimezones () {
      if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
        this.timezones = Intl.supportedValuesOf('timeZone')
      } else {
        this.timezones = FALLBACK_TIMEZONES
      }

      this.filteredTimezones = this.timezones
    },

    filterTimezones (value, update) {
      update(() => {
        const needle = String(value || '').toLowerCase()

        if (!needle) {
          this.filteredTimezones = this.timezones
          return
        }

        this.filteredTimezones = this.timezones
          .filter(item => item.toLowerCase().includes(needle))
      })
    },

    load () {
      this.loading = true

      this.store.fetchGeneralSettings()
        .then(settings => {
          this.form = {
            timezone: settings.timezone ?? 'Europe/Moscow',
            workingTimeEnabled: settings.workingTimeEnabled ?? true,
            workdayStart: settings.workdayStart ?? '09:00',
            workdayEnd: settings.workdayEnd ?? '18:00',
            mondayEnabled: settings.mondayEnabled ?? true,
            tuesdayEnabled: settings.tuesdayEnabled ?? true,
            wednesdayEnabled: settings.wednesdayEnabled ?? true,
            thursdayEnabled: settings.thursdayEnabled ?? true,
            fridayEnabled: settings.fridayEnabled ?? true,
            saturdayEnabled: settings.saturdayEnabled ?? false,
            sundayEnabled: settings.sundayEnabled ?? false
          }
        })
        .finally(() => {
          this.loading = false
        })
    },

    save () {
      this.saving = true

      this.store.saveGeneralSettings(this.form)
        .then(() => {
          this.$q.notify({
            type: 'positive',
            message: 'Общие настройки сохранены',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
        .catch(error => {
          this.$q.notify({
            type: 'negative',
            message: error.response?.data || 'Не удалось сохранить общие настройки',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
        .finally(() => {
          this.saving = false
        })
    }
  }
}
</script>

<style scoped>
.general-settings {
  max-width: 900px;
}

.settings-card {
  border-radius: 12px;
}

.settings-block__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.days-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}
</style>
