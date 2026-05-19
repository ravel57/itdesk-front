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
          <q-icon name="search" />
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
              <q-icon :name="getResultIcon(result.entityType)" />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ result.title || 'Без названия' }}
              </q-item-label>

              <q-item-label caption>
                {{ getEntityTypeLabel(result.entityType) }}
                <span v-if="result.subtitle"> · {{ result.subtitle }}</span>
              </q-item-label>

              <q-item-label
                v-if="result.entityType === 'TASK' && result.entityId"
                caption
                class="text-primary"
              >
                №{{ result.entityId }}
              </q-item-label>

              <q-item-label
                v-if="result.text"
                caption
                class="result-text"
              >
                {{ result.text }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" />
            </q-item-section>
          </q-item>
        </q-list>

        <q-inner-loading :showing="loading">
          <q-spinner size="32px" />
        </q-inner-loading>
      </div>
    </div>
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'
import { useRoute } from 'vue-router'
import axios from 'axios'

export default {
  name: 'SearchPage',

  data: () => ({
    searchRequest: '',
    selectedCategories: [],
    categoryOptions: [
      { label: 'Операторы', value: 'USER' },
      { label: 'Клиенты', value: 'CLIENT' },
      { label: 'Заявки', value: 'TASK' },
      { label: 'Сообщения клиентов', value: 'CLIENT_MESSAGE' },
      { label: 'Сообщения заявок', value: 'TASK_MESSAGE' }
    ],
    results: [],
    loading: false
  }),

  methods: {
    sendSearchRequest () {
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
          this.results = response.data || []
        })
        .catch(error => {
          console.error(error)
          this.results = []
          this.$q.notify({
            type: 'negative',
            message: 'Ошибка глобального поиска'
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

    getEntityTypeLabel (entityType) {
      switch (entityType) {
        case 'CLIENT':
          return 'Клиент'
        case 'TASK':
          return 'Заявка'
        case 'CLIENT_MESSAGE':
          return 'Сообщение клиента'
        case 'TASK_MESSAGE':
          return 'Сообщение заявки'
        case 'USER':
          return 'Оператор'
        default:
          return entityType || 'Объект'
      }
    },

    getResultIcon (entityType) {
      switch (entityType) {
        case 'CLIENT':
          return 'person'
        case 'TASK':
          return 'task_alt'
        case 'CLIENT_MESSAGE':
          return 'forum'
        case 'TASK_MESSAGE':
          return 'chat'
        case 'USER':
          return 'support_agent'
        default:
          return 'search'
      }
    }
  },

  computed: {
    isMobile () {
      return this.$q.screen.width < 1023
    }
  },

  setup () {
    const store = useStore()
    const route = useRoute()
    return { store, route }
  },


  mounted() {
    document.title = 'ULDESK : Поиск'
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
</style>
