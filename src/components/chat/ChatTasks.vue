<template>
  <q-card style="min-height: 50vh; padding: 16px;">
    <div class="flex">
      <div>
        <div class="text-h6">Список заявок</div>
        <div
          class="text-grey-7 cursor-pointer"
          @click="this.onNewTaskCreate"
          v-text="'Создать новую задачу'"
        />
      </div>
      <div class="container q-pa-none q-gutter-md q-position-relative">
        <q-toggle
          v-model="this.isNotificationEnabled"
          icon="notifications_active"
          color="primary"
          class="element q-position-absolute q-right-0"
        />
        <q-toggle
          v-model="isShowCompletedTasks"
          icon="add_task"
          color="primary"
          class="element q-position-absolute q-right-0"
        />
      </div>
    </div>
    <q-separator/>
    <q-layout view="lHh Lpr lFf" container style="height: 65vh" class="shadow-2 rounded-borders">
      <q-page-container>
        <q-page>
          <div class="row justify-center">
            <div style="width: 100%;">
              <q-card-section style="padding: 0">
                <q-card class="my-card">
                  <q-card-section
                    v-for="(task, index) in this.getActualTasks"
                    :key="index"
                    style="padding: 0"
                  >
                    <q-btn
                      v-if="!task.completed"
                      icon="check_circle"
                      label="Отметить выполненной"
                      class="text-grey"
                      flat
                      @click="this.setTaskCompletedShowDialog(task)"
                    />
                    <q-item
                      clickable
                      @click="this.onTaskClick(task)"
                      :class="task.completed ? 'text-grey-5' : ''"
                    >
                      <table>
                        <tr>
                          <th class="small-text text-grey" v-text="'Название: '"/>
                          <th class="text-body2" v-text="task.name"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Описание: '"/>
                          <th class="text-body2" v-text="task.description"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Теги: '"/>
                          <th class="text-body2" v-text="task.tags.join(', ')"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Приоритет: '"/>
                          <th class="text-body2" v-text="task.priority"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Создана: '"/>
                          <th class="text-body2" v-text="task.createdAt"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Статус: '"/>
                          <th class="text-body2" v-text="task.status"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Деадлайн: '"/>
                          <th class="text-body2" v-text="task.deadline"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'Исполнитель: '"/>
                          <th class="text-body2" v-text="task.executor"/>
                        </tr>
                        <tr>
                          <th class="small-text text-grey" v-text="'SLA: '"/>
                          <th class="text-body2" v-text="task.sla"/>
                        </tr>
                      </table>
                    </q-item>
                    <q-separator/>
                  </q-card-section>
                </q-card>
              </q-card-section>
            </div>
          </div>
        </q-page>
      </q-page-container>
    </q-layout>
  </q-card>
  <q-dialog
    v-model="this.isNewTaskDialogShow"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card>
      <q-card-section>
        <q-input
          v-model="dialogTaskName"
          label="Название"
        />
        <q-input
          v-model="dialogTaskDescription"
          label="Описание"
        />
        <q-input
          v-model="dialogTaskPriority"
          label="Приоритет"
        />
        <q-input
          v-model="dialogTaskExecutor"
          label="Исполнитель"
          use-input
        />
        <q-input
          v-model="dialogTaskTags"
          label="Теги"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="primary"
          label="Закрыть"
          @click="this.isNewTaskDialogShow = false"
        />
        <q-btn
          color="primary"
          label="Сохранить"
          @click="this.saveNewOrUpdateTask"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog
    v-model="this.isCompleteTaskDialogShow"
    persistent
    backdrop-filter="blur(4px)"
  >
    <q-card>
      <q-card-section>
        Закрыть заявку? {{ this.taskToComplete.name }}
      </q-card-section>
      <q-card-actions align="right">
        <q-btn
          color="white"
          text-color="primary"
          label="Отмена"
          @click="this.isCompleteTaskDialogShow = false"
        />
        <q-btn
          color="primary"
          label="Закрыть"
          @click="setTaskCompleted"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
export default {
  name: 'ChatTasks',

  props: ['tasks'],

  data: () => ({
    isNotificationEnabled: true,
    isNewTaskDialogShow: false,
    isCompleteTaskDialogShow: false,

    dialogTaskName: '',
    dialogTaskDescription: '',
    dialogTaskPriority: '',
    dialogTaskExecutor: '',
    dialogTaskTags: '',

    isShowCompletedTasks: false,

    isNewTask: true,
    taskId: null,

    taskToComplete: null
  }),

  methods: {
    onNewTaskCreate () {
      this.isNewTaskDialogShow = true
      this.dialogTaskDescription = ''
      this.dialogTaskPriority = ''
      this.dialogTaskExecutor = ''
      this.dialogTaskTags = ''
    },

    saveNewOrUpdateTask () {
      this.isNewTaskDialogShow = false
      this.$emit(this.isNewTask ? 'newTask' : 'updateTask', {
        id: this.isNewTask ? null : this.taskId,
        status: 'new',
        name: this.dialogTaskName,
        description: this.dialogTaskDescription,
        priority: this.dialogTaskPriority,
        executor: this.dialogTaskExecutor,
        tags: this.dialogTaskTags.split(' '),
        isCompleted: false
      })
      this.taskId = null
    },

    onTaskClick (task) {
      this.isNewTaskDialogShow = true
      this.dialogTaskName = task.name
      this.dialogTaskDescription = task.description
      this.dialogTaskPriority = task.priority
      this.dialogTaskExecutor = task.executor
      this.dialogTaskTags = task.tags
      this.taskId = task.id
      this.isNewTask = false
    },

    setTaskCompleted () {
      this.taskToComplete.completed = true
      this.$emit('updateTask', this.taskToComplete)
      this.taskToComplete = null
      this.isCompleteTaskDialogShow = false
    },

    setTaskCompletedShowDialog (task) {
      this.taskToComplete = task
      this.isCompleteTaskDialogShow = true
    }
  },

  computed: {
    getActualTasks () {
      return this.tasks.filter(task => !task.completed || this.isShowCompletedTasks)
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
</style>
