<template>
  <q-btn
    v-if="!active"
    class="chat-onboarding-launch-btn"
    round
    dense
    color="primary"
    icon="help_outline"
    @click="$emit('start')"
  >
    <q-tooltip>Показать обучение по экрану чата</q-tooltip>
  </q-btn>

  <div
    v-if="active"
    class="chat-onboarding-backdrop"
  />
  <div
    v-if="active && targetRect"
    class="chat-onboarding-highlight"
    :style="highlightStyle"
  />
  <q-card
    v-if="active && step"
    class="chat-onboarding-card no-shadow"
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
      @click="$emit('finish')"
    >
      <q-tooltip>Закрыть обучение</q-tooltip>
    </q-btn>
    <div class="chat-onboarding-step-counter">
      Шаг {{ stepIndex + 1 }} из {{ stepsCount }}
    </div>
    <div class="text-subtitle1 chat-onboarding-title">
      {{ step.title }}
    </div>
    <div class="text-body2 chat-onboarding-text">
      {{ step.text }}
    </div>
    <div class="chat-onboarding-actions">
      <q-space/>
      <q-btn
        flat
        dense
        label="Назад"
        :disable="stepIndex === 0"
        @click="$emit('prev')"
      />
      <q-btn
        color="primary"
        dense
        :label="isLastStep ? 'Готово' : 'Далее'"
        @click="$emit('next')"
      />
    </div>
  </q-card>
</template>

<script>
// Оверлей обучающего тура страницы чата: кнопка запуска, затемнение, подсветка
// целевого блока и карточка шага. Состояние тура живёт в chatOnboardingMixin.
export default {
  name: 'ChatOnboardingOverlay',

  props: {
    active: {type: Boolean, default: false},
    step: {type: Object, default: null},
    stepIndex: {type: Number, default: 0},
    stepsCount: {type: Number, default: 0},
    isLastStep: {type: Boolean, default: false},
    targetRect: {type: Object, default: null},
    cardStyle: {type: Object, default: () => ({})}
  },

  emits: ['start', 'finish', 'prev', 'next'],

  computed: {
    highlightStyle() {
      if (!this.targetRect) {
        return {}
      }
      return {
        top: `${this.targetRect.top}px`,
        left: `${this.targetRect.left}px`,
        width: `${this.targetRect.width}px`,
        height: `${this.targetRect.height}px`
      }
    }
  }
}
</script>

<style scoped>
.chat-onboarding-launch-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 3000;
}

.chat-onboarding-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.42);
}

.chat-onboarding-highlight {
  position: fixed;
  z-index: 9001;
  border: 2px solid var(--q-primary);
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.42), 0 0 0 6px rgba(92, 53, 249, 0.16);
  pointer-events: none;
  transition: top 0.18s ease, left 0.18s ease, width 0.18s ease, height 0.18s ease;
}

.chat-onboarding-card {
  position: fixed;
  z-index: 9002;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.chat-onboarding-step-counter {
  color: #757575;
  font-size: 12px;
  margin-bottom: 6px;
}

.chat-onboarding-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.chat-onboarding-text {
  color: #424242;
  line-height: 1.45;
}

.chat-onboarding-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

/* Крестик закрытия обучения в правом верхнем углу карточки */
.onboarding-close-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 1;
}

.chat-onboarding-step-counter,
.chat-onboarding-title {
  padding-right: 28px;
}
</style>
