// DeepSeek 计费规则（人民币 / 百万 tokens）。
//
// 峰谷规则（北京时间）：
//   · 高峰：周一至周五（不含法定节假日）09:00–12:00、14:00–18:00
//   · 其余时段——包括周末、调休上班的周末、法定节假日全天——一律按谷时价
//   · 高峰价 = 谷时价 × 2
//
// 价格来源：https://api-docs.deepseek.com/zh-cn/quick_start/pricing
// 2026-09-10 起 Flash 系列：缓存命中 0.02/0.04，未命中 1/2，输出 4/8（谷/峰）。
// 2026-09-14 官方确认 V4 Pro 计费方式不变：0.15/0.3、4.5/9、13.5/27。
// 数组顺序统一为 [谷时价, 高峰价]。
export const PEAK_HOURS = [
  [9, 12],
  [14, 18],
]

const FLASH_PRICE = { hit: [0.02, 0.04], miss: [1, 2], out: [4, 8] }
const PRO_PRICE = { hit: [0.15, 0.3], miss: [4.5, 9], out: [13.5, 27] }

export const PRICING = {
  'deepseek-flash': FLASH_PRICE,
  'deepseek-v4-flash': FLASH_PRICE,
  'deepseek-v4-flash-vision-exp': FLASH_PRICE,
  'deepseek-v4.1-flash': FLASH_PRICE,
  'deepseek-v4-pro': PRO_PRICE,
  _default: FLASH_PRICE,
}

/** 周末全天谷价的生效时刻：北京时间 2026-08-23 00:00。 */
const WEEKEND_VALLEY_FROM_SEC = Math.floor(Date.UTC(2026, 7, 22, 16, 0, 0) / 1000)

// 法定节假日全天谷价（只列放假日期；调休上班日都落在周末，本来就按谷价）。
// 依据：国务院办公厅 2026 年部分节假日安排 + DeepSeek 官方计费脚注。
// 2027 年及以后国务院公布安排后，在这里补日期即可。
const HOLIDAY_VALLEY = {
  '2026-01-01': 1, '2026-01-02': 1, '2026-01-03': 1,
  '2026-02-15': 1, '2026-02-16': 1, '2026-02-17': 1, '2026-02-18': 1, '2026-02-19': 1,
  '2026-02-20': 1, '2026-02-21': 1, '2026-02-22': 1, '2026-02-23': 1,
  '2026-04-04': 1, '2026-04-05': 1, '2026-04-06': 1,
  '2026-05-01': 1, '2026-05-02': 1, '2026-05-03': 1, '2026-05-04': 1, '2026-05-05': 1,
  '2026-06-19': 1, '2026-06-20': 1, '2026-06-21': 1,
  '2026-09-25': 1, '2026-09-26': 1, '2026-09-27': 1,
  '2026-10-01': 1, '2026-10-02': 1, '2026-10-03': 1, '2026-10-04': 1,
  '2026-10-05': 1, '2026-10-06': 1, '2026-10-07': 1,
}
const HOLIDAY_VALLEY_FROM_SEC = Math.floor(Date.UTC(2026, 8, 18, 16, 0, 0) / 1000)

const HOLIDAY_LIST = Object.keys(HOLIDAY_VALLEY).sort()

/** 返回北京时间的日历对象（按 UTC 字段读取即为北京日历）。 */
function beijingDate(timeMs) {
  return new Date(Number(timeMs) + 8 * 3600 * 1000)
}

/** 判断某一时刻是否处于高峰计价。timeSec 为 Unix 秒。 */
export function isPeakTime(timeSec) {
  const n = Number(timeSec)
  if (!Number.isFinite(n)) return false
  const bj = beijingDate(n * 1000)
  const day = bj.toISOString().slice(0, 10)
  if (n >= WEEKEND_VALLEY_FROM_SEC) {
    const dow = bj.getUTCDay()
    if (dow === 0 || dow === 6) return false
  }
  if (n >= HOLIDAY_VALLEY_FROM_SEC && HOLIDAY_VALLEY[day]) return false
  const hour = bj.getUTCHours()
  for (const [start, end] of PEAK_HOURS) {
    if (hour >= start && hour < end) return true
  }
  return false
}

