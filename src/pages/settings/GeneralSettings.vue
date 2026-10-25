<template>
  <div class="general-settings q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Общие настройки</div>
        <div class="settings-content-description">
          Базовые параметры системы: часовой пояс, рабочее время и правила доступа к заявкам.
        </div>
      </div>
      <div class="settings-content-actions">
        <div class="general-settings__status text-caption" :class="saveStatusClass">
          <q-spinner v-if="saveState === 'saving'" size="14px" class="q-mr-xs"/>
          <q-icon v-else-if="saveState === 'saved'" name="check" size="16px" class="q-mr-xs"/>
          <q-icon v-else-if="saveState === 'error'" name="error_outline" size="16px" class="q-mr-xs"/>
          {{ saveStatusLabel }}
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

          <q-separator class="q-my-md"/>

          <div class="settings-block__header">
            <div>
              <div class="text-subtitle2">Учитывать рабочее время в «Требует ответа»</div>
              <div class="text-caption text-grey-7">
                Время, которое клиент ждёт ответа, считается только в рабочее время: ночью и в выходные таймер не идёт,
                а сообщение вне рабочего времени ждёт ответа с начала ближайшего рабочего дня. Влияет на таймер и сортировку
                «По времени ожидания» в списке чатов и на уведомления «Чат без ответа». Работает при включённом рабочем времени.
              </div>
            </div>
            <q-toggle
              v-model="form.answerWaitingWorkingTimeEnabled"
              :disable="!form.workingTimeEnabled"
              label="Учитывать"
            />
          </div>
        </q-card-section>
      </q-card>

      <q-card flat bordered class="settings-card">
        <q-card-section class="settings-block">
          <div class="settings-block__header">
            <div>
              <div class="text-subtitle1">Зоны SLA</div>
              <div class="text-caption text-grey-7">
                Когда таймер SLA становится оранжевым и красным и когда срабатывает предупреждение. Границы задаются в
                процентах времени SLA, которое уже прошло; настройка общая для всех SLA.
              </div>
            </div>
            <q-btn
              flat
              dense
              no-caps
              icon="restart_alt"
              label="По умолчанию"
              :disable="slaZonesAreDefault"
              @click="resetSlaZones"
            />
          </div>

          <div class="sla-zones q-mt-lg">
            <q-range
              v-model="slaRange"
              class="sla-zones__range"
              :style="slaTrackStyle"
              track-size="12px"
              thumb-size="22px"
              :min="1"
              :max="99"
              :step="1"
              :min-range="1"
              label
              label-always
              :left-label-value="`${slaOrangeFrom}%`"
              :right-label-value="`${slaRedFrom}%`"
              left-label-color="orange-8"
              right-label-color="negative"
              left-thumb-color="orange-8"
              right-thumb-color="negative"
              color="transparent"
              track-color="transparent"
              aria-label="Границы оранжевой и красной зон SLA"
            />
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

      <access-security-settings/>
    </div>
  </div>
</template>

