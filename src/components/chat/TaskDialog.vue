<template>
  <q-dialog
    v-model="getPossibilityToOpenDialogTask"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card
      data-tour="task-dialog-card"
      :class="[
        'task-dialog-card',
        this.isMobile || !['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) || this.isNewTask
          ? 'dialog-width'
          : 'large-dialog-width'
  ]"
    >
      <q-toolbar class="justify-between">
        <!--FIXME-->
        <div v-if="this.isNewTask" class="text-h6" data-tour="task-dialog-title">Новая заявка</div>
        <div v-else class="text-h6" data-tour="task-dialog-title">Заявка № {{ this.task.id }}</div>
        <div class="">
          <q-btn
            flat
            round
            dense
            icon="help_outline"
            data-tour="task-dialog-help"
            @click="this.startTaskDialogOnboarding(true)"
          >
            <q-tooltip>
              Обучение по заявке
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="!(this.$route.path.includes('chats'))"
            data-tour="task-dialog-open-chat"
            flat
            round
            dense
            icon="open_in_new"
            @click="this.$router.push({ path: `/chats/${this.client.id}` })"
          >
            <q-tooltip>
              Перейти в чат с {{ this.getClientName }}
            </q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            dense
            icon="close"
            @click="this.openSubmitModal"
            v-close-popup
          />
        </div>
      </q-toolbar>
      <q-card-section
        class="task-dialog-body"
        style="padding: 0 16px"
      >
        <div
          v-if="this.isMobile && !this.isNewTask"
          class="sticky-tabs"
        >
          <q-tabs
            v-model="dialogTab"
            dense
            align="justify"
            class="bg-white text-grey no-padding"
            :breakpoint="0"
          >
            <q-tab
              name="tab1"
              icon="info"
            />
            <q-tab
              name="tab2"
              icon="forum"
            />
          </q-tabs>
        </div>
        <div
          :class="this.isMobile || this.isNewTask ? '' : 'flex-container'"
        >
          <div
            v-if="(!this.isMobile || this.dialogTab === 'tab1')"
            class="flex-item task-left-panel"
          >
            <q-card
              class="no-border-card"
            >
              <q-card-section
                class="no-padding"
              >
                <q-input
                  id="task-name"
                  data-tour="task-dialog-name"
                  v-model="this.dialogTaskName"
                  ref="taskName"
                  label="Название *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <q-select
                  id="task-type"
                  data-tour="task-dialog-type"
                  v-model="this.dialogTaskType"
                  :options="this.taskTypes.map(t => t.type)"
                  label="Тип *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                  @update:model-value="this.onTaskTypeChanged"
                />
                <div
                  v-if="this.selectedTaskTypeChecklist.length > 0"
                  class="task-type-checklist-hint"
                >
                  <div>
                    Стандартный чек-лист: {{ this.getChecklistItemsLabel(this.selectedTaskTypeChecklist) }}
                  </div>

                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    label="Применить"
                    @click="this.openApplyTypeChecklistDialog"
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
                    v-model="this.dialogTaskStatus"
                    :options="this.isNewTask ? this.store.statuses.filter(s => s.name !== 'Закрыта' && s.name !== 'Заморожена').map(s => s.name) : this.store.statuses.map(s => s.name)"
                    label="Статус *"
                    :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                    style="width: 100%;padding: 0;"
                    :style="this.getBackgroundColor(this.dialogTaskStatus)"
                  />
                  <q-btn
                    v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
                    dense
                    outline
                    no-caps
                    label="Закрыть заявку"
                    color="white"
                    text-color="primary"
                    style="font-size: 14px;height: 40px;width: 100%; margin-left: 8px"
                    @click="this.setTaskCompleted(this.task)"
                  />
                  <q-btn
                    v-if="this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])"
                    dense
                    outline
                    no-caps
                    label="Вернуть в работу"
                    color="white"
                    text-color="primary"
                    style="font-size: 14px;height: 40px;width: 100%;margin-left: 8px;"
                    @click="this.setTaskNotCompleted(this.task)"
                  />
                  <div id="unfreeze-task-btn">
                    <q-btn
                      v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && this.task.frozen"
                      dense
                      outline
                      icon="ac_unit"
                      text-color="primary"
                      style="margin-left: 8px;position: relative;height: 40px;width: 40px"
                      @click="this.changeTaskFrozen()"
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
                      v-if="!this.isNewTask && !this.dialogTaskComplete && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && !this.task.frozen"
                      dense
                      outline
                      icon="ac_unit"
                      style="height: 40px;width: 40px;margin-left: 8px"
                      text-color="gray"
                      @click="this.openFreezeDialog"
                    >
                      <q-tooltip>Заморозить заявку</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <q-input
                  id="task-description"
                  data-tour="task-dialog-description"
                  type="textarea"
                  v-model="this.dialogTaskDescription"
                  label="Описание"
                />
                <q-select
                  id="task-priority"
                  data-tour="task-dialog-priority"
                  v-model="this.dialogTaskPriority"
                  :options="this.store.priorities.map(priority => priority.name)"
                  label="Приоритет *"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                />
                <q-select
                  id="task-executor"
                  data-tour="task-dialog-executor"
                  v-model="this.dialogTaskExecutor"
                  :options="this.filteredUsers"
                  label="Исполнитель"
                  use-input
                  @filter="filterUsers"
                />
                <q-select
                  id="task-tags"
                  data-tour="task-dialog-tags"
                  style="padding-top: 16px"
                  class="custom-select"
                  v-model="this.dialogTaskTags"
                  :options="this.filteredTags"
                  multiple
                  label="Теги"
                  use-chips
                  use-input
                  dense
                  @filter="filterTags"
                />
                <q-input
                  id="task-deadline"
                  data-tour="task-dialog-deadline"
                  v-model="this.dialogTaskDeadline"
                  clearable
                  label="Дедлайн"
                  @input="formatDateTime"
                  mask="##.##.#### ##:##"
                >
                  <template
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
                          v-model="this.dialogTaskDeadline"
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
              </q-card-section>
            </q-card>
          </div>
          <div
            v-if="(!this.isMobile || this.dialogTab === 'tab2') && ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0]) && !this.isNewTask"
            id="chat-section"
            data-tour="task-dialog-right-panel"
            class="flex-item task-right-panel"
            style="border: 1px solid #0000001f;overflow: hidden;border-radius: 16px"
            :style="this.isMobile ? 'height: 541px' : ''"
          >
            <q-tabs
              v-model="taskRightTab"
              dense
              align="left"
              active-color="primary"
              indicator-color="primary"
              class="text-grey-8 task-right-tabs"
              data-tour="task-dialog-right-tabs"
            >
              <q-tab name="messages" label="Сообщения" data-tour="task-dialog-messages-tab"/>
              <q-tab name="checklist" label="Чек-лист" data-tour="task-dialog-checklist-tab"/>
              <q-tab name="history" label="История" data-tour="task-dialog-history-tab"/>
            </q-tabs>

            <q-separator/>

            <q-tab-panels
              v-model="taskRightTab"
              animated
              class="task-right-panels"
            >
              <q-tab-panel name="messages" class="q-pa-none task-messages-panel" data-tour="task-dialog-messages-panel">
                <chat-dialog
                  :is-mobile="this.isMobile"
                  :messages="this.task.messages"
                  :input-field="this.inputField"
                  :templates="this.store.templates"
                  :isSending="this.isSending"
                  :current-user="this.store.currentUser"
                  :linkedMessageId="this.linkedMessageId"
                  :client-id="this.client.id"
                  :client="this.client"
                  :is-show-helper="true"
                  :taskWatchingNow="[]"
                  :typing="[]"
                  :isDialog="true"
                  :comments="false"
                  :show-answer-required-actions="false"
                  @sendMessage="this.sendMessage"
                  @isSending="this.isSending = true"
                  @keyPressed="this.keyPressed"
                  @editMessage="this.editMessage"
                />
              </q-tab-panel>

              <q-tab-panel
                name="checklist"
                class="q-pa-md task-checklist-panel"
                data-tour="task-dialog-checklist-panel"
              >
                <div class="row q-col-gutter-sm items-center q-mb-md">
                  <div class="col">
                    <q-input
                      v-model="this.newChecklistItemText"
                      dense
                      outlined
                      label="Новый пункт чек-листа"
                      @keyup.enter="this.addChecklistItem"
                    />
                  </div>

                  <div class="col-auto">
                    <q-btn
                      dense
                      round
                      color="primary"
                      icon="add"
                      @click="this.addChecklistItem"
                    />
                  </div>
                </div>

                <div
                  v-if="this.dialogTaskChecklist.length === 0"
                  class="text-grey-7"
                >
                  Чек-лист пустой
                </div>

                <q-list
                  v-else
                  bordered
                  separator
                  class="rounded-borders"
                >
                  <draggable
                    :list="this.dialogTaskChecklist"
                    item-key="id"
                    handle=".task-checklist-drag-handle"
                    ghost-class="ghost"
                    class="task-checklist-draggable-list"
                  >
                    <template #item="{ element: item }">
                      <q-item class="task-checklist-item">
                        <q-item-section
                          side
                          class="task-checklist-drag-handle"
                        >
                          <q-icon
                            name="drag_indicator"
                            color="grey-6"
                          />
                        </q-item-section>

                        <q-item-section side>
                          <q-checkbox v-model="item.completed"/>
                        </q-item-section>

                        <q-item-section>
                          <q-input
                            v-model="item.text"
                            dense
                            borderless
                            placeholder="Пункт чек-листа"
                          />
                        </q-item-section>

                        <q-item-section side>
                          <q-btn
                            flat
                            dense
                            round
                            icon="delete"
                            color="negative"
                            @click.stop="this.removeChecklistItem(item.id)"
                          />
                        </q-item-section>
                      </q-item>
                    </template>
                  </draggable>
                </q-list>
              </q-tab-panel>

              <q-tab-panel name="history" class="q-pa-md task-history-panel" data-tour="task-dialog-history-panel">
                <q-inner-loading :showing="taskHistoryLoading">
                  <q-spinner size="32px"/>
                </q-inner-loading>
                <div
                  v-if="!taskHistoryLoading && taskHistory.length === 0"
                  class="text-grey-7"
                >
                  История изменений пустая
                </div>
                <q-timeline
                  v-else
                  color="primary"
                >
                  <q-timeline-entry
                    v-for="item in taskHistory"
                    :key="item.id"
                    :title="item.title"
                    :subtitle="formatHistoryDate(item.createdAt)"
                    :icon="getHistoryIcon(item.triggerType)"
                  >
                    <div class="text-grey-8 task-history-description">
                      {{ item.description }}
                    </div>
                    <q-list
                      v-if="item.changes && item.changes.length > 0"
                      dense
                      bordered
                      separator
                      class="q-mt-sm rounded-borders"
                    >
                      <q-item
                        v-for="change in item.changes"
                        :key="change.field"
                      >
                        <q-item-section>
                          <div class="text-caption text-weight-medium">
                            {{ change.label || change.field }}
                          </div>

                          <div class="text-caption text-grey-7">
                            Было: {{ change.oldValue || '—' }}
                          </div>

                          <div class="text-caption text-grey-7">
                            Стало: {{ change.newValue || '—' }}
                          </div>
                        </q-item-section>
                      </q-item>
                    </q-list>
                    <div
                      v-if="item.actorDisplayName"
                      class="text-caption text-grey-7 q-mt-xs"
                    >
                      Изменил: {{ item.actorDisplayName }}
                    </div>

                    <div
                      v-else
                      class="text-caption text-grey-7 q-mt-xs"
                    >
                      Изменил: неизвестно
                    </div>
                  </q-timeline-entry>
                </q-timeline>
              </q-tab-panel>
            </q-tab-panels>
          </div>
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="task-dialog-actions"
        data-tour="task-dialog-actions"
      >
        <q-btn
          color="white"
          text-color="primary"
          label="Закрыть"
          @click="this.openSubmitModal"
        />
        <q-btn
          id="save-task"
          color="primary"
          label="Сохранить"
          @click="this.saveNewOrUpdateTask"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog persistent v-model="this.freezeDialog">
    <div id="task-freeze-modal">
      <q-card>
        <q-card-section>
          <div class="text-h6">Заморозка заявки</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div id="freeze-time-input">
            <q-input
              v-model="this.dialogTaskFreezeUntil"
              clearable
              label="Заморозить до"
              mask="##.##.#### ##:##"
            >
              <template
                v-slot:append
              >
                <q-icon
                  name="event"
                  class="cursor-pointer"
                >
                  <q-popup-proxy
                    ref="qDateFreezePopup"
                    cover
                    transition-show="scale"
                    transition-hide="scale"
                  >
                    <q-date
                      v-model="this.dialogTaskFreezeUntil"
                      first-day-of-week="1"
                      locale="ru"
                      today-btn
                      :options="this.dateOption"
                      mask="DD.MM.YYYY HH:mm"
                      @update:model-value="this.$refs.qDateFreezePopup.hide()"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <q-input
            v-model="this.dialogTaskFreezeReason"
            type="textarea"
            autogrow
            label="Причина заморозки *"
            :rules="[val => (val && val.trim().length > 0) || 'Обязательное поле']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup/>
          <div id="freeze-save-btn">
            <q-btn @click="changeTaskFrozen" label="Заморозить" color="primary"/>
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </q-dialog>
  <q-dialog
    v-model="this.isSubmitModal"
    persistent
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ this.getSubmitModalTitle() }}
        </div>
        <q-btn
          flat
          round
          dense
          icon="close"
          @click="this.cancelSubmitModal"
        />
      </q-toolbar>
      <q-card-section>
        {{ this.getSubmitModalMessage() }}
      </q-card-section>
      <q-card-actions class="justify-end">
        <q-btn
          outline
          color="primary"
          @click="this.cancelSubmitModal"
        >
          Отмена
        </q-btn>
        <q-btn
          outline
          color="primary"
          @click="this.confirmSubmitModalWithoutSave"
        >
          Не сохранять
        </q-btn>
        <q-btn
          color="primary"
          @click="this.confirmSubmitModalWithSave"
        >
          Сохранить
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="this.typeChecklistApplyDialog">
    <q-card class="task-type-checklist-dialog">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          Стандартный чек-лист
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          v-close-popup
        />
      </q-toolbar>

      <q-card-section>
        У типа «{{ this.dialogTaskType }}» есть стандартный чек-лист.
        Что сделать с текущим чек-листом заявки?
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          no-caps
          color="grey-7"
          label="Оставить текущий"
          v-close-popup
        />

        <q-btn
          outline
          no-caps
          color="primary"
          label="Добавить недостающие"
          @click="this.applySelectedTypeChecklist('append')"
          v-close-popup
        />

        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Заменить"
          @click="this.applySelectedTypeChecklist('replace')"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="this.statusReasonDialog"
    persistent
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ this.statusReasonDialogTitle }}
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          @click="this.cancelStatusReasonDialog"
        />
      </q-toolbar>

      <q-card-section>
        <div class="text-body2 q-mb-md">
          {{ this.statusReasonDialogMessage }}
        </div>

        <q-input
          v-model="this.statusReasonText"
          type="textarea"
          autogrow
          autofocus
          label="Причина *"
          :error="this.statusReasonError"
          error-message="Обязательное поле"
          @keyup.ctrl.enter="this.confirmStatusReasonDialog"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="primary"
          label="Отмена"
          @click="this.cancelStatusReasonDialog"
        />

        <q-btn
          color="primary"
          label="Продолжить"
          @click="this.confirmStatusReasonDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <teleport to="body">
    <div
      v-if="this.taskDialogOnboardingActive"
      class="task-dialog-onboarding-layer"
    >
      <div
        class="task-dialog-onboarding-spotlight"
        :style="this.taskDialogOnboardingSpotlightStyle"
      />
      <q-card
        class="task-dialog-onboarding-tooltip"
        :style="this.taskDialogOnboardingTooltipStyle"
      >
        <q-card-section class="q-pb-xs">
          <div class="task-dialog-onboarding-progress text-caption text-grey-7">
            {{ this.taskDialogOnboardingStepIndex + 1 }} / {{ this.visibleTaskDialogOnboardingSteps.length }}
          </div>
          <div class="text-subtitle1 text-weight-bold q-mt-xs">
            {{ this.currentTaskDialogOnboardingStep.title }}
          </div>
          <div class="text-body2 q-mt-sm">
            {{ this.currentTaskDialogOnboardingStep.text }}
          </div>
        </q-card-section>
        <q-card-actions align="between" class="q-pt-none">
          <q-btn
            flat
            dense
            color="grey"
            label="Пропустить"
            @click="this.finishTaskDialogOnboarding"
          />
          <div>
            <q-btn
              flat
              dense
              color="primary"
              label="Назад"
              :disable="this.taskDialogOnboardingStepIndex === 0"
              @click="this.prevTaskDialogOnboardingStep"
            />
            <q-btn
              unelevated
              dense
              color="primary"
              :label="this.isLastTaskDialogOnboardingStep ? 'Готово' : 'Далее'"
              @click="this.nextTaskDialogOnboardingStep"
            />
          </div>
        </q-card-actions>
      </q-card>
    </div>
  </teleport>
