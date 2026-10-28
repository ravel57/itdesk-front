<template>
  <div class="q-pa-md support-lines-page">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Линии технической поддержки</div>
        <div class="settings-content-description">
          Линия владеет заявкой, участники выполняют работу, наблюдатели контролируют очередь.
        </div>
      </div>
      <div class="settings-content-actions">
        <q-btn
          v-if="activeTab === 'lines'"
          unelevated
          color="primary"
          icon="add"
          label="Добавить линию"
          @click="openCreate"
        />
      </div>
    </div>

    <q-tabs
      v-model="activeTab"
      dense
      align="left"
      active-color="primary"
      indicator-color="primary"
      class="text-grey-7 q-mb-md"
    >
      <!--      <q-tab name="lines" icon="support_agent" label="Линии" no-caps />-->
      <!--      <q-tab name="routing" icon="alt_route" label="Маршрутизация" no-caps />-->
    </q-tabs>

    <q-tab-panels v-model="activeTab" animated class="bg-transparent">
      <q-tab-panel name="lines" class="q-pa-none">
        <support-lines-list @edit="openEdit"/>
      </q-tab-panel>

      <q-tab-panel name="routing" class="q-pa-none">
        <support-line-routing-panel/>
      </q-tab-panel>
    </q-tab-panels>
  </div>

  <support-line-dialog ref="lineDialog"/>
</template>

<script>
import axios from 'axios'
import {useStore} from 'stores/store'
import SupportLineDialog from 'components/settings/support-lines/SupportLineDialog.vue'
import SupportLineRoutingPanel from 'components/settings/support-lines/SupportLineRoutingPanel.vue'
import SupportLinesList from 'components/settings/support-lines/SupportLinesList.vue'

export default {
  name: 'SupportLinesPage',
  components: {SupportLineDialog, SupportLineRoutingPanel, SupportLinesList},

  data: () => ({
    activeTab: 'lines'
  }),

  methods: {
    openCreate() {
      this.$refs.lineDialog.openCreate()
    },

    openEdit(line) {
      this.$refs.lineDialog.openEdit(line)
    }
  },

  mounted() {
    if (!this.store.supportLines.length) {
      axios.get('/api/v1/support-lines').then(({data}) => {
        this.store.supportLines = data || []
      })
    }
  },

  setup() {
    return {store: useStore()}
  }
}
</script>

<style scoped>
.support-lines-page {
  width: 100%;
  max-width: none;
}
</style>
