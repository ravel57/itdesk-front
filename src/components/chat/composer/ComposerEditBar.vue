<template>
  <q-card class="no-shadow edit-message-bar">
    <div
      ref="editContainer"
      class="edit-message-bar__content"
    >
      <div class="edit-message-bar__icon">
        <q-icon
          size="20px"
          name="edit"
        />
      </div>
      <div class="edit-message-bar__text app-flex-title">
        <div>
          Редактирование сообщения
        </div>
        <div class="truncate app-text-ellipsis">
          {{ text }}
        </div>
      </div>
      <q-btn
        class="edit-message-cancel-btn"
        flat
        round
        dense
        icon="close"
        aria-label="Отменить редактирование"
        @click="$emit('cancel')"
      >
        <q-tooltip v-if="!isMobile">
          Отменить редактирование
        </q-tooltip>
      </q-btn>
    </div>
  </q-card>
</template>

<script>
// Панель «Редактирование сообщения» над полем ввода
export default {
  name: 'ComposerEditBar',

  props: {
    // Текст редактируемого сообщения
    text: { type: String },
    isMobile: { type: Boolean }
  },

  emits: ['cancel'],

  methods: {
    // Высота панели для подгонки высоты окна чата (0, если контейнер ещё не отрисован)
    getContainerHeight () {
      return this.$refs.editContainer?.offsetHeight || 0
    }
  }
}
</script>

<style scoped>
.edit-message-bar {
  width: 100%;
  height: 50px;
  min-height: 50px;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 0;
  border-top: 1px solid var(--app-border, #0000001f);
}

.edit-message-bar__content {
  display: flex;
  width: 100%;
  height: 50px;
  min-width: 0;
  align-items: center;
}

.edit-message-bar__icon {
  height: 50px;
  width: 50px;
  flex: 0 0 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  margin-right: 10px;
}

.edit-message-cancel-btn {
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  margin-right: 4px;
}
</style>
