<template>
  <div class="q-pa-md organizations-settings-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Организации</div>
        <div class="settings-content-description">
          Управляйте организациями, договорами, сотрудниками и пакетами выездов.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          unelevated
          color="primary"
          icon="add"
          label="Добавить организацию"
          @click="dialogNewOrganizationShow"
        />
      </div>
    </div>

    <q-input
      v-model="search"
      outlined
      dense
      clearable
      debounce="250"
      label="Поиск по названию, договору, тарифу, адресу или менеджеру"
      class="q-mb-md"
    >
      <template #prepend>
        <q-icon name="search"/>
      </template>
    </q-input>

    <SettingsOrganizationsList
      :organizations="filteredOrganizations"
      :search="search"
      @edit="editRow"
      @drag-start="dragging = true"
      @drag-end="onOrganizationDragEnd"
    />
  </div>

  <SettingsOrganizationDialog
    ref="organizationDialog"
    @saved="syncLocalOrganizations"
  />
</template>

<script>
import {useStore} from 'stores/store'
import SettingsOrganizationsList from 'components/settings/organizations/SettingsOrganizationsList.vue'
import SettingsOrganizationDialog from 'components/settings/organizations/SettingsOrganizationDialog.vue'
import settingsOrganizationHelpersMixin from 'components/settings/organizations/settingsOrganizationHelpersMixin'
import settingsOrganizationsListMixin from 'components/settings/organizations/settingsOrganizationsListMixin'

export default {
  name: 'OrganizationsComponent',
  components: {SettingsOrganizationsList, SettingsOrganizationDialog},

  mixins: [settingsOrganizationHelpersMixin, settingsOrganizationsListMixin],

  mounted() {
    this.syncLocalOrganizations()
  },

  methods: {
    // Диалог организации живёт в SettingsOrganizationDialog и открывается через ref
    dialogNewOrganizationShow() {
      this.$refs.organizationDialog.dialogNewOrganizationShow()
    },

    editRow(row) {
      this.$refs.organizationDialog.editRow(row)
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>
