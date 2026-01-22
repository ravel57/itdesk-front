<template>
  <q-item-section
    v-if="counter"
    side
    class="circle no-padding"
  >
    {{ counter }}
  </q-item-section>
  <q-item-section
    v-else-if="image"
    side
    class="circle no-padding"
  >
    <img :src="image" :alt="counter" style="width: 12px;"/>
  </q-item-section>
</template>

<script>
export default {
  props: ['counter', 'image']
}
</script>

<style scoped>
.circle {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background-color: var(--q-primary);
  display: flex;
  color: white;
  align-items: center;
  justify-content: center;
  align-content: center;
}
</style>
