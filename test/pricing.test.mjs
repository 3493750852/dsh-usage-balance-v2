import assert from 'node:assert/strict'
import test from 'node:test'
import {
  costOf,
  isPeakTime,
  nextPeakChangeAt,
  periodInfo,
  priceFor,
} from '../lib/pricing.mjs'

function at(iso) {
  return Date.parse(iso) / 1000
}

test('峰谷时段：工作日 9-12 与 14-18 为峰时', () => {
  assert.equal(isPeakTime(at('2026-10-19T09:00:00+08:00')), true)
  assert.equal(isPeakTime(at('2026-10-19T11:59:59+08:00')), true)
  assert.equal(isPeakTime(at('2026-10-19T12:00:00+08:00')), false)
  assert.equal(isPeakTime(at('2026-10-19T14:00:00+08:00')), true)
  assert.equal(isPeakTime(at('2026-10-19T17:59:59+08:00')), true)
  assert.equal(isPeakTime(at('2026-10-19T18:00:00+08:00')), false)
})

test('峰谷时段：周末与法定节假日全天谷价', () => {
  assert.equal(isPeakTime(at('2026-10-17T10:00:00+08:00')), false) // 周六
  assert.equal(isPeakTime(at('2026-10-18T14:30:00+08:00')), false) // 周日
  assert.equal(isPeakTime(at('2026-10-01T10:00:00+08:00')), false) // 国庆
  assert.equal(isPeakTime(at('2026-10-07T15:00:00+08:00')), false) // 国庆最后一天
})

test('下一个切换点与 isPeakTime 同源', () => {
  assert.equal(nextPeakChangeAt(at('2026-10-19T11:30:00+08:00')), at('2026-10-19T12:00:00+08:00'))
  assert.equal(nextPeakChangeAt(at('2026-10-19T12:30:00+08:00')), at('2026-10-19T14:00:00+08:00'))
  assert.equal(nextPeakChangeAt(at('2026-10-19T17:30:00+08:00')), at('2026-10-19T18:00:00+08:00'))
  assert.equal(nextPeakChangeAt(at('2026-10-19T18:30:00+08:00')), at('2026-10-20T09:00:00+08:00'))
  assert.equal(nextPeakChangeAt(at('2026-10-17T10:00:00+08:00')), at('2026-10-19T09:00:00+08:00'))
})

test('价目表：Flash 峰时是谷时的 2 倍，Pro 是 Flash 的 3 倍', () => {
  const flash = priceFor('deepseek-flash')
  assert.deepEqual(flash, { hit: [0.02, 0.04], miss: [1, 2], out: [4, 8] })
  const pro = priceFor('deepseek-v4-pro')
  assert.deepEqual(pro, { hit: [0.15, 0.3], miss: [4.5, 9], out: [13.5, 27] })
  assert.equal(priceFor('unknown-model'), flash)
})

test('costOf：按 usage 与峰谷价计算，reasoning 不重复计费', () => {
  const peak = at('2026-10-19T10:00:00+08:00') * 1000
  const valley = at('2026-10-19T12:30:00+08:00') * 1000
  const usage = {
    inputTokens: 1_000_000,
    cacheReadTokens: 1_000_000,
    outputTokens: 1_000_000,
    reasoningTokens: 500_000,
  }
  const p = costOf(usage, 'deepseek-flash', peak)
  const v = costOf(usage, 'deepseek-flash', valley)
  assert.equal(p.cost, 2 + 0.04 + 8)
  assert.equal(v.cost, 1 + 0.02 + 4)
  assert.equal(p.tokens, 3_000_000)
  assert.equal(v.tokens, 3_000_000)
})

test('periodInfo 返回展示信息', () => {
  const info = periodInfo(at('2026-10-19T11:00:00+08:00'))
  assert.equal(info.period, 'peak')
  assert.equal(info.label, '峰时')
  assert.equal(info.multiplier, 2)
  assert.equal(info.nextChangeAt, at('2026-10-19T12:00:00+08:00') * 1000)
})
