<template>
  <div class="advanced-node-inspector q-mt-md">
    <template v-if="node.type === 'SWITCH'">
      <q-input v-model="node.config.valueExpression" outlined dense label="Поле, переменная или шаблон"
               hint="Например: task.priority.id или var.severity" @change="changed"/>
      <div v-for="(item, index) in ensureArray('cases')" :key="item.id" class="config-row q-mt-sm">
        <q-input v-model="item.label" outlined dense label="Название ветки" @change="changed"/>
        <q-input v-model="item.value" outlined dense label="Значение" @change="changed"/>
        <q-btn flat round dense icon="close" color="negative" @click="remove('cases', index)"/>
      </div>
      <q-btn outline dense no-caps icon="add" label="Добавить вариант" class="q-mt-md" @click="addSwitchCase"/>
      <q-banner rounded class="bg-blue-1 text-blue-9 q-mt-md">Для каждого значения появится отдельный выход. Выход
        «Иначе» обязателен.
      </q-banner>
    </template>

    <template v-else-if="node.type === 'WAIT_UNTIL'">
      <q-select v-model="node.config.mode" outlined dense label="Ждать до" :options="waitUntilModes" emit-value
                map-options @update:model-value="changed"/>
      <q-input v-if="node.config.mode === 'FIXED'" v-model="node.config.dateTime" outlined dense type="datetime-local"
               label="Дата и время" class="q-mt-md" @change="changed"/>
      <template v-else-if="node.config.mode === 'DURATION'">
        <div class="row q-col-gutter-sm q-mt-sm">
          <q-input v-model.number="node.config.amount" outlined dense type="number" min="1" label="Длительность"
                   class="col-7" @change="changed"/>
          <q-select v-model="node.config.unit" outlined dense label="Единица" :options="delayUnits" emit-value
                    map-options class="col-5" @update:model-value="changed"/>
        </div>
      </template>
      <q-input v-else-if="node.config.mode === 'TASK_DEADLINE_MINUS'" v-model.number="node.config.minutesBefore"
               outlined dense type="number" min="0" label="Минут до дедлайна" class="q-mt-md" @change="changed"/>
      <q-banner rounded class="bg-amber-1 text-amber-10 q-mt-md">Цепочка сохраняется в базе и продолжится в рассчитанный
        момент.
      </q-banner>
    </template>

    <template v-else-if="node.type === 'WAIT_EVENT' || node.type === 'WAIT_TASK'">
      <q-select v-model="node.config.eventType" outlined dense label="Ожидаемое событие" :options="triggerTypeOptions"
                emit-value map-options @update:model-value="changed"/>
      <q-select v-if="node.type === 'WAIT_EVENT'" v-model="node.config.scope" outlined dense label="Связать событие"
                :options="waitScopes" emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <q-input v-else v-model="node.config.taskIdExpression" outlined dense label="ID заявки или переменная"
               hint="task.id, var.createdTaskId или число" class="q-mt-md" @change="changed"/>
      <q-input v-model="node.config.filterExpression" outlined dense autogrow type="textarea"
               label="Дополнительное условие события" hint="Пусто — принять первое подходящее событие" class="q-mt-md"
               @change="changed"/>
      <div class="row q-col-gutter-sm q-mt-sm">
        <q-input v-model.number="node.config.timeoutAmount" outlined dense type="number" min="1" label="Таймаут"
                 class="col-7" @change="changed"/>
        <q-select v-model="node.config.timeoutUnit" outlined dense label="Единица" :options="delayUnits" emit-value
                  map-options class="col-5" @update:model-value="changed"/>
      </div>
    </template>

    <template v-else-if="node.type === 'APPROVAL'">
      <q-input v-model="node.config.title" outlined dense label="Заголовок решения" @change="changed"/>
      <q-input v-model="node.config.message" outlined dense autogrow type="textarea" label="Описание" class="q-mt-md"
               @change="changed"/>
      <q-select v-model="node.config.approverUserId" outlined dense clearable label="Ответственный пользователь"
                :options="userOptions" emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <div class="row q-col-gutter-sm q-mt-sm">
        <q-input v-model.number="node.config.timeoutAmount" outlined dense type="number" min="1" label="Таймаут"
                 class="col-7" @change="changed"/>
        <q-select v-model="node.config.timeoutUnit" outlined dense label="Единица" :options="delayUnits" emit-value
                  map-options class="col-5" @update:model-value="changed"/>
      </div>
      <q-banner rounded class="bg-purple-1 text-purple-9 q-mt-md">Запуск появится в списке ожиданий. Его можно одобрить
        или отклонить через API автоматизаций.
      </q-banner>
    </template>

    <template v-else-if="node.type === 'SUBFLOW'">
      <q-select v-model="node.config.triggerId" outlined dense label="Автоматизация" :options="triggerOptions"
                emit-value map-options @update:model-value="changed"/>
      <q-select v-model="node.config.mode" outlined dense label="Режим запуска" :options="subflowModes" emit-value
                map-options class="q-mt-md" @update:model-value="changed"/>
      <q-banner rounded class="bg-blue-1 text-blue-9 q-mt-md">Встроенный режим подходит для цепочек без ожиданий.
        Асинхронный запускает подпроцесс отдельно.
      </q-banner>
    </template>

    <template v-else-if="node.type === 'FORK'">
      <q-select v-model="node.config.joinNodeId" outlined dense clearable label="Узел объединения"
                :options="joinNodeOptions" emit-value map-options @update:model-value="changed"/>
      <div v-for="(branch, index) in ensureArray('branches')" :key="branch.id" class="config-row q-mt-sm">
        <q-input v-model="branch.label" outlined dense label="Название ветки" @change="changed"/>
        <q-btn flat round dense icon="close" color="negative" :disable="node.config.branches.length <= 2"
               @click="remove('branches', index)"/>
      </div>
      <q-btn outline dense no-caps icon="add" label="Добавить ветку" class="q-mt-md" @click="addForkBranch"/>
      <q-banner rounded class="bg-orange-1 text-orange-10 q-mt-md">Ветки выполняются независимо до выбранного JOIN.
        Ожидания внутри FORK не допускаются.
      </q-banner>
    </template>

    <template v-else-if="node.type === 'JOIN'">
      <q-input v-model="node.config.description" outlined dense label="Описание объединения" @change="changed"/>
      <q-banner rounded class="bg-blue-grey-1 text-blue-grey-9 q-mt-md">Продолжение запускается один раз после
        завершения всех веток связанного FORK.
      </q-banner>
    </template>

    <template v-else-if="node.type === 'HTTP_REQUEST'">
      <div class="row q-col-gutter-sm">
        <q-select v-model="node.config.method" outlined dense label="Метод" :options="httpMethods" class="col-4"
                  @update:model-value="changed"/>
        <q-input v-model="node.config.url" outlined dense label="URL" class="col-8" @change="changed"/>
      </div>
      <q-input v-model="node.config.headersText" outlined dense autogrow type="textarea" label="Заголовки JSON"
               class="q-mt-md" @change="changed"/>
      <q-input v-model="node.config.body" outlined dense autogrow type="textarea" label="Тело запроса"
               hint="Можно использовать {{task.id}} и {{var.name}}" class="q-mt-md" @change="changed"/>
      <div class="row q-col-gutter-sm q-mt-sm">
        <q-input v-model.number="node.config.timeoutSeconds" outlined dense type="number" min="1" max="120"
                 label="Таймаут, сек." class="col-5" @change="changed"/>
        <q-input v-model="node.config.resultVariable" outlined dense label="Переменная результата" class="col-7"
                 @change="changed"/>
      </div>
    </template>

    <template v-else-if="node.type === 'SET_VARIABLE' || node.type === 'EXPRESSION'">
      <q-input v-model="node.config.name" outlined dense label="Имя переменной" prefix="var." @change="changed"/>
      <q-input v-model="node.config.expression" outlined dense autogrow type="textarea"
               :label="node.type === 'EXPRESSION' ? 'Формула или шаблон' : 'Значение, путь или шаблон'" class="q-mt-md"
               @change="changed"/>
      <q-banner rounded class="bg-blue-1 text-blue-9 q-mt-md">Доступны пути task.*, client.*, message.*, var.* и шаблоны
        вида {{ task.id }}.
      </q-banner>
    </template>

    <template v-else-if="node.type === 'COUNTER'">
      <q-input v-model="node.config.name" outlined dense label="Имя счётчика" prefix="var." @change="changed"/>
      <q-select v-model="node.config.operation" outlined dense label="Операция" :options="counterOperations" emit-value
                map-options class="q-mt-md" @update:model-value="changed"/>
      <q-input v-model="node.config.amountExpression" outlined dense label="Значение" hint="Число, путь или var.*"
               class="q-mt-md" @change="changed"/>
    </template>

    <template v-else-if="node.type === 'ERROR_HANDLER' || node.type === 'RETRY'">
      <q-input v-model="node.config.actionScript" outlined dense autogrow type="textarea" label="Сценарий действий"
               @change="changed"/>
      <template v-if="node.type === 'RETRY'">
        <q-input v-model.number="node.config.maxAttempts" outlined dense type="number" min="1" max="20"
                 label="Максимум попыток" class="q-mt-md" @change="changed"/>
        <div class="row q-col-gutter-sm q-mt-sm">
          <q-input v-model.number="node.config.delayAmount" outlined dense type="number" min="1"
                   label="Начальная задержка" class="col-7" @change="changed"/>
          <q-select v-model="node.config.delayUnit" outlined dense label="Единица" :options="delayUnits" emit-value
                    map-options class="col-5" @update:model-value="changed"/>
        </div>
        <q-input v-model.number="node.config.multiplier" outlined dense type="number" min="1" max="10" step="0.5"
                 label="Множитель задержки" class="q-mt-md" @change="changed"/>
      </template>
    </template>

    <template v-else-if="node.type === 'ESCALATE'">
      <q-select v-model="node.config.supportLineId" outlined dense label="Новая линия" :options="supportLineOptions"
                emit-value map-options @update:model-value="changed"/>
      <q-select v-model="node.config.priorityName" outlined dense clearable label="Новый приоритет"
                :options="priorityNameOptions" emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <q-toggle v-model="node.config.clearAssignee" label="Очистить исполнителя" class="q-mt-md"
                @update:model-value="changed"/>
      <q-select v-model="node.config.notifyUserId" outlined dense clearable label="Уведомить пользователя"
                :options="userOptions" emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <q-input v-model="node.config.reason" outlined dense autogrow type="textarea" label="Причина / сообщение"
               class="q-mt-md" @change="changed"/>
    </template>

    <template v-else-if="node.type === 'CREATE_TASK'">
      <q-input v-model="node.config.title" outlined dense label="Название заявки" hint="Поддерживаются {{...}}"
               @change="changed"/>
      <q-input v-model="node.config.description" outlined dense autogrow type="textarea" label="Описание"
               class="q-mt-md" @change="changed"/>
      <q-select v-model="node.config.typeId" outlined dense clearable label="Тип" :options="taskTypeOptions" emit-value
                map-options class="q-mt-md" @update:model-value="changed"/>
      <q-select v-model="node.config.priorityName" outlined dense clearable label="Приоритет"
                :options="priorityNameOptions" emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <q-select v-model="node.config.supportLineId" outlined dense clearable label="Линия" :options="supportLineOptions"
                emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <q-input v-model="node.config.resultVariable" outlined dense label="Сохранить ID в переменную" prefix="var."
               class="q-mt-md" @change="changed"/>
    </template>

    <template v-else-if="node.type === 'NOTIFY'">
      <q-select v-model="node.config.channel" outlined dense label="Канал" :options="notifyChannels" emit-value
                map-options @update:model-value="changed"/>
      <q-select v-if="node.config.channel === 'USER'" v-model="node.config.userId" outlined dense label="Пользователь"
                :options="userOptions" emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <q-input v-model="node.config.text" outlined dense autogrow type="textarea" label="Сообщение"
               hint="Поддерживаются {{task.id}} и {{var.name}}" class="q-mt-md" @change="changed"/>
    </template>

    <template v-else-if="node.type === 'BUSINESS_HOURS'">
      <q-banner rounded class="bg-blue-1 text-blue-9">Узел использует рабочий график и часовой пояс из общих настроек.
      </q-banner>
    </template>

    <template v-else-if="node.type === 'THROTTLE'">
      <q-select v-model="node.config.scope" outlined dense label="Ключ ограничения" :options="throttleScopes" emit-value
                map-options @update:model-value="changed"/>
      <q-input v-if="node.config.scope === 'CUSTOM'" v-model="node.config.customKey" outlined dense label="Шаблон ключа"
               class="q-mt-md" @change="changed"/>
      <div class="row q-col-gutter-sm q-mt-sm">
        <q-input v-model.number="node.config.amount" outlined dense type="number" min="1" label="Не чаще чем раз в"
                 class="col-7" @change="changed"/>
        <q-select v-model="node.config.unit" outlined dense label="Единица" :options="delayUnits" emit-value map-options
                  class="col-5" @update:model-value="changed"/>
      </div>
    </template>

    <template v-else-if="node.type === 'DEDUPLICATE'">
      <q-input v-model.number="node.config.windowMinutes" outlined dense type="number" min="1"
               label="Искать за последние, минут" @change="changed"/>
      <q-select v-model="node.config.typeId" outlined dense clearable label="Тип заявки" :options="taskTypeOptions"
                emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <q-select v-model="node.config.titleMode" outlined dense label="Сравнение названия" :options="dedupeTitleModes"
                emit-value map-options class="q-mt-md" @update:model-value="changed"/>
      <q-input v-model="node.config.title" outlined dense label="Название / шаблон" class="q-mt-md" @change="changed"/>
      <q-input v-model="node.config.resultVariable" outlined dense label="ID найденного дубля" prefix="var."
               class="q-mt-md" @change="changed"/>
    </template>
  </div>
