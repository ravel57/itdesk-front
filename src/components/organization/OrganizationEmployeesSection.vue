<template>
  <q-card-section>
    <div class="details-section-header app-shared-details-section-header">
      <div>
        <div class="text-subtitle1 text-weight-medium">
          Сотрудники организации
        </div>
        <div class="text-caption text-grey-7">
          Контакты клиента, которые могут писать в чат и создавать обращения
        </div>
      </div>
    </div>

    <q-list bordered separator class="rounded-borders">
      <q-item
        v-for="client in employees"
        :key="client.id || getClientName(client)"
        clickable
        @click="openClientChat(client)"
      >
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            {{ getClientInitials(client) }}
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ getClientName(client) }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="row items-center q-gutter-xs">
            <q-chip dense square color="grey-2" text-color="dark">
              {{ getClientOpenTasksCountText(client) }}
            </q-chip>
            <q-icon name="chevron_right" />
          </div>
        </q-item-section>
      </q-item>

      <q-item v-if="employees.length === 0">
        <q-item-section>
          <q-item-label class="text-grey-7">
            У организации пока нет сотрудников / клиентов
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-card-section>
</template>

<script>
import { firstFiniteNumber, getClientName, isTaskClosed } from 'src/util/organizationHelpers'

export default {
  name: 'OrganizationEmployeesSection',

  props: {
    // сотрудники выбранной организации
    employees: {
      type: Array,
      default: () => []
    },
    // все известные заявки (tasksSource страницы) — для счётчика открытых заявок клиента
    tasks: {
      type: Array,
      default: () => []
    }
  },

  methods: {
    // чистые хелперы: src/util/organizationHelpers.js
    firstFiniteNumber,
    getClientName,
    isTaskClosed,

    getClientInitials (client) {
      const name = this.getClientName(client).trim()
      if (!name) {
        return '?'
      }
      return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join('')
        .toUpperCase()
    },

    getClientOpenTasksCount (client) {
      return this.getClientTasks(client)
        .filter(task => !this.isTaskClosed(task))
        .length
    },

    getClientTasks (client) {
      if (!client) {
        return []
      }
      return this.tasks.filter(task => this.isTaskBelongsToClient(task, client))
    },

    isTaskBelongsToClient (task, client) {
      if (!task || !client) {
        return false
      }
      const taskClientId = this.getTaskClientId(task)
      const clientId = this.getClientId(client)
      if (taskClientId !== null && clientId !== null) {
        return taskClientId === clientId
      }
      const taskClient = task.client || task.clientDto || null
      if (taskClient) {
        return this.getClientName(taskClient) === this.getClientName(client)
      }
      return false
    },

    getTaskClientId (task) {
      return this.firstFiniteNumber([
        task?.client?.id,
        task?.clientId,
        task?.client_id,
        task?.client?.clientId
      ])
    },

    getClientId (client) {
      return this.firstFiniteNumber([
        client?.id,
        client?.clientId,
        client?.client_id
      ])
    },

    getClientOpenTasksCountText (client) {
      const count = this.getClientOpenTasksCount(client)
      return `${count} ${this.getOpenTaskWord(count)}`
    },

    getOpenTaskWord (count) {
      const value = Math.abs(Number(count || 0))
      const lastTwo = value % 100
      const lastOne = value % 10
      if (lastTwo >= 11 && lastTwo <= 14) {
        return 'откр. заявок'
      }
      if (lastOne === 1) {
        return 'откр. заявка'
      }
      if (lastOne >= 2 && lastOne <= 4) {
        return 'откр. заявки'
      }
      return 'откр. заявок'
    },

    openClientChat (client) {
      if (!client?.id) {
        return
      }
      this.$router.push(`/chats/${client.id}`)
    },
  }
}
</script>
