import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dshwu-'))
fs.writeFileSync(path.join(home, '.dsh-usage-balance-v2.json'), JSON.stringify({
  totals: { cost: 3.5, durationMs: 120000, tokens: 1000, turns: 2 },
  sessions: {
    s1: { cost: 1.25, durationMs: 30000, tokens: 400, turns: 1 },
    s2: { cost: 2.25, durationMs: 90000, tokens: 600, turns: 1 },
  },
}), 'utf8')
process.env.DSH_HOME = home

const { apply } = await import('../lib/index.js')

function handlerWith(workspaces) {
  let route
  const ctx = {
    webServer: {
      register(value) { route = value; return () => {} },
    },
    workspaceRegistry: { list() { return workspaces } },
    effect(fn) { return fn() },
  }
  const root = { inject(_names, cb) { cb(ctx) }, effect(fn) { return fn() } }
  apply(root)
  return route
}

function call(route) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 0,
      writeHead(code) { this.statusCode = code },
      end(body) {
        try { resolve(JSON.parse(String(body))) } catch (err) { reject(err) }
      },
    }
    route.handler({ method: 'GET', url: '/dsh-workspace-usage/state.json' }, res)
  })
}

test('按工作区聚合会话消耗与时长', async () => {
  const route = handlerWith([
    { id: 'w1', title: 'Envir', sessionIds: ['s1'] },
    { id: 'w2', title: 'default-workspace', sessionIds: ['s2', 'missing'] },
  ])
  const body = await call(route)
  assert.equal(body.ok, true)
  assert.equal(body.workspaces.length, 2)
  assert.deepEqual(body.workspaces[0], {
    id: 'w1', title: 'Envir', cost: 1.25, durationMs: 30000, tokens: 400, turns: 1,
  })
  assert.equal(body.workspaces[1].cost, 2.25)
  assert.equal(body.workspaces[1].durationMs, 90000)
  assert.equal(body.totals.cost, 3.5)
})

test('空工作区返回 0，不报错', async () => {
  const route = handlerWith([{ id: 'w3', title: 'empty', sessionIds: [] }])
  const body = await call(route)
  assert.equal(body.ok, true)
  assert.equal(body.workspaces[0].cost, 0)
  assert.equal(body.workspaces[0].durationMs, 0)
})
