import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'

const source = readFileSync(new URL('../src/util/loginRedirect.js', import.meta.url), 'utf8')
const redirects = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
const { safeLoginRedirect, loginLocation, loginUrl, loginTargetFromRoute } = redirects

test('login query preserves the full destination, including its own query and fragment', () => {
  const target = '/tasks/81?tab=history&search=%D1%82%D0%B5%D1%81%D1%82#comment-7'
  assert.deepEqual(loginLocation(target), { path: '/login', query: { redirect: target } })
  assert.equal(new URL(loginUrl(target), 'https://app.invalid').searchParams.get('redirect'), target)
  assert.equal(new URL(loginUrl(target, '/session-expired', { reason: 'IDLE_TIMEOUT' }), 'https://app.invalid').searchParams.get('reason'), 'IDLE_TIMEOUT')
  assert.equal(loginTargetFromRoute({ query: { redirect: '/tasks/81?tab=history' }, hash: '#comment-7' }), '/tasks/81?tab=history#comment-7')
  assert.equal(loginTargetFromRoute({ query: { redirect: target }, hash: '#old' }), target)
})

test('only local pages are accepted, without login loops or external redirects', () => {
  for (const value of [null, [], ['/tasks'], 'https://other.test', '//other.test', '/\\other.test', '/%2fother.test',
    'javascript:alert(1)', '/tasks\n', '/%0d%0aLocation:test', '/login', '/login/?redirect=/tasks', '/login/mfa',
    '/session-expired', '/login-error', '/foo/../login', '/reset-password?token=secret', '/logout', '/perform_login']) {
    assert.equal(safeLoginRedirect(value), null, String(value))
  }
  assert.equal(safeLoginRedirect('/knowledge/Some%20article'), '/knowledge/Some%20article')
  assert.deepEqual(loginLocation('//other.test'), { path: '/login', query: {} })
})

test('the real router guard restores a deep link and still checks roles and permissions', async () => {
  const require = createRequire(import.meta.url)
  const { createRouter, createMemoryHistory } = require('vue-router')
  const auth = { user: null, isAuthenticated: false, init: async () => {} }
  let permission = true
  globalThis.loginRouterTest = {
    route: factory => factory, createRouter, createMemoryHistory, createWebHistory: createMemoryHistory, createWebHashHistory: createMemoryHistory,
    routes: ['/login', '/login-error', '/portal', '/403', '/chats', '/tasks/:id'].map(path => ({ path, component: {}, meta: { permission: path.startsWith('/tasks') ? 'TASK_EDIT' : undefined } })),
    useAuthStore: () => auth, appConfig: { disableAuth: false }, isPublicPage: path => path.startsWith('/login'),
    setWelcomeInviteActive: () => {}, canAny: () => permission, loginLocation
  }
  const routerSource = readFileSync(new URL('../src/router/index.js', import.meta.url), 'utf8').replace(/import[\s\S]*?from ['"][^'"]+['"]/g, '')
  const header = 'const {route,createRouter,createMemoryHistory,createWebHistory,createWebHashHistory,routes,useAuthStore,appConfig,isPublicPage,setWelcomeInviteActive,canAny,loginLocation}=globalThis.loginRouterTest;\n'
  const factory = (await import('data:text/javascript;base64,' + Buffer.from(header + routerSource).toString('base64'))).default
  const router = factory()
  const target = '/tasks/81?tab=history&sort=desc#comment-7'
  await router.push(target)
  assert.equal(router.currentRoute.value.path, '/login')
  assert.equal(router.currentRoute.value.query.redirect, target)

  auth.user = { authorities: ['OPERATOR'] }; auth.isAuthenticated = true
  await router.replace(router.currentRoute.value.query.redirect)
  assert.equal(router.currentRoute.value.fullPath, target)
  permission = false
  await router.push('/tasks/82')
  assert.equal(router.currentRoute.value.path, '/403')
  auth.user = { authorities: ['CLIENT'] }
  await router.push('/tasks/81')
  assert.equal(router.currentRoute.value.path, '/portal')
  auth.init = async () => { throw Error('No session') }; auth.isAuthenticated = false
  await router.push('/tasks/83?tab=files')
  assert.equal(router.currentRoute.value.query.redirect, '/tasks/83?tab=files')
  delete globalThis.loginRouterTest
})
