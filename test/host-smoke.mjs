import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dshub-'))
process.env.DSH_HOME = home
process.env.DSH_BALANCE_DISPLAY_OFFLINE = '1'

const { apply } = await import('../lib/index.js')

function createHarness() {
  const handlers = new Map()
  const routes = new Map()
  const ctx = {
    get() { return null },
    effect(fn) { return fn() },
    webServer: {
      register(route) {
        routes.set(route.path, route)
        return () => routes.delete(route.path)
      },
    },
  }
  const root = {
    on(name, fn) {
      const list = handlers.get(name) || []
      list.push(fn)
      handlers.set(name, list)
      return () => {
        const idx = list.indexOf(fn)
        if (idx >= 0) list.splice(idx, 1)
      }
    },
    effect(fn) { return fn() },
    inject(_names, cb) { cb(ctx) },
    get() { return null },
  }
  const emit = (name, ...args) => {
    for (const fn of handlers.get(name) || []) fn(...args)
  }
  return { root, ctx, routes, emit }
}

function getState(routes) {
  return new Promise((resolve, reject) => {
    const route = routes.get('/dsh-usage-balance-v2/state.json')
    if (!route) return reject(new Error('route not registered'))
    const res = {
      statusCode: 0,
      headers: {},
      writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers) },
      end(body) {
        try { resolve({ status: this.statusCode, body: JSON.parse(String(body)) }) } catch (err) { reject(err) }
      },
    }
    route.handler({ method: 'GET', url: '/dsh-usage-balance-v2/state.json' }, res)
  })
}

test('宿主：聚合一轮、持久化、子智能体不推进提示序号', async () => {
  const h = createHarness()
  apply(h.root)

  const session = { id: 'session-main' }
  h.emit('session/event', session, { type: 'turn/start', data: { turn: 1 } })
  await new Promise((r) => setTimeout(r, 15))
  h.emit('session/event', session, {
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 1,
      message: { source: { model: 'deepseek-flash' } },
      usage: { inputTokens: 1000, cacheReadTokens: 2000, outputTokens: 300 },
    },
  })
  h.emit('session/event', session, { type: 'turn/end', data: { turn: 1 } })

  let state = await getState(h.routes)
  assert.equal(state.status, 200)
  assert.equal(state.body.ok, true)
  assert.equal(state.body.totals.turns, 1)
  assert.equal(state.body.totals.tokens, 3300)
  assert.ok(state.body.totals.cost > 0)
  assert.ok(state.body.totals.durationMs >= 10)
  assert.equal(state.body.lastTurn.seq, 1)
  assert.equal(state.body.lastTurn.model, 'deepseek-flash')
  assert.ok(state.body.pricing.period === 'peak' || state.body.pricing.period === 'valley')
  assert.equal(state.body.balance.ok, false)

  const seqAfterMain = state.body.lastTurn.seq

  // 子智能体会话：计入总额，但不弹提示
  h.emit('subagent/start', { id: 'session-sub' })
  h.emit('session/event', { id: 'session-sub' }, { type: 'turn/start', data: { turn: 1 } })
  h.emit('session/event', { id: 'session-sub' }, {
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 1,
      message: { source: { model: 'deepseek-v4-pro' } },
      usage: { inputTokens: 100, cacheReadTokens: 0, outputTokens: 50 },
    },
  })
  h.emit('session/event', { id: 'session-sub' }, { type: 'turn/end', data: { turn: 1 } })

  state = await getState(h.routes)
  assert.equal(state.body.totals.turns, 2)
  assert.equal(state.body.lastTurn.seq, seqAfterMain)

  // 等防抖落盘
  await new Promise((r) => setTimeout(r, 1400))
  assert.ok(fs.existsSync(path.join(home, '.dsh-usage-balance-v2.json')))
  const saved = JSON.parse(fs.readFileSync(path.join(home, '.dsh-usage-balance-v2.json'), 'utf8'))
  assert.equal(saved.totals.turns, 2)
  assert.ok(saved.sessions['session-main'])
  assert.ok(saved.sessions['session-sub'])
})

test('宿主：状态文件损坏时自动重建', async () => {
  const home2 = fs.mkdtempSync(path.join(os.tmpdir(), 'dshub-'))
  const file = path.join(home2, '.dsh-usage-balance-v2.json')
  fs.writeFileSync(file, '{bad json', 'utf8')
  process.env.DSH_HOME = home2

  // 重新加载模块，让 STATE_FILE 指向新目录
  const url = new URL('../lib/index.js', import.meta.url)
  url.searchParams.set('t', String(Date.now()))
  const mod = await import(url.href)
  const h = createHarness()
  mod.apply(h.root)
  const state = await getState(h.routes)
  assert.equal(state.body.ok, true)
  assert.equal(state.body.totals.turns, 0)
})
