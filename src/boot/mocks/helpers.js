export const withPrefix = (pathRegex) => new RegExp(`^(?:\\/api\\/v1)?${pathRegex}(?:\\?.*)?$`)
export const ok = (data) => [200, data]
export const noContent = () => [204]
export const badRequest = (msg = 'Bad Request') => [400, {message: msg}]

export const now = () => Date.now()
export const clone = (x) => JSON.parse(JSON.stringify(x))

let nextTaskId = 100
let nextMsgId = 1000

export const genTaskId = () => (nextTaskId++).toString()
export const genMsgId = () => (nextMsgId++).toString()
