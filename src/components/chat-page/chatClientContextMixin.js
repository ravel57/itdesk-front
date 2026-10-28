// Источники данных страницы чата: текущий клиент и справочники, которые на время
// обучающего тура подменяются демо-данными. Требует: store, isChatOnboardingActive,
// chatOnboardingDemo* (chatOnboardingMixin), currentClientTasks (chatLinkedTasksMixin).
export default {
  computed: {
    getClient() {
      if (this.isChatOnboardingActive) {
        return this.chatOnboardingDemoClient
      }
      const clientId = Number(this.$route.params.clientId)
      const client = this.store.clients.find(client => client.id === clientId)
      if (client) {
        return client
      } else {
        return {
          messages: [],
          tasks: [],
          typingMessageText: {},
          typingUsers: [],
          watchingUsers: [],
          id: clientId
        }
      }
    },

    activeTemplates() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoTemplates : this.store.templates
    },

    activeKnowledgeBase() {
      // Черновики статей видят только редакторы на странице базы знаний, в подсказках чата их нет
      return this.isChatOnboardingActive
        ? this.chatOnboardingDemoKnowledgeBase
        : (this.store.knowledgeBase || []).filter(article => article.status !== 'DRAFT')
    },

    activeTags() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoTags : this.store.tags
    },

    activeUsers() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoUsers : this.store.users
    },

    activeOrganizations() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoOrganizations : this.store.organizations
    },

    activeStatuses() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoStatuses : this.store.statuses
    },

    activePriorities() {
      return this.isChatOnboardingActive ? this.chatOnboardingDemoPriorities : this.store.priorities
    },

    activeClientTasks() {
      return this.isChatOnboardingActive
        ? (this.chatOnboardingDemoClient.tasks || [])
        : this.currentClientTasks
    },

    isObserverUser() {
      return Array.isArray(this.store.currentUser?.authorities) &&
        this.store.currentUser.authorities.includes('OBSERVER')
    },
  },
}