</template>

<script>
import moment from 'moment/moment'
import axios from 'axios'
import { useStore } from 'stores/store'
import ChatDialog from 'components/chat/ChatDialog.vue'
import draggable from 'vuedraggable'
import { useRoute } from 'vue-router'
import { onTaskMessage } from 'src/util/ws'

export default {

  components: { ChatDialog, draggable },

  props: [
    'isMobile',
    'task',
    'isNewTaskDialogShow',
    'isTaskDialogShow',
    'isNewTask',
    'client',
    'requestStatusChangeReason'
  ],

  data: () => ({
    dialogTab: 'tab1',

    taskRightTab: 'messages',
    taskHistory: [],
    taskHistoryLoading: false,

    dialogTaskId: '',
    dialogTaskName: '',
    dialogTaskDescription: '',
    dialogTaskPriority: '',
    dialogTaskExecutor: '',
    dialogTaskTags: [],
    dialogTaskStatus: '',
    dialogTaskDeadline: '',
    dialogTaskComplete: false,
    linkedMessageId: '',
    taskCreatedAt: '',

    taskId: null, // for update
    inputField: '',
    isSending: false,
    freezeDialog: false,
    dialogTaskFreezeUntil: '',
    dialogTaskFreezeReason: '',
    statusReasonDialog: false,
    statusReasonDialogTitle: '',
    statusReasonDialogMessage: '',
    statusReasonText: '',
    statusReasonError: false,
    statusReasonResolve: null,

    taskOnCreateProcess: false,

    isSubmitModal: false,

    pendingSubmitAction: null,
    pendingSubmitSourceTask: null,

    filteredUsers: [],
    filteredTags: [],

    taskTypes: [],
    typeChecklistApplyDialog: false,
    taskFieldsInitializing: false,

    dialogTaskType: '',
    dialogTaskChecklist: [],
    newChecklistItemText: '',

    taskMessageUnsubscribe: null,

    taskDialogOnboardingKey: 'task-dialog-onboarding-v1',
    taskDialogOnboardingActive: false,
    taskDialogOnboardingStepIndex: 0,
    taskDialogOnboardingTooltipStyle: {},
    taskDialogOnboardingSpotlightStyle: {},
    taskDialogOnboardingRefreshHandler: null,
    taskDialogOnboardingSteps: [
      {
        target: 'task-dialog-title',
        title: 'Номер и заголовок заявки',
        text: 'Здесь видно, какую заявку вы открыли. Для новой заявки вместо номера отображается заголовок создания.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-name',
        title: 'Название заявки',
        text: 'Коротко сформулируйте проблему или запрос. Хорошее название помогает быстро найти заявку в общем списке.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-status-controls',
        title: 'Статус и закрытие',
        text: 'Статус показывает этап обработки. Рядом доступны быстрые действия: закрыть заявку, вернуть в работу или заморозить выполнение.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-description',
        title: 'Описание',
        text: 'В описании фиксируются детали обращения: что произошло, какие действия уже выполнены и какой результат ожидается.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-priority',
        title: 'Приоритет',
        text: 'Приоритет помогает понять срочность. Критичные и высокие заявки легче поднять в очереди и контролировать по SLA.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-executor',
        title: 'Исполнитель',
        text: 'Исполнитель отвечает за решение заявки. Если поле пустое, заявка может попасть в очередь без ответственного.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-tags',
        title: 'Теги',
        text: 'Теги нужны для классификации: тип проблемы, продукт, отдел, канал или причина обращения.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-deadline',
        title: 'Дедлайн',
        text: 'Дедлайн задаёт ожидаемый срок решения. Его удобно использовать для сортировки и контроля просрочек.',
        dialogTab: 'tab1'
      },
      {
        target: 'task-dialog-open-chat',
        title: 'Переход в чат клиента',
        text: 'Кнопка открывает чат клиента, чтобы посмотреть полный контекст общения и продолжить диалог.',
        dialogTab: 'tab1',
        requiresExistingTask: true,
        skipOnChatRoute: true
      },
      {
        target: 'task-dialog-right-panel',
        title: 'Связанные сообщения и история',
        text: 'Правая часть заявки показывает переписку по этой заявке и историю изменений. На мобильном экране этот блок открывается отдельной вкладкой.',
        dialogTab: 'tab2',
        rightTab: 'messages',
        requiresExistingTask: true,
        requiresOperator: true
      },
      {
        target: 'task-dialog-messages-panel',
        title: 'Сообщения по заявке',
        text: 'Здесь видна переписка, связанная именно с этой заявкой. Можно отвечать клиенту, не выходя из карточки заявки.',
        dialogTab: 'tab2',
        rightTab: 'messages',
        requiresExistingTask: true,
        requiresOperator: true
      },
      {
        target: 'task-dialog-history-tab',
        title: 'История изменений',
        text: 'На вкладке истории можно проверить, кто менял статус, приоритет, исполнителя, дедлайн и другие поля заявки.',
        dialogTab: 'tab2',
        rightTab: 'history',
        requiresExistingTask: true,
        requiresOperator: true
      },
      {
        target: 'task-dialog-actions',
        title: 'Сохранение изменений',
        text: 'После редактирования нажмите «Сохранить». Если закрыть окно с несохранёнными изменениями, система попросит подтвердить действие.',
        dialogTab: 'tab1'
      }
    ]
  }),

  methods: {

    startTaskDialogOnboarding (force = false) {
      if (!force && localStorage.getItem(this.taskDialogOnboardingKey)) {
        return
      }
      if (!this.getPossibilityToOpenDialogTask) {
        return
      }
      this.taskDialogOnboardingActive = true
      this.taskDialogOnboardingStepIndex = 0
      this.addTaskDialogOnboardingListeners()
      this.applyTaskDialogOnboardingStep()
    },

    finishTaskDialogOnboarding () {
      this.taskDialogOnboardingActive = false
      localStorage.setItem(this.taskDialogOnboardingKey, 'done')
      this.taskDialogOnboardingTooltipStyle = {}
      this.taskDialogOnboardingSpotlightStyle = {}
      this.removeTaskDialogOnboardingListeners()
    },

    stopTaskDialogOnboarding () {
      this.taskDialogOnboardingActive = false
      this.taskDialogOnboardingTooltipStyle = {}
      this.taskDialogOnboardingSpotlightStyle = {}
      this.removeTaskDialogOnboardingListeners()
    },

    nextTaskDialogOnboardingStep () {
      if (this.isLastTaskDialogOnboardingStep) {
        this.finishTaskDialogOnboarding()
        return
      }
      this.taskDialogOnboardingStepIndex += 1
      this.applyTaskDialogOnboardingStep()
    },

    prevTaskDialogOnboardingStep () {
      if (this.taskDialogOnboardingStepIndex === 0) {
        return
      }
      this.taskDialogOnboardingStepIndex -= 1
      this.applyTaskDialogOnboardingStep()
    },

    applyTaskDialogOnboardingStep () {
      const steps = this.visibleTaskDialogOnboardingSteps
      if (this.taskDialogOnboardingStepIndex >= steps.length) {
        this.taskDialogOnboardingStepIndex = Math.max(steps.length - 1, 0)
      }
      const step = this.currentTaskDialogOnboardingStep
      if (step.dialogTab) {
        this.dialogTab = step.dialogTab
      }
      if (step.rightTab) {
        this.taskRightTab = step.rightTab
      }
      this.$nextTick(() => {
        setTimeout(() => this.updateTaskDialogOnboardingPosition(), 120)
      })
    },

    updateTaskDialogOnboardingPosition () {
      if (!this.taskDialogOnboardingActive) {
        return
      }
      const step = this.currentTaskDialogOnboardingStep
      const target = this.getTaskDialogOnboardingTarget(step)
      if (!target) {
        this.taskDialogOnboardingSpotlightStyle = {
          top: '96px',
          left: '96px',
          width: '1px',
          height: '1px',
          opacity: 0
        }
        this.taskDialogOnboardingTooltipStyle = {
          top: '96px',
          left: '96px'
        }
        return
      }

      target.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'smooth'
      })

      setTimeout(() => {
        if (!this.taskDialogOnboardingActive) {
          return
        }
        const rect = target.getBoundingClientRect()
        const padding = 8
        const tooltipWidth = Math.min(380, window.innerWidth - 24)
        const tooltipEstimatedHeight = 190
        const gap = 14

        const spotlightTop = Math.max(rect.top - padding, 8)
        const spotlightLeft = Math.max(rect.left - padding, 8)
        const spotlightWidth = Math.min(rect.width + padding * 2, window.innerWidth - spotlightLeft - 8)
        const spotlightHeight = Math.min(rect.height + padding * 2, window.innerHeight - spotlightTop - 8)

        let tooltipTop = rect.bottom + gap
        if (tooltipTop + tooltipEstimatedHeight > window.innerHeight - 12) {
          tooltipTop = rect.top - tooltipEstimatedHeight - gap
        }
        if (tooltipTop < 12) {
          tooltipTop = 12
        }

        let tooltipLeft = rect.left
        if (tooltipLeft + tooltipWidth > window.innerWidth - 12) {
          tooltipLeft = window.innerWidth - tooltipWidth - 12
        }
        if (tooltipLeft < 12) {
          tooltipLeft = 12
        }

        this.taskDialogOnboardingSpotlightStyle = {
          top: `${spotlightTop}px`,
          left: `${spotlightLeft}px`,
          width: `${spotlightWidth}px`,
          height: `${spotlightHeight}px`
        }
        this.taskDialogOnboardingTooltipStyle = {
          top: `${tooltipTop}px`,
          left: `${tooltipLeft}px`,
          width: `${tooltipWidth}px`
        }
      }, 120)
    },

    getTaskDialogOnboardingTarget (step) {
      if (!step?.target) {
        return document.querySelector('[data-tour="task-dialog-card"]')
      }
      return document.querySelector(`[data-tour="${step.target}"]`) || document.querySelector('[data-tour="task-dialog-card"]')
    },

    addTaskDialogOnboardingListeners () {
      if (this.taskDialogOnboardingRefreshHandler) {
        return
      }
      this.taskDialogOnboardingRefreshHandler = () => this.updateTaskDialogOnboardingPosition()
      window.addEventListener('resize', this.taskDialogOnboardingRefreshHandler)
      window.addEventListener('scroll', this.taskDialogOnboardingRefreshHandler, true)
    },

    removeTaskDialogOnboardingListeners () {
      if (!this.taskDialogOnboardingRefreshHandler) {
        return
      }
      window.removeEventListener('resize', this.taskDialogOnboardingRefreshHandler)
      window.removeEventListener('scroll', this.taskDialogOnboardingRefreshHandler, true)
      this.taskDialogOnboardingRefreshHandler = null
    },

    getCurrentTaskId () {
      return this.taskId || this.dialogTaskId || this.task?.id || null
    },

    dateOption (date) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return date >= `${year}/${month}/${day}`
    },

    openSubmitModal (pendingAction = null, sourceTask = null) {
      this.pendingSubmitAction = pendingAction
      this.pendingSubmitSourceTask = sourceTask
      if (this.isNewTask) {
        if (!this.dialogTaskName) {
          this.clearPendingSubmitAction()
          this.closeDialog()
          return
        }
        this.isSubmitModal = true
        return
      }
      if (this.hasUnsavedTaskChanges()) {
        this.isSubmitModal = true
        return
      }
      const action = this.pendingSubmitAction
      const task = this.pendingSubmitSourceTask || this.task
      this.clearPendingSubmitAction()
      if (action === 'closeTask') {
        this.setTaskCompleted(task, { skipUnsavedCheck: true })
        return
      }
      if (action === 'reopenTask') {
        this.setTaskNotCompleted(task, { skipUnsavedCheck: true })
        return
      }
      this.closeDialog()
    },

    closeDialog () {
      this.$emit('closeDialog')
    },

    getSubmitModalTitle () {
      if (this.pendingSubmitAction === 'closeTask') {
        return `Сохранить изменения перед закрытием заявки №${this.task.id}?`
      }

      if (this.pendingSubmitAction === 'reopenTask') {
        return `Сохранить изменения перед возвратом заявки №${this.task.id} в работу?`
      }

      return this.isNewTask
        ? 'Сохранить заявку?'
        : 'Сохранить изменение в заявке №' + this.task.id + '?'
    },

    getSubmitModalMessage () {
      if (this.pendingSubmitAction === 'closeTask') {
        return 'В заявке есть несохранённые изменения. Сохранить их перед закрытием заявки?'
      }

      if (this.pendingSubmitAction === 'reopenTask') {
        return 'В заявке есть несохранённые изменения. Сохранить их перед возвратом заявки в работу?'
      }

      return this.isNewTask
        ? 'Закрыть не сохраняя заявку?'
        : 'Сохранить изменения в заявке №' + this.task.id + '?'
    },

    cancelSubmitModal () {
      this.isSubmitModal = false
      this.clearPendingSubmitAction()
    },

    clearPendingSubmitAction () {
      this.pendingSubmitAction = null
      this.pendingSubmitSourceTask = null
    },

    applyPendingSubmitActionToDialogFields () {
      if (this.pendingSubmitAction === 'closeTask') {
        const closedStatus = this.store.statuses.find(status => this.isClosedStatusName(status.name))
        if (!closedStatus) {
          this.$q.notify({
            message: 'Не найден статус закрытия заявки',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          return false
        }
        this.dialogTaskStatus = closedStatus.name
        this.dialogTaskComplete = true
        return true
      }

      if (this.pendingSubmitAction === 'reopenTask') {
        const reopenStatus = this.getReopenStatus(this.pendingSubmitSourceTask || this.task)
        if (!reopenStatus) {
          this.$q.notify({
            message: 'Не найден открытый статус для возврата заявки в работу',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          return false
        }
        this.dialogTaskStatus = reopenStatus.name
        this.dialogTaskComplete = false
        return true
      }
      return true
    },

    async confirmSubmitModalWithSave () {
      const hasPendingAction = !!this.pendingSubmitAction
      if (hasPendingAction && !this.applyPendingSubmitActionToDialogFields()) {
        return
      }
      this.isSubmitModal = false
      this.clearPendingSubmitAction()
      await this.saveNewOrUpdateTask()
    },

    async confirmSubmitModalWithoutSave () {
      const action = this.pendingSubmitAction
      const task = this.pendingSubmitSourceTask || this.task
      this.isSubmitModal = false
      this.clearPendingSubmitAction()
      if (action === 'closeTask') {
        await this.setTaskCompleted(task, { skipUnsavedCheck: true })
        return
      }
      if (action === 'reopenTask') {
        await this.setTaskNotCompleted(task, { skipUnsavedCheck: true })
        return
      }
      this.closeDialog()
    },

    getStatusName (status) {
      if (!status) {
        return ''
      }
      return typeof status === 'string' ? status : status.name || ''
    },

    isClosedStatusName (statusName) {
      return ['закрыта', 'закрыто', 'закрыт'].includes(String(statusName || '').trim().toLowerCase())
    },

    isFrozenStatusName (statusName) {
      return ['заморожена', 'заморожено', 'заморожен'].includes(String(statusName || '').trim().toLowerCase())
    },

    isOpenStatusName (statusName) {
      return !!statusName && !this.isClosedStatusName(statusName) && !this.isFrozenStatusName(statusName)
    },

    needStatusChangeReason (oldStatusName, newStatusName) {
      const oldName = String(oldStatusName || '').trim()
      const newName = String(newStatusName || '').trim()
      if (!oldName || !newName || oldName.toLowerCase() === newName.toLowerCase()) {
        return false
      }
      if (this.isClosedStatusName(newName) || this.isFrozenStatusName(newName)) {
        return true
      }
      return this.isClosedStatusName(oldName) && this.isOpenStatusName(newName)
    },

    getStatusChangeReasonTitle (oldStatusName, newStatusName) {
      if (this.isClosedStatusName(newStatusName)) {
        return 'Причина закрытия заявки'
      }
      if (this.isFrozenStatusName(newStatusName)) {
        return 'Причина заморозки заявки'
      }
      if (this.isClosedStatusName(oldStatusName) && this.isOpenStatusName(newStatusName)) {
        return 'Причина возврата заявки в работу'
      }
      return 'Причина изменения статуса'
    },

    requestStatusChangeReasonIfNeeded (oldStatusName, newStatusName) {
      if (!this.needStatusChangeReason(oldStatusName, newStatusName)) {
        return Promise.resolve('')
      }
      if (typeof this.requestStatusChangeReason === 'function') {
        return this.requestStatusChangeReason(oldStatusName, newStatusName)
      }
      return Promise.resolve(null)
    },

    confirmStatusReasonDialog () {
      const reason = String(this.statusReasonText || '').trim()
      if (!reason) {
        this.statusReasonError = true
        return
      }
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(reason)
      }
      this.clearStatusReasonDialog()
    },

    cancelStatusReasonDialog () {
      this.statusReasonDialog = false
      if (this.statusReasonResolve) {
        this.statusReasonResolve(null)
      }
      this.clearStatusReasonDialog()
    },

    clearStatusReasonDialog () {
      this.statusReasonDialogTitle = ''
      this.statusReasonDialogMessage = ''
      this.statusReasonText = ''
      this.statusReasonError = false
      this.statusReasonResolve = null
    },

    getDefaultOpenStatus () {
      return this.store.statuses.find(status => this.isOpenStatusName(status.name) && status.defaultSelection === true) ||
        this.store.statuses.find(status => this.isOpenStatusName(status.name))
    },

    getReopenStatus (task) {
      if (task?.previousStatus && this.isOpenStatusName(task.previousStatus.name)) {
        return task.previousStatus
      }
      return this.getDefaultOpenStatus()
    },

    openFreezeDialog () {
      this.dialogTaskFreezeReason = ''
      this.freezeDialog = true
    },

    hasUnsavedTaskChanges () {
      if (this.isNewTask) {
        return !!this.dialogTaskName
      }
      const dialogTaskDeadline = this.dialogTaskDeadline ? this.dialogTaskDeadline : ''
      const taskDeadline = this.task.deadline
        ? moment(this.task.deadline, 'DD.MM.YYYY HH:mm').format('DD.MM.YYYY HH:mm')
        : ''
      return this.dialogTaskName !== this.task.name ||
        this.dialogTaskDescription !== this.task.description ||
        this.dialogTaskPriority !== this.task.priority.name ||
        this.dialogTaskType !== (this.task.type?.type || '') ||
        JSON.stringify(this.normalizeChecklist(this.dialogTaskChecklist)) !== JSON.stringify(this.normalizeChecklist(this.task.checklist)) ||
        this.dialogTaskExecutor !== this.getUserName(this.task.executor) ||
        JSON.stringify(this.dialogTaskTags) !== JSON.stringify(this.task.tags.map(tag => tag.name)) ||
        dialogTaskDeadline !== taskDeadline ||
        this.dialogTaskStatus !== this.task.status.name ||
        this.dialogTaskComplete !== this.task.completed
    },

    getTaskField () {
      this.taskFieldsInitializing = true
      if (this.isNewTask) {
        const messageText = this.getNewTaskFromMessageText()
        this.dialogTaskName = ''
        this.dialogTaskDescription = messageText
        this.dialogTaskPriority = this.store.priorities.find(priority => priority.defaultSelection === true).name
        this.dialogTaskExecutor = ''
        this.dialogTaskTags = []
        this.dialogTaskDeadline = ''
        this.dialogTaskStatus = this.store.statuses.find(status => status.defaultSelection === true).name
        const defaultTaskType = this.getDefaultTaskType()
        this.dialogTaskType = defaultTaskType?.type || ''
        this.dialogTaskChecklist = defaultTaskType?.autoApplyChecklist !== false
          ? this.copyChecklist(this.normalizeChecklist(defaultTaskType.checklistTemplate))
          : []
        this.newChecklistItemText = ''
        setTimeout(() => this.$refs.taskName.focus(), 300)
      } else {
        this.dialogTaskId = this.task.id
        this.dialogTaskName = this.task.name
        this.dialogTaskDescription = this.task.description
        this.dialogTaskPriority = this.task.priority.name
        this.dialogTaskExecutor = this.getUserName(this.task.executor)
        this.dialogTaskTags = this.task.tags.map(tag => tag.name)
        this.dialogTaskDeadline = this.task.deadline ? moment(this.task.deadline, 'DD.MM.YYYY HH:mm').format('DD.MM.YYYY HH:mm') : ''
        this.taskId = this.task.id
        this.dialogTaskStatus = this.task.status.name
        this.taskCreatedAt = this.task.createdAt
        this.dialogTaskComplete = this.task.completed
        this.linkedMessageId = this.task.linkedMessageId
        this.dialogTaskType = this.task.type?.type || ''
        this.dialogTaskChecklist = this.normalizeChecklist(this.task.checklist)
        this.newChecklistItemText = ''
      }
      this.$nextTick(() => {
        this.taskFieldsInitializing = false
      })
    },

    async saveNewOrUpdateTask () {
      if (!this.dialogTaskName || !this.dialogTaskType || !this.dialogTaskPriority || !this.dialogTaskStatus) {
        this.$q.notify({
          message: 'Не заполнены обязательные поля',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
        return
      }
      const messageId = this.getNewTaskFromMessageId()
      if (!this.linkedMessageId) {
        this.linkedMessageId = messageId
      }
      const tags = []
      this.dialogTaskTags.forEach(tagName => tags.push(this.store.tags.find(tag => tag.name === tagName)))
      const currentTaskId = this.getCurrentTaskId()
      if (!this.isNewTask && !currentTaskId) {
        this.$q.notify({
          message: 'Не найден id заявки для обновления',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
        return
      }
      const task = {
        id: this.isNewTask ? null : currentTaskId,
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        type: this.getSelectedTaskType(),
        checklist: this.normalizeChecklist(this.dialogTaskChecklist),
        status: this.store.statuses.find(status => status.name === this.dialogTaskStatus),
        priority: this.store.priorities.find(priority => priority.name === this.dialogTaskPriority),
        executor: this.store.users.find(user => this.getUserName(user) === this.dialogTaskExecutor),
        tags,
        completed: false,
        createdAt: this.isNewTask ? new Date() : this.taskCreatedAt,
        deadline: this.dialogTaskDeadline ? moment(this.dialogTaskDeadline, 'DD.MM.YYYY HH:mm').format() : null,
        linkedMessageId: this.linkedMessageId,
        previousStatus: this.isNewTask ? this.store.statuses.find(status => status.name === this.dialogTaskStatus) : this.task.previousStatus,
        messages: this.isNewTask ? this.getLinkedMessage : this.task.messages
      }
      if (!this.isNewTask) {
        task.sla = this.task.sla
      }
      if (this.isClosedStatusName(task.status.name)) {
        task.completed = true
      }
      const oldStatusName = this.isNewTask ? '' : this.getStatusName(this.task.status)
      const newStatusName = this.getStatusName(task.status)
      const statusChangeReason = await this.requestStatusChangeReasonIfNeeded(oldStatusName, newStatusName)
      if (statusChangeReason === null) {
        return
      }
      if (statusChangeReason) {
        task.statusChangeReason = statusChangeReason
      }
      if (this.isNewTask) {
        if (this.taskOnCreateProcess) {
          return
        }
        this.taskOnCreateProcess = true
        axios.post(`/api/v1/client/${this.client.id}/task`, task)
          .then(task => {
            this.closeDialog()
            this.$emit('newTask', task)
            this.taskOnCreateProcess = false
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative',
              position: 'top-right',
              actions: [{
                icon: 'close',
                color: 'white',
                dense: true,
                handler: () => undefined
              }]
            }))
      } else {
        axios.patch(`/api/v1/client/${this.client.id}/task`, task)
          .then(newTask => {
            this.taskHistory = []
            this.loadTaskHistory()
            this.closeDialog()
            this.$emit('updateTask', task, newTask.data)
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative',
              position: 'top-right',
              actions: [{
                icon: 'close',
                color: 'white',
                dense: true,
                handler: () => undefined
              }]
            }))
      }
    },

    async setTaskCompleted (sourceTask, options = {}) {
      if (!options.skipUnsavedCheck && this.hasUnsavedTaskChanges()) {
        this.openSubmitModal('closeTask', sourceTask)
        return
      }
      const closedStatus = this.store.statuses.find(status => this.isClosedStatusName(status.name))
      const oldStatusName = this.getStatusName(sourceTask.status)
      const newStatusName = this.getStatusName(closedStatus) || 'Закрыта'
      const statusChangeReason = await this.requestStatusChangeReasonIfNeeded(oldStatusName, newStatusName)
      if (statusChangeReason === null) {
        return
      }
      const task = Object.keys(sourceTask)
        .filter(objKey => objKey !== 'client' && objKey !== 'sla')
        .reduce((newObj, key) => {
          newObj[key] = sourceTask[key]
          return newObj
        }, {})
      task.completed = true
      if (closedStatus) {
        task.status = closedStatus
      }
      if (statusChangeReason) {
        task.statusChangeReason = statusChangeReason
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.closeDialog()
          this.$emit('updateTask', task, newTask.data)
          this.$q.notify({
            message: 'Заявка закрыта',
            type: 'positive',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          }))
    },

    async setTaskNotCompleted (sourceTask, options = {}) {
      if (!options.skipUnsavedCheck && this.hasUnsavedTaskChanges()) {
        this.openSubmitModal('reopenTask', sourceTask)
        return
      }
      const reopenStatus = this.getReopenStatus(sourceTask)
      if (!reopenStatus) {
        this.$q.notify({
          message: 'Не найден открытый статус для возврата заявки в работу',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
        return
      }
      const oldStatusName = this.getStatusName(sourceTask.status)
      const newStatusName = this.getStatusName(reopenStatus)
      const statusChangeReason = await this.requestStatusChangeReasonIfNeeded(oldStatusName, newStatusName)
      if (statusChangeReason === null) {
        return
      }
      const task = Object.keys(sourceTask)
        .filter(objKey => objKey !== 'client' && objKey !== 'sla')
        .reduce((newObj, key) => {
          newObj[key] = sourceTask[key]
          return newObj
        }, {})
      task.completed = false
      task.status = reopenStatus
      if (statusChangeReason) {
        task.statusChangeReason = statusChangeReason
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.closeDialog()
          this.$emit('updateTask', task, newTask.data)
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          }))
    },

    async changeTaskFrozen () {
      const tags = []
      this.dialogTaskTags.forEach(tagName => tags.push(this.store.tags.find(tag => tag.name === tagName)))
      const currentTaskId = this.getCurrentTaskId()
      if (!currentTaskId) {
        this.$q.notify({
          message: 'Не найден id заявки для обновления',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }]
        })
        return
      }
      const freezeStatus = this.store.statuses.find(status => status.name === 'Заморожена')
      const currentStatus = this.store.statuses.find(status => status.name === this.dialogTaskStatus)
      const oldTaskStatus = this.task.status || currentStatus
      const previousStatus = this.task.previousStatus || oldTaskStatus
      let nextStatus = currentStatus
      let frozenUntil = null
      if (!this.task.frozen) {
        if (!this.dialogTaskFreezeUntil) {
          this.$q.notify({
            message: 'Не заполнена дата заморозки',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          return
        }
        const parsedFrozenUntil = moment(this.dialogTaskFreezeUntil, 'DD.MM.YYYY HH:mm', true)
        if (!parsedFrozenUntil.isValid()) {
          this.$q.notify({
            message: 'Некорректная дата заморозки. Используйте формат дд.мм.гггг чч:мм',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          return
        }
        if (parsedFrozenUntil.isSameOrBefore(moment())) {
          this.$q.notify({
            message: 'Дата заморозки должна быть в будущем',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          return
        }
        if (!this.dialogTaskFreezeReason || !this.dialogTaskFreezeReason.trim()) {
          this.$q.notify({
            message: 'Не заполнена причина заморозки',
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
          return
        }
        nextStatus = freezeStatus || currentStatus
        frozenUntil = parsedFrozenUntil.format()
      } else {
        nextStatus = this.task.previousStatus || currentStatus
      }
      const task = {
        id: currentTaskId,
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        status: nextStatus,
        priority: this.store.priorities.find(priority => priority.name === this.dialogTaskPriority),
        executor: this.store.users.find(user => this.getUserName(user) === this.dialogTaskExecutor),
        tags,
        type: this.getSelectedTaskType(),
        checklist: this.normalizeChecklist(this.dialogTaskChecklist),
        completed: false,
        createdAt: this.isNewTask ? new Date() : this.taskCreatedAt,
        deadline: this.dialogTaskDeadline ? moment(this.dialogTaskDeadline, 'DD.MM.YYYY HH:mm').format() : null,
        linkedMessageId: this.linkedMessageId,
        frozen: !this.task.frozen,
        frozenFrom: this.task.frozen ? null : new Date(),
        frozenUntil,
        previousStatus: this.task.frozen ? null : previousStatus,
        statusChangeReason: this.task.frozen ? null : this.dialogTaskFreezeReason.trim(),
      }
      if (!this.isNewTask) {
        task.sla = this.task.sla
      }
      axios.patch(`/api/v1/client/${this.client.id}/task`, task)
        .then(newTask => {
          this.freezeDialog = false
          this.dialogTaskFreezeReason = ''
          this.closeDialog()
          this.$emit('updateTask', task, newTask.data)
          this.$q.notify({
            message: task.frozen ? 'Заявка заморожена' : 'Заявка разморожена',
            type: 'positive',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          })
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          }))
    },

    getUserName (user) {
      if (user) {
        return user.lastname + ' ' + user.firstname
      } else {
        return ''
      }
    },

    sendMessage (event) {
      if (event.attachedFiles && event.attachedFiles.length > 0) {
        const formData = new FormData()
        event.attachedFiles.forEach(file => {
          formData.append('files', file)
        })
        axios.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
          .then(response => {
            response.data.map((fileUuid, index) => ({
              ...event.message,
              fileUuid,
              fileName: event.attachedFiles[index].name,
              fileType: event.attachedFiles[index].type
            })).forEach(message => {
              this.sendTextMessage({
                ...event,
                message
              })
            })
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative',
              position: 'top-right',
              actions: [{
                icon: 'close',
                color: 'white',
                dense: true,
                handler: () => undefined
              }]
            }))
      } else {
        this.sendTextMessage(event)
      }
    },

    sendTextMessage (event) {
      axios.post(`/api/v1/client/${event.clientId}/task/${this.task.id}/message`, event.message)
        .then(() => {
          this.inputField = ''
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          }))
        .finally(() => {
          this.isSending = false
        })
    },

    keyPressed (text) {
      this.inputField = text
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

    filterUsers (val, update) {
      update(() => {
        if (val) {
          this.filteredUsers = this.store.users
            .filter(user =>
              ['ADMIN', 'OPERATOR'].includes(user.authorities[0]) && this.getUserName(user).toLowerCase().includes(val.toLowerCase())
            )
            .map(user => this.getUserName(user))
        } else {
          this.filteredUsers = this.store.users
            .filter(user => ['ADMIN', 'OPERATOR'].includes(user.authorities[0]))
            .map(user => this.getUserName(user))
        }
      })
    },

    filterTags (val, update) {
      update(() => {
        this.filteredTags = this.store.tags
          .filter(tag => tag.name.toLowerCase().includes(val.toLowerCase()))
          .map(tag => tag.name)
      })
    },

    formatDateTime () {
      const rawValue = this.dialogTaskDeadline.replace(/\D/g, '')
      let formattedValue = ''
      if (rawValue.length <= 2) {
        formattedValue = rawValue
      } else if (rawValue.length <= 4) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2)
      } else if (rawValue.length <= 6) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4)
      } else if (rawValue.length <= 8) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8)
      } else if (rawValue.length <= 10) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8)
      } else if (rawValue.length <= 12) {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8, 10) + ':' + rawValue.slice(10)
      } else {
        formattedValue = rawValue.slice(0, 2) + '.' + rawValue.slice(2, 4) + '.' + rawValue.slice(4, 8) + ' ' + rawValue.slice(8, 10) + ':' + rawValue.slice(10, 12)
      }
      this.dialogTaskDeadline = formattedValue
    },

    loadTaskHistory () {
      const taskId = this.getCurrentTaskId()

      if (!taskId) {
        this.taskHistory = []
        return
      }

      this.taskHistoryLoading = true

      axios.get(`/api/v1/task/${taskId}/history`)
        .then(response => {
          this.taskHistory = response.data || []
        })
        .catch(error => {
          console.error(error)
          this.taskHistory = []
          this.$q.notify({
            type: 'negative',
            message: 'Не удалось загрузить историю заявки'
          })
        })
        .finally(() => {
          this.taskHistoryLoading = false
        })
    },

    formatHistoryDate (value) {
      if (!value) {
        return ''
      }

      return new Date(value).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    getHistoryIcon (type) {
      switch (type) {
        case 'TASK_CREATED':
          return 'add_circle'
        case 'TASK_STATUS_CHANGED':
          return 'published_with_changes'
        case 'TASK_PRIORITY_CHANGED':
          return 'priority_high'
        case 'TASK_ASSIGNEE_CHANGED':
        case 'TASK_EXECUTOR_CHANGED':
          return 'person'
        case 'TASK_DUE_DATE_CHANGED':
          return 'event'
        case 'TASK_CLOSED':
        case 'TASK_COMPLETED':
          return 'check_circle'
        case 'TASK_REOPENED':
          return 'restart_alt'
        case 'TASK_TAG_ADDED':
        case 'TASK_TAG_REMOVED':
          return 'sell'
        case 'TASK_UPDATED':
          return 'edit_note'
        default:
          return 'history'
      }
    },

    normalizeChecklist (checklist) {
      if (!Array.isArray(checklist)) {
        return []
      }
      return checklist
        .filter(item => item && item.text !== undefined && item.text !== null)
        .map(item => ({
          id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          text: String(item.text).trim(),
          completed: Boolean(item.completed)
        }))
        .filter(item => item.text.length > 0)
    },

    getChecklistItemsLabel (checklist) {
      const count = this.normalizeChecklist(checklist).length
      return `${count} ${this.declineRuNumber(count, 'пункт', 'пункта', 'пунктов')}`
    },

    declineRuNumber (value, one, few, many) {
      const number = Math.abs(Number(value)) % 100
      const lastDigit = number % 10
      if (number >= 11 && number <= 19) {
        return many
      }
      if (lastDigit === 1) {
        return one
      }
      if (lastDigit >= 2 && lastDigit <= 4) {
        return few
      }
      return many
    },

    addChecklistItem () {
      const text = this.newChecklistItemText.trim()

      if (!text) {
        return
      }

      this.dialogTaskChecklist.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text,
        completed: false
      })

      this.newChecklistItemText = ''
    },

    removeChecklistItem (id) {
      this.dialogTaskChecklist = this.dialogTaskChecklist.filter(item => item.id !== id)
    },

    getSelectedTaskType () {
      return this.taskTypes.find(taskType => taskType.type === this.dialogTaskType) || null
    },

    loadTaskTypes () {
      return axios.get('/api/v1/task-types')
        .then(response => {
          this.taskTypes = response.data || []
          if (!this.dialogTaskType && this.taskTypes.length > 0) {
            this.dialogTaskType = this.getDefaultTaskType()?.type || ''
          }
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          }))
    },

    onTaskTypeChanged () {
      if (this.taskFieldsInitializing) {
        return
      }
      const selectedType = this.selectedTaskType
      if (!selectedType) {
        return
      }
      const template = this.normalizeChecklist(selectedType.checklistTemplate)
      if (template.length === 0) {
        return
      }
      if (selectedType.autoApplyChecklist === false) {
        return
      }
      if (this.dialogTaskChecklist.length === 0) {
        this.dialogTaskChecklist = this.copyChecklist(template)
        return
      }
      this.typeChecklistApplyDialog = true
    },

    openApplyTypeChecklistDialog () {
      if (this.selectedTaskTypeChecklist.length === 0) {
        return
      }
      if (this.dialogTaskChecklist.length === 0) {
        this.applySelectedTypeChecklist('replace')
        return
      }
      this.typeChecklistApplyDialog = true
    },

    applySelectedTypeChecklist (mode) {
      const template = this.copyChecklist(this.selectedTaskTypeChecklist)
      if (mode === 'replace') {
        this.dialogTaskChecklist = template
        return
      }
      if (mode === 'append') {
        const existingTexts = new Set(
          this.dialogTaskChecklist.map(item => item.text.trim().toLowerCase())
        )
        this.dialogTaskChecklist = [
          ...this.dialogTaskChecklist,
          ...template.filter(item => !existingTexts.has(item.text.trim().toLowerCase()))
        ]
      }
    },

    copyChecklist (checklist) {
      return this.normalizeChecklist(checklist).map(item => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: item.text,
        completed: false
      }))
    },

    getNewTaskFromMessageId () {
      const queryParams = new URLSearchParams(window.location.search)
      const messageId = Number(queryParams.get('newTaskFromMessage'))
      return Number.isFinite(messageId) && messageId > 0 ? messageId : null
    },

    getNewTaskFromMessage () {
      const messageId = this.getNewTaskFromMessageId()
      if (!messageId) {
        return null
      }
      const clientId = Number(this.router.params.clientId)
      const client = this.store.clients.find(client => Number(client.id) === clientId) || this.client
      if (!client || !Array.isArray(client.messages)) {
        return null
      }
      return client.messages.find(message => Number(message.id) === messageId) || null
    },

    getNewTaskFromMessageText () {
      const message = this.getNewTaskFromMessage()
      return String(message?.text || '').trim()
    },

    onTaskMessage (payload) {
      if (Number(payload.taskId) !== Number(this.task.id)) {
        return
      }
      if (!this.task.messages) {
        this.task.messages = []
      }
      const exists = this.task.messages.some(message => Number(message.id) === Number(payload.message.id))
      if (!exists) {
        this.task.messages.push(payload.message)
      }
      if (this.taskRightTab === 'messages') {
        axios.post(`/api/v1/client/${this.client.id}/task/${this.task.id}/mark-message-read`, {
          userId: this.store.currentUser.id
        })
      }
    },

    editMessage (event) {
      if (!event.message || !event.message.id) {
        this.isSending = false
        return
      }
      axios.patch(`/api/v1/client/${event.clientId}/task/${this.task.id}/message/${event.message.id}`, {
        text: event.text
      })
        .then(response => {
          const updatedMessage = response.data
          updatedMessage.date = new Date(updatedMessage.date)
          if (updatedMessage.editedAt) {
            updatedMessage.editedAt = new Date(updatedMessage.editedAt)
          }
          const localMessage = this.task.messages.find(m => Number(m.id) === Number(updatedMessage.id))
          if (localMessage) {
            Object.assign(localMessage, updatedMessage)
          }
          this.inputField = ''
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close',
              color: 'white',
              dense: true,
              handler: () => undefined
            }]
          }))
        .finally(() => {
          this.isSending = false
        })
    },

    getDefaultTaskType () {
      return this.taskTypes.find(taskType => taskType.defaultSelection === true) ||
        this.taskTypes.find(taskType => taskType.type === 'Запрос') ||
        this.taskTypes[0] ||
        null
    },
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    },

    isTaskDialogOperator () {
      return ['ADMIN', 'OPERATOR'].includes(this.store.currentUser.authorities[0])
    },

    visibleTaskDialogOnboardingSteps () {
      return this.taskDialogOnboardingSteps.filter(step => {
        if (step.requiresExistingTask && this.isNewTask) {
          return false
        }
        if (step.requiresOperator && !this.isTaskDialogOperator) {
          return false
        }
        if (step.skipOnChatRoute && this.$route.path.includes('chats')) {
          return false
        }
        return true
      })
    },

    currentTaskDialogOnboardingStep () {
      return this.visibleTaskDialogOnboardingSteps[this.taskDialogOnboardingStepIndex] || this.visibleTaskDialogOnboardingSteps[0] || {}
    },

    isLastTaskDialogOnboardingStep () {
      return this.taskDialogOnboardingStepIndex >= this.visibleTaskDialogOnboardingSteps.length - 1
    },

    getClientName () {
      const client = this.task?.client || this.client
      if (!client) {
        return ''
      }
      return `${client.lastname || ''} ${client.firstname || ''}`.trim()
    },

    getLinkedMessage () {
      const message = this.getNewTaskFromMessage()
      if (!message) {
        return []
      }
      return [
        {
          ...message,
          id: null,
          client: null
        }
      ]
    },

    selectedTaskType () {
      return this.taskTypes.find(taskType => taskType.type === this.dialogTaskType) || null
    },

    selectedTaskTypeChecklist () {
      return this.normalizeChecklist(this.selectedTaskType?.checklistTemplate)
    },
  },

  watch: {
    getPossibilityToOpenDialogTask (value) {
      if (value) {
        this.getTaskField()
        if (!this.isNewTask && this.taskRightTab === 'history') {
          this.loadTaskHistory()
        }
        this.$nextTick(() => {
          setTimeout(() => this.startTaskDialogOnboarding(false), 450)
        })
      } else {
        this.stopTaskDialogOnboarding()
      }
    },

    dialogTaskStatus: {
      deep: true,
      handler (oldVal, newVal) {
        if (oldVal !== '' && newVal !== '') {
          if (this.dialogTaskStatus === 'Заморожена') {
            this.freezeDialog = true
          }
        }
      }
    },

    taskRightTab (value) {
      if (value === 'history') {
        this.loadTaskHistory()
      }
    },

    'task.id' () {
      this.taskHistory = []
      if (this.taskRightTab === 'history') {
        this.loadTaskHistory()
      }
    }
  },

  mounted () {
    this.loadTaskTypes()
      .finally(() => {
        this.getTaskField()
        const currentTaskId = this.getCurrentTaskId()
        if (!this.isNewTask && currentTaskId) {
          axios.post(`/api/v1/client/${this.client.id}/task/${currentTaskId}/mark-message-read`, { userId: this.store.currentUser.id })
        }
        if (this.taskRightTab === 'history') {
          this.loadTaskHistory()
        }
        this.$nextTick(() => {
          setTimeout(() => this.startTaskDialogOnboarding(false), 450)
        })
        this.taskMessageUnsubscribe = onTaskMessage(this.onTaskMessage)
      })
  },

  beforeUnmount () {
    if (this.taskMessageUnsubscribe) {
      this.taskMessageUnsubscribe()
      this.taskMessageUnsubscribe = null
    }
    this.removeTaskDialogOnboardingListeners()
  },

  setup () {
    const store = useStore()
    const router = useRoute()
    return {
      store,
      router
    }
  }
}
</script>

