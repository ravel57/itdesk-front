<template>
  <div
    id="filter-container"
    style="display: flex;margin-top: 8px; align-items: start;"
    :style="this.isMobile ? 'display:flex; flex-direction:row; flex-wrap: wrap; justify-content:center; width: 100%': ''"
  >
    <q-select
      :model-value="this.selectedSavedFilter"
      :options="this.savedFilterOptions"
      option-label="label"
      option-value="value"
      emit-value
      map-options
      label="Шаблоны фильтров"
      style="width: 12.5%; align-content: center; min-width: 300px; margin-right: 8px"
      :style="this.isMobile ? 'width: 100%; margin-bottom: 8px' : ''"
      @update:model-value="this.onSavedFilterModelUpdated"
      outlined
      clearable
    >
      <template v-slot:option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label caption>
              {{ scope.opt.scope === 'GLOBAL' ? 'Глобальный фильтр' : 'Персональный фильтр' }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon
              :name="scope.opt.scope === 'GLOBAL' ? 'groups' : 'person'"
              :color="scope.opt.scope === 'GLOBAL' ? 'deep-purple-5' : 'blue-grey-6'"
              size="20px"
            />
          </q-item-section>
        </q-item>
      </template>
      <template v-slot:append>
        <q-icon
          v-if="this.selectedSavedFilterScope"
          :name="this.selectedSavedFilterScope === 'GLOBAL' ? 'groups' : 'person'"
          :color="this.selectedSavedFilterScope === 'GLOBAL' ? 'deep-purple-5' : 'blue-grey-6'"
          size="20px"
          class="q-mr-xs"
        >
          <q-tooltip>
            {{ this.selectedSavedFilterScope === 'GLOBAL'
              ? 'Глобальный фильтр — доступен команде'
              : 'Персональный фильтр — доступен только вам' }}
          </q-tooltip>
        </q-icon>
      </template>
    </q-select>
    <q-select
      :model-value="this.filterJoinOperator"
      :options="this.filterJoinOptions"
      label="Условие"
      emit-value
      map-options
      outlined
      dense
      style="margin-right: 8px; width: 120px"
      :style="this.isMobile ? 'width: 100%; margin-bottom: 8px' : 'margin-right: 8px; width: 120px'"
      @update:model-value="this.onFilterJoinOperatorModelUpdated"
    />
    <div
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
          <template v-if="this.isDateRangeFilter(filter)">
            <div class="task-date-range-filter">
              <q-input class="app-inline app-table-cell-180"
                v-model="filter.selectedOptions.from"
                clearable
                outlined
                :label="`${filter.label} от`"
                mask="##.##.####"
              >
                <template v-slot:append>
                  <q-icon
                    name="event"
                    class="cursor-pointer"
                  >
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date
                        v-model="filter.selectedOptions.from"
                        first-day-of-week="1"
                        locale="ru"
                        today-btn
                        mask="DD.MM.YYYY"
                        v-close-popup
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>

              <q-input class="app-inline app-table-cell-180"
                v-model="filter.selectedOptions.to"
                clearable
                outlined
                :label="`${filter.label} до`"
                mask="##.##.####"
              >
                <template v-slot:append>
                  <q-icon
                    name="event"
                    class="cursor-pointer"
                  >
                    <q-popup-proxy
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-date
                        v-model="filter.selectedOptions.to"
                        first-day-of-week="1"
                        locale="ru"
                        today-btn
                        mask="DD.MM.YYYY"
                        v-close-popup
                      />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </template>

          <q-select class="app-inline app-table-cell-250"
            v-else-if="filter.slug !== 'deadline'"
            outlined
            :label="filter.label"
            multiple
            :options="this.filteredOptions[filter] ? this.filteredOptions[filter] : filter.options"
            use-chips
            use-input
            stack-label
            v-model="filter.selectedOptions"
            input-debounce="0"
            behavior="menu"
            :class="{ 'organization-select': filter.slug === 'organization' }"
            :popup-content-class="filter.slug === 'organization' ? 'organization-select-popup' : ''"
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

          <q-input class="app-inline app-table-cell-250"
            v-else
            v-model="filter.selectedOptions"
            clearable
            outlined
            :label="filter.isBeforeDeadline ? 'До дедлайна' : 'После дедлайна'"
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
            <template v-slot:append>
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
            @click="this.$emit('deleteFilter', index)"
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
              @click="onNewFilterSelected(option.label)"
            >
              <q-item-section>{{ option.label }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-btn class="app-inline app-height-40"
        v-if="this.filterChain.length > 0"
        ref="saveFilterButton"
        icon="save"
        color="grey"
        @click="this.$emit('saveFilter')"
        :disable="!this.canSaveCurrentFilter"
        flat
      >
        <q-tooltip>
          {{ !this.canSaveCurrentFilter
            ? 'Глобальные фильтры могут изменять администратор и менеджер поддержки'
            : (this.selectedSavedFilter ? 'Пересохранить шаблон' : 'Сохранить шаблон') }}
        </q-tooltip>
      </q-btn>
      <q-btn class="app-inline app-height-40"
        v-if="this.isShowDelFilterPreset && this.canDeleteSelectedSavedFilter"
        ref="deleteSavedFilterButton"
        icon="delete"
        color="grey"
        @click="this.$emit('requestDeleteSavedFilter')"
        flat
      >
        <q-tooltip>
          Удалить шаблон
        </q-tooltip>
      </q-btn>
      <q-btn class="app-inline app-height-40"
        v-if="this.filterChain.length > 0"
        icon="close"
        color="grey"
        @click="this.$emit('resetFilters')"
        flat
      >
        <q-tooltip>
          Сбросить фильтр
        </q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script>
// Панель фильтров заявок: шаблоны фильтров, условие AND/OR, цепочка фильтров, кнопки добавления/сохранения/сброса.
// Состояние (цепочка, выбранный шаблон, оператор) принадлежит странице. Элементы filterChain редактируются
// на месте (v-model на filter.selectedOptions / filter.isBeforeDeadline), как и раньше на странице;
// добавление/удаление фильтров, сохранение/удаление шаблонов выполняет страница по событиям.
// Корневой элемент #filter-container и id фильтров filter_<slug> используются watcher'ом filterChain на странице.
export default {
  props: {
    isMobile: {
      type: Boolean,
      default: false
    },
    // Цепочка фильтров [{label, slug, options, selectedOptions, isBeforeDeadline}]
    filterChain: {
      type: Array,
      required: true
    },
    // Доступные типы фильтров [{label, slug}]
    filterTypes: {
      type: Array,
      required: true
    },
    // Выбранный сохранённый шаблон (v-model:selectedSavedFilter); '' если не выбран
    selectedSavedFilter: {
      type: [String, Number],
      default: ''
    },
    savedFilterOptions: {
      type: Array,
      default: () => []
    },
    // 'GLOBAL' | 'PERSONAL' | null — доступ выбранного шаблона (null, если шаблон не выбран)
    selectedSavedFilterScope: {
      type: String,
      default: null
    },
    // Условие между фильтрами 'AND' | 'OR' (v-model:filterJoinOperator)
    filterJoinOperator: {
      type: String,
      default: 'AND'
    },
    canSaveCurrentFilter: {
      type: Boolean,
      default: false
    },
    isShowDelFilterPreset: {
      type: Boolean,
      default: false
    },
    canDeleteSelectedSavedFilter: {
      type: Boolean,
      default: false
    }
  },

  emits: [
    'update:selectedSavedFilter',
    'savedFilterSelected',
    'update:filterJoinOperator',
    'filterJoinOperatorChanged',
    'addFilter',
    'deleteFilter',
    'saveFilter',
    'requestDeleteSavedFilter',
    'resetFilters'
  ],

  data: () => ({
    isMenuActive: false,
    filteredOptions: {},
    filterJoinOptions: [
      {label: 'И', value: 'AND'},
      {label: 'ИЛИ', value: 'OR'}
    ]
  }),

  methods: {
    // Порядок как у v-model + отдельного @update:model-value: сначала обновляем значение, затем уведомляем
    onSavedFilterModelUpdated(value) {
      this.$emit('update:selectedSavedFilter', value)
      this.$emit('savedFilterSelected', value)
    },

    onFilterJoinOperatorModelUpdated(value) {
      this.$emit('update:filterJoinOperator', value)
      this.$emit('filterJoinOperatorChanged', value)
    },

    onNewFilterSelected(label) {
      this.isMenuActive = false
      this.$emit('addFilter', label)
    },

    isDateRangeFilter(filter) {
      return ['createdAt', 'lastActivity'].includes(filter?.slug)
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

    dateOption(date) {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return date >= `${year}/${month}/${day}`
    }
  }
}
</script>

<style>
.task-date-range-filter {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
</style>
