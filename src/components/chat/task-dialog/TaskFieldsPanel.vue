<template>
  <q-card
    class="no-border-card"
  >
    <q-card-section
      class="no-padding"
      data-tour="task-dialog-fields"
    >
      <q-input
        id="task-name"
        v-model="this.nameModel"
        :readonly="this.isObserverReadOnly"
        ref="taskName"
        label="Название *"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
      />
      <q-select
        id="task-type"
        v-model="this.typeModel"
        :readonly="this.isObserverReadOnly"
        :options="this.filteredTaskTypes"
        label="Тип *"
        use-input
        input-debounce="0"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
        @filter="(val, update) => this.$emit('filter-task-types', val, update)"
        @update:model-value="this.$emit('task-type-changed')"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              Типы заявок не найдены
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <div
        v-if="this.selectedTaskTypeChecklist.length > 0 && !this.isNewTask"
        class="task-type-checklist-hint"
      >
        <div>
          Стандартный чек-лист: {{ this.checklistLabel }}
        </div>

        <q-btn
          v-if="!this.isObserverReadOnly"
          flat
          dense
          color="primary"
          label="Применить"
          @click="this.$emit('open-apply-type-checklist')"
        />
      </div>
      <div
        id="task-controls"
        data-tour="task-dialog-status-controls"
        class="flex"
        style="display: flex;flex-wrap: nowrap;align-items: center;max-height: 40px"
      >
        <q-select
          id="task-status"
          dense
          outlined
          v-model="this.statusModel"
          :readonly="this.isObserverReadOnly"
          :options="this.isNewTask ? this.store.statuses.filter(s => s.name !== 'Закрыта' && s.name !== 'Заморожена').map(s => s.name) : this.store.statuses.map(s => s.name)"
          label="Статус *"
          :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
          style="width: 100%;padding: 0;"
          :style="this.getBackgroundColor(this.status)"
        />
        <q-btn
          v-if="!this.isNewTask && !this.dialogTaskComplete && $can('TASK_EDIT')"
          dense
          outline
          label="Закрыть заявку"
          color="white"
          text-color="primary"
          style="font-size: 14px;height: 40px;width: 100%; margin-left: 8px"
          @click="this.$emit('close-task')"
        />
        <q-btn
          v-if="this.dialogTaskComplete && $can('TASK_EDIT')"
          dense
          outline
          label="Вернуть в работу"
          color="white"
          text-color="primary"
          style="font-size: 14px;height: 40px;width: 100%;margin-left: 8px;"
          @click="this.$emit('reopen-task')"
        />
        <div id="unfreeze-task-btn">
          <q-btn
            v-if="!this.isNewTask && !this.dialogTaskComplete && $can('TASK_EDIT') && this.task.frozen"
            dense
            outline
            icon="ac_unit"
            text-color="primary"
            style="margin-left: 8px;position: relative;height: 40px;width: 40px"
            @click="this.$emit('unfreeze')"
          >
            <q-tooltip>
              {{
                this.task.frozenUntil ? `Заморожено до ${this.getStamp(this.task.frozenUntil)}` : 'Заявка заморожена'
              }}
            </q-tooltip>
            <q-circular-progress
              v-if="this.task.frozen"
              :value="this.getPercentFrozenTask(this.task.frozenFrom, this.task.frozenUntil)"
              reverse
              size="32px"
              style="
            position: absolute;
            font-size: 32px;
            margin: 0;
          "
              :thickness="0.22"
              color="primary"
              track-color="grey-3"
            />
          </q-btn>
        </div>
        <div id="freeze-task-btn">
          <q-btn
            v-if="!this.isNewTask && !this.dialogTaskComplete && $can('TASK_EDIT') && !this.task.frozen"
            dense
            outline
            icon="ac_unit"
            style="height: 40px;width: 40px;margin-left: 8px"
            text-color="gray"
            @click="this.$emit('freeze')"
          >
            <q-tooltip>Заморозить заявку</q-tooltip>
          </q-btn>
        </div>
      </div>
      <q-input
        id="task-description"
        type="textarea"
        rows="1"
        v-model="this.descriptionModel"
        :readonly="this.isObserverReadOnly"
        label="Описание"
      />
      <q-select
        id="task-priority"
        v-model="this.priorityModel"
        :readonly="this.isObserverReadOnly"
        :options="this.store.priorities.map(priority => priority.name)"
        label="Приоритет *"
        :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
      />
      <q-select
        id="task-support-line"
        v-model="this.supportLineModel"
        :readonly="this.isObserverReadOnly"
        :options="this.activeSupportLineNames"
        label="Линия поддержки"
        @update:model-value="this.$emit('support-line-changed')"
      />
      <q-select
        id="task-executor"
        v-model="this.executorModel"
        :readonly="this.isObserverReadOnly"
        :options="this.filteredUsers"
        :label="this.isClosingDialogTask() ? 'Исполнитель *' : 'Исполнитель'"
        :rules="[val => !this.isClosingDialogTask() || (val && val.length > 0) || 'Исполнитель обязателен при закрытии']"
        :hint="this.isObserverReadOnly ? '' : this.executorSelectionHint"
        :disable="!this.isObserverReadOnly && this.executorSelectDisabled"
        clearable
        use-input
        input-debounce="0"
        :virtual-scroll-slice-size="Math.max(this.filteredUsers.length, 30)"
        popup-content-style="max-height: 60vh"
        @filter="(val, update) => this.$emit('filter-users', val, update)"
      >
        <template #no-option>
          <q-item>
            <q-item-section class="text-grey">
              В выбранной линии нет активных участников
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <task-ola-banner
        :task="this.task"
        :selected-support-line="this.selectedSupportLine"
      />
      <q-select
        id="task-tags"
        v-model="this.tagsModel"
        :readonly="this.isObserverReadOnly"
        :options="this.filteredTags"
        multiple
        label="Теги"
        use-chips
        use-input
        @filter="(val, update) => this.$emit('filter-tags', val, update)"
      />
      <q-input
        id="task-deadline"
        v-model="this.deadlineModel"
        :readonly="this.isObserverReadOnly"
        :clearable="!this.isObserverReadOnly"
        label="Дедлайн"
        @input="this.$emit('deadline-input')"
        mask="##.##.#### ##:##"
      >
        <template
          v-if="!this.isObserverReadOnly"
          v-slot:append
        >
          <q-icon
            name="event"
            class="cursor-pointer"
          >
            <q-popup-proxy
              ref="qDateDeadlinePopup"
              cover
              transition-show="scale"
              transition-hide="scale"
            >
              <q-date
                v-model="this.deadlineModel"
                first-day-of-week="1"
                locale="ru"
                today-btn
                @update:model-value="this.$refs.qDateDeadlinePopup.hide()"
                :options="this.dateOption"
                mask="DD.MM.YYYY HH:mm"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
      <q-select
        id="task-service"
        v-model="this.serviceModel"
        :readonly="this.isObserverReadOnly"
        :options="this.availableServiceLabels"
        label="Сервис"
        clearable
        use-input
        input-debounce="0"
        @update:model-value="this.$emit('task-service-changed')"
      >
        <template #no-option>
          <q-item><q-item-section class="text-grey">Для организации нет доступных сервисов</q-item-section></q-item>
        </template>
      </q-select>
    </q-card-section>
  </q-card>