<style scoped>
.small-text {
  font-size: 0.9em;
}

th {
  text-align: left;
}

.flex-item {
  flex: 0 0 48%;
  min-height: 0;
}

.task-dialog-card {
  display: flex;
  flex-direction: column;
  height: min(720px, calc(100vh - 96px));
  max-height: calc(100vh - 96px);
  overflow: hidden;
}

.task-dialog-card.large-dialog-width {
  height: min(800px, calc(100vh - 96px));
}

.task-dialog-card.dialog-width {
  height: auto;
  max-height: calc(100vh - 96px);
}

.task-dialog-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.task-dialog-actions {
  flex: 0 0 auto;
  margin: 8px 7px 8px 0;
  background: white;
  z-index: 2;
}

.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  height: 100%;
  min-height: 0;
}

.task-left-panel {
  overflow-y: auto;
  overflow-x: hidden;
}

.task-left-panel > .q-card {
  min-height: 100%;
}

.task-right-panel {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-height: 0;
  height: 100%;
}

.task-right-tabs {
  flex: 0 0 auto;
  min-height: 40px;
}

.task-right-panels {
  flex: 1 1 auto;
  height: 100%;
  max-height: none;
  min-height: 0;
  overflow: hidden;
}

.task-right-panels :deep(.q-panel) {
  height: 100%;
  min-height: 0;
}

