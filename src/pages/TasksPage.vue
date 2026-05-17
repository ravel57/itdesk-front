<template>
  <q-page
    padding
    style="display: flex; flex-direction: column; height: 100vh; min-height: 0; padding-bottom: 0; overflow: hidden"
  >
    <div id="task-control-container" style="display: flex;flex-direction: column;">
      <div :style="this.isMobile ? 'display: flex; flex-direction: column;' : 'display: flex'">
        <div style="display: flex; width: 100%;">
          <q-input
            outlined
            dense
            v-model="this.searchRequest"
            label="Поиск"
            style="width: 100%; align-content: center; min-width: 300px; padding-right: 8px"
            :style="this.isMobile ? 'padding-right: 0;' : ''"
            clearable
          />
        </div>
        <div
          style="display: flex; height: 40px;"
          :style="this.isMobile ? 'margin-top: 8px;flex-wrap: wrap;justify-content: center;height: auto;' : ''"
        >
          <q-btn-dropdown
            v-if="!this.isShowTableMode"
            color="primary"
            dense
            :label="this.selectedGroupType.label"
            style="align-content: center;padding-left: 8px;"
            :style="this.isMobile ? 'width: 100%' : ''"
          >
            <template v-slot:label>
              <q-tooltip>
                Группировка
              </q-tooltip>
            </template>
            <q-list>
              <q-item
                v-for="(grouper, index) in this.getFilterType"
                :key="index"
                clickable
                v-close-popup
                @click="this.selectedGroupType = grouper"
              >
                <q-item-section>
                  <q-item-label>{{ grouper.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <div
            style="display: flex; flex-direction: row;flex-wrap: nowrap; margin-left: 8px;"
            :style=" this.isMobile && this.isShowTableMode ? 'justify-content: center; width: 100%;' : ''"
          >
            <q-btn
              icon="filter_alt"
              flat
              @click="this.changeFilterSelection"
              :color="this.isFilterSelected ? 'primary' : 'dark'"
            >
              <q-tooltip>
                {{ this.isFilterSelected ? "Деактивировать фильтр" : "Активировать фильтр" }}
              </q-tooltip>
            </q-btn>
            <div class="task-toolbar-action-slot">
              <template v-if="!this.isShowTableMode">
                <q-btn
                  icon="sort"
                  flat
                  color="dark"
                >
                  <q-tooltip>
                    <div v-if="this.selectedSorting.label">
                      Сортировка: {{ this.selectedSorting.label }}
                    </div>
                    <div v-else>
                      Сортировка
                    </div>
                  </q-tooltip>

                  <q-menu
                    anchor="bottom middle"
                    self="top middle"
                    v-model="this.sortMenuOpened"
                    content-class="menu-content"
                  >
                    <q-list>
                      <q-item
                        v-for="sorting in this.sortingTypes"
                        :key="sorting.slug"
                        clickable
                        v-close-popup
                        @click="this.setSortVariable(sorting)"
                      >
                        <q-item-section>
                          {{ sorting.label }}
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>

                <q-btn
                  v-if="this.selectedSorting.label"
                  @click="this.changeSortingAsc"
                  flat
                  class="text-grey-7"
                  style="width: 20px"
                  :icon="this.ascendingSort ? 'arrow_upward' : 'arrow_downward'"
                >
                  <q-tooltip>
                    {{ this.ascendingSort ? 'По возрастанию' : 'По убыванию' }}
                  </q-tooltip>
                </q-btn>
              </template>

              <q-btn
                v-else
                icon="settings"
                flat
                class="text-grey-7"
                @click="this.isShowTableSettings = true"
              >
                <q-tooltip>
                  Настройки таблицы
                </q-tooltip>
              </q-btn>
            </div>

            <q-toggle
              v-model="this.isShowTableMode"
              color="grey"
              left-label
              checked-icon="list"
              unchecked-icon="dashboard"
              size="50px"
              keep-color
            >
              <q-tooltip>
                Режим отображения: {{ this.isShowTableMode ? "Таблица" : "Карточки" }}
              </q-tooltip>
            </q-toggle>
            <q-toggle
              v-model="this.isShowCompletedTasks"
              color="primary"
              left-label
              icon="add_task"
              size="50px"
            >
              <q-tooltip>
                Закрытые заявки: {{ this.isShowCompletedTasks ? "Показаны" : "Скрыты" }}
              </q-tooltip>
            </q-toggle>
            <q-btn
              icon="undo"
              flat
              class="text-grey-7"
              :disable="!this.canUndoBulkAction || this.isBulkHistoryProcessing"
              @click="this.undoBulkAction"
            >
              <q-tooltip>
                {{ this.bulkUndoTooltip }}
              </q-tooltip>
            </q-btn>
            <q-btn
              icon="redo"
              flat
              class="text-grey-7"
              :disable="!this.canRedoBulkAction || this.isBulkHistoryProcessing"
              @click="this.redoBulkAction"
            >
              <q-tooltip>
                {{ this.bulkRedoTooltip }}
              </q-tooltip>
            </q-btn>
          </div>
          <q-dialog
            v-model="dialogSaveFilterVisible"
            persistent
            backdrop-filter="blur(4px)"
          >
            <q-card class="dialog-width">
              <q-toolbar class="justify-between">
                <div class="text-h6" v-text="'Сохранить шаблон фильтров?'"/>
                <q-btn flat round dense icon="close" v-close-popup/>
              </q-toolbar>
              <q-card-section style="padding-top: 0">
                <q-input
                  label="Название"
                  v-model="this.dialogNewFilterName"
                  :rules="[val => (val && val.length > 0) || 'Обязательное поле']"
                  ref="dialogNewFilterName"
                />
                <div style="margin-bottom: 8px">
                  Условие между фильтрами: {{ this.filterJoinOperator === 'AND' ? 'И' : 'ИЛИ' }}
                </div>
                <div
                  style="white-space: pre-wrap"
                  v-for="(filter, index) in this.filterChain.map(it => ({label: it.label, selectedOptions: it.selectedOptions}))"
                  :key="index"
                >
                  {{ `${filter.label} : ${filter.selectedOptions.join(', ')}` }}
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn
                  color="white"
                  text-color="primary"
                  label="Закрыть"
                  @click="this.dialogSaveFilterClose"
                />
                <q-btn
                  color="primary"
                  label="Сохранить"
                  @click="saveFilter"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
      </div>
      <div
        v-if="this.isFilterSelected"
        id="filter-container"
        style="display: flex;margin-top: 8px; align-items: start;"
        :style="this.isMobile ? 'display:flex; flex-direction:row; flex-wrap: wrap; justify-content:center; width: 100%': ''"
      >
        <q-select
          v-model="this.selectedSavedFilter"
          :options="this.savedFilters.map(it => it.label)"
          label="Шаблоны фильтров"
          style="width: 12.5%; align-content: center; min-width: 300px; margin-right: 8px"
          :style="this.isMobile ? 'width: 100%; margin-bottom: 8px' : ''"
          @update:model-value="this.onSavedFilterSelected"
          outlined
          clearable
        />
        <q-select
          v-model="filterJoinOperator"
          :options="filterJoinOptions"
          label="Условие"
          emit-value
          map-options
          outlined
          dense
          style="margin-right: 8px; width: 120px"
          :style="this.isMobile ? 'width: 100%; margin-bottom: 8px' : 'margin-right: 8px; width: 120px'"
          @update:model-value="updateUrlWithFilterJoinOperator"
        />
        <div
          v-if="this.isFilterSelected"
          style="margin-right: 8px;height: 100%;overflow-x: scroll;"
          :style="isMobile ? 'width: 100%': ''"
        >
          <div style="display: flex;flex-direction: row; flex-wrap: nowrap">
            <div
              v-for="(filter, index) in this.filterChain"
              :key="index"
              style="display: flex; border-right: 16px; padding-right: 16px"
              :id="`filter_${filter.slug}`"
            >
              <q-select
                v-if="filter.slug !== 'deadline'"
                outlined
                :label="filter.label"
                multiple
                :options="this.filteredOptions[filter] ? this.filteredOptions[filter] : filter.options"
                use-chips
                use-input
                stack-label
                v-model="filter.selectedOptions"
                input-debounce="0"
                style="width: 250px; height: 100%; min-height: 56px;"
                behavior="menu"
                @input="filterFn(filter, $event)"
                @focus="onFilterFocused(filter)"
              >
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">
                      Нет результатов
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
              <q-input
                v-else
                v-model="filter.selectedOptions"
                clearable
                outlined
                :label="filter.isBeforeDeadline ? 'До дедлайна' : 'После дедлайна'"
                style="width: 250px; height: 100%; min-height: 56px;"
                @input="formatDateTime"
                mask="##.##.#### ##:##"
              >
                <template v-slot:prepend>
                  <q-btn
                    dense
                    flat
                    outline
                    :icon="filter.isBeforeDeadline ? 'arrow_downward' : 'arrow_upward'"
                    @click.stop="filter.isBeforeDeadline = !filter.isBeforeDeadline"
                  />
                </template>
                <template
                  v-slot:append
                >
                  <q-icon
                    name="event"
                    class="cursor-pointer"
                  >
                    <q-popup-proxy
                      ref="qDatePopup"
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date
                        v-model="filter.selectedOptions"
                        first-day-of-week="1"
                        locale="ru"
                        today-btn
                        :options="this.dateOption"
                        mask="DD.MM.YYYY HH:mm"
                        @update:model-value="this.$refs.qDatePopup.hide()"
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
              <q-btn
                icon="cancel"
                dense
                flat
                color="blue-grey"
                size="xs"
                icon-top
                class="vertical-top"
                style="height: 20px;"
                @click="deleteFilter(index)"
              />
            </div>
          </div>
        </div>
        <div style="display: flex;align-items: center;height: 55px;">
          <q-btn
            v-if="filterTypes.filter(o => !this.filterChain.map(fc=> fc.label).includes(o.label)).length > 0"
            flat
            color="grey"
            icon="add"
            @click="!this.isMenuActive"
          >
            <q-tooltip>
              Добавить фильтр
            </q-tooltip>
            <q-menu
              v-model="this.isMenuActive"
              anchor="bottom right"
              self="top right"
            >
              <q-list>
                <q-item
                  v-for="option in filterTypes.filter(o => !this.filterChain.map(fc=> fc.label).includes(o.label))"
                  :key="option.value"
                  clickable
                  @click="handleNewFilterSelection(option.label)"
                >
                  <q-item-section>{{ option.label }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <q-btn
            v-if="this.selectedSavedFilter.length === 0 && this.filterChain.length > 0"
            ref="saveFilterButton"
            icon="save"
            color="grey"
            @click="this.dialogSaveFilter"
            flat
            style="height: 40px"
          >
            <q-tooltip>
              Сохранить шаблон
            </q-tooltip>
          </q-btn>
          <q-btn
            v-else-if="this.isShowDelFilterPreset"
            ref="deleteSavedFilterButton"
            icon="delete"
            color="grey"
            @click="isDeleteSavedFilterDialogShow = true"
            flat
            style="height: 40px"
          >
            <q-tooltip>
              Удалить шаблон
            </q-tooltip>
          </q-btn>
          <q-btn
            v-if="this.filterChain.length > 0"
            icon="close"
            color="grey"
            @click="this.removeFilters"
            flat
            style="height: 40px"
          >
            <q-tooltip>
              Сбросить фильтр
            </q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
    <div
      v-if="getFilteredTasks.length > 0"
      class="tasks-page-content"
    >
      <tasks-component
        class="tasks-page-component"
        :isShowTableMode="this.isShowTableMode"
        :isMobile="this.isMobile"
        :tableRows="getTableRows"
        :isFilterSelected="this.isFilterSelected"
        :groupedTasks="this.getGroupedTasks"
        :selectedGroupType="this.selectedGroupType"
        :isNewTaskDialogShow="this.isNewTaskDialogShow"
        :isTaskDialogShow="this.isTaskDialogShow"
        :selectedTask="this.selectedTask"
        :activeColumns="this.activeColumns"
        @onTaskClicked="this.onTaskClicked"
        @closeDialog="this.closeDialog"
        @addMessageToTask="this.addMessageToTask"
      />
    </div>
    <div
      v-else
    >
      <div
        v-if="!this.isMobile"
        class="absolute-center"
      >
        <div v-if="this.filterChain.length > 0 || this.searchRequest.length > 0">
          <div style="display: flex;flex-direction: column;align-items: center;text-align: center">
            <div style="font-size: 20px">Заявок нет</div>
            <div style="margin-bottom: 8px">
              <q-btn
                icon="close"
                color="primary"
                @click="this.filterChain = []; this.filterJoinOperator = 'AND'; this.searchRequest = ''"
              >
                Сбросить фильтры
              </q-btn>
            </div>
            <div class="">
              <q-btn
                v-if="!this.isShowCompletedTasks"
                icon="visibility"
                color="primary"
                outline
                @click="this.isShowCompletedTasks = true"
              >
                Показать закрытые и замороженные
              </q-btn>
            </div>
            <no-tasks-placeholder/>
          </div>
        </div>
        <div v-else style="display: flex;flex-direction: row;align-items: center">
          <div style="width: 140px">
            <div style="font-size: 20px">
              Заявок нет
            </div>
            <div style="font-size: 14px">
              Возможно стоит создать их
            </div>
            <div style="font-size: 14px">
              <a style="color: var(--q-primary)" href="/chats">Проверьте чаты.</a>
            </div>
          </div>
          <div style="display: flex;flex-direction: column;align-items: center">
            <no-tasks-placeholder/>
            <q-btn
              v-if="!this.isShowCompletedTasks"
              icon="visibility"
              color="primary"
              outline
              @click="this.isShowCompletedTasks = true"
            >
              Показать закрытые и замороженные
            </q-btn>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="this.isShowBulkActionsMenu"
      class="mass-container"
      :class="{ 'mass-container--mobile': this.isMobile }"
    >
      <q-page class="shadow-1" style="min-height: 0; padding: 0; border-radius: 5px;display: flex">
        <q-btn v-if="!this.showOpenTaskBtn" class="mass-actions-btn" flat text-color="white" icon="check_circle"
               @click="this.openBulkModal('close')">
          <q-tooltip>Закрыть заявки</q-tooltip>
        </q-btn>
        <q-btn v-if="this.showOpenTaskBtn" class="mass-actions-btn" flat text-color="white" icon="cancel"
               @click="this.openBulkModal('open')">
          <q-tooltip>Открыть заявку</q-tooltip>
        </q-btn>
        <q-btn class="mass-actions-btn" flat text-color="white" icon="ac_unit" @click="this.openBulkModal('freeze')">
          <q-tooltip>Заморозить заявки</q-tooltip>
        </q-btn>
        <q-btn class="mass-actions-btn" flat text-color="white" icon="manage_accounts"
               @click="this.openBulkModal('executor')">
          <q-tooltip>Сменить исполнителя заявок</q-tooltip>
        </q-btn>
        <q-btn class="mass-actions-btn" flat text-color="white" icon="clear_all" @click="this.openBulkModal('status')">
          <q-tooltip>Изменить статус заявок</q-tooltip>
        </q-btn>
        <q-btn class="mass-actions-btn" flat text-color="white" icon="star_half"
               @click="this.openBulkModal('priority')">
          <q-tooltip>Изменить приоритет заявок</q-tooltip>
        </q-btn>
        <q-btn class="mass-actions-btn" flat text-color="white" icon="category"
               @click="this.openBulkModal('type')">
          <q-tooltip>Изменить тип заявки</q-tooltip>
        </q-btn>
        <q-btn class="mass-actions-btn" flat text-color="white" icon="sell" @click="this.openBulkModal('tags')">
          <q-tooltip>Изменить теги заявок</q-tooltip>
        </q-btn>
        <q-btn class="mass-actions-btn" flat text-color="white" icon="today" @click="this.openBulkModal('deadline')">
          <q-tooltip>Изменить дедлайн заявок</q-tooltip>
        </q-btn>
        <q-separator
          style="background-color: rgba(108, 108, 108, 1) !important;padding: 0;margin: 14px 10px;"
          :style="this.isMobile ? 'margin-left: 8px': ''"
          vertical
        />
        <div class="mass-actions-counter mass-actions-btn">
          {{ this.store.checkedTasks.length }}
        </div>
        <q-btn class="mass-actions-btn" style="margin-left: 4px" flat text-color="white" icon="disabled_by_default"
               @click="this.store.checkedTasks = []">
          <q-tooltip>Снять выделение</q-tooltip>
        </q-btn>
      </q-page>
    </div>
  </q-page>
  <q-dialog
    v-model="this.isDeleteSavedFilterDialogShow"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card class="dialog-width">
      <q-toolbar class="justify-end">
        <q-btn flat round dense icon="close" v-close-popup/>
      </q-toolbar>
      <q-card-section style="padding-top: 0">
        Удалить фильтр {{ this.selectedSavedFilter }}?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="primary"
          label="Отмена"
          @click="this.isDeleteSavedFilterDialogShow = false"
        />
        <q-btn
          color="primary"
          label="Удалить"
          @click="deleteSavedFilter"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog
    v-model="this.isModalForBulkActions"
    persistent
    @hide="this.clearBulkActionReason"
  >
    <task-bulk-actions-modal
      :key="this.action"
      :action="this.action"
      :status-change-reason="this.bulkStatusChangeReason"
      :request-status-change-reason="this.requestBulkStatusChangeReason"
      @updateTask="this.updateTask"
      @close="this.closeBulkActionModal"
    />
  </q-dialog>
  <q-dialog v-model="this.isShowTableSettings" persistent>
    <q-card style="width: 500px">
      <q-card-section class="row items-center q-pb-none text-h6">
        <q-toolbar class="justify-between">
          <div class="text-h6">Настройка колонок таблицы</div>
          <div class="">
            <q-btn
              flat
              round
              dense
              icon="close"
              v-close-popup
            />
          </div>
        </q-toolbar>
      </q-card-section>
      <q-card-section class="row items-center">
        <draggable
          :list="this.activeColumns"
          item-key="id"
          class="list-group"
          ghost-class="ghost"
          style="width: 100%"
          @start="dragging = true"
          @end="dragging = false"
        >
          <template #item="{ element }">
            <q-item
              class="list-group-item"
              :class="{ 'not-draggable': true }"
              style="cursor: grab;"
            >
              <q-item-section
                top
                style="justify-content: center"
              >
                {{ element.label }}
              </q-item-section>
              <q-item-section
                top
                side
              >
                <div class="">
                  <input class="radio-select" type="checkbox" :checked="element.active"
                         @click.stop="element.active = !element.active">
                  <q-tooltip>
                    {{ element.active ? 'Скрыть колонку' : 'Отобразить колонку' }}
                  </q-tooltip>
                </div>
              </q-item-section>
            </q-item>
          </template>
        </draggable>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Применить" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog
    v-model="this.isBulkReasonDialogShow"
    persistent
  >
    <q-card style="width: 520px; max-width: 95vw;">
      <q-toolbar class="justify-between">
        <div class="text-h6">
          {{ this.getBulkReasonDialogTitle() }}
        </div>

        <q-btn
          flat
          round
          dense
          icon="close"
          @click="this.cancelBulkReasonDialog"
        />
      </q-toolbar>

      <q-card-section>
        <div class="text-body2 q-mb-md">
          {{ this.getBulkReasonDialogMessage() }}
        </div>

        <q-input
          v-model="this.bulkStatusChangeReason"
          type="textarea"
          autogrow
          autofocus
          label="Причина *"
          :error="this.bulkReasonError"
          error-message="Обязательное поле"
          @keyup.ctrl.enter="this.confirmBulkReasonDialog"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          color="primary"
          label="Отмена"
          @click="this.cancelBulkReasonDialog"
        />

        <q-btn
          color="primary"
          label="Продолжить"
          @click="this.confirmBulkReasonDialog"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import {useStore} from 'stores/store'
import {useRoute} from 'vue-router'
import axios from 'axios'
import TasksComponent from 'components/tasks/TasksComponent.vue'
import TaskBulkActionsModal from 'components/tasks/TaskBulkActionsModal.vue'
import NoTasksPlaceholder from 'components/NoTasksPlaceholder.vue'
import moment from 'moment/moment'
import draggable from 'vuedraggable'

export default {

  components: {draggable, NoTasksPlaceholder, TaskBulkActionsModal, TasksComponent},

  data: () => ({
    filterTypes: [
      {label: 'Исполнитель', slug: 'executor'},
      {label: 'Тег', slug: 'tag'},
      {label: 'Организация', slug: 'organization'},
      {label: 'Приоритет', slug: 'priority'},
      {label: 'Статус', slug: 'status'},
      {label: 'Клиент', slug: 'client'},
      {label: 'Тип заявки', slug: 'type'},
      {label: 'Дедлайн', slug: 'deadline', isBeforeDeadline: false},
    ],
    selectedGroupType: {label: 'Исполнитель', slug: 'executor'},
    sortingTypes: [
      {label: 'По дедлайну', slug: 'deadline'},
      {label: 'По дате создания', slug: 'creating'},
      {label: 'Приоритету', slug: 'priority'},
      {label: 'SLA', slug: 'sla'},
      {label: 'По статусу', slug: 'status'}
    ],
    activeColumns: [
      {name: 'id', label: 'ID', active: true},
      {name: 'name', label: 'Название', active: true},
      {name: 'type', label: 'Тип', active: true},
      {name: 'checklist', label: 'Чек-лист', active: true},
      {name: 'tags', label: 'Теги', active: true},
      {name: 'priority', label: 'Приоритет', active: true},
      {name: 'createdAt', label: 'Создана', active: true},
      {name: 'status', label: 'Статус', active: true},
      {name: 'deadline', label: 'Дедлайн', active: true},
      {name: 'executor', label: 'Исполнитель', active: true},
      {name: 'sla', label: 'SLA', active: true}
    ],
    filterChain: [],
    addNewFilterSelectorText: '',
    selectedOptions: [],
    savedFilters: [],
    selectedSavedFilter: '',
    dialogNewFilterName: '',
    dialogSaveFilterVisible: false,
    isShowTableMode: false,
    isMenuActive: false,
    isFilterSelected: false,
    isDeleteSavedFilterDialogShow: false,
    isFilterOpen: true,
    isShowCompletedTasks: false,
    searchRequest: '',
    selectedTask: {},
    isNewTaskDialogShow: false,
    isTaskDialogShow: false,
    isShowDelFilterPreset: false,
    isModalForBulkActions: false,
    isShowBulkActionsMenu: false,
    ascendingSort: true,
    isShowTableSettings: false,

    action: 'close',

    pendingBulkAction: null,
    bulkStatusChangeReason: '',
    isBulkReasonDialogShow: false,
    bulkReasonError: false,
    bulkReasonResolve: null,
    bulkReasonDialogTitle: '',
    bulkReasonDialogMessage: '',
    bulkActionHistory: [],
    bulkActionRedoHistory: [],
    pendingBulkActionHistory: null,
    bulkActionHistoryFinishTimer: null,
    isBulkHistoryProcessing: false,
    maxBulkActionHistorySize: 20,

    selectedSorting: [],
    sortMenuOpened: [],
    filteredOptions: {},
    filterJoinOperator: 'AND',
    filterJoinOptions: [
      {label: 'И', value: 'AND'},
      {label: 'ИЛИ', value: 'OR'}
    ],
    currentExecutorLabel: 'Вы',
    unassignedExecutorLabel: 'Без исполнителя',
    slaInfoByTaskId: {},
    slaInfoLoadingByTaskId: {},
    nowTs: Date.now(),
    slaTimer: null,
    selectedTaskType: null,
  }),

  methods: {
    dateOption(date) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return date >= `${year}/${month}/${day}`
    },

    filterFn(filter, input) {
      const value = input.target.value.toLowerCase()
      if (value) {
        this.filteredOptions[filter] = filter.options.filter(option =>
          option.toLowerCase().includes(value)
        )
      } else {
        this.filteredOptions[filter] = filter.options
      }
    },

    onFilterFocused(filter) {
      this.filteredOptions[filter] = filter.options
    },

    handleNewFilterSelection(label) {
      this.isMenuActive = false
      const slug = this.filterTypes.filter(el => el.label === label)[0].slug
      let options
      switch (slug) {
        case 'executor':
          options = this.executors
          break
        case 'tag':
          options = this.tags
          break
        case 'organization':
          options = this.organizations
          break
        case 'priority':
          options = this.priorities
          break
        case 'status':
          options = this.statuses
          break
        case 'client':
          options = this.clients
          break
        case 'type':
          options = this.taskTypes
          break
        default:
          options = null
          break
      }
      this.filterChain.push({label, options, selectedOptions: [], slug})
      this.addNewFilterSelectorText = ''
      this.isFilterOpen = false
    },

    deleteFilter(index) {
      this.filterChain.splice(index, 1)
      this.selectedSavedFilter = ''
    },

    saveFilter() {
      if (this.dialogNewFilterName.length > 0) {
        const newFilter = {
          id: null,
          label: this.dialogNewFilterName,
          filterJoinOperator: this.filterJoinOperator,
          selectedOptions: this.normalizeFiltersForSave(this.filterChain)
        }
        axios.post('/api/v1/filter', newFilter)
          .then(response => {
            this.savedFilters.push(response.data)
            this.dialogSaveFilterClose()
            this.selectedSavedFilter = response.data.label
          })
          .catch(e =>
            this.$q.notify({
              message: e.message,
              type: 'negative',
              position: 'top-right',
              actions: [{
                icon: 'close', color: 'white', dense: true, handler: () => undefined
              }]
            }))
      } else {
        this.$q.notify({
          message: 'Необходимо задать имя фильтра',
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        })
      }
    },

    onSavedFilterSelected() {
      const filterElement = this.savedFilters.find(el => this.selectedSavedFilter === el.label)
      if (filterElement !== undefined) {
        this.isApplyingSavedFilter = true
        this.filterJoinOperator = this.isValidFilterJoinOperator(filterElement.filterJoinOperator)
          ? filterElement.filterJoinOperator
          : 'AND'
        this.filterChain = structuredClone(filterElement.selectedOptions || [])
        this.filterChain.forEach(it => {
          const filterType = this.filterTypes.find(el => el.label === it.label)
          if (!filterType) {
            return
          }
          it.slug = filterType.slug
          switch (it.slug) {
            case 'executor':
              it.options = this.executors
              break
            case 'tag':
              it.options = this.tags
              break
            case 'organization':
              it.options = this.organizations
              break
            case 'priority':
              it.options = this.priorities
              break
            case 'status':
              it.options = this.statuses
              break
            case 'client':
              it.options = this.clients
              break
            case 'type':
              it.options = this.taskTypes
              break
            default:
              it.options = null
              break
          }
        })
        this.isFilterSelected = true
        this.updateUrlWithFilterChain(this.filterChain)
        this.$nextTick(() => {
          this.isApplyingSavedFilter = false
        })
      } else {
        this.selectedSavedFilter = ''
        this.filterChain = []
      }
    },

    dialogSaveFilter() {
      this.dialogSaveFilterVisible = true
      this.dialogNewFilterName = ''
      setTimeout(() => this.$refs.dialogNewFilterName.focus(), 250)
    },

    dialogSaveFilterClose() {
      this.dialogSaveFilterVisible = false
    },

    deleteSavedFilter() {
      const filterId = this.savedFilters.find(filter => this.selectedSavedFilter === filter.label).id
      axios.delete(`/api/v1/filter/${filterId}`)
        .then(() => {
          this.savedFilters = this.savedFilters.filter(filter => this.selectedSavedFilter !== filter.label)
          this.selectedSavedFilter = ''
          this.isDeleteSavedFilterDialogShow = false
          this.filterChain = []
        })
        .catch(e =>
          this.$q.notify({
            message: e.message,
            type: 'negative',
            position: 'top-right',
            actions: [{
              icon: 'close', color: 'white', dense: true, handler: () => undefined
            }]
          }))
    },

    changeFilterSelection() {
      this.isFilterSelected = !this.isFilterSelected
      const queryParams = new URLSearchParams(window.location.search)
      if (queryParams.get('filterChain') || queryParams.get('filterJoinOperator')) {
        queryParams.delete('filterChain')
        queryParams.delete('filterJoinOperator')
        this.$router.push({path: this.$route.path, query: Object.fromEntries(queryParams.entries())})
      }
    },

    getOrganizationName(task) {
      if (task) {
        return task.client.organization
          ? task.client.organization.name
          : ''
      } else {
        return ''
      }
    },

    removeFilters() {
      this.selectedSavedFilter = ''
      this.filterJoinOperator = 'AND'
      this.filterChain = []
    },

    base64EncodeUnicode(str) {
      return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
          return String.fromCharCode(`0x${p1}`)
        })
      )
    },

    base64DecodeUnicode(str) {
      return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
        return `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`
      }).join(''))
    },

    updateUrlWithFilterChain(filterChain) {
      const queryParams = new URLSearchParams(window.location.search)
      if (filterChain.length) {
        queryParams.set('filterChain', this.base64EncodeUnicode(JSON.stringify(filterChain)))
        queryParams.set('filterJoinOperator', this.filterJoinOperator)
      } else {
        queryParams.delete('filterChain')
        queryParams.delete('filterJoinOperator')
      }
      this.$router.push({path: this.$route.path, query: Object.fromEntries(queryParams.entries())})
    },

    initializeFilterChainFromUrl() {
      const queryParams = new URLSearchParams(window.location.search)
      const filterChainFromUrl = queryParams.get('filterChain')
      const filterJoinOperatorFromUrl = queryParams.get('filterJoinOperator')

      this.filterJoinOperator = this.isValidFilterJoinOperator(filterJoinOperatorFromUrl)
        ? filterJoinOperatorFromUrl
        : 'AND'

      if (filterChainFromUrl) {
        try {
          this.filterChain = JSON.parse(this.base64DecodeUnicode(filterChainFromUrl))
          this.filterChain.forEach(filter => {
            const filterType = this.filterTypes.find(el => el.label === filter.label)
            if (!filterType) {
              return
            }
            filter.slug = filterType.slug
            switch (filter.slug) {
              case 'executor':
                filter.options = this.executors
                break
              case 'tag':
                filter.options = this.tags
                break
              case 'organization':
                filter.options = this.organizations
                break
              case 'priority':
                filter.options = this.priorities
                break
              case 'status':
                filter.options = this.statuses
                break
              case 'client':
                filter.options = this.clients
                break
              case 'type':
                filter.options = this.taskTypes
                break
              default:
                filter.options = null
                break
            }
          })
          this.isFilterSelected = true
        } catch (e) {
          console.error(e)
        }
      } else {
        this.filterChain = []
      }
    },

    normalizeFilterForSave(filter) {
      const normalizedFilter = {
        label: filter.label,
        selectedOptions: Array.isArray(filter.selectedOptions)
          ? [...filter.selectedOptions]
          : filter.selectedOptions
      }
      if (filter.isBeforeDeadline !== undefined) {
        normalizedFilter.isBeforeDeadline = filter.isBeforeDeadline
      }
      return normalizedFilter
    },

    normalizeFiltersForSave(filters) {
      return filters.map(filter => this.normalizeFilterForSave(filter))
    },

    isCurrentSavedFilterChanged() {
      if (!this.selectedSavedFilter) {
        return false
      }
      const savedFilter = this.savedFilters.find(filter => this.selectedSavedFilter === filter.label)
      if (!savedFilter) {
        return false
      }
      const savedJoinOperator = savedFilter.filterJoinOperator || 'AND'
      const currentJoinOperator = this.filterJoinOperator || 'AND'
      if (savedJoinOperator !== currentJoinOperator) {
        return true
      }
      const savedFilters = this.normalizeFiltersForSave(savedFilter.selectedOptions || [])
      const currentFilters = this.normalizeFiltersForSave(this.filterChain || [])
      return JSON.stringify(savedFilters) !== JSON.stringify(currentFilters)
    },

    onTaskClicked(task) {
      this.isTaskDialogShow = true
      this.selectedTask = task
      this.updateUrlWithTask(task.id)
    },

    closeDialog() {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.delete('task')
      this.$router.push({path: this.$route.path, query: Object.fromEntries(queryParams.entries())})
      this.isNewTaskDialogShow = false
      this.isTaskDialogShow = false
    },

    updateUrlWithTask(openedTaskId) {
      const queryParams = new URLSearchParams(window.location.search)
      queryParams.set('task', openedTaskId)
      this.$router.push({path: this.$route.path, query: Object.fromEntries(queryParams.entries())})
    },

    initializeTaskFromUrl() {
      const queryParams = new URLSearchParams(window.location.search)
      const taskIdFromUrl = queryParams.get('task')
      if (!taskIdFromUrl && this.isTaskDialogShow) {
        this.closeDialog()
      }
      if (taskIdFromUrl) {
        const taskFromUrl = this.store.getTasks.find(task => task.id === Number(taskIdFromUrl))
        if (taskFromUrl.completed) {
          this.isShowCompletedTasks = true
        }
        this.onTaskClicked(taskFromUrl)
      } else {
        this.isNewTaskDialogShow = false
      }
    },

    updateTask(task, newTask) {
      const updatedTask = newTask?.data || newTask || task?.data || task
      if (!updatedTask?.id) {
        return
      }

      this.trackBulkActionHistoryAfterState(updatedTask)
      this.replaceTaskInLists(updatedTask)

      const history = this.pendingBulkActionHistory
      const delay = history && history.afterTasks.length >= history.taskIds.length ? 0 : 500
      this.scheduleFinishBulkActionHistory(delay)
    },

    cloneBulkTask(task) {
      const seen = new WeakSet()

      return JSON.parse(JSON.stringify(task, (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString()
        }

        if (typeof value === 'function' || typeof value === 'symbol') {
          return undefined
        }

        if (value && typeof value === 'object') {
          if (seen.has(value)) {
            return undefined
          }
          seen.add(value)
        }

        return value
      }))
    },

    getStoreTaskById(taskId) {
      return this.store.getTasks.find(task => task?.id === taskId) || null
    },

    getCheckedTaskById(taskId) {
      return this.store.checkedTasks.find(task => task?.id === taskId) || null
    },

    replaceTaskInLists(task) {
      const tasks = this.store.getTasks
      const taskIndex = tasks.findIndex(item => item?.id === task.id)
      if (taskIndex !== -1) {
        tasks.splice(taskIndex, 1, task)
      }

      const checkedTaskIndex = this.store.checkedTasks.findIndex(item => item?.id === task.id)
      if (checkedTaskIndex !== -1) {
        this.store.checkedTasks.splice(checkedTaskIndex, 1, task)
      }

      if (this.selectedTask?.id === task.id) {
        this.selectedTask = task
      }

      if (Object.prototype.hasOwnProperty.call(this.slaInfoByTaskId, task.id)) {
        const slaInfo = {...this.slaInfoByTaskId}
        delete slaInfo[task.id]
        this.slaInfoByTaskId = slaInfo
      }
    },

    beginBulkActionHistory(action) {
      if (this.bulkActionHistoryFinishTimer) {
        clearTimeout(this.bulkActionHistoryFinishTimer)
        this.bulkActionHistoryFinishTimer = null
      }

      const selectedTasks = this.store.checkedTasks
        .map(task => this.getStoreTaskById(task?.id) || task)
        .filter(task => task?.id)

      if (selectedTasks.length === 0) {
        this.pendingBulkActionHistory = null
        return
      }

      const clientIdsByTaskId = selectedTasks.reduce((acc, task) => {
        const clientId = this.getBulkTaskClientId(task)
        if (clientId) {
          acc[task.id] = clientId
        }
        return acc
      }, {})

      this.pendingBulkActionHistory = {
        action,
        createdAt: Date.now(),
        taskIds: selectedTasks.map(task => task.id),
        clientIdsByTaskId,
        beforeTasks: selectedTasks.map(task => this.cloneBulkTask(task)),
        afterTasks: []
      }
    },

    trackBulkActionHistoryAfterState(task) {
      const history = this.pendingBulkActionHistory
      if (!history || !task?.id || !history.taskIds.includes(task.id)) {
        return
      }

      const clientId = this.getBulkTaskClientId(task)
      if (clientId) {
        history.clientIdsByTaskId = {
          ...(history.clientIdsByTaskId || {}),
          [task.id]: clientId
        }
      }

      const afterTask = this.cloneBulkTask(task)
      const existingIndex = history.afterTasks.findIndex(item => item.id === task.id)
      if (existingIndex === -1) {
        history.afterTasks.push(afterTask)
      } else {
        history.afterTasks.splice(existingIndex, 1, afterTask)
      }
    },

    trackPendingBulkHistoryFromTasks(tasks) {
      const history = this.pendingBulkActionHistory
      if (!history || !Array.isArray(tasks)) {
        return
      }

      history.taskIds.forEach(taskId => {
        const task = tasks.find(item => item?.id === taskId)
        if (task?.id) {
          this.trackBulkActionHistoryAfterState(task)
        }
      })
    },

    getBulkHistoryAfterTask(taskId) {
      const history = this.pendingBulkActionHistory
      return history?.afterTasks.find(task => task.id === taskId) || this.getStoreTaskById(taskId) || this.getCheckedTaskById(taskId)
    },

    areBulkTasksEqual(firstTask, secondTask) {
      return JSON.stringify(this.cloneBulkTask(firstTask)) === JSON.stringify(this.cloneBulkTask(secondTask))
    },

    hasPendingBulkActionHistoryChanges() {
      const history = this.pendingBulkActionHistory
      if (!history) {
        return false
      }

      const beforeById = new Map(history.beforeTasks.map(task => [task.id, task]))
      return history.taskIds.some(taskId => {
        const beforeTask = beforeById.get(taskId)
        const afterTask = this.getBulkHistoryAfterTask(taskId)
        return beforeTask?.id && afterTask?.id && !this.areBulkTasksEqual(beforeTask, afterTask)
      })
    },

    scheduleFinishBulkActionHistory(delay = 0, force = false) {
      if (!this.pendingBulkActionHistory) {
        return
      }

      if (this.bulkActionHistoryFinishTimer) {
        clearTimeout(this.bulkActionHistoryFinishTimer)
      }

      this.bulkActionHistoryFinishTimer = setTimeout(() => {
        this.bulkActionHistoryFinishTimer = null
        this.finishBulkActionHistory(force)
      }, delay)
    },

    finishBulkActionHistory(force = false) {
      const history = this.pendingBulkActionHistory
      if (!history) {
        return
      }

      const beforeById = new Map(history.beforeTasks.map(task => [task.id, task]))
      const afterTasks = history.taskIds
        .map(taskId => this.getBulkHistoryAfterTask(taskId))
        .filter(task => task?.id)
        .map(task => this.cloneBulkTask(task))
        .filter(task => !this.areBulkTasksEqual(beforeById.get(task.id), task))
      const afterIds = new Set(afterTasks.map(task => task.id))
      const beforeTasks = history.beforeTasks.filter(task => afterIds.has(task.id))

      if (beforeTasks.length === 0 || afterTasks.length === 0) {
        if (!force && Date.now() - history.createdAt < 3500) {
          this.scheduleFinishBulkActionHistory(500)
          return
        }

        this.pendingBulkActionHistory = null
        return
      }

      this.pendingBulkActionHistory = null

      this.bulkActionHistory.push({
        action: history.action,
        createdAt: history.createdAt,
        clientIdsByTaskId: history.clientIdsByTaskId || {},
        beforeTasks,
        afterTasks
      })

      if (this.bulkActionHistory.length > this.maxBulkActionHistorySize) {
        this.bulkActionHistory.shift()
      }

      this.bulkActionRedoHistory = []
      this.showBulkHistorySavedNotify(history.action, afterTasks.length)
    },

    getBulkActionLabel(action) {
      switch (action) {
        case 'close':
          return 'закрытие заявок'
        case 'open':
          return 'возврат заявок в работу'
        case 'freeze':
          return 'заморозка заявок'
        case 'executor':
          return 'смена исполнителя'
        case 'status':
          return 'смена статуса'
        case 'priority':
          return 'смена приоритета'
        case 'type':
          return 'смена типа заявки'
        case 'tags':
          return 'смена тегов'
        case 'deadline':
          return 'смена дедлайна'
        default:
          return 'массовое действие'
      }
    },

    showBulkHistorySavedNotify(action, count) {
      this.$q.notify({
        message: `Массовое действие сохранено в истории: ${this.getBulkActionLabel(action)} (${count})`,
        type: 'info',
        position: 'top-right',
        timeout: 5000,
        actions: [
          {
            label: 'Отменить',
            color: 'white',
            handler: () => this.undoBulkAction()
          },
          {
            icon: 'close',
            color: 'white',
            dense: true,
            handler: () => undefined
          }
        ]
      })
    },

    sanitizeBulkTaskForSave(task) {
      const sanitizedTask = this.cloneBulkTask(task)
      delete sanitizedTask.originalSla
      delete sanitizedTask.slaInfo
      delete sanitizedTask.slaSecondsLeft
      delete sanitizedTask.slaPercent
      delete sanitizedTask.slaExpired
      delete sanitizedTask.checklistCompleted
      delete sanitizedTask.checklistTotal
      delete sanitizedTask._bulkClientId
      if (sanitizedTask.client && Array.isArray(sanitizedTask.client.tasks)) {
        delete sanitizedTask.client.tasks
      }
      return sanitizedTask
    },

    getBulkTaskClientId(task, fallbackTask = null, clientIdsByTaskId = {}) {
      const taskId = task?.id || fallbackTask?.id
      if (taskId && clientIdsByTaskId?.[taskId]) {
        return clientIdsByTaskId[taskId]
      }

      const candidates = [
        task,
        fallbackTask,
        taskId ? this.getStoreTaskById(taskId) : null,
        taskId ? this.getCheckedTaskById(taskId) : null
      ]

      for (const candidate of candidates) {
        const client = candidate?.client
        const clientId = candidate?._bulkClientId ||
          candidate?.clientId ||
          candidate?.client_id ||
          candidate?.client?.id ||
          candidate?.client?.clientId ||
          (typeof client === 'number' ? client : null)

        if (clientId) {
          return clientId
        }
      }

      return null
    },

    async saveBulkTaskSnapshot(task, fallbackTask = null, clientIdsByTaskId = {}) {
      const clientId = this.getBulkTaskClientId(task, fallbackTask, clientIdsByTaskId)
      if (!clientId) {
        throw new Error(`Не найден clientId для заявки ${task?.id || fallbackTask?.id || ''}`)
      }

      const response = await axios.patch(
        `/api/v1/client/${clientId}/task`,
        this.sanitizeBulkTaskForSave(task)
      )
      return response.data || task
    },

    async applyBulkHistorySnapshot(tasks, fallbackTasks = [], history = null) {
      const updatedTasks = []
      const fallbackById = new Map((fallbackTasks || []).map(task => [task.id, task]))
      const clientIdsByTaskId = history?.clientIdsByTaskId || {}

      for (const task of tasks) {
        const fallbackTask = fallbackById.get(task?.id) || null
        const savedTask = await this.saveBulkTaskSnapshot(task, fallbackTask, clientIdsByTaskId)
        const normalizedTask = savedTask?.id ? savedTask : task
        this.replaceTaskInLists(normalizedTask)
        updatedTasks.push(this.cloneBulkTask(normalizedTask))
      }
      return updatedTasks
    },

    async undoBulkAction() {
      if (this.pendingBulkActionHistory && this.hasPendingBulkActionHistoryChanges()) {
        if (this.bulkActionHistoryFinishTimer) {
          clearTimeout(this.bulkActionHistoryFinishTimer)
          this.bulkActionHistoryFinishTimer = null
        }
        this.finishBulkActionHistory(true)
      }

      if (!this.canUndoBulkAction || this.isBulkHistoryProcessing) {
        this.$q.notify({
          message: 'Нет массовых действий для отмены',
          type: 'warning',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
        return
      }

      const history = this.bulkActionHistory.pop()
      this.isBulkHistoryProcessing = true
      try {
        const restoredTasks = await this.applyBulkHistorySnapshot(history.beforeTasks, history.afterTasks, history)
        this.bulkActionRedoHistory.push({
          ...history,
          clientIdsByTaskId: history.clientIdsByTaskId || {},
          beforeTasks: restoredTasks,
          afterTasks: history.afterTasks
        })
        this.$q.notify({
          message: `Отменено: ${this.getBulkActionLabel(history.action)} (${restoredTasks.length})`,
          type: 'positive',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
      } catch (e) {
        this.bulkActionHistory.push(history)
        this.$q.notify({
          message: e.message || 'Не удалось отменить массовое действие',
          type: 'negative',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
      } finally {
        this.isBulkHistoryProcessing = false
      }
    },

    async redoBulkAction() {
      if (!this.canRedoBulkAction || this.isBulkHistoryProcessing) {
        return
      }

      const history = this.bulkActionRedoHistory.pop()
      this.isBulkHistoryProcessing = true
      try {
        const redoneTasks = await this.applyBulkHistorySnapshot(history.afterTasks, history.beforeTasks, history)
        this.bulkActionHistory.push({
          ...history,
          clientIdsByTaskId: history.clientIdsByTaskId || {},
          beforeTasks: history.beforeTasks,
          afterTasks: redoneTasks
        })
        this.$q.notify({
          message: `Повторено: ${this.getBulkActionLabel(history.action)} (${redoneTasks.length})`,
          type: 'positive',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
      } catch (e) {
        this.bulkActionRedoHistory.push(history)
        this.$q.notify({
          message: e.message || 'Не удалось повторить массовое действие',
          type: 'negative',
          position: 'top-right',
          actions: [{icon: 'close', color: 'white', dense: true, handler: () => undefined}]
        })
      } finally {
        this.isBulkHistoryProcessing = false
      }
    },

    showBulkActionModal(action) {
      this.action = action
      this.pendingBulkActionHistory = null

      try {
        this.beginBulkActionHistory(action)
      } catch (e) {
        console.error('Не удалось создать снимок заявок для undo/redo', e)
        this.pendingBulkActionHistory = null
      }

      this.isModalForBulkActions = false
      this.$nextTick(() => {
        this.isModalForBulkActions = true
      })
    },

    openBulkModal(action) {
      this.pendingBulkAction = action
      if (this.isBulkReasonRequired(action)) {
        this.bulkStatusChangeReason = ''
        this.bulkReasonError = false
        this.isBulkReasonDialogShow = true
        return
      }
      this.showBulkActionModal(action)
    },

    isBulkReasonRequired(action) {
      return ['close', 'open'].includes(action)
    },

    getBulkReasonDialogTitle() {
      if (this.bulkReasonDialogTitle) {
        return this.bulkReasonDialogTitle
      }

      switch (this.pendingBulkAction) {
        case 'close':
          return 'Причина закрытия заявок'
        case 'open':
          return 'Причина возврата заявок в работу'
        default:
          return 'Причина изменения заявок'
      }
    },

    getBulkReasonDialogMessage() {
      if (this.bulkReasonDialogMessage) {
        return this.bulkReasonDialogMessage
      }

      const count = this.store.checkedTasks.length

      switch (this.pendingBulkAction) {
        case 'close':
          return `Будет закрыто заявок: ${count}. Укажите причину закрытия.`
        case 'open':
          return `Будет возвращено в работу заявок: ${count}. Укажите причину возврата.`
        default:
          return `Будет изменено заявок: ${count}. Укажите причину.`
      }
    },

    getStatusName(status) {
      if (!status) {
        return ''
      }

      return typeof status === 'string' ? status : status.name || ''
    },

    isClosedStatusName(statusName) {
      return ['закрыта', 'закрыто', 'закрыт'].includes(String(statusName || '').trim().toLowerCase())
    },

    isFrozenStatusName(statusName) {
      return ['заморожена', 'заморожено', 'заморожен'].includes(String(statusName || '').trim().toLowerCase())
    },

    isOpenStatusName(statusName) {
      return !!statusName && !this.isClosedStatusName(statusName) && !this.isFrozenStatusName(statusName)
    },

    needBulkStatusChangeReason(oldStatusName, newStatusName, task = null) {
      const oldName = String(oldStatusName || '').trim()
      const newName = String(newStatusName || '').trim()

      if (!newName) {
        return false
      }

      if (oldName && oldName.toLowerCase() === newName.toLowerCase()) {
        return false
      }

      if (this.isClosedStatusName(newName) || this.isFrozenStatusName(newName)) {
        return true
      }

      if (!this.isOpenStatusName(newName)) {
        return false
      }

      return this.isClosedStatusName(oldName) || this.isFrozenStatusName(oldName) || task?.completed === true || task?.frozen === true
    },

    getBulkStatusReasonPayload(payload = {}, maybeNewStatus = null) {
      if (typeof payload === 'string' || maybeNewStatus !== null) {
        return {
          oldStatusName: this.getStatusName(payload),
          newStatusName: this.getStatusName(maybeNewStatus),
          tasks: this.store.checkedTasks || []
        }
      }

      return {
        oldStatusName: this.getStatusName(payload.oldStatus || payload.oldStatusName),
        newStatusName: this.getStatusName(payload.newStatus || payload.status || payload.newStatusName),
        tasks: payload.tasks || this.store.checkedTasks || []
      }
    },

    getBulkStatusReasonAffectedTasks(oldStatusName, newStatusName, tasks) {
      const checkedTasks = tasks || []
      const affectedTasks = checkedTasks.filter(task => this.needBulkStatusChangeReason(
        this.getStatusName(task?.status) || oldStatusName,
        newStatusName,
        task
      ))

      if (affectedTasks.length > 0) {
        return affectedTasks
      }

      if (this.needBulkStatusChangeReason(oldStatusName, newStatusName)) {
        return checkedTasks.length > 0
          ? checkedTasks
          : [{ status: oldStatusName, completed: this.isClosedStatusName(oldStatusName), frozen: this.isFrozenStatusName(oldStatusName) }]
      }

      return []
    },

    requestBulkStatusChangeReason(payload = {}, maybeNewStatus = null) {
      const { oldStatusName, newStatusName, tasks } = this.getBulkStatusReasonPayload(payload, maybeNewStatus)
      const affectedTasks = this.getBulkStatusReasonAffectedTasks(oldStatusName, newStatusName, tasks)

      if (affectedTasks.length === 0) {
        return Promise.resolve('')
      }

      const isClosing = affectedTasks.some(task =>
        this.isClosedStatusName(newStatusName) &&
        !this.isClosedStatusName(this.getStatusName(task?.status))
      )
      const isFreezing = affectedTasks.some(task =>
        this.isFrozenStatusName(newStatusName) &&
        !this.isFrozenStatusName(this.getStatusName(task?.status))
      )
      const isReopening = affectedTasks.some(task =>
        this.isOpenStatusName(newStatusName) &&
        (
          this.isClosedStatusName(this.getStatusName(task?.status)) ||
          this.isFrozenStatusName(this.getStatusName(task?.status)) ||
          task?.completed === true ||
          task?.frozen === true
        )
      )

      if (isClosing && !isFreezing && !isReopening) {
        this.bulkReasonDialogTitle = 'Причина закрытия заявок'
        this.bulkReasonDialogMessage = `Будет закрыто заявок: ${affectedTasks.length}. Укажите причину закрытия.`
      } else if (isFreezing && !isClosing && !isReopening) {
        this.bulkReasonDialogTitle = 'Причина заморозки заявок'
        this.bulkReasonDialogMessage = `Будет заморожено заявок: ${affectedTasks.length}. Укажите причину заморозки.`
      } else if (isReopening && !isClosing && !isFreezing) {
        this.bulkReasonDialogTitle = 'Причина возврата заявок в работу'
        this.bulkReasonDialogMessage = `Будет возвращено в работу заявок: ${affectedTasks.length}. Укажите причину возврата.`
      } else {
        this.bulkReasonDialogTitle = 'Причина изменения статуса заявок'
        this.bulkReasonDialogMessage = `Будет изменён тип состояния заявок: ${affectedTasks.length}. Укажите причину.`
      }

      this.pendingBulkAction = 'status'
      this.bulkStatusChangeReason = ''
      this.bulkReasonError = false
      this.isBulkReasonDialogShow = true

      return new Promise(resolve => {
        this.bulkReasonResolve = resolve
      })
    },

    confirmBulkReasonDialog() {
      const reason = String(this.bulkStatusChangeReason || '').trim()

      if (!reason) {
        this.bulkReasonError = true
        return
      }

      if (this.bulkReasonResolve) {
        const resolve = this.bulkReasonResolve
        this.isBulkReasonDialogShow = false
        this.clearBulkReasonDialogState()
        resolve(reason)
        return
      }

      const action = this.pendingBulkAction
      this.bulkStatusChangeReason = reason
      this.pendingBulkAction = null
      this.isBulkReasonDialogShow = false
      this.showBulkActionModal(action)
    },

    cancelBulkReasonDialog() {
      if (this.bulkReasonResolve) {
        const resolve = this.bulkReasonResolve
        this.isBulkReasonDialogShow = false
        this.clearBulkReasonDialogState()
        resolve(null)
        return
      }

      this.clearBulkReasonDialogState()
      this.isBulkReasonDialogShow = false
    },

    clearBulkReasonDialogState() {
      this.pendingBulkAction = null
      this.bulkStatusChangeReason = ''
      this.bulkReasonError = false
      this.bulkReasonResolve = null
      this.bulkReasonDialogTitle = ''
      this.bulkReasonDialogMessage = ''
    },

    closeBulkActionModal() {
      this.isModalForBulkActions = false
      this.scheduleFinishBulkActionHistory(0)
    },

    clearBulkActionReason() {
      if (this.hasPendingBulkActionHistoryChanges()) {
        this.scheduleFinishBulkActionHistory(0)
      } else {
        this.scheduleFinishBulkActionHistory(1200)
      }

      if (this.bulkReasonResolve) {
        return
      }

      this.clearBulkReasonDialogState()
    },

    isBulkHistoryShortcutTargetIgnored(target) {
      const tagName = target?.tagName?.toLowerCase()
      return target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName)
    },

    handleBulkHistoryShortcut(event) {
      if (!(event.ctrlKey || event.metaKey) || this.isBulkHistoryShortcutTargetIgnored(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'z' && event.shiftKey) {
        event.preventDefault()
        this.redoBulkAction()
        return
      }

      if (key === 'z') {
        event.preventDefault()
        this.undoBulkAction()
        return
      }

      if (key === 'y') {
        event.preventDefault()
        this.redoBulkAction()
      }
    },

    addMessageToTask(event) {
      this.selectedTask.messages.push(event.message)
    },

    getTaskSla(task) {
      const originalSla = task?.originalSla
      if (originalSla && typeof originalSla === 'object') {
        return originalSla
      }
      const sla = task?.sla
      if (sla && typeof sla === 'object') {
        return sla
      }
      return null
    },

    getSlaInfo(task) {
      if (!task?.id) {
        return null
      }
      if (Object.prototype.hasOwnProperty.call(this.slaInfoByTaskId, task.id)) {
        return this.slaInfoByTaskId[task.id]
      }
      return task?.slaInfo || null
    },

    async loadSlaInfoForTask(task) {
      const sourceSla = this.getTaskSla(task)
      if (
        !task?.id ||
        !sourceSla ||
        task.completed ||
        this.slaInfoLoadingByTaskId[task.id] ||
        Object.prototype.hasOwnProperty.call(this.slaInfoByTaskId, task.id)
      ) {
        return
      }
      this.slaInfoLoadingByTaskId = {
        ...this.slaInfoLoadingByTaskId,
        [task.id]: true
      }
      try {
        const response = await axios.get(`/api/v1/task/${task.id}/sla/info`)
        this.slaInfoByTaskId = {
          ...this.slaInfoByTaskId,
          [task.id]: response.data
        }
      } catch (e) {
        this.slaInfoByTaskId = {
          ...this.slaInfoByTaskId,
          [task.id]: null
        }
      } finally {
        const loading = {...this.slaInfoLoadingByTaskId}
        delete loading[task.id]
        this.slaInfoLoadingByTaskId = loading
      }
    },

    loadSlaInfoForTasks(tasks) {
      tasks
        .filter(task => this.getTaskSla(task) && !task.completed)
        .forEach(task => this.loadSlaInfoForTask(task))
    },

    getSlaTime(task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      if (secondsLeft === null) {
        return ''
      }
      if (secondsLeft <= 0) {
        return '0 ч. 0 м.'
      }
      const hours = Math.floor(secondsLeft / 3600)
      const minutes = Math.floor((secondsLeft % 3600) / 60)
      return `${hours} ч. ${minutes} м.`
    },

    getSlaLeftSeconds(task) {
      const slaInfo = this.getSlaInfo(task)
      if (!slaInfo) {
        return null
      }
      if (slaInfo.paused) {
        const remainingSeconds = Number(slaInfo.remainingSeconds)
        return Number.isFinite(remainingSeconds)
          ? Math.max(0, remainingSeconds)
          : null
      }
      const remainingSeconds = Number(slaInfo.remainingSeconds)
      if (Number.isFinite(remainingSeconds) && remainingSeconds > 0) {
        return Math.max(0, remainingSeconds)
      }
      if (slaInfo.deadline) {
        const deadlineMs = new Date(slaInfo.deadline).getTime()

        if (Number.isFinite(deadlineMs)) {
          return Math.max(0, Math.floor((deadlineMs - this.nowTs) / 1000))
        }
      }
      return Number.isFinite(remainingSeconds)
        ? Math.max(0, remainingSeconds)
        : null
    },

    getSlaPercent(task) {
      const leftSeconds = this.getSlaLeftSeconds(task)
      if (leftSeconds === null) {
        return 0
      }

      let totalSeconds = this.getSlaTotalSeconds(task)
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        totalSeconds = this.getSlaTotalSecondsFromInfo(task)
      }
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
        return 0
      }
      return Math.max(0, Math.min(1, leftSeconds / totalSeconds))
    },

    getSlaTotalSecondsFromInfo(task) {
      const slaInfo = this.getSlaInfo(task)
      if (!slaInfo?.deadline) {
        return 0
      }
      const deadlineMs = new Date(slaInfo.deadline).getTime()
      const createdAtMs = new Date(task.createdAt).getTime()
      if (!Number.isFinite(deadlineMs) || !Number.isFinite(createdAtMs)) {
        return 0
      }
      const remainingSeconds = Number(slaInfo.remainingSeconds)
      const pausedSeconds = Number(slaInfo.pausedSeconds || 0)
      if (!Number.isFinite(remainingSeconds)) {
        return 0
      }
      const nowMs = slaInfo.paused
        ? deadlineMs - remainingSeconds * 1000
        : this.nowTs
      const elapsedSeconds = Math.max(0, Math.floor((nowMs - createdAtMs) / 1000))

      return Math.max(remainingSeconds, remainingSeconds + elapsedSeconds - pausedSeconds)
    },

    getSlaTotalSeconds(task) {
      const duration = this.getTaskSla(task)?.duration
      if (!duration) {
        return 0
      }
      if (typeof duration.asSeconds === 'function') {
        const seconds = duration.asSeconds()
        return Number.isFinite(seconds) && seconds > 0 ? seconds : 0
      }
      if (typeof duration === 'number') {
        return duration > 0 ? duration : 0
      }
      if (typeof duration === 'string') {
        const parsed = Number(duration)
        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed
        }
        const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
        if (match) {
          const days = Number(match[1] || 0)
          const hours = Number(match[2] || 0)
          const minutes = Number(match[3] || 0)
          const seconds = Number(match[4] || 0)
          return days * 86400 + hours * 3600 + minutes * 60 + seconds
        }
        return 0
      }

      if (typeof duration === 'object') {
        if (Number.isFinite(duration.seconds) && duration.seconds > 0) {
          return duration.seconds
        }
        if (Number.isFinite(duration._milliseconds) && duration._milliseconds > 0) {
          return Math.floor(duration._milliseconds / 1000)
        }
        if (Number.isFinite(duration.milliseconds) && duration.milliseconds > 0) {
          return Math.floor(duration.milliseconds / 1000)
        }
      }
      return 0
    },

    getSlaDuration(task) {
      const duration = this.getTaskSla(task)?.duration
      if (!duration) {
        return moment.duration(0)
      }

      if (typeof duration.asMilliseconds === 'function') {
        const ms = duration.asMilliseconds()
        return Number.isFinite(ms) && ms > 0 ? duration : moment.duration(0)
      }

      if (typeof duration === 'number') {
        return moment.duration(duration, 'seconds')
      }

      if (typeof duration === 'string') {
        const parsed = Number(duration)
        if (Number.isFinite(parsed) && parsed > 0) {
          return moment.duration(parsed, 'seconds')
        }

        const match = duration.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/)
        if (match) {
          return moment.duration({
            days: Number(match[1] || 0),
            hours: Number(match[2] || 0),
            minutes: Number(match[3] || 0),
            seconds: Number(match[4] || 0)
          })
        }
      }

      if (typeof duration === 'object') {
        if (Number.isFinite(duration.seconds) && duration.seconds > 0) {
          return moment.duration(duration.seconds, 'seconds')
        }
        if (Number.isFinite(duration._milliseconds) && duration._milliseconds > 0) {
          return moment.duration(duration._milliseconds, 'milliseconds')
        }
        if (Number.isFinite(duration.milliseconds) && duration.milliseconds > 0) {
          return moment.duration(duration.milliseconds, 'milliseconds')
        }
      }

      return moment.duration(0)
    },

    getSlaDeadlineMoment(task) {
      const sourceSla = this.getTaskSla(task)
      if (sourceSla?.startDate && sourceSla?.duration) {
        return moment(sourceSla.startDate).add(this.getSlaDuration({
          ...task,
          sla: sourceSla,
          originalSla: sourceSla
        }))
      }
      const slaInfo = this.getSlaInfo(task)
      if (slaInfo?.deadline) {
        return moment(slaInfo.deadline)
      }
      return moment.invalid()
    },

    getSlaDeadlineMs(task) {
      const deadline = this.getSlaDeadlineMoment(task)
      if (!deadline.isValid()) {
        return Number.MAX_SAFE_INTEGER
      }
      return deadline.valueOf()
    },

    isSlaExpired(task) {
      const secondsLeft = this.getSlaLeftSeconds(task)
      return secondsLeft !== null && secondsLeft <= 0
    },

    isSlaVisibleInTable(task) {
      return !task?.completed &&
        !!this.getTaskSla(task) &&
        !!this.getSlaInfo(task)
    },

    getSlaTableValue(task) {
      if (!this.isSlaVisibleInTable(task)) {
        return ''
      }
      const slaTime = this.getSlaTime(task)
      return slaTime ? `Осталось: ${slaTime}` : ''
    },

    setSortVariable(sort) {
      this.selectedSorting = sort
    },

    changeSortingAsc() {
      this.ascendingSort = !this.ascendingSort
    },

    formatDateTime() {
      const rawValue = this.dialogTaskDeadline.replace(/\D/g, '')
      let formattedValue = ''
      if (rawValue.length <= 2) {
        formattedValue = rawValue
      } else if (rawValue.length <= 4) {
        formattedValue = `${rawValue.slice(0, 2)}.${rawValue.slice(2)}`
      } else if (rawValue.length <= 6) {
        formattedValue = `${rawValue.slice(0, 2)}.${rawValue.slice(2, 4)}.${rawValue.slice(4)}`
      } else if (rawValue.length <= 8) {
        formattedValue = `${rawValue.slice(0, 2)}.${rawValue.slice(2, 4)}.${rawValue.slice(4, 8)}`
      } else if (rawValue.length <= 10) {
        formattedValue = `${rawValue.slice(0, 2)}.${rawValue.slice(2, 4)}.${rawValue.slice(4, 8)} ${rawValue.slice(8)}`
      } else if (rawValue.length <= 12) {
        formattedValue = `${rawValue.slice(0, 2)}.${rawValue.slice(2, 4)}.${rawValue.slice(4, 8)} ${rawValue.slice(8, 10)}:${rawValue.slice(10)}`
      } else {
        formattedValue = `${rawValue.slice(0, 2)}.${rawValue.slice(2, 4)}.${rawValue.slice(4, 8)} ${rawValue.slice(8, 10)}:${rawValue.slice(10, 12)}`
      }
      this.dialogTaskDeadline = formattedValue
    },

    isCurrentUserExecutor(task) {
      return task?.executor?.id != null &&
        this.store.currentUser?.id != null &&
        Number(task.executor.id) === Number(this.store.currentUser.id)
    },

    getExecutorGroupName(task) {
      if (!task?.executor) {
        return this.unassignedExecutorLabel
      }
      return `${task.executor.firstname} ${task.executor.lastname}`
    },

    getExecutorName(task) {
      if (!task?.executor) {
        return this.unassignedExecutorLabel
      }
      if (this.isCurrentUserExecutor(task)) {
        return this.currentExecutorLabel
      }
      return `${task.executor.firstname} ${task.executor.lastname}`
    },

    getTaskTypeName (task) {
      if (!task?.type) {
        return 'Не указан'
      }
      if (typeof task.type === 'string') {
        return task.type.trim() || 'Не указан'
      }
      return task.type.type || 'Не указан'
    },

    getChecklistItems (task) {
      if (!Array.isArray(task?.checklist)) {
        return []
      }

      return task.checklist.filter(item => item && item.text !== undefined && item.text !== null)
    },

    getChecklistTotalCount (task) {
      return this.getChecklistItems(task).length
    },

    getChecklistCompletedCount (task) {
      return this.getChecklistItems(task)
        .filter(item => Boolean(item.completed))
        .length
    },

    getChecklistTableValue (task) {
      const total = this.getChecklistTotalCount(task)

      if (total === 0) {
        return ''
      }

      return `${this.getChecklistCompletedCount(task)} / ${total}`
    },

    mergeActiveColumns (savedColumns) {
      const defaultColumns = [
        {name: 'id', label: 'ID', active: true},
        {name: 'name', label: 'Название', active: true},
        {name: 'type', label: 'Тип', active: true},
        {name: 'checklist', label: 'Чек-лист', active: true},
        {name: 'tags', label: 'Теги', active: true},
        {name: 'priority', label: 'Приоритет', active: true},
        {name: 'createdAt', label: 'Создана', active: true},
        {name: 'status', label: 'Статус', active: true},
        {name: 'deadline', label: 'Дедлайн', active: true},
        {name: 'executor', label: 'Исполнитель', active: true},
        {name: 'sla', label: 'SLA', active: true}
      ]

      if (!Array.isArray(savedColumns)) {
        return defaultColumns
      }

      const savedByName = new Map(savedColumns.map(column => [column.name, column]))

      return defaultColumns.map(defaultColumn => ({
        ...defaultColumn,
        active: savedByName.has(defaultColumn.name)
          ? savedByName.get(defaultColumn.name).active
          : defaultColumn.active
      }))
    },

    isValidFilterJoinOperator(value) {
      return ['AND', 'OR'].includes(value)
    },

    updateUrlWithFilterJoinOperator() {
      this.updateUrlWithFilterChain(this.filterChain)
    },

    isTaskMatchesFilter(task, filter) {
      const slug = this.filterTypes.find(ft => ft.label === filter.label)?.slug

      switch (slug) {
        case 'executor': {
          return filter.selectedOptions.includes(this.getExecutorName(task))
        }

        case 'tag': {
          const taskTags = task.tags.map(tag => tag.name)
          return filter.selectedOptions.some(selectedTag => taskTags.includes(selectedTag))
        }

        case 'priority': {
          return filter.selectedOptions.includes(task.priority.name)
        }

        case 'organization': {
          return task.client.organization != null &&
            filter.selectedOptions.includes(task.client.organization.name)
        }

        case 'status': {
          return filter.selectedOptions.includes(task.status.name)
        }

        case 'client': {
          return filter.selectedOptions.includes(`${task.client.lastname} ${task.client.firstname}`)
        }

        case 'type': {
          return filter.selectedOptions.includes(this.getTaskTypeName(task))
        }

        case 'deadline': {
          if (!filter.selectedOptions) {
            return true
          }

          if (filter.isBeforeDeadline) {
            return new Date(moment(filter.selectedOptions, 'DD.MM.YYYY HH:mm').format()) >= new Date(task.deadline)
          }

          return new Date(moment(filter.selectedOptions, 'DD.MM.YYYY HH:mm').format()) <= new Date(task.deadline)
        }

        default:
          return true
      }
    },

  },

  computed: {
    canUndoBulkAction() {
      return this.bulkActionHistory.length > 0 || this.hasPendingBulkActionHistoryChanges()
    },

    canRedoBulkAction() {
      return this.bulkActionRedoHistory.length > 0
    },

    bulkUndoTooltip() {
      const lastAction = this.bulkActionHistory[this.bulkActionHistory.length - 1]
      if (lastAction) {
        return `Отменить: ${this.getBulkActionLabel(lastAction.action)} (${lastAction.beforeTasks.length})`
      }

      if (this.hasPendingBulkActionHistoryChanges()) {
        const pendingAction = this.pendingBulkActionHistory?.action
        const count = this.pendingBulkActionHistory?.taskIds?.length || 0
        return `Отменить: ${this.getBulkActionLabel(pendingAction)} (${count})`
      }

      return 'Нет массовых действий для отмены'
    },

    bulkRedoTooltip() {
      const lastAction = this.bulkActionRedoHistory[this.bulkActionRedoHistory.length - 1]
      return lastAction
        ? `Повторить: ${this.getBulkActionLabel(lastAction.action)} (${lastAction.afterTasks.length})`
        : 'Нет массовых действий для повтора'
    },

    getFilteredTasks() {
      let tasks = this.store.getTasks.filter(task => {
        let matchesSearchRequest = true
        if (this.searchRequest) {
          const search = this.searchRequest.toLowerCase()
          const checklistText = this.getChecklistItems(task)
            .map(item => item.text)
            .join(' ')
            .toLowerCase()
          matchesSearchRequest = task.name.toLowerCase().includes(search) ||
            task.id.toString().toLowerCase().includes(search) ||
            task.priority.name.toLowerCase().includes(search) ||
            task.status.name.toLowerCase().includes(search) ||
            this.getTaskTypeName(task).toLowerCase().includes(search) ||
            checklistText.includes(search)
        }
        return ((!task.frozen && !task.completed) || this.isShowCompletedTasks) && matchesSearchRequest
      })
      if (this.selectedSorting.slug) {
        if (this.ascendingSort) {
          tasks.sort((a, b) => {
            switch (this.selectedSorting.slug) {
              case 'deadline':
                return new Date(a.deadline) - new Date(b.deadline)
              case 'creating':
                return new Date(a.createdAt) - new Date(b.createdAt)
              case 'priority':
                return b.priority.orderNumber - a.priority.orderNumber
              case 'sla':
                return this.getSlaDeadlineMs(a) - this.getSlaDeadlineMs(b)
              case 'status':
                return b.status.orderNumber - a.status.orderNumber
              default:
                return 0
            }
          })
        } else {
          tasks.sort((a, b) => {
            switch (this.selectedSorting.slug) {
              case 'deadline':
                return new Date(b.deadline) - new Date(a.deadline)
              case 'creating':
                return new Date(b.createdAt) - new Date(a.createdAt)
              case 'priority':
                return a.priority.orderNumber - b.priority.orderNumber
              case 'sla':
                return this.getSlaDeadlineMs(b) - this.getSlaDeadlineMs(a)
              case 'status':
                return a.status.orderNumber - b.status.orderNumber
              default:
                return 0
            }
          })
        }
      }
      const activeFilters = this.filterChain.filter(filter => {
        const slug = this.filterTypes.find(ft => ft.label === filter.label)?.slug
        if (slug === 'deadline') {
          return !!filter.selectedOptions
        }
        return filter.selectedOptions && filter.selectedOptions.length > 0
      })
      if (activeFilters.length > 0) {
        if (this.filterJoinOperator === 'AND') {
          tasks = tasks.filter(task =>
            activeFilters.every(filter => this.isTaskMatchesFilter(task, filter))
          )
        } else {
          tasks = tasks.filter(task =>
            activeFilters.some(filter => this.isTaskMatchesFilter(task, filter))
          )
        }
      }
      return tasks
    },

    getGroupedTasks() {
      let options
      let source
      const tasks = this.getFilteredTasks
      const slug = this.selectedGroupType.slug
      const groupedCards = []
      switch (slug) {
        case 'executor': {
          source = this.groupExecutors
          options = Object.groupBy(tasks, task => this.getExecutorGroupName(task))
          break
        }
        case 'tag': {
          source = this.tags
          options = Object.groupBy(tasks, ({tags}) => tags.map(tag => tag.name).join(','))
          break
        }
        case 'priority': {
          source = this.priorities
          options = Object.groupBy(tasks, ({priority}) => priority.name)
          break
        }
        case 'type': {
          source = this.taskTypes
          options = Object.groupBy(tasks, task => this.getTaskTypeName(task))
          break
        }
        case 'organization': {
          source = this.organizations
          options = Object.groupBy(tasks, ({organization}) => {
            if (organization) {
              return organization.name
            } else {
              return ''
            }
          })
          break
        }
        case 'status': {
          source = this.statuses
          options = Object.groupBy(tasks, ({status}) => status.name)
          break
        }
        case 'client': {
          source = this.clients
          options = Object.groupBy(tasks, ({client}) => `${client.lastname} ${client.firstname}`)
          break
        }
      }

      if (slug === 'tag') {
        for (const [keys, value] of Object.entries(options)) {
          for (const key of keys.split(',')) {
            const existingCard = groupedCards.find(card => card.title === key)
            if (existingCard) {
              existingCard.taskCards.push(value[0])
            } else {
              groupedCards.push({
                title: key,
                taskCards: [...value]
              })
            }
          }
        }
        groupedCards.forEach(it => {
          it.title = `${it.title ? it.title : 'Не сгрупированны'} (${it.taskCards.length})`
        })
      } else if (slug === 'organization') {
        if (options['']) {
          options[''].forEach(task => {
            const existingCard = groupedCards.find(card => card.title === this.getOrganizationName(task))
            if (existingCard) {
              existingCard.taskCards.push(task)
            } else {
              groupedCards.push({
                title: this.getOrganizationName(task),
                taskCards: [task]
              })
            }
          })
        }
        groupedCards.forEach(it => {
          it.title = `${it.title ? it.title : 'Не сгрупированны'} (${it.taskCards.length})`
        })
      } else {
        source.forEach(el => {
          groupedCards.push({
            title: options[el] ? `${el} (${options[el].length})` : el,
            taskCards: options[el]
          })
        })
      }
      return groupedCards
    },

    getTableRows() {
      try {
        const tasks = this.getFilteredTasks
        this.loadSlaInfoForTasks(tasks)
        return tasks.map(task => {
          const slaInfo = this.slaInfoByTaskId[task.id] || null
          const row = {
            ...task,
            originalSla: task.sla,
            slaInfo
          }
          const secondsLeft = this.getSlaLeftSeconds(row)
          return {
            ...row,
            type: this.getTaskTypeName(row),
            checklist: this.getChecklistTableValue(row),
            checklistCompleted: this.getChecklistCompletedCount(row),
            checklistTotal: this.getChecklistTotalCount(row),
            sla: secondsLeft !== null ? this.getSlaTime(row) : '',
            slaSecondsLeft: secondsLeft,
            slaPercent: slaInfo ? this.getSlaPercent(row) : 0,
            slaExpired: secondsLeft !== null && secondsLeft <= 0
          }
        })
      } catch (e) {
        return []
      }
    },

    executors() {
      return [
        this.currentExecutorLabel,
        ...this.store.users.filter(user => user !== null)
          .filter(user => user.roles !== 'OBSERVER')
          .map(user => `${user.firstname} ${user.lastname}`),
        this.unassignedExecutorLabel,
      ]
    },

    groupExecutors() {
      return [
        ...this.store.users.filter(user => user !== null)
          .filter(user => user.roles !== 'OBSERVER')
          .map(user => `${user.firstname} ${user.lastname}`),
        this.unassignedExecutorLabel,
      ]
    },

    tags() {
      return this.store.tags.map(tag => tag.name)
    },

    priorities() {
      return this.store.priorities.map(priority => priority.name)
    },

    organizations() {
      return this.store.organizations.map(organization => organization.name)
    },

    statuses() {
      return this.store.statuses.map(status => status.name)
    },

    clients() {
      return this.store.clients.map(client => `${client.lastname} ${client.firstname}`)
    },

    taskTypes() {
      return Array.from(
        new Set(this.store.getTasks.map(task => this.getTaskTypeName(task)))
      ).sort((a, b) => a.localeCompare(b, 'ru'))
    },

    isMobile() {
      return this.$q.screen.width < 1023
    },

    urlFilterChain() {
      return new URLSearchParams(window.location.search).get('filterChain')
    },

    showBulkActionsMenu() {
      return this.store.checkedTasks.length > 0
    },

    showOpenTaskBtn() {
      return this.store.checkedTasks.every(task => task.completed === true)
    },

    getFilterType() {
      return this.filterTypes.filter(filter => filter.slug !== 'deadline')
    },

    taskTypeOptions() {
      return (this.store.taskTypes || [])
        .filter(type => type && type.id != null)
        .sort((a, b) => String(a.type || '').localeCompare(String(b.type || ''), 'ru'))
    }
  },

  watch: {
    filterChain: {
      handler(newVal) {
        try {
          if (this.isFilterSelected) {
            this.filterContainerHeight = document.getElementById('filter-container').scrollHeight
          }
          this.updateUrlWithFilterChain(newVal)
          const queryParams = new URLSearchParams(window.location.search)
          const filterChainFromUrl = queryParams.get('filterChain')
          try {
            const filters = JSON.parse(this.base64DecodeUnicode(filterChainFromUrl))
            document.getElementById(`filter_${filters[filters.length - 1].slug}`).children[0].click()
          } catch (ignored) {
          }
          if (this.selectedSavedFilter && !this.isApplyingSavedFilter) {
            if (this.isCurrentSavedFilterChanged()) {
              this.selectedSavedFilter = ''
            }
          }
        } catch (e) {
        }
      },
      deep: true
    },

    isShowTableMode(newValue) {
      localStorage.setItem('isShowListMode', newValue ? 'true' : 'false')
    },

    selectedSavedFilter: {
      handler(newVal) {
        this.isShowDelFilterPreset = newVal !== ''
      },
      deep: true
    },

    '$route'(to) {
      this.initializeFilterChainFromUrl()
      this.initializeTaskFromUrl()
    },

    selectedGroupType() {
      localStorage.setItem('GroupType', `{ "label": "${this.selectedGroupType.label}", "slug": "${this.selectedGroupType.slug}" }`)
    },

    isShowCompletedTasks() {
      localStorage.setItem('isShowCompletedTasks', this.isShowCompletedTasks)
    },

    showBulkActionsMenu() {
      if (this.showBulkActionsMenu) {
        this.isShowBulkActionsMenu = true
      } else {
        document.getElementsByClassName('mass-container')[0].style.animationName = 'HideBulkContainer'
        document.getElementsByClassName('mass-container')[0].style.animationPlayState = 'start'
        setTimeout(() => {
          this.isShowBulkActionsMenu = false
        }, 200)
      }
    },

    'store.getTasks': {
      deep: true,
      handler(tasks) {
        if (!this.pendingBulkActionHistory) {
          return
        }

        this.trackPendingBulkHistoryFromTasks(tasks)
        this.scheduleFinishBulkActionHistory(500)
      }
    },

    'store.checkedTasks': {
      deep: true,
      handler(tasks) {
        if (!this.pendingBulkActionHistory) {
          return
        }

        this.trackPendingBulkHistoryFromTasks(tasks)
      }
    },

    activeColumns: {
      deep: true,
      handler() {
        localStorage.setItem('taskTableSettings', JSON.stringify(this.activeColumns))
      }
    },

    filterJoinOperator() {
      if (this.isFilterSelected && this.filterChain.length > 0) {
        this.updateUrlWithFilterChain(this.filterChain)
      }

      if (this.selectedSavedFilter && !this.isApplyingSavedFilter) {
        if (this.isCurrentSavedFilterChanged()) {
          this.selectedSavedFilter = ''
        }
      }
    },
  },

  mounted() {
    document.title = 'ULDESK : Заявки'
    this.store.checkedTasks = []
    window.addEventListener('keydown', this.handleBulkHistoryShortcut)
    this.slaTimer = setInterval(() => {
      this.nowTs = Date.now()
    }, 1000)
    setTimeout(() => this.initializeTaskFromUrl(), 300)
    setTimeout(() => this.initializeFilterChainFromUrl(), 300)
    axios.get('/api/v1/filters')
      .then(response => {
        this.savedFilters = response.data
      })
      .catch(e =>
        this.$q.notify({
          message: e.message,
          type: 'negative',
          position: 'top-right',
          actions: [{
            icon: 'close', color: 'white', dense: true, handler: () => undefined
          }]
        }))
  },

  created() {
    this.isShowCompletedTasks = localStorage.getItem('isShowCompletedTasks') !== 'false'
    this.isShowTableMode = localStorage.getItem('isShowListMode') !== 'false'
    if (localStorage.getItem('taskTableSettings')) {
      this.activeColumns = this.mergeActiveColumns(JSON.parse(localStorage.getItem('taskTableSettings')))
    } else {
      this.activeColumns = this.mergeActiveColumns(this.activeColumns)
    }
    const savedGroupType = localStorage.getItem('GroupType')
    if (savedGroupType) {
      this.selectedGroupType = JSON.parse(savedGroupType)
    }
  },

  setup() {
    const store = useStore()
    const router = useRoute()
    return {store, router}
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.handleBulkHistoryShortcut)
    clearInterval(this.slaTimer)
    if (this.bulkActionHistoryFinishTimer) {
      clearTimeout(this.bulkActionHistoryFinishTimer)
    }
  },
}
</script>

<style>
.board {
  white-space: nowrap;
}

.scroll-container {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
}

.mass-actions-btn {
  padding: 0;
  margin: 10px;
  width: 24px;
}

.mass-actions-counter {
  user-select: none;
  margin-right: 0;
  margin-left: 10px;
  font-size: 17px;
  font-weight: 540;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center
}

.mass-container {
  position: fixed;
  left: 50%;
  bottom: -250px;
  transform: translateX(-50%);
  z-index: 3000;
  width: max-content;
  max-width: calc(100vw - 24px);
  padding: 0 14px;
  border-radius: 8px;
  background-color: rgba(36, 36, 36, 1);
  animation-name: BulkContainer;
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
}

.mass-container--mobile {
  left: 12px;
  right: 12px;
  width: auto;
  max-width: none;
  transform: none;
}

.mass-container > .q-page {
  width: 100%;
  overflow-x: auto;
}

@keyframes BulkContainer {

  from {
    bottom: -150px;
  }

  to {
    bottom: 8px;
  }
}

@keyframes HideBulkContainer {

  from {
    bottom: 8px;
  }

  to {
    bottom: -150px;
  }
}

.task-toolbar-action-slot {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 72px;
  min-width: 72px;
  margin-right: 8px;
}

.tasks-page-content {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.tasks-page-component {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>
