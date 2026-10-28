<template>
  <q-page class="q-pa-md services-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Сервисы и мониторинг</div>
        <div class="settings-content-description">
          Управляйте каталогом услуг, договорными подключениями, SLA/OLA и интеграциями Zabbix.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn flat round color="primary" icon="refresh" :loading="loading" @click="loadAll"/>
        <q-btn v-if="tab === 'services'" unelevated color="primary" icon="add" label="Сервис" @click="openService()"/>
        <q-btn v-if="tab === 'zabbix'" unelevated color="primary" icon="add" label="Интеграция" @click="openZabbix()"/>
        <q-btn v-if="tab === 'assignments'" unelevated color="primary" icon="add" label="Подключение" @click="openAssignment()"/>
        <q-btn v-if="tab === 'criticalities'" unelevated color="primary" icon="add" label="Критичность" @click="openCriticality()"/>
      </div>
    </div>

    <q-tabs v-model="tab" dense align="left" class="text-primary q-mb-md">
      <q-tab name="services" icon="dns" label="Сервисы"/>
      <q-tab name="assignments" icon="handshake" label="Организации и договоры"/>
      <q-tab name="zabbix" icon="monitor_heart" label="Zabbix"/>
      <q-tab name="criticalities" icon="priority_high" label="Критичности"/>
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="services" class="q-pa-none">
        <services-table
          :services="services"
          :loading="loading"
          :checking-id="checkingId"
          @check-monitoring="checkMonitoring"
          @edit="openService"
          @remove="removeService"
        />
      </q-tab-panel>

      <q-tab-panel name="assignments" class="q-pa-none">
        <assignments-table
          :assignments="assignments"
          :loading="loading"
          @edit="openAssignment"
          @remove="removeAssignment"
        />
      </q-tab-panel>

      <q-tab-panel name="zabbix" class="q-pa-none">
        <zabbix-table
          :zabbix-integrations="zabbixIntegrations"
          :loading="loading"
          :testing-zabbix-id="testingZabbixId"
          @log="openZabbixLog"
          @test="testZabbix"
          @edit="openZabbix"
          @remove="removeZabbix"
        />
      </q-tab-panel>

      <q-tab-panel name="criticalities" class="q-pa-none">
        <criticalities-list
          :criticalities="criticalities"
          :services="services"
          :loading="loading"
          @resort="resortCriticalities"
          @set-default="setDefaultCriticality"
          @edit="openCriticality"
          @remove="removeCriticality"
        />
      </q-tab-panel>
    </q-tab-panels>

    <service-dialog
      v-model="serviceDialog"
      :service="serviceEditing"
      :services="services"
      :criticalities="criticalities"
      :zabbix-integrations="zabbixIntegrations"
      @close="closeService"
      @saved="onServiceSaved"
      @remove="removeService"
    />

    <zabbix-integration-dialog v-model="zabbixDialog" :integration="zabbixEditing" @saved="loadAll"/>
    <zabbix-webhook-log-dialog v-model="zabbixLogDialog" :integration="zabbixEditing"/>

    <assignment-dialog
      v-model="assignmentDialog"
      :assignment="assignmentEditing"
      :services="services"
      @saved="onAssignmentSaved"
    />

    <criticality-dialog v-model="criticalityDialog" :criticality="criticalityEditing" @saved="loadAll"/>
  </q-page>
</template>

<script>
import {useStore} from 'stores/store'
import ZabbixIntegrationDialog from 'components/monitoring/ZabbixIntegrationDialog.vue'
import ZabbixWebhookLogDialog from 'components/monitoring/ZabbixWebhookLogDialog.vue'
import ServicesTable from 'components/settings/services/ServicesTable.vue'
import AssignmentsTable from 'components/settings/services/AssignmentsTable.vue'
import ZabbixTable from 'components/settings/services/ZabbixTable.vue'
import CriticalitiesList from 'components/settings/services/CriticalitiesList.vue'
import ServiceDialog from 'components/settings/services/ServiceDialog.vue'
import AssignmentDialog from 'components/settings/services/AssignmentDialog.vue'
import CriticalityDialog from 'components/settings/services/CriticalityDialog.vue'
import servicesNotifyMixin from 'components/settings/services/servicesNotifyMixin'
import servicesDataMixin from 'components/settings/services/servicesDataMixin'
import servicesServiceActionsMixin from 'components/settings/services/servicesServiceActionsMixin'
import servicesZabbixActionsMixin from 'components/settings/services/servicesZabbixActionsMixin'
import servicesAssignmentsCriticalitiesMixin from 'components/settings/services/servicesAssignmentsCriticalitiesMixin'

// Оркестратор страницы «Сервисы и мониторинг»: вкладки с таблицами и диалоги — в components/settings/services,
// загрузка каталога и действия со строками — в *Mixin.js рядом с ними.
export default {
  name: 'ServicesPage',

  components: {
    ZabbixIntegrationDialog,
    ZabbixWebhookLogDialog,
    ServicesTable,
    AssignmentsTable,
    ZabbixTable,
    CriticalitiesList,
    ServiceDialog,
    AssignmentDialog,
    CriticalityDialog
  },

  mixins: [
    servicesNotifyMixin,
    servicesDataMixin,
    servicesServiceActionsMixin,
    servicesZabbixActionsMixin,
    servicesAssignmentsCriticalitiesMixin
  ],

  setup() {
    return {store: useStore()}
  },

  data() {
    return {
      tab: 'services'
    }
  },

  mounted() {
    // ?tab=zabbix — переход из уведомления о связи с Zabbix
    if (['services', 'assignments', 'zabbix', 'criticalities'].includes(this.$route.query.tab)) {
      this.tab = this.$route.query.tab
    }
    this.store.fetchData();
    this.loadAll()
  }
}
</script>

<style scoped>
.services-page {
  width: 100%;
}
</style>
