<template>
  <div class="onboarding-overlay">
    <div
      v-if="highlightStyle"
      class="onboarding-highlight"
      :style="highlightStyle"
    />

    <q-card
      class="onboarding-card"
      :style="cardStyle"
    >
      <q-btn
        flat
        round
        dense
        size="sm"
        icon="close"
        color="grey-7"
        class="onboarding-close-btn"
        aria-label="Закрыть обучение"
        @click="$emit('skip')"
      >
        <q-tooltip>Закрыть обучение</q-tooltip>
      </q-btn>
      <q-card-section class="q-pb-sm" style="padding-right: 40px">
        <div class="onboarding-card__step">
          Шаг {{ stepNumber }} из {{ stepsCount }}
        </div>
        <div class="onboarding-card__title">
          {{ step.title }}
        </div>
        <div class="onboarding-card__text">
          {{ step.text }}
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none">
        <div class="row items-center q-gutter-xs">
          <q-btn
            flat
            dense
            color="primary"
            label="Назад"
            :disable="!hasPrevious"
            @click="$emit('previous')"
          />
          <q-btn
            unelevated
            dense
            color="primary"
            :label="hasNext ? 'Далее' : 'Готово'"
            @click="$emit('next')"
          />
        </div>
      </q-card-actions>
    </q-card>
  </div>
</template>

<script>
// Оверлей обучения: подсветка целевого элемента и карточка шага (позиции считает страница).
export default {
  name: 'ClientsChatsOnboardingOverlay',

  props: {
    step: { type: Object, required: true },
    cardStyle: { type: Object, default: () => ({}) },
    highlightStyle: { type: Object, default: null },
    stepNumber: { type: Number, default: 1 },
    stepsCount: { type: Number, default: 1 },
    hasPrevious: { type: Boolean, default: false },
    hasNext: { type: Boolean, default: false }
  },

  emits: ['skip', 'previous', 'next']
}
</script>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  z-index: 6000;
  pointer-events: none;
}

.onboarding-highlight {
  position: fixed;
  z-index: 6001;
  border: 2px solid var(--q-primary);
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.32);
  pointer-events: none;
  transition: top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease;
}

.onboarding-card {
  position: fixed;
  z-index: 6002;
  border-radius: 14px;
  pointer-events: auto;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
}

.onboarding-card__step {
  margin-bottom: 4px;
  color: #777;
  font-size: 12px;
}

.onboarding-card__title {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 700;
}

.onboarding-card__text {
  color: #555;
  font-size: 14px;
  line-height: 1.45;
}

/* Крестик закрытия обучения в правом верхнем углу карточки */
.onboarding-close-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
}
</style>
