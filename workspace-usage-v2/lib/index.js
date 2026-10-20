/**
 * dsh-workspace-usage-v2 — per-workspace totals with reconciled session usage.
 *
 * The v2 balance plugin's ledger only contains completed turns after the plugin
 * was enabled; the open session footer uses DSH's official tokenUsage /
 * sessionStats projections and can be larger. The browser posts those official
 * session values here; this plugin keeps an overlay and returns max(ledger,
 * official) per session, so a workspace total can never be smaller than any of
 * its sessions.
 *
 * GET  /dsh-workspace-usage-v2/state.json
 * POST /dsh-workspace-usage-v2/reconcile   { sessionId, cost, durationMs, tokens }
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const name = 'dsh-workspace-usage-v2'

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const LEDGER_FILE = process.env.DSH_USAGE_BALANCE_STATE
  || path.join(DSH_HOME, '.dsh-usage-balance-v2.json')
const OVERLAY_FILE = path.join(DSH_HOME, '.dsh-workspace-usage-reconciled.json')

function readJson(file, fallback) {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'))
    return value && typeof value === 'object' ? value : fallback
  } catch {
    return fallback
  }
}

function writeJson(file, value) {
  try {
    const temp = file + '.tmp-' + process.pid
    fs.writeFileSync(temp, JSON.stringify(value), 'utf8')
    fs.renameSync(temp, file)
    return true
  } catch {
    return false
  }
}

function round8(n) {
  return Math.round((Number(n) || 0) * 1e8) / 1e8
}

function merged(ledger, overlay, sessionId) {
  const a = ledger && ledger.sessions ? ledger.sessions[sessionId] : null
  const b = overlay && overlay.sessions ? overlay.sessions[sessionId] : null
  return {
    cost: round8(Math.max(Number(a?.cost) || 0, Number(b?.cost) || 0)),
    durationMs: Math.max(0, Math.round(Math.max(Number(a?.durationMs) || 0, Number(b?.durationMs) || 0))),
    tokens: Math.max(0, Math.round(Math.max(Number(a?.tokens) || 0, Number(b?.tokens) || 0))),
    turns: Math.max(0, Math.round(Math.max(Number(a?.turns) || 0, Number(b?.turns) || 0))),
  }
}

function sendJson(res, status, body) {
  try {
    const text = JSON.stringify(body)
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(text),
    })
    res.end(text)
  } catch {
    try { res.writeHead(500); res.end() } catch {}
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 65536) {
        body = ''
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', () => resolve(''))
  })
}

export function apply(root) {
  try {
    root.inject(['webServer'], (ctx) => {
      ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: '/dsh-workspace-usage-v2/state.json',
        handler: (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { Allow: 'GET, HEAD' })
            res.end()
            return
          }
          const ledger = readJson(LEDGER_FILE, { sessions: {}, totals: {} })
          const overlay = readJson(OVERLAY_FILE, { sessions: {} })
          let registry = null
          try { registry = ctx.get('workspaceRegistry') } catch {}
          let workspaces = []
          try {
            workspaces = (registry && typeof registry.list === 'function' ? registry.list() : []).map((workspace) => {
              const sessionIds = Array.isArray(workspace.sessionIds) ? workspace.sessionIds.map(String) : []
              let cost = 0
              let durationMs = 0
              let tokens = 0
              let turns = 0
              for (const sessionId of sessionIds) {
                const row = merged(ledger, overlay, sessionId)
                cost += row.cost
                durationMs += row.durationMs
                tokens += row.tokens
                turns += row.turns
              }
              return {
                id: String(workspace.id),
                title: String(workspace.title || ''),
                sessionIds,
                cost: round8(cost),
                durationMs: Math.max(0, Math.round(durationMs)),
                tokens: Math.max(0, Math.round(tokens)),
                turns: Math.max(0, Math.round(turns)),
              }
            })
          } catch {
            workspaces = []
          }
          sendJson(res, 200, {
            ok: true,
            now: Date.now(),
            workspaces,
          })
        },
      }), 'dsh-workspace-usage-v2: state route')

      ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: '/dsh-workspace-usage-v2/reconcile',
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            res.writeHead(405, { Allow: 'POST' })
            res.end()
            return
          }
          let input
          try { input = JSON.parse(await readBody(req)) } catch { input = null }
          if (!input || typeof input !== 'object') {
            sendJson(res, 400, { ok: false, error: 'invalid json' })
            return
          }
          const sessionId = String(input.sessionId || '')
          if (!/^[a-zA-Z0-9_-]{1,120}$/.test(sessionId)) {
            sendJson(res, 400, { ok: false, error: 'invalid session id' })
            return
          }
          const overlay = readJson(OVERLAY_FILE, { sessions: {} })
          overlay.sessions ||= {}
          const prev = overlay.sessions[sessionId] || {}
          overlay.sessions[sessionId] = {
            cost: round8(Math.max(Number(prev.cost) || 0, Number(input.cost) || 0)),
            durationMs: Math.max(0, Math.round(Math.max(Number(prev.durationMs) || 0, Number(input.durationMs) || 0))),
            tokens: Math.max(0, Math.round(Math.max(Number(prev.tokens) || 0, Number(input.tokens) || 0))),
            at: Date.now(),
          }
          writeJson(OVERLAY_FILE, overlay)
          sendJson(res, 200, { ok: true })
        },
      }), 'dsh-workspace-usage-v2: reconcile route')
    })
  } catch (err) {
    try { console.error('[dsh-workspace-usage-v2] 注册路由失败：', err?.message || err) } catch {}
  }
}
