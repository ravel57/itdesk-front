<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-lg-5">
      <q-card flat bordered class="routing-card">
        <q-card-section>
          <div class="text-subtitle1 text-weight-medium">Черновик маршрутизации</div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Конструктор формирует выражение и действия для существующего экрана «Автоматизации».
            Отдельная система маршрутов не создаётся.
          </div>
        </q-card-section>

        <q-separator/>

        <q-card-section class="q-gutter-md">
          <q-input v-model="routingForm.name" outlined dense label="Название правила"/>

          <q-select
            v-model="routingForm.trigger"
            :options="routingTriggerOptions"
            outlined
            dense
            emit-value
            map-options
            label="Когда выполнять"
          />

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-5">
              <q-select
                v-model="routingForm.conditionField"
                :options="routingConditionFieldOptions"
                outlined
                dense
                emit-value
                map-options
                label="Поле условия"
              />
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                v-model="routingForm.conditionOperator"
                :options="routingOperatorOptions"
                outlined
                dense
                emit-value
                map-options
                label="Оператор"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-model="routingForm.conditionValue" outlined dense label="Значение"/>
            </div>
          </div>

          <q-select
            v-model="routingForm.targetLineId"
            :options="lineOptions"
            outlined
            dense
            emit-value
            map-options
            label="Целевая линия"
          />

          <q-select
            v-model="routingForm.assignmentStrategy"
            :options="routingAssignmentOptions"
            outlined
            dense
            emit-value
            map-options
            label="После перевода"
          />

          <q-input
            :model-value="routingPreview"
            outlined
            readonly
            autogrow
            type="textarea"
            label="Заготовка для автоматизации"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Очистить" @click="resetRoutingForm"/>
          <q-btn flat color="primary" icon="content_copy" label="Копировать" @click="copyRoutingPreview"/>
          <q-btn color="primary" icon="save" label="Сохранить черновик" @click="saveRoutingDraft"/>
        </q-card-actions>
      </q-card>
    </div>

    <div class="col-12 col-lg-7">
      <q-card flat bordered class="routing-card">
        <q-card-section class="row items-center justify-between">
          <div>
            <div class="text-subtitle1 text-weight-medium">Черновики</div>
            <div class="text-caption text-grey-7">
              Черновики хранятся в браузере и служат подготовкой к созданию реальной автоматизации.
            </div>
          </div>
          <q-btn
            flat
            color="primary"
            icon="account_tree"
            label="Открыть автоматизации"
            @click="openAutomations"
          />
        </q-card-section>

        <q-separator/>

        <q-list v-if="routingDrafts.length" separator>
          <q-item v-for="draft in routingDrafts" :key="draft.id">
            <q-item-section>
              <q-item-label>{{ draft.name || 'Маршрутизация без названия' }}</q-item-label>
              <q-item-label caption>{{ draft.preview }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row no-wrap">
                <q-btn flat round dense icon="edit" @click="editRoutingDraft(draft)"/>
                <q-btn flat round dense icon="delete" color="negative" @click="removeRoutingDraft(draft.id)"/>
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section v-else class="text-center text-grey-7 q-py-xl">
          <q-icon name="alt_route" size="42px" color="grey-5"/>
          <div class="q-mt-sm">Черновиков маршрутизации пока нет</div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import {
  ROUTING_ASSIGNMENT_OPTIONS,
  ROUTING_CONDITION_FIELD_OPTIONS,
  ROUTING_OPERATOR_OPTIONS,
  ROUTING_TRIGGER_OPTIONS
} from 'src/util/settingsSupportLines/supportLineOptions'
import {
  buildRoutingCondition,
  buildRoutingPreview,
  createEmptyRoutingForm,
  readRoutingDrafts,
  writeRoutingDrafts
} from 'src/util/settingsSupportLines/routingDraft'
import {useStore} from 'stores/store'

// Конструктор черновиков маршрутизации (черновики хранятся в localStorage).
export default {
  name: 'SupportLineRoutingPanel',

  data: () => ({
    routingDrafts: [],
    routingForm: {},
    routingTriggerOptions: ROUTING_TRIGGER_OPTIONS,
    routingConditionFieldOptions: ROUTING_CONDITION_FIELD_OPTIONS,
    routingOperatorOptions: ROUTING_OPERATOR_OPTIONS,
    routingAssignmentOptions: ROUTING_ASSIGNMENT_OPTIONS
  }),

  computed: {
    lineOptions() {
      return (this.store.supportLines || [])
        .filter(line => line?.id && line.active !== false)
        .map(line => ({value: line.id, label: line.name}))
    },

    routingPreview() {
      return buildRoutingPreview(this.routingForm)
    }
  },

  created() {
    this.routingForm = this.createEmptyRoutingForm()
    this.loadRoutingDrafts()
  },

  methods: {
    createEmptyRoutingForm,

    buildRoutingCondition() {
      return buildRoutingCondition(this.routingForm)
    },

    resetRoutingForm() {
      this.routingForm = this.createEmptyRoutingForm()
    },

    saveRoutingDraft() {
      const draft = {
        ...this.routingForm,
        id: this.routingForm.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        preview: this.routingPreview
      }
      const index = this.routingDrafts.findIndex(item => item.id === draft.id)
      if (index === -1) this.routingDrafts.push(draft)
      else this.routingDrafts.splice(index, 1, draft)
      this.persistRoutingDrafts()
      this.resetRoutingForm()
      this.$q.notify({
        type: 'positive',
        message: 'Черновик маршрутизации сохранён'
      })
    },

    editRoutingDraft(draft) {
      this.routingForm = {...draft}
    },

    removeRoutingDraft(id) {
      this.routingDrafts = this.routingDrafts.filter(item => item.id !== id)
      this.persistRoutingDrafts()
    },

    loadRoutingDrafts() {
      this.routingDrafts = readRoutingDrafts()
    },

    persistRoutingDrafts() {
      writeRoutingDrafts(this.routingDrafts)
    },

    async copyRoutingPreview() {
      try {
        await navigator.clipboard.writeText(this.routingPreview)
        this.$q.notify({
          type: 'positive',
          message: 'Заготовка скопирована'
        })
      } catch (e) {
        this.$q.notify({
          type: 'negative',
          message: 'Не удалось скопировать заготовку'
        })
      }
    },

    openAutomations() {
      this.$router.push({path: '/settings/automatization', query: {source: 'support-lines'}})
    }
  },

  setup() {
    return {store: useStore()}
  }
}
</script>

<style scoped>
.routing-card {
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
}
</style>
