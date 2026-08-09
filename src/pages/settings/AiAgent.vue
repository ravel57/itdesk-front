<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">ИИ-агент</div>
        <div class="settings-content-description">
          Индекс LLM строится из актуальных статей базы знаний текущего инстанса.
        </div>
      </div>

      <div class="settings-content-actions">
        <q-btn
          color="primary"
          icon="model_training"
          :loading="retraining"
          :disable="retraining"
          @click="confirmRetrain"
        >
          Переобучить LLM
          <q-tooltip>
            Удалить старые данные LLM только для текущего инстанса и заново загрузить актуальную базу знаний
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-card flat bordered class="q-mt-md llm-status-card">
      <q-card-section>
        <div class="row items-center q-col-gutter-md">
          <div class="col-12 col-sm">
            <div class="text-subtitle1 text-weight-medium">Индекс базы знаний</div>
            <div class="text-body2 text-grey-7">
              Чанков в LLM-индексе: {{ kbCountLabel }}
            </div>
          </div>
          <div class="col-12 col-sm-auto">
            <q-btn
              flat
              dense
              color="primary"
              icon="refresh"
              label="Обновить статус"
              :loading="loadingCount"
              @click="loadKbCount"
            />
          </div>
        </div>

        <div v-if="retraining" class="q-mt-md">
          <q-linear-progress indeterminate color="primary" rounded />
          <div class="text-caption text-grey-7 q-mt-sm">
            Этап 1: очистка данных текущего instanceName. Этап 2: повторная индексация актуальных статей БЗ.
          </div>
        </div>

        <q-banner
          v-if="lastResult"
          rounded
          class="bg-green-1 text-green-10 q-mt-md"
        >
          Переобучение завершено: статей {{ lastResult.documents }}, создано чанков {{ lastResult.chunks }},
          в индексе {{ lastResult.count }}.
        </q-banner>
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AiAgent',

  data () {
    return {
      retraining: false,
      loadingCount: false,
      kbCount: null,
      lastResult: null
    }
  },

  computed: {
    kbCountLabel () {
      return this.kbCount === null ? '—' : this.kbCount
    }
  },

  mounted () {
    this.loadKbCount()
  },

  methods: {
    async loadKbCount () {
      this.loadingCount = true
      try {
        const { data } = await axios.get('/api/v1/llm/kb-count')
        this.kbCount = Number(data?.count ?? 0)
      } catch (e) {
        this.kbCount = null
      } finally {
        this.loadingCount = false
      }
    },

    confirmRetrain () {
      this.$q.dialog({
        title: 'Переобучить LLM?',
        message: 'Старый индекс текущего инстанса будет удалён, после чего LLM заново проиндексирует актуальные статьи базы знаний.',
        cancel: true,
        persistent: true,
        ok: {
          label: 'Переобучить',
          color: 'primary'
        },
        cancel: {
          label: 'Отмена',
          flat: true
        }
      }).onOk(() => this.retrainLlm())
    },

    async retrainLlm () {
      this.retraining = true
      this.lastResult = null

      try {
        const { data } = await axios.post('/api/v1/llm/retrain')
        this.lastResult = data
        this.kbCount = Number(data?.count ?? 0)
        this.$q.notify({
          type: 'positive',
          position: 'top-right',
          message: `LLM переобучена: ${data?.documents ?? 0} статей, ${data?.chunks ?? 0} чанков`
        })
      } catch (e) {
        const detail = e?.response?.data?.detail || e?.response?.data?.message || e.message
        this.$q.notify({
          type: 'negative',
          position: 'top-right',
          message: `Не удалось переобучить LLM: ${detail}`
        })
        await this.loadKbCount()
      } finally {
        this.retraining = false
      }
    }
  }
}
</script>

<style scoped>
.llm-status-card {
  max-width: 860px;
}
</style>
