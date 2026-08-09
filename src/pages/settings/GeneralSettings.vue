<template>
  <div class="general-settings q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Общие настройки</div>
        <div class="settings-content-description">
          Базовые параметры системы: часовой пояс, рабочее время и правила доступа к заявкам.
        </div>
      </div>
    </div>

    <div class="general-settings__sections column q-gutter-md">
      <q-card flat bordered class="settings-card">
        <q-card-section class="settings-block">
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
        </q-card-section>
      </q-card>

      <q-card flat bordered class="settings-card">
        <q-card-section class="settings-block">
          <div class="settings-block__header">
            <div>
              <div class="text-subtitle1">Рабочее время</div>
              <div class="text-caption text-grey-7">
                Используется для SLA, OLA и аналитики длительности этапов.
              </div>
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
            <q-checkbox v-model="form.mondayEnabled" label="Пн" :disable="!form.workingTimeEnabled"/>
            <q-checkbox v-model="form.tuesdayEnabled" label="Вт" :disable="!form.workingTimeEnabled"/>
            <q-checkbox v-model="form.wednesdayEnabled" label="Ср" :disable="!form.workingTimeEnabled"/>
            <q-checkbox v-model="form.thursdayEnabled" label="Чт" :disable="!form.workingTimeEnabled"/>
            <q-checkbox v-model="form.fridayEnabled" label="Пт" :disable="!form.workingTimeEnabled"/>
            <q-checkbox v-model="form.saturdayEnabled" label="Сб" :disable="!form.workingTimeEnabled"/>
            <q-checkbox v-model="form.sundayEnabled" label="Вс" :disable="!form.workingTimeEnabled"/>
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="settings-card">
        <q-card-section class="settings-block">
          <div class="settings-block__header">
            <div>
              <div class="text-subtitle1">Доступ к заявкам по линиям поддержки</div>
              <div class="text-caption text-grey-7">
                Настройка закладывает фундамент для разграничения очередей, не меняя маршрутизацию заявок.
              </div>
            </div>
          </div>

          <q-select
            v-model="form.supportLineAccessMode"
            :options="supportLineAccessModeOptions"
            outlined
            emit-value
            map-options
            option-value="value"
            option-label="label"
            label="Модель доступа"
            class="q-mt-md"
          />

          <q-card flat bordered class="access-mode-card q-mt-md">
            <q-card-section>
              <div class="row items-start no-wrap q-gutter-md">
                <q-icon :name="selectedAccessMode.icon" color="primary" size="26px"/>
                <div>
                  <div class="text-subtitle2">{{ selectedAccessMode.label }}</div>
                  <div class="text-body2 text-grey-8 q-mt-xs">
                    {{ selectedAccessMode.description }}
                  </div>
                  <div class="column q-gutter-xs q-mt-sm">
                    <div
                      v-for="rule in selectedAccessMode.rules"
                      :key="rule"
                      class="row items-center no-wrap q-gutter-sm text-caption text-grey-8"
                    >
                      <q-icon name="check_circle" color="positive" size="17px"/>
                      <span>{{ rule }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <q-banner
            v-if="form.supportLineAccessMode === 'HYBRID'"
            rounded
            class="bg-blue-1 text-blue-10 q-mt-md"
          >
            <template #avatar>
              <q-icon name="shield" color="primary"/>
            </template>
            Рекомендуемый режим: оператор видит заявки своих линий, назначенные ему заявки и заявки,
            где он указан наблюдателем или упомянут. Администраторы сохраняют полный доступ.
          </q-banner>
        </q-card-section>
      </q-card>

      <div class="general-settings__actions row justify-end q-gutter-sm">
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
      </div>
    </div>
  </div>
</template>

<script>
import {useStore} from 'stores/store'

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

const SUPPORT_LINE_ACCESS_MODES = [
  {
    label: 'Все операторы видят все заявки',
    value: 'ALL_OPERATORS',
    icon: 'public',
    description: 'Линия используется только для маршрутизации и распределения, без ограничения видимости.',
    rules: [
      'Все операторы видят все доступные по организации заявки',
      'Участие в линии влияет только на назначение исполнителя',
      'Подходит для небольшой единой службы поддержки'
    ]
  },
  {
    label: 'Только участники линии',
    value: 'LINE_MEMBERS',
    icon: 'lock',
    description: 'Заявку видят участники текущей линии и администраторы.',
    rules: [
      'Оператор видит заявки линий, в которых состоит',
      'Исполнитель вне линии недопустим',
      'Подходит для строгого разделения отделов'
    ]
  },
  {
    label: 'Гибридная модель',
    value: 'HYBRID',
    icon: 'hub',
    description: 'Основной доступ определяется линией, но сохраняются безопасные исключения для совместной работы.',
    rules: [
      'Участники и наблюдатели линии видят её заявки',
      'Назначенный исполнитель всегда сохраняет доступ',
      'Упомянутый пользователь получает доступ к конкретной заявке',
      'Администраторы видят все заявки'
    ]
  }
]

export default {
  name: 'GeneralSettingsTab',

  data() {
    return {
      store: useStore(),
      loading: false,
      saving: false,
      timezones: [],
      filteredTimezones: [],
      supportLineAccessModeOptions: SUPPORT_LINE_ACCESS_MODES,
      form: this.getDefaultForm()
    }
  },

  computed: {
    selectedAccessMode() {
      return SUPPORT_LINE_ACCESS_MODES.find(item => item.value === this.form.supportLineAccessMode) ||
        SUPPORT_LINE_ACCESS_MODES[2]
    }
  },

  mounted() {
    this.initTimezones()
    this.load()
  },

  methods: {
    getDefaultForm() {
      return {
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
        sundayEnabled: false,
        supportLineAccessMode: 'HYBRID'
      }
    },

    initTimezones() {
      if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
        this.timezones = Intl.supportedValuesOf('timeZone')
      } else {
        this.timezones = FALLBACK_TIMEZONES
      }

      this.filteredTimezones = this.timezones
    },

    filterTimezones(value, update) {
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

    load() {
      this.loading = true

      this.store.fetchGeneralSettings()
        .then(settings => {
          this.form = {
            ...this.getDefaultForm(),
            ...settings,
            supportLineAccessMode: settings.supportLineAccessMode || 'HYBRID'
          }
        })
        .finally(() => {
          this.loading = false
        })
    },

    save() {
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
  width: 100%;
  max-width: 960px;
  overflow: visible;
}

.general-settings > .settings-content-header {
  margin-bottom: 20px;
}

.general-settings__sections {
  position: relative;
  z-index: 0;
}

.settings-card {
  border-radius: 12px;
}

.settings-block__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.days-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
}

.access-mode-card {
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
}
@media (max-width: 700px) {
  .settings-block__header {
    flex-direction: column;
    gap: 8px;
  }

  .settings-block__header .q-toggle {
    align-self: flex-start;
  }
}
</style>
