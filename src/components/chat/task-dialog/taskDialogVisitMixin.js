import { resolveTaskOrganization } from 'src/util/taskDialog/taskOrganization'

// Выезд по заявке: организация заявки, доступность кнопки, диалог добавления выезда (OrganizationVisitDialog).
// Требует в компоненте: props task/client/isNewTask, this.store, isTaskDialogOperator,
// getCurrentTaskId и dialogTaskName (taskDialogFormMixin), this.$q и this.$emit.
export default {
  data: () => ({
    taskVisitDialog: false
  }),

  computed: {
    currentTaskOrganization () {
      return resolveTaskOrganization(this.task, this.client, () => this.store.organizations)
    },

    currentTaskVisitOption () {
      const taskId = this.getCurrentTaskId()

      if (!taskId) {
        return null
      }

      const taskTitle = this.dialogTaskName || this.task?.name || this.task?.title || 'Без названия'

      return {
        label: `#${taskId} ${taskTitle}`,
        value: taskId,
        taskTitle
      }
    },

    canCreateVisitFromTask () {
      return !this.isNewTask &&
        !!this.getCurrentTaskId() &&
        !!this.currentTaskOrganization?.id &&
        this.isTaskDialogOperator
    }
  },

  methods: {
    openTaskVisitDialog () {
      if (!this.canCreateVisitFromTask) {
        this.$q.notify({
          message: 'Для добавления выезда у заявки должна быть организация',
          type: 'warning'
        })
        return
      }

      this.taskVisitDialog = true
    },

    onTaskVisitSaved ({ organization, visit }) {
      if (organization?.id && Array.isArray(this.store.organizations)) {
        const index = this.store.organizations.findIndex(item => Number(item.id) === Number(organization.id))

        if (index >= 0) {
          this.store.organizations.splice(index, 1, organization)
        } else {
          this.store.organizations.push(organization)
        }
      }

      if (organization?.id && this.client?.organization && Number(this.client.organization.id) === Number(organization.id)) {
        Object.assign(this.client.organization, organization)
      }

      this.$emit('organizationVisitSaved', {
        organization,
        visit,
        task: this.task
      })

      this.$q.notify({
        message: 'Выезд добавлен к заявке',
        type: 'positive'
      })
    }
  }
}
