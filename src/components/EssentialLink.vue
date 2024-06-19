<template>
  <q-item
    v-if="this.roles.includes(this.user.authorities[0])"
    clickable
    tag="router-link"
    :to="link"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon"/>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>

    <circle-counter v-if="counter" :counter="counter"/>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'
import CircleCounter from 'components/CircleCounter.vue'

export default defineComponent({
  name: 'EssentialLink',

  components: { CircleCounter },

  props: {
    title: {
      type: String,
      required: true
    },
    caption: {
      type: String,
      default: ''
    },
    link: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    counter: {
      type: String,
      default: ''
    },
    roles: {
      type: Array
    },
    user: {
      type: Object
    }
  }

})
</script>
