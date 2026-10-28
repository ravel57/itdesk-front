<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
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
</template>

<script>
import axios from 'axios'
import {emptyCriticality} from 'src/util/settingsServices/serviceForms'
import servicesNotifyMixin from './servicesNotifyMixin'

// Диалог создания/редактирования критичности.
// Открытие — через v-model; criticality — строка списка или null для новой критичности.
// События: update:modelValue, saved (критичность сохранена, диалог уже закрыт).
export default {
  name: 'CriticalityDialog',

  mixins: [servicesNotifyMixin],

  props: {
    modelValue: {type: Boolean, default: false},
    criticality: {type: Object, default: null}
  },

  emits: ['update:modelValue', 'saved'],

  data() {
    return {
      saving: false,
      criticalityForm: emptyCriticality()
    }
  },

  watch: {
    modelValue(opened) {
      if (opened) {
        this.criticalityForm = this.criticality ? {...this.criticality} : emptyCriticality()
      }
    }
  },

  methods: {
    async saveCriticality() {
      if (!this.criticalityForm.name?.trim()) return;
      this.saving = true;
      try {
        if (this.criticalityForm.id) await axios.patch('/api/v1/service-criticality', this.criticalityForm); else await axios.post('/api/v1/service-criticality', this.criticalityForm);
        this.$emit('update:modelValue', false);
        this.$emit('saved')
      } catch (e) {
        this.notifyError(e)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.criticality-dialog {
  width: 480px;
  max-width: calc(100vw - 32px);
}
</style>
