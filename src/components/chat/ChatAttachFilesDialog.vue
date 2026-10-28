<template>
  <q-dialog
    backdrop-filter="blur(4px)"
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="'Добавить файлы'"/>
        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />
      </q-toolbar>
      <q-card-section>
        <div style="margin-bottom: 8px;">
          <div
            style="margin-bottom: 16px"
            v-for="(file, index) in this.files"
            :key="index"
          >
            <div
              style="display: flex; align-items: center; padding: 4px; border: solid 1px rgba(108, 108, 108, 0.2); border-radius: 4px">
              <div
                style="padding: 2px 8px 2px 8px; border-radius: 4px; background-color: rgba(255, 149, 0, 1); color: white; font-size: 12px; margin-right: 8px">
                {{ file.name.split('.')[file.name.split('.').length - 1].toUpperCase() }}
              </div>
              <div class="truncate">{{ file.name.split('.')[0] }}</div>
              <q-space/>
              <q-btn
                flat
                round
                dense
                style="color: gray"
                icon="delete"
                @click="this.removeFile(index)"
              />
            </div>
          </div>
        </div>
        <div style="font-size: 14px; margin-bottom: 16px">Добавлено {{ this.files.length }} файлов</div>
        <q-file
          :model-value="this.files"
          @update:model-value="this.$emit('update:files', $event)"
          label="Выберите файл"
          color="primary"
          outlined
          append
          bottom-slots
          :max-file-size="maxMessageFileSizeBytes"
          :hint="`Максимальный размер одного файла — ${maxMessageFileSizeLabel}`"
          :error="Boolean(fileUploadError)"
          :error-message="fileUploadError"
          multiple
          style="width: 100%"
          @rejected="onFilesRejected"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file"/>
          </template>
        </q-file>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import {
  MESSAGE_FILE_MAX_SIZE_BYTES,
  MESSAGE_FILE_MAX_SIZE_LABEL,
  getMessageFileSizeError
} from 'src/util/messageFileUpload'

// Диалог «Добавить файлы»: список прикреплённых к сообщению файлов и выбор новых
export default {

  name: 'ChatAttachFilesDialog',

  props: {
    modelValue: { type: Boolean },
    // Прикреплённые к сообщению файлы (v-model:files)
    files: {
      type: Array,
      default: () => []
    },
    // Текст ошибки загрузки файла (v-model:file-upload-error)
    fileUploadError: {
      type: String,
      default: ''
    }
  },

  emits: ['update:modelValue', 'update:files', 'update:fileUploadError'],

  methods: {
    removeFile (index) {
      const files = [...this.files]
      files.splice(index, 1)
      this.$emit('update:files', files)
    },

    onFilesRejected (rejectedEntries) {
      const files = (Array.isArray(rejectedEntries) ? rejectedEntries : [])
        .map(entry => entry?.file)
        .filter(Boolean)
      this.$emit(
        'update:fileUploadError',
        getMessageFileSizeError(files) || `Файл не удалось добавить. Максимальный размер — ${MESSAGE_FILE_MAX_SIZE_LABEL}`
      )
    }
  },

  computed: {
    maxMessageFileSizeBytes () {
      return MESSAGE_FILE_MAX_SIZE_BYTES
    },

    maxMessageFileSizeLabel () {
      return MESSAGE_FILE_MAX_SIZE_LABEL
    }
  }
}
</script>

<style scoped>
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
