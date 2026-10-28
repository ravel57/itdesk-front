<template>
  <q-page class="plugins-page">
    <div class="plugins-header settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Плагины</div>
        <div class="settings-content-description">
          Загружайте, обновляйте и управляйте установленными плагинами ULDesk.
        </div>
      </div>

      <div class="settings-content-actions">
        <q-btn
          unelevated
          color="primary"
          icon="refresh"
          label="Перезагрузить плагины"
          :loading="reloading"
          @click="reloadPlugins"
        />
      </div>
    </div>

    <plugin-upload-card @uploaded="loadPlugins"/>

    <plugins-table
      :plugins="plugins"
      :loading="loading"
      @refresh="loadPlugins"
      @security="openPluginSecurity"
      @enable="enablePlugin"
      @disable="disablePlugin"
      @reload="reloadSinglePlugin"
      @delete="confirmDeletePlugin"
    />

    <plugin-security-dialog v-model="securityDialogOpen" :plugin="securityPlugin"/>
  </q-page>
</template>

<script>
import PluginUploadCard from 'components/settings/plugins/PluginUploadCard.vue'
import PluginsTable from 'components/settings/plugins/PluginsTable.vue'
import PluginSecurityDialog from 'components/settings/plugins/PluginSecurityDialog.vue'
import pluginsNotifyMixin from 'components/settings/plugins/pluginsNotifyMixin'
import pluginsListMixin from 'components/settings/plugins/pluginsListMixin'

// Оркестратор страницы «Плагины»: загрузка, таблица и диалог доступов — в components/settings/plugins,
// список плагинов и действия над ними — в pluginsListMixin.
export default {
  name: 'PluginsPage',

  components: {PluginUploadCard, PluginsTable, PluginSecurityDialog},

  mixins: [pluginsNotifyMixin, pluginsListMixin],

  data: () => ({
    securityDialogOpen: false,
    securityPlugin: null
  }),

  mounted() {
    this.loadPlugins()
  },

  methods: {
    openPluginSecurity(plugin) {
      this.securityPlugin = plugin
      this.securityDialogOpen = true
    }
  }
}
</script>

<style scoped>
.plugins-page {
  padding: 16px;
}

.plugins-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 700px) {
  .plugins-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
