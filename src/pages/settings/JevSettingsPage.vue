<template>
  <div class="jev-settings q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Jev (ИИ-решения)</div>
        <div class="settings-content-description">
          Jev оценивает данные и возвращает уверенность. Вопросы, условия и действия настраиваются
          в графах автоматизаций. Вероятности и выбранные ветки видны в журнале самой автоматизации.
        </div>
      </div>

      <div class="settings-content-actions">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="query_stats"
          label="Журнал решений"
          @click="decisionLogOpen = true"
        >
          <q-tooltip>Результаты анализа и уверенность Jev</q-tooltip>
        </q-btn>
      </div>
    </div>

    <jev-decision-log v-model="decisionLogOpen"/>

    <q-card flat bordered class="settings-card">
      <q-card-section class="settings-block">
        <div class="text-subtitle1">Настройка автоматизаций</div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Пороги уверенности, правила определения необходимости ответа, исключённые приоритеты
          и параметры детектора инцидентов редактируются в блоке «Настройки сценария» соответствующего графа.
          Условия и действия можно менять в остальных блоках этого же графа.
        </div>
        <q-btn
          flat
          no-caps
          color="primary"
          icon="account_tree"
          label="Открыть автоматизации"
          class="q-mt-sm"
          to="/settings/automatization"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import JevDecisionLog from 'components/jev/JevDecisionLog.vue'

export default {
  name: 'JevSettingsPage',

  components: { JevDecisionLog },

  data () {
    return {
      decisionLogOpen: false
    }
  }
}
</script>

<style scoped>
.jev-settings {
  position: relative;
  width: 100%;
  max-width: 960px;
}

.jev-settings > .settings-content-header {
  margin-bottom: 20px;
}

.settings-card {
  border-radius: 12px;
}
</style>
