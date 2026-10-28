import {withPrefix, ok, noContent, badRequest, now, clone, genMsgId} from 'src/boot/mocks/helpers'

export function registerClientMocks(mock, db) {
  // GET /clients
  mock.onGet(withPrefix('\\/clients')).reply(() => ok(clone(db.clients)))

  // PATCH /client/{clientId}/client — редактирование карточки клиента
  mock.onPatch(withPrefix('\\/client\\/(\\d+)\\/client')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)\/client/)
    const clientId = Number(m?.[1])
    const client = db.clients.find(item => item.id === clientId)
    if (!client) {
      return badRequest('Клиент не найден')
    }
    const body = JSON.parse(config.data || '{}')
    client.lastname = body.lastname ?? client.lastname
    client.firstname = body.firstname ?? client.firstname
    client.moreInfo = body.moreInfo ?? client.moreInfo
    if (typeof body.organization === 'string') {
      const found = db.organizations.find(org => org.name === body.organization)
      client.organization = found ? {...found} : {id: null, name: body.organization}
    }
    return ok(clone(client))
  })

  // DELETE /client/{clientId}
  mock.onDelete(withPrefix('\\/client\\/(\\d+)')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)/)
    const clientId = Number(m?.[1])
    db.clients = db.clients.filter(item => item.id !== clientId)
    return noContent()
  })

  // ----------------------------
  // client chat
  // ----------------------------

  // GET /client/{clientId}/messages-page?page=N
  mock.onGet(withPrefix('\\/client\\/(\\d+)\\/messages-page')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)\/messages-page/)
    const clientId = Number(m?.[1])

    // clientId=0 — просто пусто
    if (Number.isNaN(clientId) || clientId === 0) {
      return ok({messages: [], isEnd: true})
    }

    // page читаем из query params
    const page = Number(config.params?.page ?? 1)

    const messages = [
      {
        id: 'm1',
        date: new Date().toISOString(),
        text: `MOCK: clientId=${clientId}, page=${page}`,
        from: 'client'
      },
      {
        id: 'm2',
        date: new Date().toISOString(),
        text: 'MOCK: ответ оператора',
        from: 'operator'
      }
    ]

    return ok({
      messages,
      isEnd: true
    })
  })

  // POST /client/{clientId}/message  (отправить сообщение клиенту)
  mock.onPost(withPrefix('\\/client\\/(\\d+)\\/message')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)\/message/)
    const clientId = Number(m?.[1])
    if (Number.isNaN(clientId)) return badRequest('clientId is invalid')

    const body = JSON.parse(config.data || '{}')
    const text = String(body?.text || '').trim()
    if (!text) return badRequest('text is empty')

    db.clientMessages.push({
      id: genMsgId(),
      clientId,
      from: 'operator',
      text,
      createdAt: now()
    })

    // у тебя контроллер возвращает true/409 :contentReference[oaicite:2]{index=2}
    return ok(true)
  })

  // POST /client/{clientId}/search-messages  (поиск по чату клиента)
  mock.onPost(withPrefix('\\/client\\/(\\d+)\\/search-messages')).reply((config) => {
    const m = config.url.match(/\/client\/(\d+)\/search-messages/)
    const clientId = Number(m?.[1])
    if (Number.isNaN(clientId)) return badRequest('clientId is invalid')

    const body = JSON.parse(config.data || '{}')
    const query = String(body?.text || body?.message || body?.query || '').toLowerCase().trim()

    const out = db.clientMessages
      .filter(x => x.clientId === clientId)
      .filter(x => !query || String(x.text).toLowerCase().includes(query))

    return ok(clone(out))
  })
}
