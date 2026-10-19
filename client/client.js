window.__ModuleLoader__.load({
  id: "dsh-usage-balance-v2",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
    const React = react;
    const CSS_ID = "dsh-usage-balance-v2/styles.css";
    if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="' + CSS_ID + '"]') === null) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-usage-balance-v2";
      tag.dataset.pluginCss = CSS_ID;
      tag.textContent = [
        "@keyframes dshub-in{from{opacity:0;transform:translate(-50%,6px)}to{opacity:1;transform:translate(-50%,0)}}",
        "@keyframes dshub-pop-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}",
        ".dshub_root{display:flex;align-items:center;justify-content:center;width:auto;max-width:none;flex:0 0 auto;box-sizing:border-box;margin:0 8px;padding:0;font-size:var(--dsh-content-font-size-secondary,13px);line-height:calc(20px + var(--dsh-content-font-delta-secondary,0px));color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-variant-numeric:tabular-nums}",
        ".dshub_root:has(.dshub_chip[disabled]){display:none!important}",
        ".dshub_anchor{position:relative;display:inline-flex;align-items:center;min-width:0}",
        ".dshub_chip{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;line-height:inherit;padding:0 2px;border-radius:6px;cursor:pointer;white-space:nowrap;transition:background-color .12s ease,color .12s ease}",
        ".dshub_chip:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.10));color:var(--dsw-alias-label-secondary)}",
        ".dshub_coin{color:var(--dsw-alias-label-tertiary);font-size:inherit;line-height:inherit;flex:0 0 auto}",
        ".dshub_icon{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;flex:0 0 auto;color:var(--dsw-alias-label-tertiary)}",
        ".dshub_num{color:var(--dsw-alias-label-secondary);font-weight:400}",
        ".dshub_muted{opacity:.85}",
        ".dshub_dot{opacity:.5;margin:0 4px}",
        ".dshub_bar{color:var(--dsw-alias-separator-primary,rgba(128,128,128,.3));margin:0 8px;user-select:none}",
        ".dshub_bad{color:var(--dsw-alias-state-error-primary,#ef4444)}",
        ".dshub_pill{display:inline-flex;align-items:center;justify-content:center;padding:0;font-size:inherit;line-height:inherit;flex:0 0 auto}",
        ".dshub_peak{color:var(--dsw-alias-state-warn-primary,#d97706)}",
        ".dshub_valley{color:var(--dsw-alias-state-success-primary,#059669)}",
        ".dshub_chev{font-size:10px;opacity:.7;margin-left:1px}",
        ".dshub_pop{position:absolute;bottom:calc(100% + 8px);right:0;left:auto;transform:none;z-index:10000;width:min(352px,92vw);box-sizing:border-box;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.22));border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,.20);padding:10px 12px 11px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.55;white-space:normal;text-align:left;backdrop-filter:blur(10px);animation:dshub-pop-in .16s cubic-bezier(.16,1,.3,1)}",
        ".dshub_pop_head{display:flex;align-items:center;gap:6px;font-weight:600;color:var(--dsw-alias-label-primary);font-size:12.5px;margin-bottom:7px}",
        ".dshub_pop_actions{margin-left:auto;display:inline-flex;align-items:center;gap:2px}",
        ".dshub_iconbtn{border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-size:13px;line-height:18px;padding:0 3px;border-radius:4px}",
        ".dshub_iconbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.12));color:var(--dsw-alias-label-primary)}",
        ".dshub_iconbtn[disabled]{opacity:.45;cursor:default}",
        ".dshub_grid{display:grid;grid-template-columns:64px minmax(0,1fr);gap:3px 8px;align-items:baseline}",
        ".dshub_k{color:var(--dsw-alias-label-tertiary)}",
        ".dshub_v{color:var(--dsw-alias-label-primary);font-weight:500;font-variant-numeric:tabular-nums;min-width:0;overflow:hidden;text-overflow:ellipsis}",
        ".dshub_vsub{display:block;font-weight:400;font-size:11px;color:var(--dsw-alias-label-tertiary);margin-top:1px;white-space:normal;line-height:1.45}",
        ".dshub_rule{height:1px;background:var(--dsw-alias-separator-primary,rgba(128,128,128,.18));margin:8px 0 7px}",
        ".dshub_err{color:var(--dsw-alias-state-error-primary,#ef4444);white-space:normal;line-height:1.45}",
        ".dshub_toast{position:fixed;left:50%;transform:translateX(-50%);z-index:10001;min-width:220px;max-width:min(380px,92vw);box-sizing:border-box;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base,#fff));border:1px solid var(--dsw-alias-border-l2,rgba(128,128,128,.22));border-radius:10px;box-shadow:0 10px 28px rgba(0,0,0,.18);padding:8px 11px 9px;font-size:12px;line-height:1.55;color:var(--dsw-alias-label-secondary);cursor:pointer;animation:dshub-in .18s cubic-bezier(.16,1,.3,1);backdrop-filter:blur(8px)}",
        ".dshub_toast_head{display:flex;align-items:center;gap:6px;font-weight:600;color:var(--dsw-alias-label-primary);font-size:12px}",
        ".dshub_toast_close{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:1;padding:0 2px}",
        ".dshub_toast_main{margin-top:3px;color:var(--dsw-alias-label-secondary)}",
        ".dshub_toast_main b{color:var(--dsw-alias-label-primary);font-weight:600;font-variant-numeric:tabular-nums}",
        ".dshub_toast_sub{margin-top:1px;font-size:11px;color:var(--dsw-alias-label-tertiary)}"
      ].join("");
      document.head.appendChild(tag);
    }
    const STATE_URL = "/dsh-usage-balance-v2/state.json";
    function money(value, currency) {
      const n = Number(value);
      const cur = String(currency || "CNY").toUpperCase();
      const symbol = cur === "USD" ? "$" : "\xA5";
      if (!Number.isFinite(n)) return symbol + "\u2014";
      if (n === 0) return symbol + "0.00";
      const abs = Math.abs(n);
      const digits = abs >= 0.01 ? 2 : abs >= 1e-4 ? 4 : 6;
      return symbol + n.toFixed(digits);
    }
    function balanceMoney(value, currency) {
      const n = Number(value);
      const cur = String(currency || "CNY").toUpperCase();
      const symbol = cur === "USD" ? "$" : "\xA5";
      if (!Number.isFinite(n)) return symbol + "\u2014";
      return symbol + n.toFixed(2);
    }
    function duration(ms, decimal) {
      const n = Math.max(0, Number(ms) || 0);
      if (n < 1e3) return "0\u79D2";
      const s = n / 1e3;
      if (s < 60) return (decimal ? Math.round(s * 10) / 10 : Math.round(s)) + "\u79D2";
      const whole = Math.round(s);
      const m = Math.floor(whole / 60);
      const sec = whole % 60;
      if (m < 60) return m + "\u5206" + (sec > 0 ? sec + "\u79D2" : "");
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return h + "\u5C0F\u65F6" + (mm > 0 ? mm + "\u5206" : "");
    }
    function durationShort(ms) {
      const n = Math.max(0, Number(ms) || 0);
      const s = Math.round(n / 1e3);
      if (s < 60) return s + "s";
      const m = Math.floor(s / 60);
      const sec = s % 60;
      if (m < 60) return m + "m" + (sec > 0 ? sec + "s" : "");
      const h = Math.floor(m / 60);
      const mm = m % 60;
      return h + "h" + (mm > 0 ? mm + "m" : "");
    }
    function tokens(value) {
      const n = Math.max(0, Number(value) || 0);
      if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M";
      if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k";
      return String(Math.round(n));
    }
    const PRICE = {
      flash: { hit: [0.02, 0.04], miss: [1, 2], out: [4, 8] },
      pro: { hit: [0.15, 0.3], miss: [4.5, 9], out: [13.5, 27] }
    };
    function priceFor(model) {
      return String(model || "").toLowerCase().indexOf("v4-pro") !== -1 ? PRICE.pro : PRICE.flash;
    }
    // 按 DSH 官方 tokenUsage 投影（整个会话的 token）乘单价，而不是只算插件启用后的轮次。
    function costFromUsage(usage, model, peak) {
      if (!usage) return null;
      const p = priceFor(model);
      const i = peak ? 1 : 0;
      const input = Number(usage.uncachedInputTokens) || 0;
      const cache = Number(usage.cacheReadTokens) || 0;
      const write = Number(usage.cacheWriteTokens) || 0;
      const output = Number(usage.outputTokens) || 0;
      const cost = cache / 1e6 * p.hit[i] + (input + write) / 1e6 * p.miss[i] + output / 1e6 * p.out[i];
      return {
        cost: Math.round(cost * 1e8) / 1e8,
        input,
        cache,
        write,
        output,
        tokens: input + cache + write + output,
        hitPrice: p.hit[i],
        missPrice: p.miss[i],
        outPrice: p.out[i]
      };
    }
    function clock(ts) {
      const n = Number(ts);
      if (!Number.isFinite(n)) return "\u2014";
      try {
        return new Date(n).toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" });
      } catch {
        return new Date(n).toTimeString().slice(0, 5);
      }
    }
    function countdown(ms) {
      const n = Math.max(0, Number(ms) || 0);
      const total = Math.floor(n / 1e3);
      const h = Math.floor(total / 3600);
      const m = Math.floor(total % 3600 / 60);
      if (h > 0) return h + "\u5C0F\u65F6" + m + "\u5206";
      if (m > 0) return m + "\u5206";
      return total + "\u79D2";
    }
    function useDashboard() {
      const [snap, setSnap] = React.useState(null);
      const [error, setError] = React.useState("");
      const [refreshing, setRefreshing] = React.useState(false);
      const stopped = React.useRef(false);
      const timer = React.useRef(null);
      const load = React.useCallback(async (force) => {
        try {
          const res = await fetch(STATE_URL + (force ? "?refresh=1" : ""), { cache: "no-store" });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const data = await res.json();
          if (!stopped.current) {
            setSnap(data);
            setError("");
          }
          return data;
        } catch (err) {
          if (!stopped.current) setError(String(err && err.message ? err.message : err));
          return null;
        }
      }, []);
      React.useEffect(() => {
        stopped.current = false;
        let cancelled = false;
        const tick = async () => {
          if (cancelled) return;
          const data = await load(false);
          if (cancelled) return;
          const delay = data && data.active && data.active.running ? 2e3 : 6e3;
          timer.current = window.setTimeout(tick, delay);
        };
        void tick();
        return () => {
          cancelled = true;
          stopped.current = true;
          if (timer.current) window.clearTimeout(timer.current);
        };
      }, [load]);
      const refresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
          await load(true);
        } finally {
          if (!stopped.current) setRefreshing(false);
        }
      }, [load]);
      return { snap, error, refreshing, refresh };
    }
    const Readout = React.memo(function Readout2({ useProjection }) {
      const { snap, error, refreshing, refresh } = useDashboard();
      const rootRef = React.useRef(null);
      const anchorRef = React.useRef(null);
      const seenSeq = React.useRef(null);
      const [open, setOpen] = React.useState(false);
      const [toast, setToast] = React.useState(null);
      const [toastBottom, setToastBottom] = React.useState(120);
      const projection = typeof useProjection === "function" ? useProjection : null;
      const officialUsage = projection ? projection("tokenUsage") : void 0;
      const officialStats = projection ? projection("sessionStats") : void 0;
      React.useEffect(() => {
        const lt = snap && snap.lastTurn;
        const seq = lt && Number.isFinite(Number(lt.seq)) ? Number(lt.seq) : 0;
        if (seenSeq.current === null) {
          seenSeq.current = seq;
          return;
        }
        if (seq > seenSeq.current) {
          seenSeq.current = seq;
          if (lt) setToast({ ...lt, key: Date.now() });
        }
      }, [snap && snap.lastTurn && snap.lastTurn.seq]);
      React.useEffect(() => {
        if (!toast) return;
        const t = window.setTimeout(() => setToast(null), 8e3);
        return () => window.clearTimeout(t);
      }, [toast]);
      React.useEffect(() => {
        const update = () => {
          const el = rootRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          setToastBottom(Math.max(88, window.innerHeight - rect.top + 10));
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
      }, [snap]);
      React.useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
          const anchor = anchorRef.current;
          if (anchor && e.target instanceof Node && anchor.contains(e.target)) return;
          setOpen(false);
        };
        const onKey = (e) => {
          if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => {
          document.removeEventListener("mousedown", onDoc);
          document.removeEventListener("keydown", onKey);
        };
      }, [open]);
      if (!snap) {
        return /* @__PURE__ */ React.createElement("div", { className: "dshub_root", ref: rootRef }, /* @__PURE__ */ React.createElement("div", { className: "dshub_anchor", ref: anchorRef }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "dshub_chip", disabled: true }, /* @__PURE__ */ React.createElement("span", { className: "dshub_coin" }, "\xA5"), /* @__PURE__ */ React.createElement("span", { className: "dshub_muted" }, error ? "\u4F59\u989D\u4E0D\u53EF\u7528" : "\u4F59\u989D\u8BFB\u53D6\u4E2D\u2026"))));
      }
      const totals = snap.totals || { cost: 0, durationMs: 0, turns: 0, tokens: 0 };
      const session = snap.session || { cost: totals.cost, durationMs: totals.durationMs, tokens: totals.tokens, turns: totals.turns };
      const today = snap.today || { cost: 0, turns: 0 };
      const balance = snap.balance || { ok: false, currency: "CNY" };
      const pricing = snap.pricing || { peak: false, label: "\u8C37\u65F6" };
      const peak = pricing.peak === true;
      const balOk = balance.ok === true;
      const balText = balOk ? balanceMoney(balance.total, balance.currency) : "\u2014";
      const official = costFromUsage(officialUsage, (snap.lastTurn && snap.lastTurn.model) || "deepseek-flash", peak);
      const sessionCost = official ? official.cost : session.cost;
      const sessionTokens = official ? official.tokens : session.tokens;
      const sessionTurns = officialStats && Number.isFinite(Number(officialStats.turns)) ? Number(officialStats.turns) : session.turns;
      const sessionDuration = officialStats && (Number(officialStats.llmMs) || Number(officialStats.toolMs))
        ? (Number(officialStats.llmMs) || 0) + (Number(officialStats.toolMs) || 0)
        : session.durationMs;
      const balanceSub = [];
      if (balOk) {
        if (Number.isFinite(Number(balance.toppedUp))) balanceSub.push("\u5145\u503C " + balanceMoney(balance.toppedUp, balance.currency));
        if (Number.isFinite(Number(balance.granted))) balanceSub.push("\u8D60\u91D1 " + balanceMoney(balance.granted, balance.currency));
      }
      const nextRaw = Number(pricing.nextChangeAt);
      const nextAtMs = Number.isFinite(nextRaw) && nextRaw > 0 ? nextRaw < 1e12 ? nextRaw * 1000 : nextRaw : null;
      const nextChange = nextAtMs ? clock(nextAtMs) + "\uFF08\u7EA6 " + countdown(nextAtMs - snap.now) + " \u540E\uFF09" : "\u2014";
      const last = snap.lastTurn;
      const lastLine = last ? money(last.cost, balance.currency) + " \xB7 " + duration(last.durationMs, true) : "\u6682\u65E0";
      const lastSub = last ? tokens(last.tokens) + " tok \xB7 " + (last.peak ? "\u5CF0\u65F6" : "\u8C37\u65F6") + (last.model ? " \xB7 " + last.model : "") : "\u5B8C\u6210\u4E00\u8F6E\u5BF9\u8BDD\u540E\u663E\u793A";
      const tip = "\u70B9\u51FB\u67E5\u770B\u8BE6\u60C5\uFF1A\u672C\u4F1A\u8BDD\u6D88\u8017 " + money(sessionCost, balance.currency) + " \xB7 \u603B\u7528\u65F6 " + duration(sessionDuration) + " \xB7 \u4F59\u989D " + (balOk ? balanceMoney(balance.total, balance.currency) : "\u4E0D\u53EF\u7528");
      const popover = open ? /* @__PURE__ */ React.createElement("div", { className: "dshub_pop", role: "dialog", "aria-label": "\u7528\u91CF\u4E0E\u4F59\u989D\u8BE6\u60C5" }, /* @__PURE__ */ React.createElement("div", { className: "dshub_pop_head" }, /* @__PURE__ */ React.createElement("span", null, "\u7528\u91CF\u4E0E\u4F59\u989D"), /* @__PURE__ */ React.createElement("span", { className: "dshub_pop_actions" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "dshub_iconbtn",
          title: "\u5237\u65B0\u4F59\u989D",
          disabled: refreshing,
          onClick: (e) => {
            e.stopPropagation();
            void refresh();
          }
        },
        refreshing ? "\u2026" : "\u21BB"
      ), /* @__PURE__ */ React.createElement("button", { type: "button", className: "dshub_iconbtn", title: "\u5173\u95ED", onClick: () => setOpen(false) }, "\xD7"))), /* @__PURE__ */ React.createElement("div", { className: "dshub_grid" }, /* @__PURE__ */ React.createElement("span", { className: "dshub_k" }, "\u672C\u4F1A\u8BDD\u6D88\u8017"), /* @__PURE__ */ React.createElement("span", { className: "dshub_v" }, money(sessionCost, balance.currency), /* @__PURE__ */ React.createElement("span", { className: "dshub_vsub" }, (sessionTurns || 0) + " \u8F6E \xB7 " + tokens(sessionTokens) + " tok")), /* @__PURE__ */ React.createElement("span", { className: "dshub_k" }, "\u672C\u4F1A\u8BDD\u7528\u65F6"), /* @__PURE__ */ React.createElement("span", { className: "dshub_v" }, duration(sessionDuration), /* @__PURE__ */ React.createElement("span", { className: "dshub_vsub" }, "LLM " + duration(officialStats && officialStats.llmMs || 0) + " \xB7 \u5DE5\u5177 " + duration(officialStats && officialStats.toolMs || 0) + " \xB7 " + (officialStats && officialStats.steps || 0) + " \u6B65")), /* @__PURE__ */ React.createElement("span", { className: "dshub_k" }, "\u8BA1\u8D39"), /* @__PURE__ */ React.createElement("span", { className: "dshub_v" }, money(sessionCost, balance.currency), /* @__PURE__ */ React.createElement("span", { className: "dshub_vsub" }, official ? "\u7F13\u5B58 " + tokens(official.cache) + " \xD7 " + money(official.hitPrice, balance.currency) + "/M + \u672A\u547D\u4E2D " + tokens(official.input + official.write) + " \xD7 " + money(official.missPrice, balance.currency) + "/M + \u8F93\u51FA " + tokens(official.output) + " \xD7 " + money(official.outPrice, balance.currency) + "/M" : "\u5BBF\u4E3B\u7EDF\u8BA1\uFF08\u63D2\u4EF6\u542F\u7528\u540E\uFF09")), /* @__PURE__ */ React.createElement("span", { className: "dshub_k" }, "\u5269\u4F59\u4F59\u989D"), /* @__PURE__ */ React.createElement("span", { className: "dshub_v" }, balOk ? balanceMoney(balance.total, balance.currency) : /* @__PURE__ */ React.createElement("span", { className: "dshub_bad" }, "\u4E0D\u53EF\u7528"), /* @__PURE__ */ React.createElement("span", { className: "dshub_vsub" + (balOk ? "" : " dshub_err") }, balOk ? balanceSub.join(" \xB7 ") || "\u4F59\u989D\u63A5\u53E3\u5DF2\u8FD4\u56DE" : balance.error || error || "\u672A\u77E5\u539F\u56E0")), /* @__PURE__ */ React.createElement("span", { className: "dshub_k" }, "\u5F53\u524D\u65F6\u6BB5"), /* @__PURE__ */ React.createElement("span", { className: "dshub_v" }, peak ? "\u2600\uFE0F \u5CF0\u65F6 \xB7 2 \u500D\u4EF7" : "\u{1F319} \u8C37\u65F6 \xB7 5 \u6298", /* @__PURE__ */ React.createElement("span", { className: "dshub_vsub" }, "\u9AD8\u5CF0 \u5468\u4E00\u81F3\u5468\u4E94 09:00\u201312:00 / 14:00\u201318:00\uFF1B\u4E0B\u6B21\u5207\u6362 ", nextChange)), /* @__PURE__ */ React.createElement("span", { className: "dshub_k" }, "\u6700\u8FD1\u4E00\u8F6E"), /* @__PURE__ */ React.createElement("span", { className: "dshub_v" }, lastLine, /* @__PURE__ */ React.createElement("span", { className: "dshub_vsub" }, lastSub))), /* @__PURE__ */ React.createElement("div", { className: "dshub_rule" }), /* @__PURE__ */ React.createElement("div", { className: "dshub_vsub" }, "\u66F4\u65B0 ", clock(snap.now), " \xB7 \u4F59\u989D ", balance.at ? clock(balance.at) : "\u2014", balance.stale ? "\uFF08\u65E7\u6570\u636E\uFF09" : "")) : null;
      const chip = /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "dshub_chip",
          title: tip,
          "aria-expanded": open,
          onClick: (e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }
        },
        /* @__PURE__ */ React.createElement("span", { className: "dshub_icon", "aria-hidden": true, title: "\u672C\u4F1A\u8BDD\u6D88\u8017" },
          /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", width: 14, height: 14, fill: "none" },
            /* @__PURE__ */ React.createElement("circle", { cx: 8, cy: 8, r: 6.2, stroke: "currentColor", strokeWidth: 1.2 }),
            /* @__PURE__ */ React.createElement("path", { d: "M5.6 5.1 8 8.1l2.4-3M8 8.1v3.2M6.4 9.2h3.2M6.4 10.5h3.2", stroke: "currentColor", strokeWidth: 1.1, strokeLinecap: "round", strokeLinejoin: "round" })
          )
        ),
        /* @__PURE__ */ React.createElement("span", { className: "dshub_num" }, money(sessionCost, balance.currency)),
        /* @__PURE__ */ React.createElement("span", { className: "dshub_icon", "aria-hidden": true, title: "\u672C\u4F1A\u8BDD\u7528\u65F6" },
          /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", width: 14, height: 14, fill: "none" },
            /* @__PURE__ */ React.createElement("circle", { cx: 8, cy: 8, r: 6.2, stroke: "currentColor", strokeWidth: 1.2 }),
            /* @__PURE__ */ React.createElement("path", { d: "M8 4.8V8l2.2 1.4", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round", strokeLinejoin: "round" })
          )
        ),
        /* @__PURE__ */ React.createElement("span", { className: "dshub_num" }, durationShort(sessionDuration)),
        /* @__PURE__ */ React.createElement("span", { className: "dshub_icon", "aria-hidden": true, title: "\u5269\u4F59\u4F59\u989D" },
          /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 16 16", width: 14, height: 14, fill: "none" },
            /* @__PURE__ */ React.createElement("rect", { x: 2.2, y: 4.3, width: 11.6, height: 7.8, rx: 2, stroke: "currentColor", strokeWidth: 1.2 }),
            /* @__PURE__ */ React.createElement("path", { d: "M2.5 6.5h7.7a1.55 1.55 0 0 1 0 3.1H8.7", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" }),
            /* @__PURE__ */ React.createElement("circle", { cx: 10.7, cy: 8.05, r: 0.8, fill: "currentColor" })
          )
        ),
        /* @__PURE__ */ React.createElement("span", { className: "dshub_num" + (balOk ? "" : " dshub_bad") }, balText),
        /* @__PURE__ */ React.createElement("span", { className: "dshub_pill " + (peak ? "dshub_peak" : "dshub_valley") }, peak ? "\u5CF0" : "\u8C37"),
        /* @__PURE__ */ React.createElement("span", { className: "dshub_chev" }, open ? "\u2303" : "\u2304")
      );
      const toastNode = null;
      return /* @__PURE__ */ React.createElement("div", { className: "dshub_root", ref: rootRef }, /* @__PURE__ */ React.createElement("div", { className: "dshub_anchor", ref: anchorRef }, chip, popover), toastNode);
    });
    const inject = ["slots"];
    function apply(ctx) {
      ctx.effect(() => ctx.slots.inject("conversation.composer.dock", () => {
        return ctx.slots.register({
          name: "conversation.composer.dock",
          id: "dsh-usage-balance-v2",
          order: 1
        }, Readout);
      }), "dsh-usage-balance-v2: composer dock");
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
