<template>
  <q-card class="plugins-card">
    <q-card-section>
      <div class="text-subtitle1">Загрузить плагин</div>
      <div class="text-caption text-grey-7">
        Загрузите ZIP-архив с manifest.yml, ui.yml и, если нужен backend-hook, plugin.groovy.
      </div>
    </q-card-section>

    <q-separator/>

    <q-card-section>
      <div class="upload-row">
        <q-file
          v-model="pluginFile"
          outlined
          dense
          clearable
          accept=".zip"
          label="Выберите ZIP-плагин *"
          class="plugin-file"
        >
          <template #prepend>
            <q-icon name="extension"/>
          </template>
        </q-file>

        <q-btn
          color="primary"
          icon="upload"
          label="Загрузить"
          :disable="!pluginFile"
          :loading="uploading"
          @click="uploadPlugin"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import axios from 'axios'
import {getErrorMessage} from 'src/util/settingsPlugins/pluginNormalizers'
import pluginsNotifyMixin from './pluginsNotifyMixin'

// Карточка загрузки ZIP-плагина. После успешной загрузки эмитит uploaded (страница перечитывает список).
export default {
  name: 'PluginUploadCard',

  mixins: [pluginsNotifyMixin],

  emits: ['uploaded'],

  data: () => ({
    pluginFile: null,
    uploading: false
  }),

  methods: {
    async uploadPlugin() {
      if (!this.pluginFile) {
        return
      }

      this.uploading = true

      try {
        const formData = new FormData()
        formData.append('file', this.pluginFile)

        await axios.post('/api/v1/plugins/install', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        this.pluginFile = null
        this.notifyPositive('Плагин загружен')
        this.$emit('uploaded')
      } catch (e) {
        this.notifyNegative(getErrorMessage(e, 'Не удалось загрузить плагин'))
      } finally {
        this.uploading = false
      }
    }
  }
}
</script>

<style scoped>
.plugins-card {
  margin-bottom: 16px;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.plugin-file {
  flex: 1;
}

@media (max-width: 700px) {
  .upload-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
