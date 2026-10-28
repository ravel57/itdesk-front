<template>
  <q-btn
    data-tour="tasks-page-tune"
    icon="tune"
    flat
    class="text-grey-7"
  >
    <q-tooltip>
      Вид, сортировка и действия
    </q-tooltip>
    <q-menu
      anchor="bottom right"
      self="top right"
    >
      <q-list style="min-width: 240px">
        <template v-if="!this.isShowTableMode">
          <q-item-label header>Группировка</q-item-label>
          <q-item
            v-for="grouper in this.groupTypes"
            :key="grouper.slug"
            clickable
            v-close-popup
            :active="this.selectedGroupType.slug === grouper.slug"
            active-class="text-primary"
            @click="this.$emit('update:selectedGroupType', grouper)"
          >
            <q-item-section>
              <q-item-label>{{ grouper.label }}</q-item-label>
            </q-item-section>
            <q-item-section
              v-if="this.selectedGroupType.slug === grouper.slug"
              side
            >
              <q-icon
                name="check"
                color="primary"
                size="18px"
              />
            </q-item-section>
          </q-item>

          <q-separator/>
          <q-item-label header>Сортировка</q-item-label>
          <q-item
            v-for="sorting in this.sortingTypes"
            :key="sorting.slug"
            clickable
            v-close-popup
            :active="this.selectedSorting.slug === sorting.slug"
            active-class="text-primary"
            @click="this.$emit('setSort', sorting)"
          >
            <q-item-section>
              {{ sorting.label }}
            </q-item-section>
            <q-item-section
              v-if="this.selectedSorting.slug === sorting.slug"
              side
            >
              <q-icon
                name="check"
                color="primary"
                size="18px"
              />
            </q-item-section>
          </q-item>
          <q-item
            v-if="this.selectedSorting.label"
            clickable
            v-close-popup
            @click="this.$emit('toggleSortDirection')"
          >
            <q-item-section avatar>
              <q-icon :name="this.ascendingSort ? 'arrow_upward' : 'arrow_downward'"/>
            </q-item-section>
            <q-item-section>
              {{ this.ascendingSort ? 'По возрастанию' : 'По убыванию' }}
            </q-item-section>
          </q-item>
          <q-separator/>
        </template>
        <q-item
          v-else
          clickable
          v-close-popup
          @click="this.$emit('openTableSettings')"
        >
          <q-item-section avatar>
            <q-icon name="settings"/>
          </q-item-section>
          <q-item-section>Настройки таблицы</q-item-section>
        </q-item>

        <slot name="bulk-history"/>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script>
// Меню «Вид, сортировка и действия» (кнопка tune): группировка и сортировка карточек, настройки таблицы.
// Пункты undo/redo массовых действий страница передаёт в слот bulk-history: слот рендерится лениво,
// только при открытии меню (как раньше), а история остаётся на странице.
// data-tour="tasks-page-tune" остаётся на корневом q-btn — на него ссылается онбординг.
export default {
  props: {
    isShowTableMode: {
      type: Boolean,
      default: false
    },
    // Доступные типы группировки [{label, slug}]
    groupTypes: {
      type: Array,
      default: () => []
    },
    // Выбранная группировка (v-model:selectedGroupType)
    selectedGroupType: {
      type: Object,
      required: true
    },
    sortingTypes: {
      type: Array,
      default: () => []
    },
    // Выбранная сортировка {label, slug} (до выбора на странице это пустой массив)
    selectedSorting: {
      type: [Object, Array],
      default: () => ({})
    },
    ascendingSort: {
      type: Boolean,
      default: false
    }
  },

  emits: ['update:selectedGroupType', 'setSort', 'toggleSortDirection', 'openTableSettings']
}
</script>
