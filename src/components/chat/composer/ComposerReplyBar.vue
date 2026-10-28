<template>
  <q-card
    class="no-shadow"
    style="width: 100%;height: 50px;display: flex;flex-direction: row;border-radius: 0;border-top: 1px solid #0000001f"
  >
    <div ref="replyContainer" style="display: flex;width: 100%;max-height: 50px;align-items: center">
      <div
        style="height: 50px;width: 50px;display: flex;justify-content: center;align-items: center;margin-left: 5px;margin-right: 10px">
        <img
          v-if="message.fileUuid && message.fileType.startsWith('image/')"
          :src="`/files/images/${message.fileUuid}`"
          alt="reply-img"
          style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
        >
        <video
          v-else-if="message.fileUuid && message.fileType.startsWith('video/')"
          style="width: 40px;height: 40px;border-radius: 4px;object-fit: cover;"
        >
          <source
            :src="`/files/videos/${message.fileUuid}`"
            type="video/mp4"
          >
          Your browser does not support the video tag.
        </video>
        <q-icon
          v-else
          size="20px"
          name="reply"
        />
      </div>
      <div style="width: 100%">
        <div class="">
          В ответ на {{ sender }}
        </div>
        <div class="truncate">
          {{ previewText }}
        </div>
      </div>
      <q-icon
        size="20px"
        style="height: 50px;width: 50px;cursor: pointer"
        name="close"
        @click="$emit('close')"
      />
    </div>
  </q-card>
</template>

<script>
// Панель «В ответ на …» над полем ввода: превью сообщения, на которое отвечаем
export default {
  name: 'ComposerReplyBar',

  props: {
    // Сообщение, на которое отвечаем
    message: { type: Object },
    // Имя автора сообщения
    sender: { type: String },
    // Короткий текст превью (текст сообщения или тип вложения)
    previewText: { type: String }
  },

  emits: ['close'],

  methods: {
    // Высота панели для подгонки высоты окна чата (0, если контейнер ещё не отрисован)
    getContainerHeight () {
      return this.$refs.replyContainer?.offsetHeight || 0
    }
  }
}
</script>

<style scoped>
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
