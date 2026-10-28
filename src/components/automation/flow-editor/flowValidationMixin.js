import { deepClone } from 'src/util/automationFlow'
import { validateFlow } from 'src/util/automationEditor/flowValidation'

// Валидация графа: computed validation и событие validation-change.
// Требует: data localFlow, operationCatalog. Логика проверок — src/util/automationEditor/flowValidation.js.
export default {
  computed: {
    validation() {
      return validateFlow(this.localFlow, () => this.operationCatalog)
    }
  },

  watch: {
    validation: {
      deep: true,
      immediate: true,
      handler(value) {
        this.$emit('validation-change', deepClone(value))
      }
    }
  }
}
