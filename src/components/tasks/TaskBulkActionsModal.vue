<template>
  <q-card style="min-width: 440px;min-height: 150px; position: relative" data-tour="tasks-bulk-actions-modal">
    <q-card-section style="display: flex; flex-direction: row; justify-content: space-between">
      <div class="text-h5" data-tour="tasks-bulk-actions-title">{{ this.getHeader }}</div>
      <q-btn
        flat
        round
        dense
        icon="close"
        v-close-popup
      />
    </q-card-section>
    <q-card-section style="margin-bottom: 44px" class="q-pt-none">
      <!--      <div v-if="this.action === 'close'">-->
      <!--        Закрыть заявки ({{ this.store.checkedTasks.length }})?-->
      <!--      </div>-->
      <!--      <div v-if="this.action === 'open'">-->
      <!--        Открыть заявки ({{ this.store.checkedTasks.length }})?-->
      <!--      </div>-->
      <bulk-date-time-field
        v-if="this.action === 'freeze'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksFreezeUntil"
        label="Заморозить до"
      />
      <q-select
        v-if="this.action === 'supportLine'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksSupportLineId"
        :options="this.supportLineOptions"
        emit-value
        map-options
        label="Линия поддержки *"
        :rules="[val => val != null || 'Выберите линию поддержки']"
        style="width: 100%;"
      />
      <q-select
        v-if="this.action === 'executor'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksExecutor"
        :options="this.filteredExecutorOptions"
        label="Исполнитель *"
        :rules="[val => this.isValidExecutorSelection(val) || 'Выберите исполнителя']"
        use-input
        fill-input
        hide-selected
        input-debounce="0"
        style="width: 100%;"
        @filter="this.filterExecutorOptions"
        @input-value="this.updateExecutorInputValue"
        @popup-show="this.clearExecutorFilter"
        @update:model-value="this.onExecutorSelected"
      />
      <q-select
        v-if="this.action === 'status'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksStatus"
        :options="this.store.statuses.map(s => s.name)"
        label="Статус *"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        style="width: 100%;"
      />
      <q-select
        v-if="this.action === 'priority'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksPriority"
        :options="this.store.priorities.map(priority => priority.name)"
        style="width: 100%;"
        label="Приоритет *"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
      />
      <q-select
        v-if="this.action === 'type'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksType"
        :options="this.taskTypeOptions"
        option-label="type"
        style="width: 100%;"
        label="Тип заявки *"
        :rules="[val => this.isValidTaskTypeSelection(val) || 'Выберите тип заявки']"
      />
      <q-select
        v-if="this.action === 'service'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksServiceId"
        :options="this.serviceOptions"
        emit-value
        map-options
        clearable
        style="width: 100%;"
        label="Сервис *"
        :rules="[val => val != null || 'Выберите сервис']"
      />
      <q-select
        v-if="this.action === 'tags'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksTags"
        :options="this.store.tags.map(t => t.name)"
        multiple
        label="Теги"
        use-chips
        use-input
        dense
        style="padding-top: 16px"
      />
      <bulk-date-time-field
        v-if="this.action === 'deadline'"
        data-tour="tasks-bulk-actions-field"
        v-model="this.tasksDeadline"
        label="Дедлайн"
      />
      <div class="text-h7" style="padding-top: 20px" data-tour="tasks-bulk-actions-count">
        {{ this.getDeclension(this.store.checkedTasks.length) }}
      </div>
    </q-card-section>
    <q-card-actions style="position: absolute;bottom: 0;width: 100%" align="right"
                    data-tour="tasks-bulk-actions-buttons">
      <q-btn flat label="Отменить" text-color="primary" v-close-popup/>
      <q-btn label="Применить" color="primary" @click="this.doAction()"/>
    </q-card-actions>
  </q-card>
  <bulk-freeze-dialog
    v-model="this.freezeDialog"
    v-model:freeze-until="this.taskFreezeUntil"
  />
</template>

<script>
import {useStore} from 'stores/store'
import BulkDateTimeField from 'components/tasks/bulk-actions/BulkDateTimeField.vue'
import BulkFreezeDialog from 'components/tasks/bulk-actions/BulkFreezeDialog.vue'
import bulkApplyMixin from 'components/tasks/bulk-actions/bulkApplyMixin'
import bulkExecutorMixin from 'components/tasks/bulk-actions/bulkExecutorMixin'
import bulkStatusMixin from 'components/tasks/bulk-actions/bulkStatusMixin'
import bulkTaskTypeMixin from 'components/tasks/bulk-actions/bulkTaskTypeMixin'
import bulkValuesMixin from 'components/tasks/bulk-actions/bulkValuesMixin'
import {getBulkActionHeader, getDeclension} from 'src/util/taskBulkActions/actionTexts'
import {serviceLabelWithOrganizations} from 'src/util/serviceOrganizations'

// Модалка массового действия над выбранными заявками (закрыть/открыть/заморозить/сменить поле).
// Состояние формы и шаблон — здесь; исполнители — bulkExecutorMixin, типы — bulkTaskTypeMixin,
// статусы и причины — bulkStatusMixin, начальные значения и валидация — bulkValuesMixin,
// применение — bulkApplyMixin.
export default {

  name: 'TaskBulkActionsModal',

  components: {BulkDateTimeField, BulkFreezeDialog},

  mixins: [bulkExecutorMixin, bulkTaskTypeMixin, bulkStatusMixin, bulkValuesMixin, bulkApplyMixin],

  props: {
    action: {type: String, required: true},
    statusChangeReason: {type: String, default: ''},
    requestStatusChangeReason: {type: Function, default: null}
  },

  data: () => ({
    tasksPriority: '',
    tasksFreezeUntil: '',
    tasksSupportLineId: null,
    tasksExecutor: '',
    tasksStatus: '',
    tasksType: null,
    tasksServiceId: null,
    tasksTags: [],
    tasksDeadline: '',
    taskFreezeUntil: '',
    freezeDialog: false
  }),

  methods: {
    getDeclension(count) {
      return getDeclension(count)
    }
  },

  created() {
    this.loadTaskTypes()
    this.initBulkActionValues()
  },

  computed: {
    supportLineOptions () {
      return [...(this.store.supportLines || [])]
        .filter(line => line?.id != null && line.active !== false)
        .sort((a, b) => Number(a.orderNumber || 0) - Number(b.orderNumber || 0))
        .map(line => ({
          value: line.id,
          label: line.name || `Линия ${line.id}`
        }))
    },

    serviceOptions () {
      return (this.store.services || [])
        .filter(service => service?.id != null && service.active !== false)
        .map(service => ({
          value: service.id,
          label: serviceLabelWithOrganizations(service, this.store.services)
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru'))
    },

    getHeader() {
      return getBulkActionHeader(this.action)
    }
  },

  watch: {
    tasksTags: {
      deep: true,
      handler() {
        if (this.tasksTags.length > 1) {
          if (this.tasksTags[0] === 'Смешанные теги') {
            this.tasksTags.splice(0, 1)
          }
        }
      }
    },
    tasksStatus: {
      deep: true,
      handler(newVal, oldVal) {
        const oldName = String(oldVal || '').trim()
        const newName = String(newVal || '').trim()
        if (!newName || oldName.toLowerCase() === newName.toLowerCase()) {
          return
        }
        if (this.isFrozenStatusName(newName)) {
          this.taskFreezeUntil = ''
          this.freezeDialog = true
        }
      }
    }
  },

  setup() {
    const store = useStore()
    return {store}
  }
}
</script>

<style scoped>

</style>