/** 当前计价时段：'peak' | 'valley'。 */
export function periodOf(timeSec = Date.now() / 1000) {
  return isPeakTime(timeSec) ? 'peak' : 'valley'
}

/**
 * 下一个峰谷切换时刻（Unix 秒）。与 isPeakTime 同源，扫描未来 14 天的小时边界。
 * 返回 null 表示 14 天内没有切换点（当前规则下不会发生）。
 */
export function nextPeakChangeAt(timeSec) {
  const n = Number(timeSec)
  if (!Number.isFinite(n)) return null
  const current = isPeakTime(n)
  const day0 = Math.floor((n + 8 * 3600) / 86400) * 86400
  for (let d = 0; d <= 14; d++) {
    for (const edge of [0, 9, 12, 14, 18]) {
      const candidate = day0 + d * 86400 + edge * 3600 - 8 * 3600
      if (candidate <= n + 1) continue
      if (isPeakTime(candidate) !== current) return candidate
    }
  }
  return null
}

/** 当前时段的展示信息（供前端 tooltip / 角标使用）。 */
export function periodInfo(timeSec = Date.now() / 1000) {
  const peak = isPeakTime(timeSec)
  const next = nextPeakChangeAt(timeSec)
  return {
    period: peak ? 'peak' : 'valley',
    peak,
    label: peak ? '峰时' : '谷时',
    multiplier: peak ? 2 : 1,
    // 展示层统一用毫秒时间戳（nextPeakChangeAt 内部按 Unix 秒计算）。
    nextChangeAt: next === null ? null : next * 1000,
    holidays: HOLIDAY_LIST.slice(),
  }
}

/** 按模型名匹配价目表（最长关键字优先，避免 pro 误伤 flash）。 */
export function priceFor(model) {
  const m = String(model || '').toLowerCase()
  const keys = Object.keys(PRICING).filter((k) => k !== '_default').sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (m.includes(key)) return PRICING[key]
  }
  return PRICING._default
}

function round8(n) {
  return Math.round((Number(n) || 0) * 1e8) / 1e8
}

/**
 * 按真实 usage 计算一次模型调用的费用。
 * usage 字段来自 DSH assistant/message：
 *   inputTokens        未缓存输入
 *   cacheReadTokens    缓存命中输入
 *   cacheWriteTokens   缓存写入（DeepSeek 不单独计费，按未命中输入处理）
 *   outputTokens       输出（已包含 reasoningTokens，不能重复加）
 * 返回 { cost, tokens, buckets, model }。
 */
export function costOf(usage, model, atMs = Date.now()) {
  const u = usage || {}
  const input = Number(u.inputTokens) || 0
  const cacheRead = Number(u.cacheReadTokens) || 0
  const cacheWrite = Number(u.cacheWriteTokens) || 0
  const output = Number(u.outputTokens) || 0
  const price = priceFor(model)
  const off = isPeakTime(atMs / 1000) ? 1 : 0
  const cost = (cacheRead / 1e6) * price.hit[off]
    + ((input + cacheWrite) / 1e6) * price.miss[off]
    + (output / 1e6) * price.out[off]
  return {
    cost: round8(cost),
    tokens: input + cacheRead + cacheWrite + output,
    buckets: { input, cacheRead, cacheWrite, output },
    model: String(model || '未知'),
    peak: off === 1,
  }
}

/** 金额加法：保留 8 位小数，避免浮点累加误差。 */
export function addMoney(a, b) {
  return round8((Number(a) || 0) + (Number(b) || 0))
}

/** 北京时间日期键：YYYY-MM-DD。 */
export function beijingDay(timeMs = Date.now()) {
  return beijingDate(timeMs).toISOString().slice(0, 10)
}
