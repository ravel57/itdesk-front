<template>
  <q-dialog
    persistent
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
  >
    <div id="task-freeze-modal">
      <q-card>
        <q-card-section>
          <div class="text-h6">Заморозка заявки</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div id="freeze-time-input">
            <q-input
              v-model="this.untilModel"
              clearable
              label="Заморозить до *"
              mask="##.##.#### ##:##"
            >
              <template
                v-slot:append
              >
                <q-icon
                  name="event"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    ref="qDateFreezePopup"
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date
                      v-model="this.untilModel"
                      first-day-of-week="1"
                      locale="ru"
                      today-btn
                      :options="this.dateOption"
                      mask="DD.MM.YYYY HH:mm"
                      @update:model-value="this.$refs.qDateFreezePopup.hide()"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <q-input
            v-model="this.reasonModel"
            type="textarea"
            autogrow
            label="Причина заморозки *"
            :rules="[val => (val && val.trim().length > 0) || 'Обязательное поле']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup/>
          <div id="freeze-save-btn">
            <q-btn @click="this.$emit('confirm')" label="Заморозить" color="primary"/>
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
</template>

<script>
import { dateOption } from './dateOption'

export default {
  props: {
    modelValue: Boolean,
    // Значение поля «Заморозить до» (дд.мм.гггг чч:мм), v-model:until
    until: { type: String, default: '' },
    // Причина заморозки, v-model:reason
    reason: { type: String, default: '' }
  },

  emits: ['update:modelValue', 'update:until', 'update:reason', 'confirm'],

  computed: {
    untilModel: {
      get () {
        return this.until
      },
      set (value) {
        this.$emit('update:until', value)
      }
    },

    reasonModel: {
      get () {
        return this.reason
      },
      set (value) {
        this.$emit('update:reason', value)
      }
    }
  },

  methods: {
    dateOption
  }
}
</script>
