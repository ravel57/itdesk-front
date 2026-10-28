import {conditionFieldMeta} from 'src/util/automationPage/graphFields'
import {
  buildActionExpression,
  buildConditionExpression,
  parseGraphAction,
  parseGraphCondition,
  splitTopLevel,
  stripOuterBrackets
} from 'src/util/automationPage/graphExpressions'

// Модель простого («графового») редактора правил: условия (группы И/ИЛИ), действия веток ДА/НЕТ,
// сборка выражений и разбор сохранённых выражений обратно в модель.
// Требует в компоненте: this.supportLines.
export default {
  data: () => ({
    graphConditionGroups: [],
    graphActions: [],
    graphElseActions: [],
    elseBranchEnabled: false,
    graphSequence: 1
  }),

  computed: {
    graphExpression() {
      if (this.graphConditionGroups.length === 0) {
        return 'true'
      }

      const groups = []
      for (const group of this.graphConditionGroups) {
        if (!group.conditions.length) {
          return ''
        }
        const conditions = group.conditions.map(condition => buildConditionExpression(condition))
        if (conditions.some(value => !value)) {
          return ''
        }
        groups.push(`(${conditions.join(' and ')})`)
      }
      return groups.join(' or ')
    },

    graphAction() {
      const actions = this.graphActions.map(action => buildActionExpression(action))
      if (!actions.length || actions.some(value => !value)) {
        return ''
      }
      return actions.join('; ')
    },

    graphElseAction() {
      if (!this.elseBranchEnabled) {
        return ''
      }
      const actions = this.graphElseActions.map(action => buildActionExpression(action))
      if (!actions.length || actions.some(value => !value)) {
        return ''
      }
      return actions.join('; ')
    }
  },

  methods: {
    nextGraphId() {
      const id = this.graphSequence
      this.graphSequence += 1
      return id
    },

    newCondition() {
      return {
        id: this.nextGraphId(),
        field: 'task.type.id',
        operator: 'equals',
        value: null
      }
    },

    newAction() {
      return {
        id: this.nextGraphId(),
        type: 'ASSIGN_LINE',
        value: this.supportLines.find(line => line.defaultSelection)?.id || null
      }
    },

    addConditionGroup() {
      this.graphConditionGroups.push({
        id: this.nextGraphId(),
        conditions: [this.newCondition()]
      })
    },

    removeConditionGroup(groupIndex) {
      this.graphConditionGroups.splice(groupIndex, 1)
    },

    addCondition(groupIndex) {
      this.graphConditionGroups[groupIndex].conditions.push(this.newCondition())
    },

    removeCondition(groupIndex, conditionIndex) {
      const group = this.graphConditionGroups[groupIndex]
      group.conditions.splice(conditionIndex, 1)
      if (group.conditions.length === 0) {
        this.removeConditionGroup(groupIndex)
      }
    },

    branchActions(branch) {
      return branch === 'no' ? this.graphElseActions : this.graphActions
    },

    addAction(branch = 'yes') {
      this.branchActions(branch).push(this.newAction())
    },

    removeAction(branch, actionIndex) {
      const actions = this.branchActions(branch)
      if (actions.length > 1) {
        actions.splice(actionIndex, 1)
      }
    },

    onElseBranchToggle(enabled) {
      if (enabled && this.graphElseActions.length === 0) {
        this.graphElseActions = [this.newAction()]
      }
    },

    resetCondition(condition) {
      condition.operator = 'equals'
      condition.value = null
      const meta = conditionFieldMeta(condition.field)
      if (meta.kind === 'tag') {
        condition.operator = 'has_tag'
      } else if (meta.kind === 'text') {
        condition.operator = 'contains'
      }
    },

    resetGraph() {
      this.graphSequence = 1
      this.graphConditionGroups = []
      this.graphActions = [this.newAction()]
      this.graphElseActions = []
      this.elseBranchEnabled = false
    },

    readGraph(expression, action, elseAction) {
      this.resetGraph()
      const nextGraphId = () => this.nextGraphId()
      const normalizedExpression = String(expression || '').trim()
      const normalizedAction = String(action || '').trim()
      const normalizedElseAction = String(elseAction || '').trim()

      if (normalizedExpression && normalizedExpression !== 'true') {
        const parsedGroups = []
        for (const rawGroup of splitTopLevel(normalizedExpression, 'or')) {
          const conditions = []
          for (const rawCondition of splitTopLevel(stripOuterBrackets(rawGroup), 'and')) {
            const parsed = parseGraphCondition(rawCondition, nextGraphId)
            if (!parsed) return false
            conditions.push(parsed)
          }
          parsedGroups.push({id: this.nextGraphId(), conditions})
        }
        this.graphConditionGroups = parsedGroups
      }

      const parsedActions = []
      for (const rawAction of splitTopLevel(normalizedAction, ';')) {
        const parsed = parseGraphAction(rawAction, nextGraphId)
        if (!parsed) return false
        parsedActions.push(parsed)
      }
      if (!parsedActions.length) return false
      this.graphActions = parsedActions

      if (normalizedElseAction) {
        const parsedElseActions = []
        for (const rawAction of splitTopLevel(normalizedElseAction, ';')) {
          const parsed = parseGraphAction(rawAction, nextGraphId)
          if (!parsed) return false
          parsedElseActions.push(parsed)
        }
        if (!parsedElseActions.length) return false
        this.graphElseActions = parsedElseActions
        this.elseBranchEnabled = true
      }
      return true
    }
  }
}
