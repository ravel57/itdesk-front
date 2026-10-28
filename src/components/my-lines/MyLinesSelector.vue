<template>
  <div class="line-selector q-mt-md">
    <q-card
      flat
      bordered
      clickable
      class="line-summary-card all-lines-card"
      :class="{ 'line-summary-card--selected': selectedLineId === null }"
      @click="$emit('select', null)"
    >
      <q-card-section class="line-summary-content">
        <div class="line-summary-icon bg-primary text-white">
          <q-icon name="account_tree" size="22px"/>
        </div>
        <div class="line-summary-body">
          <div class="line-summary-title">Все мои линии</div>
          <div class="line-summary-caption">
            {{ lines.length }} {{ pluralizeLines(lines.length) }}
          </div>
        </div>
        <q-icon
          v-if="selectedLineId === null"
          name="check_circle"
          color="primary"
          size="22px"
        />
      </q-card-section>
    </q-card>

    <q-card
      v-for="line in lines"
      :key="line.id"
      flat
      bordered
      clickable
      class="line-summary-card"
      :class="{ 'line-summary-card--selected': Number(selectedLineId) === Number(line.id) }"
      @click="$emit('select', line.id)"
    >
      <q-card-section class="line-summary-content">
        <div class="line-summary-level">
          L{{ line.level || 1 }}
        </div>
        <div class="line-summary-body">
          <div class="line-summary-title text-ellipsis">{{ line.name }}</div>
          <div class="line-summary-meta">
            <q-badge outline color="primary" :label="getLineRoleLabel(line)"/>
            <span>{{ getLineMemberCount(line) }} участников</span>
          </div>
          <div class="line-summary-caption text-ellipsis">
            {{ getLineOlaLabel(line) }}
          </div>
        </div>
        <q-icon
          v-if="Number(selectedLineId) === Number(line.id)"
          name="check_circle"
          color="primary"
          size="22px"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script>
import {getLineMemberCount, getLineOlaLabel, getLineRoleLabel, pluralizeLines} from 'src/util/myLines/lineHelpers'

// Выбор линии на странице «Мои линии»: карточка «Все мои линии» и карточки линий пользователя.
export default {
  name: 'MyLinesSelector',

  props: {
    lines: {type: Array, default: () => []},
    selectedLineId: {type: Number, default: null},
    currentUserId: {type: [Number, String], default: null}
  },

  emits: ['select'],

  methods: {
    pluralizeLines,
    getLineMemberCount,
    getLineOlaLabel,

    getLineRoleLabel(line) {
      return getLineRoleLabel(line, this.currentUserId)
    }
  }
}
</script>

<style scoped>
.line-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.line-summary-card {
  cursor: pointer;
  border-left: 4px solid var(--app-border, #bdbdbd);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.line-summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.1);
}

.line-summary-card--selected {
  border-left-color: var(--q-primary);
  box-shadow: 0 4px 14px rgba(92, 53, 249, 0.14);
}

.line-summary-content {
  min-height: 92px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.line-summary-icon,
.line-summary-level {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.line-summary-level {
  background: rgba(92, 53, 249, 0.1);
  color: var(--q-primary);
  font-weight: 700;
}

.line-summary-body {
  min-width: 0;
  flex: 1;
}

.line-summary-title {
  font-size: 15px;
  font-weight: 700;
}

.line-summary-meta {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-text-muted, #757575);
  font-size: 12px;
}

.line-summary-caption {
  margin-top: 5px;
  color: var(--app-text-muted, #757575);
  font-size: 12px;
}

@media (max-width: 700px) {
  .line-selector {
    grid-template-columns: 1fr;
  }
}
</style>