</template>

<script>
import {nextFlowId} from 'src/util/automationFlow'

const EVENT_LABELS = {
  TASK_CREATED: 'Заявка создана', TASK_UPDATED: 'Заявка изменена', TASK_STATUS_CHANGED: 'Изменён статус',
  TASK_PRIORITY_CHANGED: 'Изменён приоритет', TASK_TYPE_CHANGED: 'Изменён тип заявки',
  TASK_ASSIGNEE_CHANGED: 'Изменён исполнитель',
  TASK_GROUP_CHANGED: 'Изменена линия', TASK_TAG_ADDED: 'Добавлен тег', TASK_TAG_REMOVED: 'Удалён тег',
  TASK_CLOSED: 'Заявка закрыта', TASK_REOPENED: 'Заявка возвращена', SLA_WARNING: 'Предупреждение SLA',
  SLA_BREACHED: 'SLA нарушен', MESSAGE_INCOMING: 'Входящее сообщение', MESSAGE_OUTGOING: 'Исходящее сообщение'
}

export default {
  name: 'AutomationAdvancedNodeInspector',
  props: {
    node: {type: Object, required: true},
    flow: {type: Object, required: true},
    triggerTypes: {type: Array, default: () => []},
    triggers: {type: Array, default: () => []},
    taskTypes: {type: Array, default: () => []},
    priorities: {type: Array, default: () => []},
    supportLines: {type: Array, default: () => []},
    users: {type: Array, default: () => []}
  },
  emits: ['change'],
  data: () => ({
    delayUnits: [
      {label: 'сек.', value: 'SECONDS'}, {label: 'мин.', value: 'MINUTES'},
      {label: 'ч.', value: 'HOURS'}, {label: 'дн.', value: 'DAYS'}
    ],
    waitUntilModes: [
      {label: 'Через интервал', value: 'DURATION'}, {label: 'Конкретная дата и время', value: 'FIXED'},
      {label: 'Дедлайн заявки', value: 'TASK_DEADLINE'}, {
        label: 'За N минут до дедлайна',
        value: 'TASK_DEADLINE_MINUS'
      },
      {label: 'Начало следующего рабочего дня', value: 'NEXT_WORKDAY'}
    ],
    waitScopes: [
      {label: 'Та же заявка', value: 'TASK'}, {label: 'Тот же клиент', value: 'CLIENT'}, {
        label: 'Любой объект',
        value: 'GLOBAL'
      }
    ],
    subflowModes: [
      {label: 'Выполнить внутри текущей цепочки', value: 'INLINE'}, {label: 'Запустить отдельно', value: 'ASYNC'}
    ],
    httpMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    counterOperations: [
      {label: 'Увеличить', value: 'ADD'}, {label: 'Уменьшить', value: 'SUBTRACT'}, {label: 'Установить', value: 'SET'}
    ],
    notifyChannels: [
      {label: 'Сообщение клиенту', value: 'CLIENT'}, {
        label: 'Уведомление пользователю',
        value: 'USER'
      }, {label: 'Запись в журнал', value: 'LOG'}
    ],
    throttleScopes: [
      {label: 'По заявке', value: 'TASK'}, {label: 'По клиенту', value: 'CLIENT'},
      {label: 'На всю автоматизацию', value: 'GLOBAL'}, {label: 'Свой ключ', value: 'CUSTOM'}
    ],
    dedupeTitleModes: [
      {label: 'Не сравнивать', value: 'NONE'}, {label: 'Точное совпадение', value: 'EXACT'},
      {label: 'Содержит текст', value: 'CONTAINS'}, {label: 'Название текущей заявки', value: 'CURRENT'}
    ]
  }),
  computed: {
    triggerTypeOptions() {
      return (this.triggerTypes || []).map(value => ({value, label: EVENT_LABELS[value] || value}))
    },
    triggerOptions() {
      return (this.triggers || []).filter(item => item?.id).map(item => ({
        value: item.id,
        label: item.name || `Автоматизация ${item.id}`
      }))
    },
    userOptions() {
      return (this.users || []).filter(item => item?.id).map(item => ({
        value: item.id,
        label: `${item.lastname || ''} ${item.firstname || ''}`.trim() || item.username || `Пользователь ${item.id}`
      }))
    },
    taskTypeOptions() {
      return (this.taskTypes || []).filter(item => item?.id).map(item => ({
        value: item.id,
        label: item.type || item.name || `Тип ${item.id}`
      }))
    },
    priorityNameOptions() {
      return (this.priorities || []).filter(item => item?.name).map(item => ({value: item.name, label: item.name}))
    },
    supportLineOptions() {
      return (this.supportLines || []).filter(item => item?.id && item.active !== false).map(item => ({
        value: item.id,
        label: item.name
      }))
    },
    joinNodeOptions() {
      return (this.flow?.nodes || []).filter(item => item.type === 'JOIN').map(item => ({
        value: item.id,
        label: item.label || item.id
      }))
    }
  },
  methods: {
    changed() {
      this.$emit('change')
    },
    ensureArray(key) {
      if (!Array.isArray(this.node.config[key])) this.node.config[key] = []
      return this.node.config[key]
    },
    remove(key, index) {
      this.ensureArray(key).splice(index, 1)
      this.changed()
    },
    addSwitchCase() {
      this.ensureArray('cases').push({
        id: nextFlowId('case'),
        label: `Вариант ${this.node.config.cases.length + 1}`,
        value: ''
      })
      this.changed()
    },
    addForkBranch() {
      this.ensureArray('branches').push({
        id: nextFlowId('branch'),
        label: `Ветка ${this.node.config.branches.length + 1}`
      })
      this.changed()
    }
  }
}
</script>

<style scoped>
.config-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 34px;
  gap: 8px;
  align-items: end;
}
</style>
