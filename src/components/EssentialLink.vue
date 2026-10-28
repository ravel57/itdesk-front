<template>
  <q-item
    v-if="this.isVisible"
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
        :class="this.miniState ? 'mini-counter app-mini-counter' : 'display-none'"
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
      type: [String, Number],
      default: ''
    },
    roles: {
      type: Array
    },
    // Право, по которому пункт меню виден (как на бэкенде); без права — виден всем вошедшим
    permission: {
      type: String,
      default: ''
    },
    // Список прав «любое из» — используется вместо permission, когда пункт объединяет несколько разделов
    permissions: {
      type: Array,
      default: () => []
    },
    user: {
      type: Object
    },
    miniState: {
      type: Boolean
    },
    // Показывать только в мобильной версии (фильтруется на уровне MainLayout); объявлено как проп,
    // чтобы флаг не утёк в DOM как произвольный атрибут
    mobileOnly: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    isVisible () {
      if (this.permissions?.length) {
        return this.$canAny(...this.permissions)
      }
      if (this.permission) {
        return this.$can(this.permission)
      }
      return !this.roles || this.roles.includes(this.user?.authorities?.[0])
    }
  }

})
</script>

<style scoped>
.display-none {
  display: none !important;
}
</style>
