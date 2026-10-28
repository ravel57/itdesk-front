<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: min(900px, 96vw)">
      <q-card-section>
        <div class="text-h6">Подключение сервиса к организации</div>
      </q-card-section>
      <q-card-section class="row q-col-gutter-md">
        <q-select v-model="assignmentForm.organizationId" class="col-12 col-md-6 organization-select" outlined
                  emit-value map-options
                  :options="organizationOptions" label="Организация *"
                  popup-content-class="organization-select-popup"/>
        <q-select v-model="assignmentForm.serviceId" class="col-12 col-md-6" outlined emit-value map-options
                  :options="serviceOptions" label="Сервис *"/>
        <q-input v-model="assignmentForm.contractNumber" class="col-12 col-md-4" outlined label="Договор"/>
        <q-input v-model="assignmentForm.tariffName" class="col-12 col-md-4" outlined
                 label="Тариф / уровень поддержки"/>
        <q-input v-model="assignmentForm.slaPolicyName" class="col-12 col-md-4" outlined
                 label="Название SLA-политики"/>
        <q-input v-model="assignmentForm.validFrom" class="col-6 col-md-3" outlined type="date" label="Действует с"
                 stack-label/>
        <q-input v-model="assignmentForm.validTo" class="col-6 col-md-3" outlined type="date" label="Действует до"
                 stack-label/>
        <q-input v-model.number="assignmentForm.firstResponseSlaMinutes" class="col-6 col-md-3" outlined type="number"
                 min="0" label="Первый ответ, мин."/>
        <q-input v-model.number="assignmentForm.resolutionSlaMinutes" class="col-6 col-md-3" outlined type="number"
                 min="0" label="Решение, мин."/>
        <q-input v-model="assignmentForm.supportCalendar" class="col-12 col-md-4" outlined label="Календарь"/>
        <q-select v-model="assignmentForm.availableChannels" class="col-12 col-md-8" outlined multiple use-chips
                  emit-value map-options :options="channelOptions" label="Доступные каналы"/>
        <q-toggle v-model="assignmentForm.active" label="Активно"/>
        <q-toggle v-model="assignmentForm.defaultForOrganization" label="Сервис по умолчанию"/>
        <q-input v-model="assignmentForm.notes" class="col-12" outlined type="textarea" autogrow label="Примечания"/>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Отмена" v-close-popup/>
        <q-btn color="primary" label="Сохранить" :loading="saving" @click="saveAssignment"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'
import {serviceLabelWithOrganizations} from 'src/util/serviceOrganizations'
import {CHANNEL_VALUES} from 'src/util/settingsServices/serviceColumns'
import {assignmentFormFromRow, emptyAssignment} from 'src/util/settingsServices/serviceForms'
import servicesNotifyMixin from './servicesNotifyMixin'

// Диалог подключения сервиса к организации (договор, тариф, SLA, каналы).
// Открытие — через v-model; assignment — строка таблицы или null для нового подключения.
// События: update:modelValue, saved (подключение сохранено, диалог уже закрыт).
export default {
  name: 'AssignmentDialog',

  mixins: [servicesNotifyMixin],

  props: {
    modelValue: {type: Boolean, default: false},
    assignment: {type: Object, default: null},
    services: {type: Array, default: () => []}
  },

  emits: ['update:modelValue', 'saved'],

  setup() {
    return {store: useStore()}
  },

  data() {
    return {
      saving: false,
      assignmentForm: emptyAssignment(),
      channelOptions: CHANNEL_VALUES.map(value => ({label: value, value}))
    }
  },

  computed: {
    organizationOptions() {
      return this.store.organizations.map(x => ({label: x.name, value: x.id}))
    },

    serviceOptions() {
      return this.services.map(x => ({label: serviceLabelWithOrganizations(x, this.services), value: x.id}))
    }
  },

  watch: {
    modelValue(opened) {
      if (opened) {
        this.assignmentForm = assignmentFormFromRow(this.assignment)
      }
    }
  },

  methods: {
    async saveAssignment() {
      if (!this.assignmentForm.organizationId || !this.assignmentForm.serviceId) return this.notifyError(new Error('Организация и сервис обязательны'));
      this.saving = true;
      try {
        const id = this.assignmentForm.id;
        const payload = {...this.assignmentForm};
        delete payload.id;
        delete payload.organization;
        delete payload.service;
        delete payload.effective;
        if (id) await axios.patch(`/api/v1/organization-service-assignment/${id}`, payload); else await axios.post('/api/v1/organization-service-assignment', payload);
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
