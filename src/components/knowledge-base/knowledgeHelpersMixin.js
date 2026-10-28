import {
  getKnowledgePreview,
  getKnowledgeSearchText,
  getKnowledgeTags,
  getKnowledgeTexts,
  getTaskLink,
  isDraft,
  normalizeSearchValue
} from 'src/util/knowledgeBase/knowledgeContent'

// Методы-обёртки над чистыми функциями разбора статьи, чтобы шаблоны и миксины
// страницы и дочерних компонентов (список, просмотр, диалог) пользовались одними именами.
export default {
  methods: {
    isDraft (knowledge) {
      return isDraft(knowledge)
    },

    taskLink (knowledge) {
      return getTaskLink(knowledge)
    },

    getKnowledgeTexts (knowledge) {
      return getKnowledgeTexts(knowledge)
    },

    getKnowledgeTags (knowledge) {
      return getKnowledgeTags(knowledge)
    },

    getKnowledgePreview (knowledge) {
      return getKnowledgePreview(knowledge)
    },

    normalizeKnowledgeSearch (value) {
      return normalizeSearchValue(value)
    },

    getKnowledgeSearchText (knowledge) {
      return getKnowledgeSearchText(knowledge)
    },

    normalizeKnowledgeTagSearch (value) {
      return normalizeSearchValue(value)
    }
  }
}
