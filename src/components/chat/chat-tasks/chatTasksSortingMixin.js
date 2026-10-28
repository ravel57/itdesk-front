import { SORTING_TYPES } from 'src/util/chatTasks/taskList'

// Сортировка списка заявок: варианты, выбранная сортировка, сохранение в localStorage.
// Требует в компоненте: resetTasksPageAndLoad.
export default {
  data: () => ({
    selectedSorting: [],
    ascendingSort: false,
    sortingTypes: SORTING_TYPES.map(sorting => ({ ...sorting })),
  }),

  methods: {
    saveSortingSettings () {
      localStorage.setItem('chatTasksSorting', JSON.stringify({
        slug: this.selectedSorting?.slug || '',
        ascendingSort: this.ascendingSort
      }))
    },

    restoreSortingSettings () {
      try {
        const savedSorting = JSON.parse(localStorage.getItem('chatTasksSorting') || '{}')
        const selectedSorting = this.sortingTypes.find(sorting => sorting.slug === savedSorting.slug)

        if (selectedSorting) {
          this.selectedSorting = selectedSorting
        }

        if (typeof savedSorting.ascendingSort === 'boolean') {
          this.ascendingSort = savedSorting.ascendingSort
        }
      } catch (ignored) {
      }
    },

    setSortVariable (sort) {
      this.selectedSorting = sort
      this.saveSortingSettings()
      this.resetTasksPageAndLoad(true)
    },

    changeSortingAsc () {
      this.ascendingSort = !this.ascendingSort
      this.saveSortingSettings()
      this.resetTasksPageAndLoad(true)
    },
  }
}
