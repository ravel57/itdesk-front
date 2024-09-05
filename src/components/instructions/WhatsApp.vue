<template>
  <q-card class="dialog-width">
    <q-card-section style="display: flex; flex-direction: row;justify-content: space-between;padding-bottom: 5px">
      <div class="text-h6">
        Инструкция What's App
      </div>
      <q-btn
        icon="close"
        dense
        flat
        v-close-popup
      />
    </q-card-section>
    <q-card-section>

    </q-card-section>
    <q-card-actions class="justify-end">
      <q-btn
        color="primary"
        v-close-popup
      >
        Понятно
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script>
export default {
  name: 'whats-app-instruction'
}
</script>

<style scoped>

</style>
