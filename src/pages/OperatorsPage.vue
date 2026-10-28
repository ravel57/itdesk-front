<template>
  <q-page class="operators-page" :style-fn="this.pageStyle">
    <div class="operators-layout">
      <div
        v-if="!this.isMobile || !this.selectedOperator"
        class="operators-list-column"
      >
        <div class="operators-list-header">
          <div class="text-h6">Операторы</div>
          <div class="text-caption text-grey-7">
            Онлайн: {{ this.onlineCount }} из {{ this.operators.length }}
          </div>
        </div>
        <q-input
          v-model="this.searchQuery"
          dense
          outlined
          clearable
          placeholder="Поиск по имени"
          class="q-mb-sm"
        >
          <template v-slot:append>
            <q-icon name="search"/>
          </template>
        </q-input>
        <q-toggle
          v-model="this.onlyOnline"
          dense
          label="Только онлайн"
          class="q-mb-sm"
        />
        <q-list separator class="operators-list">
          <q-item
            v-for="operator in this.filteredOperators"
            :key="operator.id"
            clickable
            :active="this.selectedOperator?.id === operator.id"
            active-class="operators-list-item--active"
            @click="this.selectOperator(operator)"
          >
            <q-item-section avatar>
              <div class="operator-avatar operator-avatar--small">
                {{ this.initials(operator) }}
                <span
                  class="operator-presence-dot"
                  :class="{ 'operator-presence-dot--online': this.isOnline(operator) }"
                />
              </div>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ this.fullName(operator) }}</q-item-label>
              <q-item-label caption>
                {{ this.roleText(operator) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge
                v-if="this.isOnline(operator)"
                color="positive"
                outline
                label="онлайн"
              />
            </q-item-section>
          </q-item>
          <q-item v-if="this.filteredOperators.length === 0">
            <q-item-section class="text-grey-6">
              {{ this.onlyOnline && !this.searchQuery ? 'Сейчас никого нет онлайн' : 'Никого не найдено' }}
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <div
        v-if="!this.isMobile || this.selectedOperator"
        class="operators-detail-column"
      >
        <template v-if="this.selectedOperator">
          <q-btn
            v-if="this.isMobile"
            flat
            dense
            color="primary"
            icon="arrow_back"
            label="К списку"
            class="q-mb-sm"
            @click="this.backToList"
          />
          <div class="operator-card">
            <div class="operator-card__header">
              <div class="operator-avatar operator-avatar--large">
                {{ this.initials(this.selectedOperator) }}
                <span
                  class="operator-presence-dot operator-presence-dot--large"
                  :class="{ 'operator-presence-dot--online': this.isOnline(this.selectedOperator) }"
                />
              </div>
              <div class="operator-card__title">
                <div class="text-h5">{{ this.fullName(this.selectedOperator) }}</div>
                <div class="row items-center q-gutter-sm q-mt-xs">
                  <q-badge color="primary" outline :label="this.roleText(this.selectedOperator)"/>
                  <q-badge
                    :color="this.isOnline(this.selectedOperator) ? 'positive' : 'grey-6'"
                    :label="this.isOnline(this.selectedOperator) ? 'Онлайн' : 'Не в сети'"
                  />
                </div>
              </div>
            </div>

            <div class="operator-section">
              <div class="operator-section__title">Контакты</div>
              <div v-if="this.contacts.length === 0" class="text-grey-6">
                Контактные данные не указаны
              </div>
              <div
                v-for="contact in this.contacts"
                :key="contact.label"
                class="operator-contact-row"
              >
                <q-icon :name="contact.icon" color="grey-7" size="20px"/>
                <span class="text-grey-7 operator-contact-row__label">{{ contact.label }}</span>
                <span>{{ contact.value }}</span>
              </div>
            </div>

            <div class="operator-section">
              <div class="operator-section__title">Линии поддержки</div>
              <div v-if="this.operatorLines.length === 0" class="text-grey-6">
                Не состоит ни в одной линии
              </div>
              <div v-else class="row q-gutter-sm">
                <q-chip
                  v-for="line in this.operatorLines"
                  :key="line.id"
                  dense
                  outline
                  color="primary"
                  :icon="line.relation === 'responsible' ? 'star' : line.relation === 'observer' ? 'visibility' : 'person'"
                >
                  {{ line.name }} · {{ this.relationLabel(line.relation) }}
                </q-chip>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="operators-empty">
          <q-icon name="support_agent" size="56px" color="grey-5"/>
          <div class="text-grey-7 q-mt-sm">Выберите оператора слева, чтобы посмотреть карточку</div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { useStore } from 'stores/store'
import { roleLabel } from 'src/util/access'

export default {
  name: 'OperatorsPage',

  data: () => ({
    searchQuery: '',
    onlyOnline: false
  }),

  computed: {
    store () {
      return useStore()
    },

    isMobile () {
      return this.$q.screen.width < 1023
    },

    onlineIds () {
      return new Set((this.store.usersOnline || []).map(user => String(user?.id)))
    },

    operators () {
      const merged = new Map()
      for (const user of [...(this.store.users || []), ...(this.store.usersOnline || [])]) {
        if (user && user.id !== undefined && user.id !== null && !merged.has(String(user.id))) {
          merged.set(String(user.id), user)
        }
      }
      return [...merged.values()]
        .filter(user => !(Array.isArray(user.authorities) && user.authorities.includes('OBSERVER')))
        .sort((left, right) => {
          const onlineDiff = Number(this.isOnline(right)) - Number(this.isOnline(left))
          return onlineDiff || this.fullName(left).localeCompare(this.fullName(right), 'ru')
        })
    },

    onlineCount () {
      return this.operators.filter(user => this.isOnline(user)).length
    },

    filteredOperators () {
      const query = String(this.searchQuery || '').trim().toLowerCase()
      return this.operators.filter(user => {
        if (this.onlyOnline && !this.isOnline(user)) {
          return false
        }
        return !query || this.fullName(user).toLowerCase().includes(query)
      })
    },

    selectedOperator () {
      const userId = this.$route.params.userId
      if (!userId) {
        return null
      }
      return this.operators.find(user => String(user.id) === String(userId)) || null
    },

    contacts () {
      const user = this.selectedOperator
      if (!user) {
        return []
      }
      return [
        { icon: 'badge', label: 'Логин', value: user.username },
        { icon: 'mail', label: 'Почта', value: user.email },
        { icon: 'phone', label: 'Телефон', value: user.phoneNumber || user.phone }
      ].filter(item => item.value)
    },

    operatorLines () {
      const user = this.selectedOperator
      if (!user) {
        return []
      }
      const sameUser = person => String(person?.id) === String(user.id)
      return (this.store.supportLines || [])
        .map(line => {
          let relation = null
          if (sameUser(line.responsible)) {
            relation = 'responsible'
          } else if ((line.members || []).some(sameUser)) {
            relation = 'member'
          } else if ((line.observers || []).some(sameUser)) {
            relation = 'observer'
          }
          return relation ? { id: line.id, name: line.name, relation } : null
        })
        .filter(Boolean)
    }
  },

  watch: {
    '$route.params.userId': {
      immediate: true,
      handler () {
        this.revealSelectedInList()
      }
    }
  },

  methods: {
    // Страница ровно по высоте экрана: прокручивается список операторов, а не вся страница
    pageStyle (offset) {
      return {height: offset ? `calc(100vh - ${offset}px)` : '100vh'}
    },

    fullName (user) {
      return `${user?.lastname || ''} ${user?.firstname || ''}`.trim() || user?.username || `Пользователь ${user?.id}`
    },

    initials (user) {
      const first = String(user?.firstname || '').charAt(0)
      const last = String(user?.lastname || '').charAt(0)
      return (last + first).toUpperCase() || '?'
    },

    isOnline (user) {
      return this.onlineIds.has(String(user?.id))
    },

    roleText (user) {
      const role = user?.role || user?.authorities?.[0]
      return roleLabel(role) || 'Сотрудник'
    },

    relationLabel (relation) {
      return {
        responsible: 'ответственный',
        member: 'участник',
        observer: 'наблюдатель'
      }[relation]
    },

    selectOperator (operator) {
      this.$router.push(`/operators/${operator.id}`)
    },

    backToList () {
      this.$router.push('/operators')
    },

    // Оператор из глобального поиска может быть скрыт фильтрами списка — сбрасываем их, чтобы он был виден
    revealSelectedInList () {
      if (this.selectedOperator && this.onlyOnline && !this.isOnline(this.selectedOperator)) {
        this.onlyOnline = false
      }
    }
  }
}
</script>

<style scoped>
.operators-page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 16px;
  overflow: hidden;
}

.operators-layout {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  gap: 24px;
  align-items: stretch;
}

.operators-list-column {
  display: flex;
  flex-direction: column;
  width: 340px;
  min-height: 0;
  flex-shrink: 0;
}

.operators-list-header {
  margin-bottom: 12px;
}

.operators-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid var(--app-border, #e0e0e0);
  border-radius: 8px;
}

.operators-list-item--active {
  background: rgba(148, 121, 255, 0.12);
}

.operators-detail-column {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}

.operator-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(148, 121, 255, 0.2);
  color: var(--q-primary);
  font-weight: 700;
}

.operator-avatar--small {
  width: 36px;
  height: 36px;
  font-size: 14px;
}

.operator-avatar--large {
  width: 72px;
  height: 72px;
  font-size: 26px;
}

.operator-presence-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: var(--app-surface-strong, #bdbdbd);
}

.operator-presence-dot--large {
  width: 16px;
  height: 16px;
  right: 2px;
  bottom: 2px;
}

.operator-presence-dot--online {
  background: #21ba45;
}

.operator-card {
  border: 1px solid var(--app-border, #e0e0e0);
  border-radius: 12px;
  padding: 24px;
  max-width: 720px;
}

.operator-card__header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--app-border, #f0f0f2);
}

.operator-section {
  padding-top: 20px;
}

.operator-section__title {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-text-muted, #8a8a90);
}

.operator-contact-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.operator-contact-row__label {
  min-width: 70px;
}

.operators-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  border: 1px dashed var(--app-border, #d0d0d5);
  border-radius: 12px;
}

@media (max-width: 1023px) {
  .operators-layout {
    flex-direction: column;
  }

  .operators-list-column {
    flex: 1 1 auto;
    width: 100%;
  }
}
</style>
