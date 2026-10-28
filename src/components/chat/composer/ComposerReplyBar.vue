<template>
  <q-card
    class="no-shadow"
    style="width: 100%;height: 50px;display: flex;flex-direction: row;border-radius: 0;border-top: 1px solid var(--app-border, #0000001f)"
  >
    <div ref="replyContainer" style="display: flex;width: 100%;max-height: 50px;align-items: center">
      <div
        style="height: 50px;width: 50px;display: flex;justify-content: center;align-items: center;margin-left: 5px;margin-right: 10px">
        <img class="app-inline app-attachment-thumbnail"
          v-if="message.fileUuid && message.fileType.startsWith('image/')"
          :src="`/files/images/${message.fileUuid}`"
          alt="reply-img"
        >
        <video class="app-inline app-attachment-thumbnail"
          v-else-if="message.fileUuid && message.fileType.startsWith('video/')"
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
      <div class="app-inline app-width-full">
        <div class="">
          В ответ на {{ sender }}
        </div>
        <div class="truncate app-text-ellipsis">
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
