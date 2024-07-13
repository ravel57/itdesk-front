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
      <q-icon
        :name="icon"
      />
      <circle-counter
        v-if="counter"
        :class="this.miniState ? 'mini-counter' : 'display-none'"
        :counter="counter"
      />
    </q-item-section>
    <circle-counter
      v-else-if="this.miniState"
      :counter="counter"
    />
    <q-item-section>
      <q-item-label>
        {{ title }}
      </q-item-label>
      <q-item-label
        caption
      >
        {{ caption }}
      </q-item-label>
    </q-item-section>

    <circle-counter
      v-if="counter"
      :counter="counter"
    />
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
    },
    miniState: {
      type: Boolean
    }
  }

})
</script>

<style scoped>
.mini-counter {
  position: absolute !important;
  height: 12px !important;
  width: 12px !important;
  font-size: 9px !important;
  margin-left: 15px !important;
  background-color: var(--q-primary) !important;
  top: 8px !important;
}

.display-none {
  display: none !important;
}
</style>
