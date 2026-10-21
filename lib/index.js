/**
 * dsh-usage-balance-v2 — 宿主半区。
 *
 * 1. 监听 session/event，用 assistant/message 的真实 usage 按 DeepSeek 峰谷价目表
 *    累计总消耗、总时长、每轮消耗。
 * 2. 通过 credentials（DEEPSEEK_API_KEY）或 DSH 账号服务读取剩余余额，做短缓存。
 * 3. 暴露只读 JSON 路由 /dsh-usage-balance-v2/state.json 给浏览器半区。
 *
 * 数据保存在 $DSH_HOME/.dsh-usage-balance-v2.json，只统计插件启用之后的轮次。
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  addMoney,
  beijingDay,
  costOf,
  isPeakTime,
  periodInfo,
} from './pricing.mjs'

export const name = 'dsh-usage-balance-v2'

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const STATE_FILE = path.join(DSH_HOME, '.dsh-usage-balance-v2.json')
const WORKSPACE_OVERLAY_FILE = path.join(DSH_HOME, '.dsh-workspace-usage-reconciled.json')
const BALANCE_URL = 'https://api.deepseek.com/user/balance'
const BALANCE_TTL_MS = 25_000
const ACCOUNT_TIMEOUT_MS = 5_000
const MAX_SESSIONS = 200

function freshState() {
  return {
    version: 1,
    createdAt: Date.now(),
    seq: 0,
    totals: { cost: 0, tokens: 0, turns: 0, durationMs: 0 },
    today: { day: beijingDay(), cost: 0, tokens: 0, turns: 0, durationMs: 0 },
    sessions: {},
    lastTurn: null,
  }
}

function round8(n) {
  return Math.round((Number(n) || 0) * 1e8) / 1e8
}

function normalizeState(raw) {
  const base = freshState()
  if (!raw || typeof raw !== 'object') return base
  const state = {
    ...base,
    ...raw,
    version: 1,
    totals: { ...base.totals, ...(raw.totals && typeof raw.totals === 'object' ? raw.totals : {}) },
    today: { ...base.today, ...(raw.today && typeof raw.today === 'object' ? raw.today : {}) },
    sessions: raw.sessions && typeof raw.sessions === 'object' ? raw.sessions : {},
    lastTurn: raw.lastTurn && typeof raw.lastTurn === 'object' ? raw.lastTurn : null,
  }
  state.totals.cost = round8(state.totals.cost)
  state.today.cost = round8(state.today.cost)
  if (state.today.day !== beijingDay()) {
    state.today = { day: beijingDay(), cost: 0, tokens: 0, turns: 0, durationMs: 0 }
  }
  return state
}

function loadState() {
  try {
    return normalizeState(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')))
  } catch {
    return freshState()
  }
}

function saveState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
    const temp = STATE_FILE + '.tmp-' + process.pid
    fs.writeFileSync(temp, JSON.stringify(state), 'utf8')
    fs.renameSync(temp, STATE_FILE)
  } catch (err) {
    try { console.error('[dsh-usage-balance-v2] 保存状态失败：', err?.code || err?.message || err) } catch {}
  }
}

function modelOf(data) {
  const source = data?.message?.source
  if (typeof source === 'string') return source
  return String(source?.model || data?.model || '')
}

function sendJson(res, status, body) {
  try {
    const text = JSON.stringify(body)
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(text),
    })
    res.end(res.req?.method === 'HEAD' ? undefined : text)
  } catch {
    try { res.writeHead(500); res.end() } catch {}
  }
}

function readJsonFile(file, fallback) {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'))
    return value && typeof value === 'object' ? value : fallback
  } catch {
    return fallback
  }
}

function writeJsonFile(file, value) {
  try {
    const temp = file + '.tmp-' + process.pid
    fs.writeFileSync(temp, JSON.stringify(value), 'utf8')
    fs.renameSync(temp, file)
    return true
  } catch {
    return false
  }
}

function readRequestBody(req) {
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

function mergedSession(ledgerRow, overlayRow) {
  const cost = Math.max(Number(ledgerRow?.cost) || 0, Number(overlayRow?.cost) || 0)
  return {
    cost: round8(cost),
    durationMs: Math.max(0, Math.round(Math.max(Number(ledgerRow?.durationMs) || 0, Number(overlayRow?.durationMs) || 0))),
    tokens: Math.max(0, Math.round(Math.max(Number(ledgerRow?.tokens) || 0, Number(overlayRow?.tokens) || 0))),
    turns: Math.max(0, Math.round(Math.max(Number(ledgerRow?.turns) || 0, Number(overlayRow?.turns) || 0))),
  }
}

export function apply(root) {
  const state = loadState()
  let saveTimer = null
  let balanceCache = null
  let balanceInFlight = null
  let lastBalanceError = ''
  let ctx = null

  const activeTurns = new Map()
  const subagentSessions = new Set()

  if (!fs.existsSync(STATE_FILE)) saveState(state)

  function scheduleSave() {
    if (saveTimer) return
    saveTimer = setTimeout(() => {
      saveTimer = null
      saveState(state)
    }, 1200)
    try { saveTimer.unref?.() } catch {}
  }

  function todayRow() {
    const day = beijingDay()
    if (!state.today || state.today.day !== day) {
      state.today = { day, cost: 0, tokens: 0, turns: 0, durationMs: 0 }
    }
    return state.today
  }

  function getCredentials() {
    try { return ctx && typeof ctx.get === 'function' ? ctx.get('credentials') : null } catch { return null }
  }

  function getAccount() {
    try { return ctx && typeof ctx.get === 'function' ? ctx.get('deepseekAccount') : null } catch { return null }
  }

  function pickBalanceInfo(infos) {
    if (!Array.isArray(infos) || infos.length === 0) return null
    const num = (x) => (x && x.total_balance !== undefined ? Number(x.total_balance) : NaN)
    return infos.find((x) => x && String(x.currency || '').toUpperCase() === 'CNY' && Number.isFinite(num(x)) && num(x) > 0)
      || infos.find((x) => Number.isFinite(num(x)) && num(x) > 0)
      || infos.find((x) => x && String(x.currency || '').toUpperCase() === 'CNY')
      || infos[0]
  }

  async function fetchApiKeyBalance() {
    const credentials = getCredentials()
    if (!credentials || typeof credentials.resolve !== 'function') {
      return { ok: false, code: 'NO_CREDENTIALS', error: '当前 DSH 没有 credentials 服务' }
    }
    let cred
    try {
      cred = await credentials.resolve('DEEPSEEK_API_KEY')
    } catch {
      return { ok: false, code: 'NO_KEY', error: '未配置 DEEPSEEK_API_KEY' }
    }
    const key = typeof cred === 'string' ? cred : cred?.value
    if (!key) return { ok: false, code: 'NO_KEY', error: '未配置 DEEPSEEK_API_KEY' }

    let lastErr = null
    for (let attempt = 0; attempt < 2; attempt++) {
      let res
      try {
        res = await fetch(BALANCE_URL, {
          headers: { Authorization: 'Bearer ' + key },
          signal: AbortSignal.timeout(8000),
        })
      } catch (err) {
        lastErr = err
        if (attempt === 0) await new Promise((r) => setTimeout(r, 500))
        continue
      }
      if (!res.ok) {
        lastErr = new Error('HTTP ' + res.status)
        if (res.status < 500) break
        if (attempt === 0) await new Promise((r) => setTimeout(r, 500))
        continue
      }
      let data
      try { data = await res.json() } catch { return { ok: false, code: 'PARSE', error: '余额接口返回不是合法 JSON' } }
      const info = pickBalanceInfo(data?.balance_infos)
      if (!info || !Number.isFinite(Number(info.total_balance))) {
        return { ok: false, code: 'SHAPE', error: '余额接口返回结构异常' }
      }
      const numOr = (x) => { const n = Number(x); return Number.isFinite(n) ? n : null }
      return {
        ok: true,
        total: Number(info.total_balance),
        toppedUp: numOr(info.topped_up_balance),
        granted: numOr(info.granted_balance),
        currency: String(info.currency || 'CNY').toUpperCase(),
        source: 'apikey',
        at: Date.now(),
      }
    }
    return { ok: false, code: 'HTTP', error: '余额接口请求失败：' + String(lastErr?.message || lastErr).slice(0, 160) }
  }

  async function fetchAccountBalance() {
    const account = getAccount()
    if (!account || typeof account.getBalance !== 'function') {
      return { ok: false, code: 'NO_ACCOUNT', error: '未登录 DeepSeek 账号' }
    }
    let result
    try {
      result = await Promise.race([
        account.getBalance({
          version: String(process.env.DSH_CLIENT_VERSION || process.env.DSH_VERSION || '') || 'unknown',
          locale: String(process.env.DSH_LOCALE || '') || 'zh_CN',
          timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('账号余额请求超时')), ACCOUNT_TIMEOUT_MS)),
      ])
    } catch (err) {
      return { ok: false, code: 'ACCOUNT_FAILED', error: String(err?.message || err).slice(0, 160) }
    }
    if (!result) return { ok: false, code: 'NO_ACCOUNT', error: '账号未登录或没有账号凭据' }
    if (result.status !== 'ready') return { ok: false, code: 'ACCOUNT_NOT_READY', error: '账号余额接口未就绪' }
    const norm = Array.isArray(result.value) ? result.value : []
    const bonus = Array.isArray(result.bonusWallets) ? result.bonusWallets : []
    const wallets = [...norm, ...bonus].filter((w) => w && Number.isFinite(Number(w.balance)))
    if (wallets.length === 0) return { ok: false, code: 'NO_WALLET', error: '账号没有余额钱包' }
    const curOf = (w) => String(w.currency || 'CNY').toUpperCase()
    const currency = curOf(wallets.find((w) => Number(w.balance) > 0 && curOf(w) === 'CNY')
      || wallets.find((w) => Number(w.balance) > 0)
      || wallets[0])
    const sum = (list) => list
      .filter((w) => curOf(w) === currency && Number.isFinite(Number(w.balance)))
      .reduce((s, w) => s + Number(w.balance), 0)
    const toppedUp = sum(norm)
    const granted = sum(bonus)
    return {
      ok: true,
      total: round8(toppedUp + granted),
      toppedUp: round8(toppedUp),
      granted: round8(granted),
      currency,
      source: 'account',
      at: Date.now(),
    }
  }

  async function fetchBalance(force = false) {
    const now = Date.now()
    if (!force && balanceCache && now - balanceCache.at < BALANCE_TTL_MS) return balanceCache
    if (balanceInFlight) return balanceInFlight
    if (process.env.DSH_BALANCE_DISPLAY_OFFLINE === '1') {
      return { ok: false, total: null, currency: 'CNY', source: 'offline', at: now, error: '离线模式' }
    }
    balanceInFlight = (async () => {
      const keyResult = await fetchApiKeyBalance()
      let result = keyResult
      if (!keyResult.ok) {
        const accountResult = await fetchAccountBalance()
        if (accountResult.ok) result = accountResult
        else result = { ...keyResult, error: keyResult.error + '；账号登录路：' + accountResult.error }
      }
      if (result.ok) {
        lastBalanceError = ''
        balanceCache = result
      } else {
        lastBalanceError = result.error
        balanceCache = balanceCache
          ? { ...balanceCache, stale: true, error: result.error }
          : result
      }
      return balanceCache
    })().finally(() => { balanceInFlight = null })
    return balanceInFlight
  }

  function finalizeTurn(sessionId) {
    const agg = activeTurns.get(sessionId)
    if (!agg) return
    activeTurns.delete(sessionId)
    if (!(agg.cost > 0) && !(agg.tokens > 0)) return
    const now = Date.now()
    const durationMs = Math.max(0, now - agg.startAt)
    const today = todayRow()

    state.totals.cost = addMoney(state.totals.cost, agg.cost)
    state.totals.tokens += agg.tokens
    state.totals.turns += 1
    state.totals.durationMs += durationMs

    today.cost = addMoney(today.cost, agg.cost)
    today.tokens += agg.tokens
    today.turns += 1
    today.durationMs += durationMs

    const prevSession = state.sessions[sessionId] || { cost: 0, tokens: 0, turns: 0, durationMs: 0 }
    state.sessions[sessionId] = {
      cost: addMoney(prevSession.cost, agg.cost),
      tokens: (Number(prevSession.tokens) || 0) + agg.tokens,
      turns: (Number(prevSession.turns) || 0) + 1,
      durationMs: (Number(prevSession.durationMs) || 0) + durationMs,
      lastAt: now,
    }

    if (!subagentSessions.has(String(sessionId))) {
      state.seq = (Number(state.seq) || 0) + 1
      state.lastTurn = {
        seq: state.seq,
        turn: agg.turn,
        sessionId,
        cost: agg.cost,
        durationMs,
        tokens: agg.tokens,
        input: agg.input,
        cacheRead: agg.cacheRead,
        cacheWrite: agg.cacheWrite,
        output: agg.output,
        model: agg.model || '未知',
        peak: isPeakTime(now / 1000),
        at: now,
      }
    }
    pruneSessions()
    scheduleSave()
  }

  function pruneSessions() {
    const entries = Object.entries(state.sessions)
    if (entries.length <= MAX_SESSIONS) return
    const keep = entries
      .sort((a, b) => (Number(b[1]?.lastAt) || 0) - (Number(a[1]?.lastAt) || 0))
      .slice(0, MAX_SESSIONS)
    state.sessions = Object.fromEntries(keep)
  }

  function handleSessionEvent(session, event) {
    try {
      const sessionId = String(session?.id || 'default')
      const type = event?.type
      const data = event?.data
      if (!type || !data || typeof data !== 'object') return

      if (type === 'turn/start') {
        activeTurns.set(sessionId, {
          turn: Number(data.turn) || 0,
          startAt: Date.now(),
          cost: 0,
          tokens: 0,
          input: 0,
          cacheRead: 0,
          cacheWrite: 0,
          output: 0,
          model: '',
          byModel: {},
        })
        return
      }

      if (type === 'assistant/message') {
        if (!data.usage || typeof data.usage !== 'object') return
        const model = modelOf(data)
        const at = Number(event.time) || Date.now()
        const result = costOf(data.usage, model, at)
        let agg = activeTurns.get(sessionId)
        if (!agg) {
          agg = {
            turn: Number(data.turn) || 0,
            startAt: Date.now(),
            cost: 0,
            tokens: 0,
            input: 0,
            cacheRead: 0,
            cacheWrite: 0,
            output: 0,
            model: '',
            byModel: {},
          }
          activeTurns.set(sessionId, agg)
        }
        agg.cost = addMoney(agg.cost, result.cost)
        agg.tokens += result.tokens
        agg.input += result.buckets.input
        agg.cacheRead += result.buckets.cacheRead
        agg.cacheWrite += result.buckets.cacheWrite
        agg.output += result.buckets.output
        agg.model = model || agg.model
        return
      }

      if (type === 'turn/end') finalizeTurn(sessionId)
    } catch (err) {
      try { console.error('[dsh-usage-balance-v2] 处理会话事件失败：', err?.message || err) } catch {}
    }
  }

  root.effect(() => {
    const offs = []
    try { offs.push(root.on('session/event', handleSessionEvent)) } catch {}
    try {
      offs.push(root.on('subagent/start', (info) => {
        const id = info?.id ? String(info.id) : ''
        if (id) subagentSessions.add(id)
      }))
    } catch {}
    try {
      offs.push(root.on('subagent/end', (info) => {
        const id = info?.id ? String(info.id) : ''
        if (id) subagentSessions.add(id)
      }))
    } catch {}
    try {
      offs.push(root.on('session/disposed', (session) => {
        const id = String(session?.id || '')
        if (id) activeTurns.delete(id)
      }))
    } catch {}
    return () => {
      for (const off of offs) {
        try { if (typeof off === 'function') off() } catch {}
      }
    }
  }, 'dsh-usage-balance-v2: session events')

  async function snapshot(forceBalance) {
    const now = Date.now()
    const balance = await fetchBalance(forceBalance)
    const current = activeTurns.size > 0
      ? [...activeTurns.entries()].sort((a, b) => b[1].startAt - a[1].startAt)[0]
      : null
    const today = todayRow()
    const period = periodInfo(now / 1000)
    const sessionId = current?.[0] || state.lastTurn?.sessionId || null
    const row = sessionId ? state.sessions[sessionId] : null
    const session = {
      id: sessionId,
      cost: round8(row?.cost || 0),
      tokens: Number(row?.tokens) || 0,
      turns: Number(row?.turns) || 0,
      durationMs: Number(row?.durationMs) || 0,
    }
    return {
      ok: true,
      version: 1,
      now,
      session,
      totals: { ...state.totals, cost: round8(state.totals.cost) },
      today: { ...today, cost: round8(today.cost) },
      sessionCount: Object.keys(state.sessions).length,
      lastTurn: state.lastTurn,
      active: current ? {
        running: true,
        sessionId: current[0],
        turn: current[1].turn,
        since: current[1].startAt,
        elapsedMs: Math.max(0, now - current[1].startAt),
        cost: current[1].cost,
        tokens: current[1].tokens,
      } : { running: false },
      balance: {
        ok: balance?.ok === true,
        total: balance?.total ?? null,
        toppedUp: balance?.toppedUp ?? null,
        granted: balance?.granted ?? null,
        currency: balance?.currency || 'CNY',
        source: balance?.source || '',
        at: balance?.at || null,
        stale: balance?.stale === true,
        error: balance?.ok ? '' : (balance?.error || lastBalanceError || '余额不可用'),
      },
      pricing: period,
    }
  }

  // 本地开发：宿主半区重新装载后让 clientModules 重新哈希客户端 bundle，
  // 这样刷新页面就能拿到最新的 client/client.js，而不必重启整个 DSH。
  try {
    root.inject(['clientModules'], (modulesCtx) => {
      const timer = setTimeout(() => {
        try { modulesCtx.clientModules?.rebuilt?.('dsh-usage-balance-v2') } catch {}
      }, 1500)
      try { timer.unref?.() } catch {}
    })
  } catch {}

  try {
    root.inject(['webServer'], (webCtx) => {
      ctx = webCtx
      webCtx.effect(() => webCtx.webServer.register({
        kind: 'exact',
        path: '/dsh-usage-balance-v2/state.json',
        handler: async (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { Allow: 'GET, HEAD' })
            res.end()
            return
          }
          let force = false
          try {
            const url = new URL(req.url || '/', 'http://localhost')
            force = url.searchParams.get('refresh') === '1'
          } catch {}
          try {
            sendJson(res, 200, await snapshot(force))
          } catch (err) {
            sendJson(res, 500, { ok: false, error: String(err?.message || err) })
          }
        },
      }), 'dsh-usage-balance-v2: state route')

      // Per-workspace totals: merge the ledger's per-session rows with the
      // official values posted by the browser, then join through the host
      // workspace registry.
      webCtx.effect(() => webCtx.webServer.register({
        kind: 'exact',
        path: '/dsh-workspace-usage-v2/state.json',
        handler: (req, res) => {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { Allow: 'GET, HEAD' })
            res.end()
            return
          }
          const overlay = readJsonFile(WORKSPACE_OVERLAY_FILE, { sessions: {} })
          const ledgerSessions = state.sessions && typeof state.sessions === 'object' ? state.sessions : {}
          let registry = null
          try { registry = webCtx.get('workspaceRegistry') } catch {}
          let workspaces = []
          try {
            workspaces = (registry && typeof registry.list === 'function' ? registry.list() : []).map((workspace) => {
              const sessionIds = Array.isArray(workspace.sessionIds) ? workspace.sessionIds.map(String) : []
              let cost = 0
              let durationMs = 0
              let tokens = 0
              let turns = 0
              for (const sessionId of sessionIds) {
                const row = mergedSession(ledgerSessions[sessionId], overlay.sessions?.[sessionId])
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
          sendJson(res, 200, { ok: true, now: Date.now(), workspaces })
        },
      }), 'dsh-usage-balance-v2: workspace state route')

      // The browser posts the open session's official tokenUsage/sessionStats
      // values here. Keeping max(ledger, official) per session guarantees a
      // workspace total is never smaller than one of its sessions.
      webCtx.effect(() => webCtx.webServer.register({
        kind: 'exact',
        path: '/dsh-workspace-usage-v2/reconcile',
        handler: async (req, res) => {
          if (req.method !== 'POST') {
            res.writeHead(405, { Allow: 'POST' })
            res.end()
            return
          }
          let input = null
          try { input = JSON.parse(await readRequestBody(req)) } catch {}
          if (!input || typeof input !== 'object') {
            sendJson(res, 400, { ok: false, error: 'invalid json' })
            return
          }
          const sessionId = String(input.sessionId || '')
          if (!/^[a-zA-Z0-9_-]{1,120}$/.test(sessionId)) {
            sendJson(res, 400, { ok: false, error: 'invalid session id' })
            return
          }
          const overlay = readJsonFile(WORKSPACE_OVERLAY_FILE, { sessions: {} })
          overlay.sessions ||= {}
          const prev = overlay.sessions[sessionId] || {}
          overlay.sessions[sessionId] = {
            cost: round8(Math.max(Number(prev.cost) || 0, Number(input.cost) || 0)),
            durationMs: Math.max(0, Math.round(Math.max(Number(prev.durationMs) || 0, Number(input.durationMs) || 0))),
            tokens: Math.max(0, Math.round(Math.max(Number(prev.tokens) || 0, Number(input.tokens) || 0))),
            at: Date.now(),
          }
          writeJsonFile(WORKSPACE_OVERLAY_FILE, overlay)
          sendJson(res, 200, { ok: true })
        },
      }), 'dsh-usage-balance-v2: workspace reconcile route')
    })
  } catch (err) {
    try { console.error('[dsh-usage-balance-v2] 注册路由失败：', err?.message || err) } catch {}
  }

  root.effect(() => () => {
    if (saveTimer) {
      try { clearTimeout(saveTimer) } catch {}
      saveTimer = null
      saveState(state)
    }
  }, 'dsh-usage-balance-v2: flush state')
}
