<template>
  <div
    v-if="this.isShowTableMode"
    style="overflow: auto"
    :style="this.isMobile ? 'margin-top: 8px' : 'margin-top: 8px'"
  >
    <q-table
      :rows="this.tableRows"
      :columns="this.tableColumns"
      :rows-per-page-options="[10, 20, 50, 0]"
      :sortable="true"
      row-key="id"
      style="margin-top: 8px"
      :style="this.isFilterSelected ? (this.isMobile ? 'max-height: 55vh' : 'max-height: 70vh') : 'max-height: 80vh'"
      rows-per-page-label="Строк на странице"
    >
      <template v-slot:body-cell-name="props">
        <q-td :props="props">
          <div @click="this.$emit('onTaskClicked', props.row)">
            {{ this.shortenLine(props.row.name) }}
          </div>
        </q-td>
      </template>
    </q-table>
  </div>
  <div
    v-else
    class="scrollable-flex-container"
    :style="this.isFilterSelected ? (this.isMobile ? 'max-height: 50vh' : 'max-height: 70vh') : 'max-height: 80vh'"
  >
    <card-tasks-view
      :groupedTasks="this.groupedTasks"
      :selectedGroupType="this.selectedGroupType"
      @onTaskClicked="this.$emit('onTaskClicked', $event)"
    />
  </div>
  <task-dialog
    v-if="this.getPossibilityToOpenDialogTask"
    :client="this.selectedTask.client"
    :isMobile="this.isMobile"
    :task="this.selectedTask"
    :isNewTaskDialogShow="this.isNewTaskDialogShow"
    :isTaskDialogShow="this.isTaskDialogShow"
    :isNewTask="false"
    @closeDialog="this.$emit('closeDialog', $event)"
    @updateTask="this.$emit('updateTask', $event)"
  />
</template>

<script>
import CardTasksView from 'components/tasks/CardTasksView.vue'
import TaskDialog from 'components/chat/TaskDialog.vue'

export default {

  components: { TaskDialog, CardTasksView },

  name: 'TasksComponent',

  props: [
    'isShowTableMode',
    'isMobile',
    'tableRows',
    'tableColumns',
    'isFilterSelected',
    'groupedTasks',
    'selectedGroupType',
    'isNewTaskDialogShow',
    'isTaskDialogShow',
    'selectedTask'
  ],

  data: () => ({}),

  methods: {
    shortenLine (string) {
      if (string.length > 31) {
        return string.substring(0, 31) + '...'
      } else {
        return string
      }
    }
  },

  computed: {
    getPossibilityToOpenDialogTask () {
      return this.isNewTaskDialogShow || this.isTaskDialogShow
    }
  }
}
</script>

<style scoped>

</style>
