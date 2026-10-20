/**
 * dsh-workspace-usage — per-workspace totals for the DSH sidebar.
 *
 * Reads the ledger written by dsh-usage-balance-v2 and aggregates each
 * workspace's sessions through the host `workspaceRegistry` service.
 *
 * Route: GET /dsh-workspace-usage/state.json
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const name = 'dsh-workspace-usage'

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const LEDGER_FILE = process.env.DSH_USAGE_BALANCE_STATE
  || path.join(DSH_HOME, '.dsh-usage-balance-v2.json')

function round8(n) {
  return Math.round((Number(n) || 0) * 1e8) / 1e8
}

function readLedger() {
  try {
    const raw = JSON.parse(fs.readFileSync(LEDGER_FILE, 'utf8'))
    return raw && typeof raw === 'object' ? raw : { sessions: {}, totals: {} }
  } catch {
    return { sessions: {}, totals: {} }
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

export function apply(root) {
  try {
    root.inject(['webServer', 'workspaceRegistry'], (ctx) => {
      ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: '/dsh-workspace-usage/state.json',
        handler: (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { Allow: 'GET, HEAD' })
            res.end()
            return
          }

          const ledger = readLedger()
          const sessions = ledger.sessions && typeof ledger.sessions === 'object' ? ledger.sessions : {}
          let workspaces = []
          try {
            workspaces = ctx.workspaceRegistry.list().map((workspace) => {
              let cost = 0
              let durationMs = 0
              let tokens = 0
              let turns = 0
              for (const sessionId of workspace.sessionIds) {
                const row = sessions[sessionId]
                if (!row) continue
                cost += Number(row.cost) || 0
                durationMs += Number(row.durationMs) || 0
                tokens += Number(row.tokens) || 0
                turns += Number(row.turns) || 0
              }
              return {
                id: String(workspace.id),
                title: String(workspace.title || ''),
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
            ledgerUpdatedAt: Number(ledger.lastTurn?.at) || null,
            totals: {
              cost: round8(ledger.totals?.cost),
              durationMs: Math.max(0, Math.round(Number(ledger.totals?.durationMs) || 0)),
              tokens: Math.max(0, Math.round(Number(ledger.totals?.tokens) || 0)),
              turns: Math.max(0, Math.round(Number(ledger.totals?.turns) || 0)),
            },
            workspaces,
          })
        },
      }), 'dsh-workspace-usage: state route')
    })
  } catch (err) {
    try { console.error('[dsh-workspace-usage] 注册路由失败：', err?.message || err) } catch {}
  }
}
