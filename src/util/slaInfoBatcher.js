import axios from 'axios'

const BATCH_URL = '/api/v1/tasks/sla/info'

const DEFAULTS = {
  // окно сбора запросов: все load() за это время уходят одним батчем
  windowMs: 30,
  // не больше backend-лимита (200) — с запасом
  maxBatchSize: 50,
  // одновременно в полёте не больше N батч-запросов
  maxInFlight: 2,
  // кэш: повторные load() без force в этот срок сети не касаются
  ttlMs: 10_000
}

function normalizeId (taskId) {
  if (taskId === null || taskId === undefined || taskId === '') {
    return null
  }
  const text = String(taskId).trim()
  // демо-заявки онбординга имеют строковые id (`__onboarding_...`): в сеть их не отправляем
  return /^\d+$/.test(text) ? text : null
}

function createError (message, extra = {}) {
  return Object.assign(new Error(message), extra)
}

/**
 * Единый батчер SLA-информации заявок: собирает запросы за короткое окно,
 * дедуплицирует id, режет на пачки, ограничивает число запросов в полёте
 * и кэширует результат на короткий TTL.
 *
 * load(taskId) возвращает Promise<SlaInfoDto> и — как раньше axios.get —
 * отклоняется, если SLA получить не удалось (сеть, нет доступа, неизвестная заявка).
 */
export class SlaInfoBatcher {
  constructor (options = {}) {
    this.options = { ...DEFAULTS, ...options }
    this.http = options.http || axios
    this.cache = new Map() // id -> { info, ts }
    this.pending = new Map() // id -> { force, waiters: [{ resolve, reject, scope }] }
    this.inFlight = new Map() // id -> Promise<SlaInfoDto>
    this.inFlightOwner = new Map() // id -> запрос, который сейчас считается «текущим» для id
    this.sendQueue = [] // пачки (массивы id), ожидающие свободного слота
    this.activeRequests = 0
    this.timer = null
  }

  /** Свежее значение из кэша или undefined. */
  peek (taskId) {
    const id = normalizeId(taskId)
    return id === null ? undefined : this.freshFromCache(id)
  }

  /**
   * Запросить SLA заявки.
   * @param {number|string} taskId
   * @param {{force?: boolean, scope?: object}} opts force — пропустить кэш и получить свежее значение;
   *   scope — владелец запроса (см. createScope): после dispose ответ игнорируется.
   */
  load (taskId, { force = false, scope = null } = {}) {
    const id = normalizeId(taskId)
    if (id === null) {
      return Promise.reject(createError('SLA info: unsupported task id', { skipped: true }))
    }
    if (scope?.disposed) {
      return Promise.reject(createError('SLA info: scope disposed', { cancelled: true }))
    }
    if (!force) {
      const cached = this.freshFromCache(id)
      if (cached !== undefined) {
        return Promise.resolve(cached)
      }
      const running = this.inFlight.get(id)
      if (running && !this.pending.has(id)) {
        return this.joinInFlight(running, scope)
      }
    }
    return new Promise((resolve, reject) => {
      let entry = this.pending.get(id)
      if (!entry) {
        entry = { waiters: [] }
        this.pending.set(id, entry)
      }
      const waiter = { resolve, reject, scope }
      entry.waiters.push(waiter)
      scope?.track(id, waiter)
      this.scheduleFlush()
    })
  }

  /** Загрузить сразу несколько заявок: Map<id, info> только по успешно полученным. */
  async loadMany (taskIds, opts = {}) {
    const result = new Map()
    const ids = [...new Set((taskIds || []).filter(id => normalizeId(id) !== null))]
    await Promise.all(ids.map(async id => {
      try {
        result.set(id, await this.load(id, opts))
      } catch (e) {
        // пропускаем: вызывающий видит отсутствие id в результате
      }
    }))
    return result
  }

  /** Положить свежие данные (например, ответ pause/resume) и обновить кэш. */
  set (taskId, info) {
    const id = normalizeId(taskId)
    if (id !== null && info) {
      this.cache.set(id, { info, ts: Date.now() })
    }
  }

  /** Сбросить кэш по id (или весь кэш) — следующий load() сходит в сеть. */
  invalidate (taskIds = null) {
    if (taskIds === null || taskIds === undefined) {
      this.cache.clear()
      this.inFlight.clear()
      this.inFlightOwner.clear()
      return
    }
    ;[].concat(taskIds).forEach(taskId => {
      const id = normalizeId(taskId)
      if (id !== null) {
        this.cache.delete(id)
        this.inFlight.delete(id)
        this.inFlightOwner.delete(id)
      }
    })
  }

