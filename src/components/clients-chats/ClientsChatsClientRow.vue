<template>
  <div>
    <q-item
      clickable
      class="client-row-item"
      :data-tour="isFirst ? 'client-row' : null"
    >
      <q-item-section class="client-row-main app-client-row-main">
        <router-link
          :to="route"
          class="text-primary client-row-link"
          @click="$emit('chat-click', $event)"
        >
          <q-item-section
            side
            class="client-avatar-section"
          >
            <div
              class="client-avatar"
              :style="'background-color: ' + avatarColor"
            >
              {{ abbreviation }}
              <div
                v-if="hasCriticalTasks || hasPing"
                class="client-attention-badge"
              >
                <q-icon name="priority_high" color="white" size="18px"/>
                <q-tooltip
                  anchor="center left"
                  self="center right"
                  :offset="[10, 10]"
                >
                  <div v-if="hasCriticalTasks">Критическая заявка</div>
                  <div v-if="hasPing">Есть упоминание (@)</div>
                </q-tooltip>
              </div>
            </div>
          </q-item-section>
          <q-item-section class="client-info-section">
            <q-item-label
              class="client-name-row"
              :data-tour="isFirst ? 'client-name' : null"
            >
              <span class="client-name-text app-client-name-text">
                {{ name }}
              </span>
              <span
                v-if="organization"
                class="client-organization-inline"
                :title="organization"
                :data-tour="isFirst ? 'client-organization' : null"
              >
                | {{ organization }}
              </span>
              <div class="row items-center no-wrap">
                <div
                  v-if="slaVisible"
                  class="sla-pill q-ml-sm app-clients-chats-client-row-sla-pill"
                  :class="{ 'sla-pill--expired': slaExpired }"
                  :data-tour="isFirst ? 'client-sla' : null"
                >
                  <q-linear-progress
                    :value="slaPercent ?? 0"
                    :color="slaExpired ? 'negative' : slaColor"
                    :track-color="slaExpired ? 'negative-2' : 'grey-3'"
                    reverse
                    rounded
                    class="sla-bar"
                    style="width: 80px; border: solid 1px var(--app-border, darkgray)"
                    size="12px"
                    :animation-speed="0"
                  >
                    <q-tooltip
                      anchor="top middle"
                      self="bottom middle"
                      :offset="[10, 10]"
                    >
                      Минимальный SLA среди заявок
                    </q-tooltip>
                  </q-linear-progress>
                </div>
              </div>
            </q-item-label>
            <q-item-label
              caption
            >
              <PluginExtensionPoint
                point="CHAT_CLIENT_ROW_INFO"
                entity-type="CLIENT"
                :entity="client"
                :context="{ client }"
              />
            </q-item-label>
            <q-item-label
              class="shorten-text app-shorten-text"
              caption
              :data-tour="isFirst ? 'client-last-message' : null"
              :class="!isObserver && client.lastMessage?.deleted ? 'strikethrough app-strikethrough' : ''"
            >
              {{ timeLastMessage }}: {{ lastMessage }}
            </q-item-label>
          </q-item-section>
          <div
            v-if="client.unreadMessagesCount || hasUnansweredRequired"
            class="client-row-alerts"
            :data-tour="isFirst ? 'client-alerts' : null"
          >
            <q-separator vertical class="client-row-alerts__separator"/>

            <div class="client-row-alerts__content">
              <span
                v-if="hasUnansweredRequired"
                class="unanswered-timer"
                :title="answerTimerTitle"
              >
                {{ answerTimerText }}
              </span>

              <circle-counter
                v-if="client.unreadMessagesCount"
                :counter="client.unreadMessagesCount"
              />
            </div>
          </div>
        </router-link>
      </q-item-section>
    </q-item>
    <q-separator/>
  </div>
</template>

<script>
import CircleCounter from 'components/CircleCounter.vue'
import PluginExtensionPoint from 'src/plugins/PluginExtensionPoint.vue'

// Строка клиента в списке чатов. Все данные вычисляются в странице (props), клик по ссылке — событие chat-click.
export default {
  name: 'ClientsChatsClientRow',

  components: {
    CircleCounter,
    PluginExtensionPoint
  },

  props: {
    client: { type: Object, required: true },
    // первая строка списка — на ней висят data-tour подсказки обучения
    isFirst: { type: Boolean, default: false },
    route: { type: [String, Object], required: true },
    isObserver: { type: Boolean, default: false },
    name: { type: String, default: '' },
    abbreviation: { type: String, default: '' },
    avatarColor: { type: String, default: '' },
    organization: { type: String, default: '' },
    hasCriticalTasks: { type: Boolean, default: false },
    hasPing: { type: Boolean, default: false },
    slaVisible: { type: Boolean, default: false },
    slaExpired: { type: Boolean, default: false },
    slaPercent: { type: Number, default: null },
    slaColor: { type: String, default: 'grey' },
    timeLastMessage: { type: String, default: '' },
    lastMessage: { type: String, default: '' },
    hasUnansweredRequired: { type: Boolean, default: false },
    answerTimerText: { type: String, default: '' },
    answerTimerTitle: { type: String, default: '' }
  },

  emits: ['chat-click']
}
</script>

<style scoped>
.sla-pill--expired {
  border-color: red;
}

.sla-bar {
  width: 100%;
}

.client-row-alerts {
  display: flex;
  align-items: stretch;
  align-self: stretch;
  flex: 0 0 auto;
  margin-left: 0;
  margin-right: auto;
}

.client-row-alerts__separator {
  align-self: stretch;
  height: auto;
  margin-right: 12px;
}

.client-row-alerts__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.client-info-section {
  flex: 0 0 400px;
  width: 400px;
  min-width: 0;
  max-width: 400px;
}

.unanswered-timer {
  font-size: 12px;
  line-height: 1;
  color: var(--q-primary);
  white-space: nowrap;
  font-weight: 600;
}

.client-attention-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--q-negative);
  border: 2px solid #fff;
  cursor: default;
}

.client-row-link {
  text-decoration: none;
  display: flex;
  align-items: stretch;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.client-avatar-section {
  padding-top: 6px;
  padding-right: 8px;
  flex: 0 0 auto;
}

.client-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 20px;
  flex: 0 0 auto;
}

.client-name-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.client-organization-inline {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  color: var(--app-text-muted, #9aa0ab);
  font-weight: 400;
}

@media (max-width: 600px) {
  .client-row-item {
    padding: 7px 4px;
  }

  .client-row-link {
    align-items: stretch;
  }

  .client-avatar-section {
    padding-right: 8px;
  }

  .client-avatar {
    width: 42px;
    height: 42px;
    font-size: 17px;
  }

  .client-info-section {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
    max-width: none;
  }

  .client-name-row {
    flex-wrap: wrap;
    gap: 3px 6px;
    line-height: 1.15;
  }

  .sla-bar {
    width: 64px !important;
  }

  .client-row-alerts {
    flex: 0 0 70px;
    max-width: 70px;
    margin-left: 6px;
    margin-right: 0;
    justify-content: flex-end;
  }

  .client-row-alerts__separator {
    margin-right: 8px;
  }

  .client-row-alerts__content {
    gap: 4px;
  }

  .unanswered-timer {
    font-size: 11px;
    line-height: 1.1;
    text-align: right;
  }
}
</style>
