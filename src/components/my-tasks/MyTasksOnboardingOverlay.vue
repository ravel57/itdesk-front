<template>
  <teleport to="body">
    <div
      v-if="this.active"
      class="my-tasks-onboarding-layer app-shared-my-tasks-onboarding-layer"
    >
      <div class="my-tasks-onboarding-backdrop"/>
      <div
        class="my-tasks-onboarding-highlight"
        :style="this.highlightStyle"
      />
      <div
        class="my-tasks-onboarding-tooltip"
        :style="this.tooltipStyle"
      >
        <q-btn
          flat
          round
          dense
          size="sm"
          icon="close"
          color="grey-7"
          class="onboarding-close-btn app-shared-onboarding-close-btn"
          aria-label="Закрыть обучение"
          @click="$emit('skip')"
        >
          <q-tooltip>Закрыть обучение</q-tooltip>
        </q-btn>
        <div class="my-tasks-onboarding-progress">
          {{ this.stepIndex + 1 }} / {{ this.stepsCount }}
        </div>
        <div class="my-tasks-onboarding-title">
          {{ this.step.title }}
        </div>
        <div class="my-tasks-onboarding-text">
          {{ this.step.text }}
        </div>
        <div class="my-tasks-onboarding-actions app-my-tasks-onboarding-actions" style="justify-content: flex-end">
          <div class="my-tasks-onboarding-nav">
            <q-btn
              flat
              dense
              color="primary"
              label="Назад"
              :disable="this.stepIndex === 0"
              @click="$emit('prev')"
            />
            <q-btn
              unelevated
              dense
              color="primary"
              :label="this.isLastStep ? 'Готово' : 'Далее'"
              @click="$emit('next')"
            />
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
// Подсказка обучения страницы «Мои заявки»: затемнение, подсветка элемента и карточка шага (рендерится в body).
// Положение и шаги считает страница (myTasksOnboardingMixin), сюда приходят пропсы; действия уходят событиями.
export default {
  name: 'MyTasksOnboardingOverlay',

  props: {
    active: {type: Boolean, default: false},
    step: {type: Object, default: () => ({})},
    stepIndex: {type: Number, default: 0},
    stepsCount: {type: Number, default: 0},
    isLastStep: {type: Boolean, default: false},
    highlightStyle: {type: Object, default: () => ({})},
    tooltipStyle: {type: Object, default: () => ({})}
  },

  emits: ['skip', 'prev', 'next']
}
</script>

<style scoped>
.my-tasks-onboarding-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
}

.my-tasks-onboarding-highlight {
  position: fixed;
  border: 3px solid var(--q-primary);
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 20px rgba(120, 90, 255, 0.45);
  background: rgba(255, 255, 255, 0.08);
  z-index: 10001;
  pointer-events: none;
  transition: all 0.18s ease;
}

.my-tasks-onboarding-tooltip {
  position: fixed;
  z-index: 10002;
  background: var(--app-surface, #fff);
  color: var(--app-text, #111);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.26);
  padding: 16px;
  pointer-events: auto;
  transition: top 0.18s ease, left 0.18s ease;
}

.my-tasks-onboarding-progress {
  text-align: right;
  color: var(--app-text-muted, #757575);
  font-size: 13px;
  margin-bottom: 4px;
}

.my-tasks-onboarding-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.my-tasks-onboarding-text {
  font-size: 14px;
  line-height: 1.45;
  margin-bottom: 14px;
}

.my-tasks-onboarding-nav {
  display: flex;
  gap: 8px;
}

/* Крестик закрытия обучения в правом верхнем углу карточки */

.my-tasks-onboarding-progress,
.my-tasks-onboarding-title {
  padding-right: 28px;
}
</style>
