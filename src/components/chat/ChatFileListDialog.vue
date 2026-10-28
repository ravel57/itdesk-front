<template>
  <q-dialog
    backdrop-filter="blur(4px)"
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6" v-text="'Файлы'"/>
        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />
      </q-toolbar>
      <q-card-section>
        <div class="file-list-toolbar">
          <div class="text-caption text-grey-7">
            Файлов: {{ sortedFileList.length }}
          </div>
          <q-btn
            dense
            flat
            icon="sort"
            :label="fileSortDirection === 'desc' ? 'Сначала новые' : 'Сначала старые'"
            @click="toggleFileSortDirection"
          />
        </div>
        <div class="app-inline app-margin-bottom-8">
          <div class="app-inline app-margin-bottom-16"
            v-for="(file, index) in sortedFileList"
            :key="file.uuid || index"
          >
            <a
              class="file-list-item"
              :href="getFileUrl(file)"
              target="_blank"
            >
              <div class="file-list-ext">
                {{ getFileExt(file) }}
              </div>
              <div class="file-list-info">
                <div class="truncate app-text-ellipsis">{{ getFileTitle(file) }}</div>
                <div
                  v-if="getFileDateText(file)"
                  class="file-list-date"
                >
                  {{ getFileDateText(file) }}
                </div>
              </div>

              <q-space/>
            </a>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
// Список файлов клиента/заявки с сортировкой по дате
export default {

  name: 'ChatFileListDialog',

  props: {
    modelValue: { type: Boolean },
    // Нормализованный список файлов (у каждого есть uuid)
    files: {
      type: Array,
      default: () => []
    }
  },

  emits: ['update:modelValue'],

  data: () => ({
    fileSortDirection: 'desc'
  }),

  methods: {
    getFileName (file) {
      return file?.name || file?.uuid || 'Файл'
    },

    toggleFileSortDirection () {
      this.fileSortDirection = this.fileSortDirection === 'desc' ? 'asc' : 'desc'
    },

    getFileDateTime (file) {
      const value = file?.date || file?.createdAt || file?.messageDate
      if (!value) {
        return NaN
      }
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? NaN : date.getTime()
    },

    getFileDateText (file) {
      const time = this.getFileDateTime(file)
      if (!Number.isFinite(time)) {
        return ''
      }
      return new Date(time).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getFileExt (file) {
      const name = this.getFileName(file)
      if (!name.includes('.')) {
        return 'FILE'
      }
      return name.split('.').pop().toUpperCase()
    },

    getFileTitle (file) {
      const name = this.getFileName(file)
      if (!name.includes('.')) {
        return name
      }
      return name.substring(0, name.lastIndexOf('.'))
    },

    getFileUrl (file) {
      if (!file?.uuid) {
        return '#'
      }
      const category = this.getFileRouteCategory(file)
      return `/files/${category}/${encodeURIComponent(file.uuid)}`
    },

    getFileRouteCategory (file) {
      const type = String(file?.type || '').trim().toLowerCase()
      const name = String(file?.name || '').trim().toLowerCase()
      if (type.startsWith('image/')) {
        return 'images'
      }
      if (type.startsWith('video/')) {
        return 'videos'
      }
      if (type.startsWith('audio/')) {
        return 'audios'
      }
      if (type === 'image' || type === 'images') {
        return 'images'
      }
      if (type === 'video' || type === 'videos') {
        return 'videos'
      }
      if (type === 'audio' || type === 'audios') {
        return 'audios'
      }
      if (type === 'document' || type === 'documents') {
        return 'documents'
      }
      if (
        type.startsWith('application/') ||
        type.startsWith('text/') ||
        name.endsWith('.pdf') ||
        name.endsWith('.doc') ||
        name.endsWith('.docx') ||
        name.endsWith('.xls') ||
        name.endsWith('.xlsx') ||
        name.endsWith('.txt') ||
        name.endsWith('.csv') ||
        name.endsWith('.zip') ||
        name.endsWith('.rar') ||
        name.endsWith('.7z')
      ) {
        return 'documents'
      }
      return 'documents'
    }
  },

  computed: {
    sortedFileList () {
      const files = Array.isArray(this.files) ? [...this.files] : []
      const direction = this.fileSortDirection === 'asc' ? 'asc' : 'desc'
      return files.sort((left, right) => {
        const leftTime = this.getFileDateTime(left)
        const rightTime = this.getFileDateTime(right)
        const leftHasDate = Number.isFinite(leftTime)
        const rightHasDate = Number.isFinite(rightTime)
        if (!leftHasDate && !rightHasDate) {
          return this.getFileName(left).localeCompare(this.getFileName(right), 'ru')
        }
        if (!leftHasDate) {
          return 1
        }
        if (!rightHasDate) {
          return -1
        }
        if (leftTime === rightTime) {
          return this.getFileName(left).localeCompare(this.getFileName(right), 'ru')
        }
        return direction === 'asc'
          ? leftTime - rightTime
          : rightTime - leftTime
      })
    }
  }
}
</script>

<style scoped>
.file-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.file-list-item {
  display: flex;
  align-items: center;
  padding: 6px;
  border: solid 1px var(--app-border, rgba(108, 108, 108, 0.2));
  border-radius: 4px;
  text-decoration: none;
  color: inherit;
}

.file-list-ext {
  padding: 2px 8px;
  border-radius: 4px;
  background-color: rgba(255, 149, 0, 1);
  color: white;
  font-size: 12px;
  margin-right: 8px;
  flex: 0 0 auto;
}

.file-list-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-list-date {
  font-size: 12px;
  color: var(--app-text, rgba(0, 0, 0, 0.54));
}
</style>