.task-right-panels :deep(.q-tab-panel) {
  height: 100%;
  min-height: 0;
}

.task-messages-panel {
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.task-checklist-panel {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.task-history-panel {
  position: relative;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.task-history-description {
  white-space: pre-line;
}

.no-border-card {
  border: none;
  box-shadow: none;
}

.custom-select .q-field__label {
  font-size: 16px;
}

.task-dialog-onboarding-layer {
  position: fixed;
  inset: 0;
  z-index: 10000;
  pointer-events: auto;
}

.task-dialog-onboarding-spotlight {
  position: fixed;
  z-index: 10001;
  border: 2px solid var(--q-primary);
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  pointer-events: none;
  transition: top 0.18s ease, left 0.18s ease, width 0.18s ease, height 0.18s ease;
}

.task-dialog-onboarding-tooltip {
  position: fixed;
  z-index: 10002;
  max-width: calc(100vw - 24px);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.24);
  pointer-events: auto;
}

.task-dialog-onboarding-progress {
  text-align: right;
}

.task-checklist-item {
  padding: 4px 8px;
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

.task-type-checklist-dialog {
  width: 460px;
  max-width: calc(100vw - 32px);
}

.task-checklist-draggable-list {
  width: 100%;
}

.task-checklist-drag-handle {
  cursor: grab;
  user-select: none;
}

.task-checklist-drag-handle:active {
  cursor: grabbing;
}

.ghost {
  opacity: 0.5;
}
</style>
