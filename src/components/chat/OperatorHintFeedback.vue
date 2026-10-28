<template>
  <div class="operator-hint-feedback row items-center no-wrap q-gutter-xs app-shared-plugin-badge">
    <span class="text-caption text-grey-8">Подсказка помогла?</span>
    <q-btn
      flat
      dense
      round
      size="sm"
      icon="thumb_up"
      :color="hint.helpful === true ? 'positive' : 'grey-7'"
      :loading="saving === true"
      :disable="saving !== null"
      @click.stop="rate(true)"
    >
      <q-tooltip>Помогла</q-tooltip>
    </q-btn>
    <q-btn
      flat
      dense
      round
      size="sm"
      icon="thumb_down"
      :color="hint.helpful === false ? 'negative' : 'grey-7'"
      :loading="saving === false"
      :disable="saving !== null"
      @click.stop="rate(false)"
    >
      <q-tooltip>Не помогла</q-tooltip>
    </q-btn>
  </div>
</template>

<script>
import axios from 'axios'

// Оценка подсказки Jev оператором: по оценкам в настройках Jev видно, какой источник подсказок полезен
export default {
  name: 'OperatorHintFeedback',

  props: {
    hint: { type: Object, required: true }
  },

  emits: ['rated'],

  data: () => ({
    saving: null
  }),

  methods: {
    rate (helpful) {
      // Повторное нажатие на выбранную оценку снимает её
      const value = this.hint.helpful === helpful ? null : helpful
      this.saving = helpful
      axios.post(`/api/v1/operator-hints/${this.hint.id}/feedback`, { helpful: value })
        .then(({ data }) => this.$emit('rated', data))
        .catch(e => this.$q.notify({ type: 'negative', message: e?.response?.data?.message || e.message }))
        .finally(() => {
          this.saving = null
        })
    }
  }
}
</script>
