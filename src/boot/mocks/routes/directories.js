import {withPrefix, ok, noContent, badRequest, clone} from 'src/boot/mocks/helpers'

export function registerDirectoryMocks(mock, db) {
  // GET /users
  mock.onGet(withPrefix('\\/users')).reply(() => ok(clone(db.users)))

  // GET /roles
  mock.onGet(withPrefix('\\/roles')).reply(() => ok(clone(db.roles)))

  // GET /organizations
  mock.onGet(withPrefix('\\/organizations')).reply(() => ok(clone(db.organizations)))

  // GET /tags
  mock.onGet(withPrefix('\\/tags')).reply(() => ok(clone(db.tags)))

  // GET /statuses
  mock.onGet(withPrefix('\\/statuses')).reply(() => ok(clone(db.statuses)))

  // GET /priorities
  mock.onGet(withPrefix('\\/priorities')).reply(() => ok(clone(db.priorities)))

  // GET /templates
  mock.onGet(withPrefix('\\/templates')).reply(() => ok(clone(db.templates)))

  // GET /filters
  mock.onGet(withPrefix('\\/filters')).reply(() => ok([]))

  // GET /llm/query?query=...
  mock.onGet(withPrefix('\\/llm/query')).reply((config) => {
    const q = config.params?.query || ''
    return ok({
      answer: `MOCK LLM ANSWER: ${q}`,
      context: []
    })
  })

  // GET /knowledge-base
  mock.onGet(withPrefix('\\/knowledge-base')).reply(() => ok(clone(db.knowledgeBase)))

  // GET /support-lines, /task-types, /services
  mock.onGet(withPrefix('\\/support-lines')).reply(() => ok(clone(db.supportLines)))
  mock.onGet(withPrefix('\\/task-types')).reply(() => ok(clone(db.taskTypes)))
  mock.onGet(withPrefix('\\/services')).reply(() => ok(clone(db.services)))
  mock.onGet(withPrefix('\\/organization-service-assignments')).reply(() => ok([]))
  mock.onGet(withPrefix('\\/zabbix-integrations')).reply(() => ok([]))
  mock.onGet(withPrefix('\\/service-criticalities')).reply(() => ok([]))

  // ----------------------------
  // admin crud (минимально, чтобы UI не падал)
  // ----------------------------

  // POST /tag
  mock.onPost(withPrefix('\\/tag')).reply((config) => {
    const body = JSON.parse(config.data || '{}')
    const name = String(body?.name || '').trim()
    if (!name) return badRequest('name required')

    const id = Math.max(0, ...db.tags.map(t => t.id)) + 1
    const tag = {id, name}
    db.tags.push(tag)
    return ok(clone(tag))
  })

  // PATCH /tag
  mock.onPatch(withPrefix('\\/tag')).reply((config) => {
    const body = JSON.parse(config.data || '{}')
    const id = Number(body?.id)
    const name = String(body?.name || '').trim()
    if (!id || !name) return badRequest('id/name required')

    const tag = db.tags.find(t => t.id === id)
    if (!tag) return badRequest('tag not found')

    tag.name = name
    return ok(clone(tag))
  })

  // DELETE /tag/{tagId}
  mock.onDelete(withPrefix('\\/tag\\/(\\d+)')).reply((config) => {
    const m = config.url.match(/\/tag\/(\d+)/)
    const tagId = Number(m?.[1])
    if (!tagId) return badRequest('tagId invalid')

    db.tags = db.tags.filter(t => t.id !== tagId)
    return noContent()
  })
}
