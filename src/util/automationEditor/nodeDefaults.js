import { nextFlowId } from 'src/util/automationFlow'

// Конфигурация нового узла по его типу.
export function defaultNodeConfig(type, {triggerTypes, supportLines}) {
  if (type === 'OPERATION') return {operation: '', arguments: {}, resultVariable: '', background: false}
  if (type === 'PARAMETERS') return {resultVariable: 'settings', parameters: []}
  if (type === 'FOR_EACH') return {itemsExpression: '', itemVariable: 'item', indexVariable: 'index', maxItems: 100, endNodeId: null, collectExpression: '', resultVariable: ''}
  if (['LOOP_END', 'LOOP_BREAK'].includes(type)) return {}
  if (type === 'EVENT') return {triggerType: triggerTypes[0]?.value || 'TASK_CREATED'}
  if (type === 'CONDITION') return {expression: 'true', rule: {left: '=true', operator: 'true'}, groups: [], manualExpression: false}
  if (type === 'SWITCH') {
    return {
      valueExpression: 'task.priority.id',
      cases: [
        {id: nextFlowId('case'), label: 'Вариант 1', value: ''},
        {id: nextFlowId('case'), label: 'Вариант 2', value: ''}
      ]
    }
  }
  if (type === 'ACTION') return {actionScript: '', actions: [], manualScript: false, continueOnError: false}
  if (type === 'DELAY') return {amount: 15, unit: 'MINUTES'}
  if (type === 'WAIT_UNTIL') return {mode: 'DURATION', amount: 15, unit: 'MINUTES', minutesBefore: 30, dateTime: ''}
  if (type === 'WAIT_EVENT') {
    return {
      eventType: 'MESSAGE_INCOMING', scope: 'TASK', filterExpression: '', timeoutAmount: 24, timeoutUnit: 'HOURS'
    }
  }
  if (type === 'WAIT_TASK') {
    return {
      eventType: 'TASK_CLOSED',
      taskIdExpression: 'task.id',
      filterExpression: '',
      timeoutAmount: 7,
      timeoutUnit: 'DAYS'
    }
  }
  if (type === 'APPROVAL') {
    return {
      title: 'Требуется решение', message: '', approverUserId: null, timeoutAmount: 24, timeoutUnit: 'HOURS'
    }
  }
  if (type === 'SUBFLOW') return {triggerId: null, mode: 'INLINE', localVariables: true, inputs: {}, outputs: {}}
  if (type === 'FORK') {
    return {
      joinNodeId: null,
      branches: [
        {id: nextFlowId('branch'), label: 'Ветка 1'},
        {id: nextFlowId('branch'), label: 'Ветка 2'}
      ]
    }
  }
  if (type === 'JOIN') return {description: 'Дождаться завершения веток'}
  if (type === 'HTTP_REQUEST') {
    return {
      method: 'GET', url: '', headersText: '{}', body: '', timeoutSeconds: 15, resultVariable: 'httpResponse'
    }
  }
  if (type === 'SET_VARIABLE') return {name: 'value', expression: ''}
  if (type === 'EXPRESSION') return {name: 'result', expression: '0'}
  if (type === 'COUNTER') return {name: 'counter', operation: 'ADD', amountExpression: '1'}
  if (type === 'ERROR_HANDLER') return {actionScript: ''}
  if (type === 'RETRY') {
    return {
      actionScript: '',
      maxAttempts: 3,
      delayAmount: 5,
      delayUnit: 'MINUTES',
      multiplier: 2
    }
  }
  if (type === 'ESCALATE') {
    return {
      supportLineId: supportLines[0]?.id || null,
      priorityName: null,
      clearAssignee: true,
      notifyUserId: null,
      reason: ''
    }
  }
  if (type === 'CREATE_TASK') {
    return {
      title: 'Связанная заявка',
      description: '',
      typeId: null,
      serviceId: null,
      priorityName: null,
      supportLineId: null,
      resultVariable: 'createdTaskId'
    }
  }
  if (type === 'NOTIFY') return {channel: 'CLIENT', userId: null, text: ''}
  if (type === 'BUSINESS_HOURS') return {}
  if (type === 'THROTTLE') return {scope: 'TASK', customKey: '', amount: 30, unit: 'MINUTES'}
  if (type === 'DEDUPLICATE') {
    return {
      windowMinutes: 120, typeId: null, titleMode: 'CURRENT', title: '', resultVariable: 'duplicateTaskId'
    }
  }
  if (type === 'NOTE') return {text: ''}
  if (type === 'END') return {result: 'Сценарий завершён'}
  return {}
}
