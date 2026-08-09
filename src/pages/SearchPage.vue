<template>
  <q-page padding>
    <div class="search-page">
      <q-input
        v-model="searchRequest"
        outlined
        dense
        label="Глобальный поиск"
        clearable
        debounce="400"
        class="search-input"
        @update:model-value="sendSearchRequest"
      >
        <template #prepend>
          <q-icon name="search"/>
        </template>
      </q-input>

      <q-option-group
        v-model="selectedCategories"
        :options="categoryOptions"
        type="checkbox"
        color="primary"
        inline
        class="q-mt-sm search-category-filter"
        @update:model-value="sendSearchRequest"
      />

      <div class="q-mt-md">
        <q-banner
          v-if="!searchRequest"
          rounded
          class="bg-grey-2 text-grey-8"
        >
          Введите текст для поиска по клиентам, заявкам, сообщениям и операторам.
        </q-banner>

        <q-banner
          v-else-if="!loading && results.length === 0"
          rounded
          class="bg-grey-2 text-grey-8"
        >
          Ничего не найдено
        </q-banner>

        <q-list
          v-else
          bordered
          separator
          class="search-results"
        >
          <q-item
            v-for="result in results"
            :key="result.id"
            clickable
            @click="openResult(result)"
          >
            <q-item-section avatar>
              <q-icon :name="getResultIcon(result.entityType)"/>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ result.title || 'Без названия' }}
              </q-item-label>

              <q-item-label caption>
                {{ getResultSubtitle(result) }}
              </q-item-label>

              <q-item-label
                v-if="getResultDisplayText(result)"
                caption
                class="result-text"
              >
                {{ getResultDisplayText(result) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side class="result-side">
              <div
                v-if="result._matchPercent !== null && result._matchPercent !== undefined"
                class="match-percent"
              >
                {{ result._matchPercent }}%
              </div>

              <q-icon name="chevron_right"/>
            </q-item-section>
          </q-item>
        </q-list>

        <q-inner-loading :showing="loading">
          <q-spinner size="32px"/>
        </q-inner-loading>
      </div>
    </div>
  </q-page>
</template>

<script>
import {useStore} from 'stores/store'
import {useRoute} from 'vue-router'
import axios from 'axios'

const GLOBAL_SEARCH_SETTINGS_STORAGE_KEY = 'uldesk.global-search.settings'

export default {
  name: 'SearchPage',

  data: () => ({
    searchRequest: '',
    selectedCategories: [],
    categoryOptions: [
      {label: 'Заявки', value: 'TASK'},
      {label: 'Сервисы', value: 'SERVICE'},
      {label: 'Сообщения из чатов', value: 'CLIENT_MESSAGE'},
      {label: 'Сообщения из заявок', value: 'TASK_MESSAGE'},
      {label: 'База знаний', value: 'KNOWLEDGE'},
      {label: 'Клиенты', value: 'CLIENT'},
      {label: 'Операторы', value: 'USER'},
    ],
    results: [],
    loading: false
  }),

  methods: {
    getAllowedGlobalSearchCategories() {
      return this.categoryOptions.map(category => category.value)
    },

    normalizeGlobalSearchCategories(value) {
      if (!Array.isArray(value)) {
        return []
      }

      const allowedCategories = this.getAllowedGlobalSearchCategories()

      return value
        .filter(category => allowedCategories.includes(category))
    },

    buildGlobalSearchSettingsForStorage() {
      return {
        searchRequest: this.searchRequest || '',
        selectedCategories: this.normalizeGlobalSearchCategories(this.selectedCategories)
      }
    },

    saveGlobalSearchSettingsToLocalStorage() {
      try {
        localStorage.setItem(
          GLOBAL_SEARCH_SETTINGS_STORAGE_KEY,
          JSON.stringify(this.buildGlobalSearchSettingsForStorage())
        )
      } catch (e) {
        console.warn('Не удалось сохранить настройки глобального поиска', e)
      }
    },

    restoreGlobalSearchSettingsFromLocalStorage() {
      let settings = null

      try {
        const rawSettings = localStorage.getItem(GLOBAL_SEARCH_SETTINGS_STORAGE_KEY)

        if (!rawSettings) {
          return false
        }

        settings = JSON.parse(rawSettings)
      } catch (e) {
        console.warn('Не удалось прочитать настройки глобального поиска', e)
        return false
      }

      if (!settings || typeof settings !== 'object') {
        return false
      }

      this.searchRequest = String(settings.searchRequest || '')
      this.selectedCategories = this.normalizeGlobalSearchCategories(settings.selectedCategories)

      return true
    },

    sendSearchRequest() {
      this.saveGlobalSearchSettingsToLocalStorage()
      const query = (this.searchRequest || '').trim()
      if (query.length < 2) {
        this.results = []
        return
      }

      this.loading = true

      axios.get('/api/v1/global-search', {
        params: {
          query,
          types: this.selectedCategories.length > 0
            ? this.selectedCategories.join(',')
            : undefined
        }
      })
        .then(response => {
          this.results = this.normalizeSearchResults(response.data || [])
        })
        .catch(error => {
          console.error(error)
          this.results = []
          this.$q.notify({
            type: 'negative',
            message: 'Ошибка глобального поиска',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          })
        })
        .finally(() => {
          this.loading = false
        })
    },

    openResult (result) {
      if (!result) {
        return
      }
      if (result.entityType === 'KNOWLEDGE') {
        this.$router.push({
          path: '/knowledge-base',
          query: {
            knowledgeId: result.entityId
          }
        })
        return
      }
      if (result.clientId) {
        const query = {}
        if (result.taskId) {
          query.task = result.taskId
        }
        if (result.entityType === 'CLIENT_MESSAGE' || result.entityType === 'TASK_MESSAGE') {
          query.messageId = result.entityId
        }
        this.$router.push({
          path: `/chats/${result.clientId}`,
          query
        })
        return
      }
      if (result.entityType === 'TASK' && result.taskId) {
        this.$router.push({
          path: '/tasks',
          query: {
            task: result.taskId
          }
        })
        return
      }
      if (result.url) {
        this.$router.push(result.url)
      }
    },

    getResultSubtitle(result) {
      const entityLabel = this.getEntityTypeLabel(result?.entityType)
      const subtitle = String(result?.subtitle || '').trim()
      if (!subtitle || subtitle === entityLabel) {
        return entityLabel
      }
      return `${entityLabel} · ${subtitle}`
    },

    getResultDisplayText(result) {
      if (!result) {
        return ''
      }
      if (result.entityType === 'TASK') {
        return ''
      }
      return String(result.text || '').trim()
    },

    getEntityTypeLabel(entityType) {
      switch (entityType) {
        case 'CLIENT':
          return 'Клиент'
        case 'TASK':
          return 'Заявка'
        case 'SERVICE':
          return 'Сервис'
        case 'KNOWLEDGE':
          return 'База знаний'
        case 'CLIENT_MESSAGE':
          return 'Сообщения из чатов'
        case 'TASK_MESSAGE':
          return 'Сообщения из заявок'
        case 'USER':
          return 'Оператор'
        default:
          return entityType || 'Объект'
      }
    },

    getResultIcon(entityType) {
      switch (entityType) {
        case 'CLIENT':
          return 'person'
        case 'TASK':
          return 'task_alt'
        case 'SERVICE':
          return 'dns'
        case 'CLIENT_MESSAGE':
          return 'forum'
        case 'TASK_MESSAGE':
          return 'chat'
        case 'USER':
          return 'support_agent'
        case 'KNOWLEDGE':
          return 'menu_book'
        default:
          return 'search'
      }
    },

    getResultScore(result) {
      const score = Number(result?.score)
      return Number.isFinite(score) ? score : 0
    },

    normalizeSearchResults(results) {
      if (!Array.isArray(results) || results.length === 0) {
        return []
      }

      const maxScore = results.reduce((max, result) => {
        return Math.max(max, this.getResultScore(result))
      }, 0)

      return results
        .map((result, index) => {
          const score = this.getResultScore(result)

          return {
            ...result,
            _originalIndex: index,
            _matchPercent: maxScore > 0
              ? Math.round((score / maxScore) * 100)
              : 0
          }
        })
        .sort((left, right) => {
          const scoreDiff = this.getResultScore(right) - this.getResultScore(left)

          if (scoreDiff !== 0) {
            return scoreDiff
          }

          return left._originalIndex - right._originalIndex
        })
    }
  },

  computed: {
    isMobile() {
      return this.$q.screen.width < 1023
    }
  },

  setup() {
    const store = useStore()
    const route = useRoute()
    return {store, route}
  },

  mounted() {
    document.title = 'ULDESK : Поиск'
    this.restoreGlobalSearchSettingsFromLocalStorage()
    if ((this.searchRequest || '').trim().length >= 2) {
      this.sendSearchRequest()
    }
  }
}
</script>

<style scoped>
.search-page {
  max-width: 960px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
}

.search-results {
  border-radius: 8px;
  overflow: hidden;
}

.result-text {
  display: -webkit-box;
  max-width: 100%;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.search-category-filter {
  align-items: center;
}

.result-side {
  min-width: 72px;
  align-items: flex-end;
  gap: 4px;
}

.match-percent {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
</style>