  /**
   * Владелец запросов (компонент/экран). dispose() снимает его ожидающие запросы:
   * не отправленные ещё id без других ожидающих в сеть не уходят,
   * а ответы уже летящих запросов для него игнорируются.
   */
  createScope () {
    const batcher = this
    const tracked = new Map() // id -> waiter[]
    const scope = {
      disposed: false,
      track (id, waiter) {
        const list = tracked.get(id) || []
        list.push(waiter)
        tracked.set(id, list)
      },
      load (taskId, opts = {}) {
        return batcher.load(taskId, { ...opts, scope })
      },
      loadMany (taskIds, opts = {}) {
        return batcher.loadMany(taskIds, { ...opts, scope })
      },
      peek: id => batcher.peek(id),
      set: (id, info) => batcher.set(id, info),
      invalidate: ids => batcher.invalidate(ids),
      dispose () {
        if (scope.disposed) return
        scope.disposed = true
        tracked.forEach((waiters, id) => batcher.cancelWaiters(id, waiters))
        tracked.clear()
      }
    }
    return scope
  }

  // ---------------- internals ----------------

  freshFromCache (id) {
    const hit = this.cache.get(id)
    if (!hit) return undefined
    if (Date.now() - hit.ts > this.options.ttlMs) {
      this.cache.delete(id)
      return undefined
    }
    return hit.info
  }

  joinInFlight (promise, scope) {
    if (!scope) return promise
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject, scope }
      scope.track('inflight', waiter)
      promise.then(
        info => (scope.disposed ? reject(createError('SLA info: scope disposed', { cancelled: true })) : resolve(info)),
        error => reject(error)
      )
    })
  }

  cancelWaiters (id, waiters) {
    const entry = this.pending.get(id)
    waiters.forEach(waiter => {
      waiter.reject(createError('SLA info: scope disposed', { cancelled: true }))
      if (entry) {
        entry.waiters = entry.waiters.filter(item => item !== waiter)
      }
    })
    if (entry && entry.waiters.length === 0) {
      this.pending.delete(id)
    }
  }

  // снимаем id с «в полёте» только если его не перекрыл более новый запрос
  releaseInFlight (id, request) {
    if (this.inFlightOwner.get(id) === request) {
      this.inFlightOwner.delete(id)
      this.inFlight.delete(id)
    }
  }

  scheduleFlush () {
    if (this.timer !== null) return
    this.timer = setTimeout(() => {
      this.timer = null
      this.flush()
    }, this.options.windowMs)
  }

  flush () {
    if (this.pending.size === 0) return
    const batch = this.pending
    this.pending = new Map()
    const ids = [...batch.keys()]
    const { maxBatchSize } = this.options
    for (let i = 0; i < ids.length; i += maxBatchSize) {
      const chunkIds = ids.slice(i, i + maxBatchSize)
      const chunk = new Map(chunkIds.map(id => [id, batch.get(id)]))
      this.sendQueue.push(chunk)
    }
    this.pump()
  }

  pump () {
    while (this.activeRequests < this.options.maxInFlight && this.sendQueue.length > 0) {
      this.send(this.sendQueue.shift())
    }
  }

  send (chunk) {
    const ids = [...chunk.keys()]
    this.activeRequests += 1
    const request = this.http
      .post(BATCH_URL, { taskIds: ids.map(Number) })
      .then(response => response?.data || {})
    ids.forEach(id => {
      this.inFlightOwner.set(id, request)
      this.inFlight.set(id, request.then(data => {
        if (data[id] === undefined || data[id] === null) {
          throw createError('SLA info: not available', { notFound: true })
        }
        return data[id]
      }))
      // чтобы отклонение без подписчиков не попадало в unhandledrejection
      this.inFlight.get(id).catch(() => {})
    })
    request
      .then(data => {
        ids.forEach(id => {
          // после invalidate() ответ запроса, летевшего до сброса, в кэш не кладём
          const isCurrent = this.inFlightOwner.get(id) === request
          this.releaseInFlight(id, request)
          const info = data[id]
          const hasInfo = info !== undefined && info !== null
          if (hasInfo && isCurrent) {
            this.cache.set(id, { info, ts: Date.now() })
          } else if (!hasInfo) {
            this.cache.delete(id)
          }
          chunk.get(id).waiters.forEach(waiter => {
            if (waiter.scope?.disposed) {
              waiter.reject(createError('SLA info: scope disposed', { cancelled: true }))
            } else if (hasInfo) {
              waiter.resolve(info)
            } else {
              waiter.reject(createError('SLA info: not available', { notFound: true }))
            }
          })
        })
      })
      .catch(error => {
        ids.forEach(id => {
          this.releaseInFlight(id, request)
          chunk.get(id).waiters.forEach(waiter => waiter.reject(error))
        })
      })
      .finally(() => {
        this.activeRequests -= 1
        this.pump()
      })
  }
}

export const slaInfoBatcher = new SlaInfoBatcher()
