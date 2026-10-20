<template>
  <div class="q-pa-md">
    <div class="settings-content-header">
      <div class="settings-content-heading">
        <div class="settings-content-title">Карточка заявки</div>
        <div class="settings-content-description">
          Выберите, какие поля показывать в карточке заявки, и перетащите их в нужном порядке.
        </div>
      </div>
    </div>

    <task-card-configurator/>
  </div>
</template>

<script>
import TaskCardConfigurator from 'components/TaskCardConfigurator.vue'

export default {
  name: 'TaskCardConfigPage',

  components: { TaskCardConfigurator }
}
</script>
