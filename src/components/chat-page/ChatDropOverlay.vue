<template>
  <div class="chat-drop-overlay">
    <q-icon name="upload_file" size="40px" color="primary"/>
    <div class="chat-drop-overlay__title">Отпустите файлы, чтобы прикрепить к чату</div>
    <div class="chat-drop-overlay__hint">Работает в любом месте окна чата</div>
  </div>
</template>

<script>
// Подсказка поверх колонки чата, пока над ней перетаскивают файлы.
export default {
  name: 'ChatDropOverlay'
}
</script>

<style scoped>
.chat-drop-overlay {
  position: absolute;
  inset: 8px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed var(--q-primary);
  border-radius: 16px;
  background: rgba(92, 53, 249, 0.06);
  pointer-events: none;
}

.chat-drop-overlay__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--q-primary);
}

.chat-drop-overlay__hint {
  font-size: 12px;
  color: var(--app-text-muted, #6a6a70);
}
</style>