<script>
import {useStore} from 'stores/store'
import AccessSecuritySettings from 'components/settings/AccessSecuritySettings.vue'

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

  components: {AccessSecuritySettings},

  data() {
    return {
      store: useStore(),
      loading: false,
      saving: false,
      // Автосохранение: форма сохраняется через паузу после правки, без кнопки «Сохранить»
      ready: false,
      saveTimer: null,
      saveState: 'idle',
      lastSavedJson: '',
      timezones: [],
      filteredTimezones: [],
      supportLineAccessModeOptions: SUPPORT_LINE_ACCESS_MODES,
      form: this.getDefaultForm()
    }
  },

  computed: {
    saveStatusLabel() {
      return {
        saving: 'Сохранение…',
        saved: 'Сохранено',
        error: 'Не сохранено'
      }[this.saveState] || ''
    },

    saveStatusClass() {
      return this.saveState === 'error' ? 'text-negative' : 'text-grey-7'
    },

    // В интерфейсе зоны показаны по прошедшему времени (слева направо: зелёная → оранжевая → красная),
    // а в настройках хранятся как оставшееся до срока — так их использует сервер
    slaOrangeFrom() {
      return 100 - Number(this.form.slaOrangeStartPercent)
    },

    slaRedFrom() {
      return 100 - Number(this.form.slaRedStartPercent)
    },

    slaRange: {
      get() {
        return {min: this.slaOrangeFrom, max: this.slaRedFrom}
      },
      set(value) {
        const orangeFrom = Math.round(Number(value?.min))
        const redFrom = Math.round(Number(value?.max))
        if (!Number.isFinite(orangeFrom) || !Number.isFinite(redFrom) || orangeFrom >= redFrom) return
        this.form.slaOrangeStartPercent = 100 - orangeFrom
        this.form.slaRedStartPercent = 100 - redFrom
      }
    },

    // Линия ползунка окрашена по зонам: зелёная до левой ручки, оранжевая между ручками, красная после правой.
    // Ползунок идёт от 1 до 99, поэтому положение значения на линии — (v - 1) / 98
    slaTrackStyle() {
      const position = value => ((value - 1) / 98 * 100).toFixed(2) + '%'
      return {
        '--sla-orange-at': position(this.slaOrangeFrom),
        '--sla-red-at': position(this.slaRedFrom)
      }
    },

    slaZonesAreDefault() {
      return Number(this.form.slaOrangeStartPercent) === 50 && Number(this.form.slaRedStartPercent) === 25
    },

    selectedAccessMode() {
      return SUPPORT_LINE_ACCESS_MODES.find(item => item.value === this.form.supportLineAccessMode) ||
        SUPPORT_LINE_ACCESS_MODES[2]
    }
  },

  watch: {
    form: {
      deep: true,
      handler() {
        if (this.ready) {
          this.scheduleSave()
        }
      }
    }
  },

  mounted() {
    this.initTimezones()
    this.load()
  },

  beforeUnmount() {
    // Правка, сделанная перед уходом со страницы, не должна потеряться
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
      this.save()
    }
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
        supportLineAccessMode: 'HYBRID',
        answerWaitingWorkingTimeEnabled: false,
        slaOrangeStartPercent: 50,
        slaRedStartPercent: 25
      }
    },

    resetSlaZones() {
      this.form.slaOrangeStartPercent = 50
      this.form.slaRedStartPercent = 25
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
      this.ready = false

      this.store.fetchGeneralSettings()
        .then(settings => {
          this.form = {
            ...this.getDefaultForm(),
            ...settings,
            supportLineAccessMode: settings.supportLineAccessMode || 'HYBRID'
          }
          this.lastSavedJson = JSON.stringify(this.form)
        })
        .finally(() => {
          this.loading = false
          // Присвоение формы при загрузке не считается правкой
          this.$nextTick(() => {
            this.ready = true
          })
        })
    },

    scheduleSave() {
      clearTimeout(this.saveTimer)
      this.saveTimer = setTimeout(() => {
        this.saveTimer = null
        this.save()
      }, 600)
    },

    save() {
      const payload = JSON.stringify(this.form)
      if (payload === this.lastSavedJson) {
        return
      }
      if (this.saving) {
        // Дождёмся текущего запроса и сохраним последнее состояние
        this.scheduleSave()
        return
      }
      this.saving = true
      this.saveState = 'saving'

      this.store.saveGeneralSettings({...this.form})
        .then(() => {
          this.lastSavedJson = payload
          this.saveState = 'saved'
        })
        .catch(error => {
          this.saveState = 'error'
          this.$q.notify({
            type: 'negative',
            message: error.response?.data || 'Не удалось сохранить общие настройки'
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

.general-settings__status {
  display: flex;
  align-items: center;
  min-height: 24px;
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

.sla-zones__range {
  padding: 0 11px;
}

/* Цвета зон на самой линии ползунка; выделенный участок между ручками не перекрашиваем */
.sla-zones__range :deep(.q-slider__track) {
  opacity: 1;
  border-radius: 6px;
  background: linear-gradient(
    to right,
    #4caf50 0,
    #4caf50 var(--sla-orange-at),
    #fb8c00 var(--sla-orange-at),
    #fb8c00 var(--sla-red-at),
    #b71c1c var(--sla-red-at),
    #b71c1c 100%
  ) !important;
}

.sla-zones__range :deep(.q-slider__selection) {
  background: transparent !important;
}

.sla-zones__range :deep(.q-slider__thumb) {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
}
</style>
