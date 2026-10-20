# dsh-usage-balance-v2

中文 | [English](README.en.md)

DSH Web 底部用量条旁的余额/消耗读数插件。

默认嵌在原生统计条的 **token 用量与上下文百分比之间**，沿用原生字号、颜色和分隔符风格：

```
… 4.8M tok · 缓存命中 98%   [¥] ¥0.77  [⏱] 4m50s  [◉] ¥230.88 峰 ⌄   13%
```

三个读数分别是：**本会话消耗**、**本会话总用时**、**剩余余额**；金币/时钟/钱包都是简易内联 SVG 图标。

<p align="center">
  <img src="assets/preview-inline.png" alt="嵌在官方用量条中的读数" width="438">
</p>

<p align="center">
  <img src="assets/preview-details.png" alt="用量与余额详情卡" width="348">
</p>

点击展开详情卡：

- **本会话消耗**：读取 DSH 官方 `tokenUsage` 投影的**整段会话** token（缓存命中 / 未命中 / 输出），分别乘以当前峰/谷单价。详情卡直接列出乘法公式，例如
  `缓存 4.7M × ¥0.04/M + 未命中 73k × ¥2/M + 输出 54k × ¥8/M`。
  不是只统计插件启用后的轮次，因此和原生 `tok` 数对得上。
- **本会话用时**：读取官方 `sessionStats` 投影的 `LLM + 工具` 时间，并显示步数。
- **剩余余额**：优先用 `DEEPSEEK_API_KEY` 调 DeepSeek `/user/balance`；
  没有 API key 时回退到 DSH 账号登录态的余额服务（充值钱包 + 赠金钱包）。
  展开后显示充值/赠金构成；失败时显示具体原因。
- **当前时段**：按北京时间自动判断峰/谷，显示高峰规则与下次切换倒计时。
- **最近一轮**：显示上一轮消耗、时长、token、模型与峰谷状态。

布局上把三个读数放在原生 `token 用量` 与 `上下文百分比` 之间，用 14px 简易图标 + 紧凑数字，不额外增加行高，也不会把原生用量挤成省略号。

**不会在每轮结束时弹窗**；所有明细都收在点击展开的详情卡里。

## 侧边栏工作区累计

每个工作区标题行的右侧会显示该工作区的累计（该工作区下所有会话之和），保持一行小字：

```
Envir              ¥48.14 · 4h25m
默认工作区         ¥4.90 · 1h8m
```

读数由配套的 [`workspace-usage/`](workspace-usage) 宿主插件提供：它读取 `.dsh-usage-balance-v2.json`，再按 DSH 的 `workspaceRegistry` 把会话归属到工作区。鼠标悬停到工作区行时，操作按钮会临时盖住累计读数。

## 峰谷计价

- 高峰：周一至周五（不含法定节假日）**09:00–12:00、14:00–18:00**
- 谷时：其余时段，包括**周末、调休上班的周末、法定节假日全天**
- 高峰价 = 谷时价 × 2

价目表（人民币 / 百万 tokens，`[谷时, 高峰]`）：

| 模型 | 缓存命中 | 未命中输入 | 输出 |
| --- | --- | --- | --- |
| `deepseek-flash` / `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` | 0.02 / 0.04 | 1 / 2 | 4 / 8 |
| `deepseek-v4-pro` | 0.15 / 0.3 | 4.5 / 9 | 13.5 / 27 |

价目与节假日集中在 `lib/pricing.mjs` 的 `PRICING`、`PEAK_HOURS`、`HOLIDAY_VALLEY`。
2027 年及以后，国务院公布节假日安排后需要补 `HOLIDAY_VALLEY`。

## 安装

本插件不依赖任何 `@deepseek-ai/*` npm 包，不会触发 DSH 的版本兼容性拦截。

### 1. 克隆并链接到目标 profile

```powershell
git clone https://github.com/3493750852/dsh-usage-balance-v2.git
$plugin = (Resolve-Path .\dsh-usage-balance-v2).Path
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-usage-balance-v2" `
  -Target $plugin
```

Web profile 把路径里的 `desktop` 换成 `web`。

### 2. 在 profile 的 `cordis.patch.yml` 末尾追加

```yaml
- insert:
    - id: dsh-usage-balance-v2
      name: dsh-usage-balance-v2
```

### 3. 安装侧边栏工作区累计（可选）

```powershell
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-workspace-usage" `
  -Target (Join-Path $plugin 'workspace-usage')
```

再往同一个 `cordis.patch.yml` 追加：

```yaml
- insert:
    - id: dsh-workspace-usage
      name: dsh-workspace-usage
```

DSH profile 默认 `patchReload: live`，保存后宿主会热加载；刷新一次页面即可看到读数。
如果刷新后仍不显示，重启一次 DSH。

### 4. 验证

```js
fetch('/dsh-usage-balance-v2/state.json').then((r) => r.json()).then(console.log)
fetch('/dsh-workspace-usage/state.json').then((r) => r.json()).then(console.log)
```

应分别返回 `{ ok: true, totals, balance, pricing, lastTurn, ... }` 和
`{ ok: true, workspaces: [...] }`。

## 数据文件

`$DSH_HOME/.dsh-usage-balance-v2.json`

- 只记录插件启用之后的轮次；启用前的历史不会回填。
- `totals` 是累计值，`today` 按北京时间每天自动清零。
- 删除该文件即可重置统计（余额不受影响）。

## 统计口径

**本会话**（外部读数与详情卡主值）：

```
费用 = 缓存命中 tokens / 1e6 × 命中价
     + (未缓存输入 + 缓存写入) / 1e6 × 未命中价
     + 输出 tokens / 1e6 × 输出价
```

token 直接取 DSH 官方 `tokenUsage` 投影的整段会话累计值；价格按**当前**峰/谷时段取。
`reasoningTokens` 已包含在 `outputTokens` 中，不再单独加。

**最近一轮**：宿主按每一步 `assistant/message` 的真实 usage 与**该步到达时**的峰谷价累计，
所以跨 12:00 / 18:00 的轮次会按实际时段拆价。

不会在每轮结束时弹窗；所有信息都收在点击展开的详情卡里。

## 许可

MIT
