<template>
  <q-dialog
    :model-value="this.modelValue"
    @update:model-value="this.$emit('update:modelValue', $event)"
  >
    <q-card style="overflow: hidden;"
            :style="this.isMobile ? 'max-height: 60vh; max-width: 90vw;' : 'max-height: 90vh; max-width: 80vw;'">
      <div style="overflow-x: auto">
        <img
          :style="this.getScaledImageStyle()"
          :src="`/files/images/${this.photo.fileUuid}`"
          alt="">
      </div>
    </q-card>
  </q-dialog>
</template>

<script>
// Просмотр фотографии из сообщения в увеличенном размере
export default {

  name: 'ChatPhotoDialog',

  props: {
    modelValue: { type: Boolean },
    // Сообщение с фотографией (fileUuid, fileWidth, fileHeight)
    photo: {
      type: [Object, String],
      default: ''
    },
    isMobile: { type: Boolean }
  },

  emits: ['update:modelValue'],

  methods: {
    getScaledImageStyle () {
      const maxWidth = this.isMobile ? window.innerWidth * 0.9 : window.innerWidth * 0.8
      const maxHeight = this.isMobile ? window.innerHeight * 0.6 : window.innerHeight * 0.9

      let imgWidth = this.photo.fileWidth
      let imgHeight = this.photo.fileHeight

      const aspectRatio = imgWidth / imgHeight

      if (imgWidth > maxWidth || imgHeight > maxHeight) {
        if (imgWidth / maxWidth > imgHeight / maxHeight) {
          imgWidth = maxWidth
          imgHeight = maxWidth / aspectRatio
        } else {
          imgHeight = maxHeight
          imgWidth = maxHeight * aspectRatio
        }
      }

      return `height: ${imgHeight}px; width: ${imgWidth}px;`
    }
  }
}
</script>
