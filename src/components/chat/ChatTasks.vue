<template>
  <q-card class="my-card" style="min-height: 50vh; padding: 16px;">
    <div class="flex">
      <div>
        <div class="text-h6">Список заявок</div>
        <div
          class="text-grey-7 cursor-pointer"
          @click="this.isNewTaskDialogShow = true"
        >
          Создать новую задачу
        </div>
      </div>
      <div class="container q-pa-none q-gutter-md q-position-relative">
        <q-toggle
          v-model="this.isNotificationEnabled"
          icon="notifications_active"
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
                    v-for="(task, index) in this.tasks"
                    :key="index"
                    style="padding: 0"
                  >
                    <table>
                      <tr>
                        <th class="small-text text-grey" v-text="'Название: '"/>
                        <th class="text-body2" v-text="task.name"/>
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
          @click="this.saveNewTask"
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

    dialogTaskName: '',
    dialogTaskPriority: '',
    dialogTaskExecutor: '',
    dialogTaskTags: ''
  }),

  methods: {
    saveNewTask () {
      this.isNewTaskDialogShow = false
      this.$emit('newTask', {
        name: this.dialogTaskName,
        priority: this.dialogTaskPriority,
        executor: this.dialogTaskExecutor,
        tags: [this.dialogTaskTags.split(' ')]
      })
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
