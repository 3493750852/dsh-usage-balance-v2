# dsh-workspace-usage

Per-workspace **total cost** and **total duration** for the DSH sidebar.

This is a small host-side companion to [dsh-usage-balance-v2](https://github.com/3493750852/dsh-usage-balance-v2).
It reads that plugin's ledger (`.dsh-usage-balance-v2.json`) and joins each
session with the host `workspaceRegistry`, exposing:

```
GET /dsh-workspace-usage/state.json
```

```json
{
  "ok": true,
  "workspaces": [
    { "id": "ws_...", "title": "default-workspace", "cost": 52.1, "durationMs": 19765379, "tokens": 800036492, "turns": 171 }
  ],
  "totals": { "cost": 52.1, "durationMs": 19765379, "tokens": 800036492, "turns": 171 }
}
```

The UI side lives in the v2 client bundle: it fetches this route and appends a
compact `¥52.10 · 5h29m` label to each workspace row in the sidebar.

## Install

```powershell
New-Item -ItemType Junction `
  -Path "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-workspace-usage" `
  -Target "<this directory>"
```

Append to the profile `cordis.patch.yml`:

```yaml
- insert:
    - id: dsh-workspace-usage
      name: dsh-workspace-usage
```

The ledger path can be overridden with `DSH_USAGE_BALANCE_STATE`.

## License

MIT
