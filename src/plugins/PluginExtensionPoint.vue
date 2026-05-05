<template>
  <div v-if="resolvedExtensions.length" class="plugin-extension-point">
    <PluginRenderer
      v-for="extension in resolvedExtensions"
      :key="extension.pluginKey + ':' + extension.key"
      :schema="extension"
      :context="fullContext"
    />
  </div>
</template>

<script>
import PluginRenderer from './PluginRenderer.vue'
import { pluginRegistry } from './pluginRegistry'

export default {
  name: 'PluginExtensionPoint',

  components: {
    PluginRenderer
  },

  props: {
    point: {
      type: String,
      required: true
    },
    entityType: {
      type: String,
      required: true
    },
    entity: {
      type: Object,
      required: false,
      default: null
    },
    context: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },

  computed: {
    resolvedExtensions () {
      return pluginRegistry
        .getExtensions(this.point, this.entityType)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    },

    fullContext () {
      return {
        ...this.context,
        entityType: this.entityType,
        entity: this.entity
      }
    }
  }
}
</script>

<style>
.plugin-extension-point {
  margin-top: 8px;
}
</style>
