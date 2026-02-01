# Handoff → Execution Flow

**Purpose**: How planner/ClawDBot handoff payloads become execution. Cursor and the runner apply actions only when approved; execution is allowlisted.

---

## Flow

1. **Plan**: Planner (or ClawDBot) produces a plan or handoff-shaped output (priorities, suggested_actions, or handoff JSON with `intent`, `actions`, `confidence`).
2. **Test (optional)**: Antigravity reviews the plan and produces critiques; human can revise plan.
3. **Approve**: Human sets `approved_by: "human"` on the handoff and (optionally) adds `run_script` actions for runner.
4. **Execute**: Either Cursor implements the plan by hand, or the runner runs allowlisted scripts from the approved handoff.

---

## Handoff format

See [.cursor/governance/handoff_format.md](.cursor/governance/handoff_format.md). Summary:

- `approved_by` must be `"human"` for Cursor or runner to act.
- `actions` is an array; each item can be `apply_fix`, `enrich_data`, `validate_data`, `implement_draft`, etc.
- For **runner execution**, actions can include `run_script`: `{ type: "run_script", script_name: "<npm script>", args: [] }`.

---

## Runner execution (allowlisted)

- **Config**: Set `CLAWDBOT_APPROVED_HANDOFF` to path to approved handoff JSON. Set `CLAWDBOT_EXECUTE_HANDOFF=true` to run; set `CLAWDBOT_DRY_RUN_HANDOFF=true` to only log what would run.
- **Allowlist**: Only script names in [lib/execution/allowlist.ts](lib/execution/allowlist.ts) (`ALLOWED_SCRIPT_NAMES`) are run. Forbidden args (e.g. `--execute`, `--fix`, `--apply`) are blocked.
- **Behavior**: Runner reads handoff; if `approved_by === "human"`, it runs each allowlisted `run_script` action via `npm run <script_name> -- <args>`.

---

## Safety

- Planner and Antigravity never trigger scripts or write DB (audit_logs only).
- ClawDBot remains read-only; it does not execute.
- Execution is only Cursor (human-implemented) or runner (allowlisted scripts, human-approved handoff).
