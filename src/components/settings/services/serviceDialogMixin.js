import axios from 'axios'
import {serviceLabelWithOrganizations, serviceOrganizationNames} from 'src/util/serviceOrganizations'
import {emptyService, serviceFormFromRow} from 'src/util/settingsServices/serviceForms'
import servicesNotifyMixin from './servicesNotifyMixin'

// Состояние и действия диалога сервиса: форма, вкладки, списки выбора, правила приоритета, этапы OLA, сохранение.
// Требует в компоненте: this.store (setup: useStore()), props modelValue / service / services / criticalities /
// zabbixIntegrations. Форма пересоздаётся при каждом открытии диалога (modelValue: false -> true).
export default {
  mixins: [servicesNotifyMixin],

  data() {
    return {
      saving: false,
      serviceTab: 'general',
      serviceForm: emptyService()
    }
  },

  computed: {
    criticalityOptions() {
      return this.criticalities.map(x => ({label: x.name, value: x.id}))
    },
    userOptions() {
      return this.store.users.map(x => ({
        label: [x.lastname, x.firstname].filter(Boolean).join(' ') || x.username,
        value: x.id
      }))
    },

    supportLineOptions() {
      return this.store.supportLines.map(x => ({label: x.name, value: x.id}))
    },

    priorityOptions() {
      return this.store.priorities.map(x => ({label: x.name, value: x.id}))
    },

    taskTypeOptions() {
      return this.store.taskTypes.map(x => ({label: x.type || x.name, value: x.id}))
    },

    dependencyOptions() {
      return this.services.filter(x => x.id !== this.serviceForm.id).map(x => ({
        label: serviceLabelWithOrganizations(x, this.services),
        value: x.id
      }))
    },

    zabbixOptions() {
      return this.zabbixIntegrations.map(x => ({label: x.name, value: x.id}))
    }
  },

  watch: {
    modelValue(opened) {
      if (opened) {
        this.serviceForm = serviceFormFromRow(this.service)
        this.serviceTab = 'general'
      }
    }
  },

  methods: {
    serviceOrganizationNames(service) {
      return serviceOrganizationNames(service, this.services)
    },

    closeService() {
      this.$emit('close')
    },

    addPriorityRule() {
      this.serviceForm.priorityRules.push({
        orderNumber: this.serviceForm.priorityRules.length,
        taskTypeId: null,
        keyword: '',
        priorityId: null,
        active: true
      })
    },

    addOlaStage() {
      this.serviceForm.olaStages.push({
        orderNumber: this.serviceForm.olaStages.length,
        supportLineId: null,
        durationSeconds: 3600,
        useWorkingTime: true,
        warningPercent: 80,
        active: true
      })
    },

    async saveService() {
      if (!this.serviceForm.code?.trim() || !this.serviceForm.name?.trim()) {
        this.serviceTab = 'general'
        this.notifyError(new Error('Код и название сервиса обязательны'))
        return
      }
      this.saving = true
      try {
        const id = this.serviceForm.id;
        const payload = {...this.serviceForm};
        delete payload.id
        if (id) await axios.patch(`/api/v1/service/${id}`, payload); else await axios.post('/api/v1/service', payload)
        this.closeService();
        this.$emit('saved')
      } catch (error) {
        this.notifyError(error)
      } finally {
        this.saving = false
      }
    }
  }
}
