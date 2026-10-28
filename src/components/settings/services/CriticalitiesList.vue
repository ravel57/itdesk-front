<template>
  <q-list bordered separator class="rounded-borders settings-row-list">
    <q-item header class="text-bold">
      Критичность
    </q-item>

    <q-item v-if="loading && !criticalities.length">
      <q-item-section class="text-grey-7">
        Загрузка...
      </q-item-section>
    </q-item>

    <q-item v-else-if="!criticalities.length">
      <q-item-section class="text-grey-7">
        Критичности не добавлены
      </q-item-section>
    </q-item>

    <draggable
      v-else
      :list="criticalities"
      item-key="id"
      class="list-group"
      ghost-class="ghost"
      handle=".settings-drag-handle"
      @end="$emit('resort')"
    >
      <template #item="{ element }">
        <q-item class="list-group-item">
          <q-item-section side class="settings-drag-handle cursor-grab">
            <q-icon name="drag_indicator" color="grey-6"/>
          </q-item-section>

          <q-item-section>
            <q-item-label class="row items-center q-gutter-sm">
              <span class="text-weight-medium">{{ element.name }}</span>
              <q-badge v-if="element.defaultSelection" color="primary">По умолчанию</q-badge>
            </q-item-label>
            <q-item-label caption>
              Сервисов: {{ criticalityUsage(element) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row no-wrap">
              <q-btn
                flat
                dense
                :text-color="element.defaultSelection ? 'primary' : 'grey'"
                icon="beenhere"
                @click.stop="$emit('set-default', element)"
              >
                <q-tooltip>
                  {{ element.defaultSelection ? 'Используется по умолчанию' : 'Использовать по умолчанию' }}
                </q-tooltip>
              </q-btn>
              <q-btn flat dense color="primary" icon="edit" @click.stop="$emit('edit', element)">
                <q-tooltip>Редактировать критичность</q-tooltip>
              </q-btn>
              <q-btn flat dense color="negative" icon="delete" @click.stop="$emit('remove', element)">
                <q-tooltip>Удалить критичность</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </template>
    </draggable>
  </q-list>
</template>

<script>
import draggable from 'vuedraggable'

// Список критичностей с перетаскиванием (вкладка «Критичности»).
// Порядок меняется на месте в переданном массиве (vuedraggable :list); сохранение порядка — по событию resort.
export default {
  name: 'CriticalitiesList',

  components: {draggable},

  props: {
    criticalities: {type: Array, default: () => []},
    // нужен для подсчёта «Сервисов: N» у каждой критичности
    services: {type: Array, default: () => []},
    loading: {type: Boolean, default: false}
  },

  emits: ['resort', 'set-default', 'edit', 'remove'],

  methods: {
    criticalityUsage(row) {
      return this.services.filter(service => service.criticality?.id === row.id).length
    }
  }
}
</script>
