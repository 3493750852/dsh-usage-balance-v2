import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dshubmerge-'))
fs.writeFileSync(path.join(home, '.dsh-usage-balance-v2.json'), JSON.stringify({
  sessions: {
    s1: { cost: 1.25, durationMs: 30000, tokens: 400, turns: 1 },
    s2: { cost: 2.25, durationMs: 90000, tokens: 600, turns: 1 },
  },
  totals: { cost: 3.5, durationMs: 120000, tokens: 1000, turns: 2 },
  today: { day: '2026-10-21', cost: 3.5, durationMs: 120000, tokens: 1000, turns: 2 },
}), 'utf8')
process.env.DSH_HOME = home

const { apply } = await import('../lib/index.js')

function harness() {
  const routes = new Map()
  const ctx = {
    get(name) {
      if (name === 'workspaceRegistry') {
        return {
          list() {
            return [
              { id: 'w1', title: 'Envir', sessionIds: ['s1'] },
              { id: 'w2', title: 'default', sessionIds: ['s2'] },
            ]
          },
        }
      }
      return null
    },
    effect(fn) { return fn() },
    webServer: { register(route) { routes.set(route.path, route); return () => {} } },
  }
  apply({ inject(_names, cb) { cb(ctx) }, effect(fn) { return fn() } })
  return routes
}

function call(route, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const req = {
      method,
      on(event, fn) {
        if (event === 'data' && body !== undefined) fn(JSON.stringify(body))
        if (event === 'end') fn()
      },
      destroy() {},
    }
    const res = {
      statusCode: 0,
      writeHead(code) { this.statusCode = code },
      end(text) { try { resolve({ status: this.statusCode, body: JSON.parse(String(text)) }) } catch (err) { reject(err) } },
    }
    route.handler(req, res)
  })
}

test('主包内提供工作区聚合与官方值校正', async () => {
  const routes = harness()
  let result = await call(routes.get('/dsh-workspace-usage-v2/state.json'))
  assert.equal(result.body.ok, true)
  assert.equal(result.body.workspaces[0].cost, 1.25)
  assert.equal(result.body.workspaces[1].cost, 2.25)

  await call(routes.get('/dsh-workspace-usage-v2/reconcile'), {
    method: 'POST',
    body: { sessionId: 's1', cost: 9.9, durationMs: 600000, tokens: 5000 },
  })
  result = await call(routes.get('/dsh-workspace-usage-v2/state.json'))
  assert.equal(result.body.workspaces[0].cost, 9.9)
  assert.equal(result.body.workspaces[0].durationMs, 600000)
  assert.equal(result.body.workspaces[1].cost, 2.25)

  const overlay = JSON.parse(fs.readFileSync(path.join(home, '.dsh-workspace-usage-reconciled.json'), 'utf8'))
  assert.equal(overlay.sessions.s1.cost, 9.9)
})
