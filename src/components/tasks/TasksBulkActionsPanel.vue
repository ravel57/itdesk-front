<template>
  <div
    class="mass-container"
    :class="{ 'mass-container--mobile': this.isMobile }"
  >
    <q-page class="shadow-1" style="min-height: 0; padding: 0; border-radius: 5px;display: flex">
      <q-btn v-if="!this.showOpenTaskBtn" class="mass-actions-btn" flat text-color="white" icon="check_circle"
             @click="this.$emit('openModal', 'close')">
        <q-tooltip>Закрыть заявки</q-tooltip>
      </q-btn>
      <q-btn v-if="this.showOpenTaskBtn" class="mass-actions-btn" flat text-color="white" icon="cancel"
             @click="this.$emit('openModal', 'open')">
        <q-tooltip>Открыть заявку</q-tooltip>
      </q-btn>
      <!--<q-btn class="mass-actions-btn" flat text-color="white" icon="ac_unit" @click="this.$emit('openModal', 'freeze')">-->
      <!--  <q-tooltip>Заморозить заявки</q-tooltip>-->
      <!--</q-btn>-->
      <q-btn class="mass-actions-btn" flat text-color="white" icon="support_agent"
             @click="this.$emit('openModal', 'supportLine')">
        <q-tooltip>Сменить линию поддержки</q-tooltip>
      </q-btn>
      <q-btn class="mass-actions-btn" flat text-color="white" icon="manage_accounts"
             @click="this.$emit('openModal', 'executor')">
        <q-tooltip>Сменить исполнителя заявок</q-tooltip>
      </q-btn>
      <q-btn class="mass-actions-btn" flat text-color="white" icon="clear_all" @click="this.$emit('openModal', 'status')">
        <q-tooltip>Изменить статус заявок</q-tooltip>
      </q-btn>
      <q-btn class="mass-actions-btn" flat text-color="white" icon="star_half"
             @click="this.$emit('openModal', 'priority')">
        <q-tooltip>Изменить приоритет заявок</q-tooltip>
      </q-btn>
      <q-btn class="mass-actions-btn" flat text-color="white" icon="category"
             @click="this.$emit('openModal', 'type')">
        <q-tooltip>Изменить тип заявки</q-tooltip>
      </q-btn>
      <q-btn class="mass-actions-btn" flat text-color="white" icon="dns"
             @click="this.$emit('openModal', 'service')">
        <q-tooltip>Изменить сервис заявок</q-tooltip>
      </q-btn>
      <q-btn class="mass-actions-btn" flat text-color="white" icon="sell" @click="this.$emit('openModal', 'tags')">
        <q-tooltip>Изменить теги заявок</q-tooltip>
      </q-btn>
      <q-btn class="mass-actions-btn" flat text-color="white" icon="today" @click="this.$emit('openModal', 'deadline')">
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
</template>

<script>
import {useStore} from 'stores/store'

// Плавающая панель массовых действий над выделенными заявками (store.checkedTasks).
// Показом/скрытием панели управляет страница (класс mass-container используется для анимации скрытия),
// выбор действия отдаётся наверх событием openModal.
export default {
  props: {
    isMobile: {
      type: Boolean,
      default: false
    }
  },

  emits: ['openModal'],

  setup() {
    const store = useStore()
    return {store}
  },

  computed: {
    showOpenTaskBtn() {
      return this.store.checkedTasks.every(task => task.completed === true)
    }
  }
}
</script>

<style>
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
</style>
