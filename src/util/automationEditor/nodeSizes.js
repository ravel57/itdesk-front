// Размеры узлов графа и типы узлов, настраиваемых в AutomationAdvancedNodeInspector.

export const NODE_SIZES = {
  OPERATION: {width: 350, height: 185},
  PARAMETERS: {width: 350, height: 185},
  FOR_EACH: {width: 330, height: 185},
  LOOP_END: {width: 235, height: 120},
  LOOP_BREAK: {width: 235, height: 120},
  EVENT: {width: 250, height: 145},
  CONDITION: {width: 310, height: 185},
  SWITCH: {width: 310, height: 185},
  ACTION: {width: 310, height: 185},
  DELAY: {width: 245, height: 145},
  WAIT_UNTIL: {width: 260, height: 150},
  WAIT_EVENT: {width: 280, height: 165},
  WAIT_TASK: {width: 280, height: 165},
  APPROVAL: {width: 280, height: 165},
  SUBFLOW: {width: 265, height: 150},
  FORK: {width: 280, height: 175},
  JOIN: {width: 230, height: 125},
  HTTP_REQUEST: {width: 290, height: 165},
  SET_VARIABLE: {width: 265, height: 145},
  EXPRESSION: {width: 265, height: 145},
  COUNTER: {width: 245, height: 135},
  ERROR_HANDLER: {width: 290, height: 165},
  RETRY: {width: 275, height: 160},
  ESCALATE: {width: 275, height: 160},
  CREATE_TASK: {width: 280, height: 165},
  NOTIFY: {width: 265, height: 145},
  BUSINESS_HOURS: {width: 265, height: 150},
  THROTTLE: {width: 265, height: 150},
  DEDUPLICATE: {width: 275, height: 155},
  NOTE: {width: 245, height: 135},
  END: {width: 220, height: 120}
}

export const ADVANCED_NODE_TYPES = [
  'SWITCH', 'WAIT_UNTIL', 'WAIT_EVENT', 'WAIT_TASK', 'APPROVAL', 'SUBFLOW', 'FORK', 'JOIN',
  'HTTP_REQUEST', 'SET_VARIABLE', 'EXPRESSION', 'COUNTER', 'ERROR_HANDLER', 'RETRY', 'ESCALATE',
  'CREATE_TASK', 'NOTIFY', 'BUSINESS_HOURS', 'THROTTLE', 'DEDUPLICATE'
]

export function nodeSize(node) {
  return NODE_SIZES[node?.type] || NODE_SIZES.NOTE
}
