import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/util/answerWaiting.js', import.meta.url), 'utf8')
const { getAnswerWaitingMs, normalizeAnswerWaitingSettings } =
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))

// Europe/Moscow, пн–пт 09:00–18:00. 2026-10-19 — понедельник, 23 — пятница, 24/25 — выходные
const working = normalizeAnswerWaitingSettings({ workingTimeUsed: true })
const calendar = { ...working, workingTimeUsed: false }
const at = (day, hour, minute) => Date.UTC(2026, 9, day, hour - 3, minute)
const HOUR = 3600000

test('calendar time when working time is not used', () => {
  assert.equal(getAnswerWaitingMs(at(23, 17, 0), at(26, 10, 0), calendar), 65 * HOUR)
})

test('inside working hours equals calendar time', () => {
  assert.equal(getAnswerWaitingMs(at(19, 10, 0), at(19, 12, 30), working), 2.5 * HOUR)
})

test('message at night waits from the workday start', () => {
  assert.equal(getAnswerWaitingMs(at(19, 23, 0), at(20, 10, 0), working), HOUR)
  assert.equal(getAnswerWaitingMs(at(19, 23, 0), at(20, 8, 59), working), 0)
  assert.equal(getAnswerWaitingMs(at(20, 7, 0), at(20, 9, 30), working), 0.5 * HOUR)
})

test('message on a weekend waits from Monday', () => {
  assert.equal(getAnswerWaitingMs(at(24, 12, 0), at(26, 10, 0), working), HOUR)
  assert.equal(getAnswerWaitingMs(at(25, 12, 0), at(25, 20, 0), working), 0)
})

test('waiting crosses workday boundaries', () => {
  assert.equal(getAnswerWaitingMs(at(23, 17, 30), at(26, 9, 30), working), HOUR)
  assert.equal(getAnswerWaitingMs(at(19, 17, 0), at(21, 10, 0), working), 11 * HOUR)
})

test('workday window is half-open', () => {
  assert.equal(getAnswerWaitingMs(at(19, 18, 0), at(19, 20, 0), working), 0)
  assert.equal(getAnswerWaitingMs(at(19, 9, 0), at(19, 18, 0), working), 9 * HOUR)
})

test('uses company timezone and enabled days', () => {
  assert.equal(getAnswerWaitingMs(Date.UTC(2026, 9, 19, 6, 0), Date.UTC(2026, 9, 19, 7, 0), working), HOUR)
  assert.equal(getAnswerWaitingMs(Date.UTC(2026, 9, 19, 5, 0), Date.UTC(2026, 9, 19, 5, 30), working), 0)
  const ny = { ...working, timezone: 'America/New_York' }
  assert.equal(getAnswerWaitingMs(Date.UTC(2026, 9, 19, 13, 0), Date.UTC(2026, 9, 19, 14, 0), ny), HOUR)
  const noFriday = { ...working, workingDays: [1, 2, 3, 4] }
  assert.equal(getAnswerWaitingMs(at(23, 12, 0), at(26, 10, 0), noFriday), HOUR)
})

test('non-positive interval is zero', () => {
  assert.equal(getAnswerWaitingMs(5, 1, working), 0)
  assert.equal(getAnswerWaitingMs(NaN, 1, working), 0)
})