</template>

<script>
import { useStore } from 'stores/store'
import TaskOlaBanner from './TaskOlaBanner.vue'
import { dateOption } from './dateOption'

// v-model для поля: читает проп, при записи эмитит update:<проп>
const fieldModel = prop => ({
  get () {
    return this[prop]
  },
  set (value) {
    this.$emit(`update:${prop}`, value)
  }
})

// Левая панель диалога заявки: поля заявки, быстрые действия над статусом, OLA-баннер.
// Компонент только отображает: все изменения состояния и логика остаются в TaskDialog (через update:* и события).
export default {
  components: { TaskOlaBanner },

  props: {
    task: { type: Object, default: null },
    isNewTask: { type: Boolean, default: false },
    isObserverReadOnly: { type: Boolean, default: false },
    dialogTaskComplete: { type: Boolean, default: false },

    // Значения полей (v-model:name, v-model:type, ...)
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    status: { type: String, default: '' },
    description: { type: String, default: '' },
    priority: { type: String, default: '' },
    supportLine: { type: String, default: '' },
    executor: { type: String, default: '' },
    tags: { type: Array, default: () => [] },
    deadline: { type: String, default: '' },
    service: { type: String, default: '' },

    // Данные для списков
    filteredTaskTypes: { type: Array, default: () => [] },
    filteredUsers: { type: Array, default: () => [] },
    filteredTags: { type: Array, default: () => [] },
    activeSupportLineNames: { type: Array, default: () => [] },
    availableServiceLabels: { type: Array, default: () => [] },
    selectedTaskTypeChecklist: { type: Array, default: () => [] },
    // Подпись «N пунктов» для подсказки о стандартном чек-листе типа
    checklistLabel: { type: String, default: '' },
    executorSelectionHint: { type: String, default: '' },
    executorSelectDisabled: { type: Boolean, default: false },
    selectedSupportLine: { type: Object, default: null },
    // Функция из TaskDialog: идёт ли сейчас закрытие заявки (читает актуальное состояние родителя)
    isClosingDialogTask: { type: Function, required: true }
  },

  emits: [
    'update:name',
    'update:type',
    'update:status',
    'update:description',
    'update:priority',
    'update:supportLine',
    'update:executor',
    'update:tags',
    'update:deadline',
    'update:service',
    'filter-task-types',
    'task-type-changed',
    'open-apply-type-checklist',
    'close-task',
    'reopen-task',
    'unfreeze',
    'freeze',
    'support-line-changed',
    'filter-users',
    'filter-tags',
    'deadline-input',
    'task-service-changed'
  ],

  computed: {
    nameModel: fieldModel('name'),
    typeModel: fieldModel('type'),
    statusModel: fieldModel('status'),
    descriptionModel: fieldModel('description'),
    priorityModel: fieldModel('priority'),
    supportLineModel: fieldModel('supportLine'),
    executorModel: fieldModel('executor'),
    tagsModel: fieldModel('tags'),
    deadlineModel: fieldModel('deadline'),
    serviceModel: fieldModel('service')
  },

  methods: {
    dateOption,

    focusName () {
      this.$refs.taskName?.focus?.()
    },

    getPercentFrozenTask (date, endDate) {
      if (!date || !endDate) {
        return 0
      }
      const startDate = new Date(date).getTime()
      const targetDate = new Date(endDate).getTime()
      const now = new Date().getTime()
      if (Number.isNaN(startDate) || Number.isNaN(targetDate) || targetDate <= startDate) {
        return 0
      }
      const totalInterval = targetDate - startDate
      const timePassed = now - startDate
      return Math.max(0, Math.min(100, 100 - ((timePassed / totalInterval) * 100)))
    },

    getStamp (value) {
      if (!value) {
        return ''
      }
      const date = value instanceof Date ? value : new Date(value)
      if (Number.isNaN(date.getTime())) {
        return ''
      }
      return date.toLocaleTimeString('ru-RU', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getBackgroundColor (statusLabel) {
      const status = this.store.statuses.find(status => status.name === statusLabel)
      if (!status) {
        return ''
      }
      switch (status.name) {
        case 'Закрыта': {
          return 'background-color: rgba(16, 181, 92, 0.2);'
        }
        case 'Заморожена': {
          return 'background-color: #32ade633;'
        }
        default: {
          return `background-color: ${this.generateStatusColor(status.orderNumber)};`
        }
      }
    },

    generateStatusColor (index) {
      const adjustedIndex = Math.abs(index)

      function generateHSLAColor (hue) {
        return `hsla(${hue}, 70%, 50%, 0.2)`
      }

      function isGreenOrBlue (hue) {
        return (hue >= 120 && hue <= 240)
      }

      let hue = (adjustedIndex * 30) % 360
      while (isGreenOrBlue(hue)) {
        hue = (hue + 60) % 360
      }
      return generateHSLAColor(hue)
    },
  },

  setup () {
    const store = useStore()
    return {
      store
    }
  }
}
</script>

<style scoped>
.no-border-card {
  border: none;
  box-shadow: none;
}

.task-type-checklist-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: -8px;
  margin-bottom: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(98, 0, 238, 0.06);
  color: #5f6368;
  font-size: 13px;
}
</style>
