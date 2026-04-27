# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

**Frontend prototype shipped, backend not yet started.** The user took the deviation path off the original v1 plan: instead of running P1–P4 (Tauri + Rust + DB + placeholder UI) and then doing the design last, they built the **Things-style UI first against mock data**. So:

- ✅ Vite + React 18 + TS frontend exists under `src/`, runs with `pnpm dev`, types pass with `pnpm build`.
- ✅ The full Things 风格 design (4 views + ⌘K search) is implemented from the design bundle at `https://api.anthropic.com/v1/design/h/znLI5njQuSAFrPPs_BCDPg`.
- ❌ No `src-tauri/`, no Rust, no SQLite. Data is mocked from `src/lib/mockData.ts`.
- ❌ Tailwind / shadcn / TanStack Query / React Router are **not** installed — the design uses inline styles driven by tokens, and the prototype is single-state.

When the backend lands later, the swap target is `src/lib/mockData.ts` → `src/lib/api.ts` (Tauri invoke wrapper from plan task 24). The view components were written to consume typed `Project`/`Task` data, so they shouldn't need rewrites — only the data source.

## Authoritative documents

- `docs/spec.md` — V1 functional spec (locked 2026-04-23). Data model, schema, scope. **Source of truth for the data layer.**
- `docs/plans/v1/` — 38 numbered tasks. Still the plan of record for backend (P1–P3) and the eventual UI swap (P5). The current frontend covers what would have been P4 placeholders + P5, just earlier and with the real design.
- `.impeccable.md` — design context (calm / editorial / capable). Now realized as the Things 风格 token set.

## Frontend architecture

```
src/
├── main.tsx, App.tsx, index.css   # entrypoint
├── design/
│   └── tokens.ts                  # STYLE_THINGS — colors, sizes, spacing as a typed object
├── lib/
│   ├── types.ts                   # Project, Task, TaskGroup etc. — aligned with spec §6.1 schema
│   ├── mockData.ts                # PROJECTS, TASKS, TASK_GROUPS + helpers (todayTasks, projectById…)
│   └── date.ts                    # TODAY (frozen), formatDate, relDate
├── components/
│   ├── ui/                        # primitives — Stat, Checkbox, Row, GroupCard
│   └── layout/                    # AppShell (view router + ⌘K), Sidebar, Toolbar
└── features/
    ├── today/TodayView.tsx
    ├── tasks/CrossView.tsx        # cross-project flat list, sorted by due
    ├── history/HistoryView.tsx
    ├── projects/                  # ProjectDetail + List/Board/Timeline panels
    └── search/GlobalSearch.tsx    # ⌘K overlay
```

### Load-bearing rules for the frontend

- **All visual styling reads from `src/design/tokens.ts` (`S` export).** Do not hardcode colors, paddings, or radii in components — extend the tokens module instead. This keeps the door open for a Sequoia/Linear/dark variant.
- **Components consume typed data from `lib/types.ts`.** Never widen to `any`. Mock data conforms to the same types so the eventual API swap is type-safe.
- **`AppShell` owns view + projectId state and the ⌘K listener.** Features don't manage their own routing.
- **`TODAY` is frozen at `2026-04-23`.** This is intentional — the mock dataset references that date so the UI renders deterministically. When real data arrives, replace `TODAY` with `new Date().toISOString().slice(0, 10)`.
- **No CSS frameworks installed.** Inline `style` props with token objects are the convention. Do not introduce Tailwind unless the user asks — it would force a rewrite of every component.

## Tech stack

**Active:** Vite 5 · React 18 · TypeScript 5 (strict) · pnpm 10 (via corepack).

**Planned (not yet installed):** Tauri 2 · Rust · `rusqlite` · TanStack Query · React Router · date-fns · Vitest · `tauri-plugin-notification` · `tauri-plugin-dialog`.

## Commands

- `pnpm dev` — Vite dev server at http://localhost:5173
- `pnpm build` — `tsc -b` (strict typecheck) + Vite production build
- `pnpm typecheck` — types only, no bundle
- `pnpm preview` — preview the production bundle

When backend lands: `pnpm tauri dev`, `pnpm tauri build`, `cd src-tauri && cargo test`.

## Backend architecture (still target — not built)

```
React → TanStack Query → src/lib/api.ts (invoke) → Tauri IPC
  → src-tauri/src/commands/* → src-tauri/src/db/* (rusqlite::Connection)
  → SQLite at ~/Library/Application Support/pm/pm.db
```

Load-bearing rules when this lands:

- **`src/lib/api.ts` is the only file that calls `invoke`.** See `docs/plans/v1/24-api-contract.md` for the signature list.
- **`commands/*.rs` validates and forwards; `db/*.rs` owns SQL.** Don't put SQL in command handlers.
- **No ORM** — raw `rusqlite` is a deliberate decision (D5).
- **Rust `models.rs` ↔ TS `lib/types.ts` must stay aligned** — the wire format on both sides.

## Spec invariants to respect when wiring the backend

- **Soft delete** via `deleted_at TEXT` on `projects` and `tasks`. All main queries filter `WHERE deleted_at IS NULL`. Trash is the inverse query.
- **Archive ≠ delete.** `projects.status='archived'` + `archived_at`; reversible.
- **Subtasks: one level only.** A task with `parent_task_id` set must itself have `parent_task_id IS NULL`.
- **`tasks.completed_at` is auto-managed** — set when status flips to `done`, cleared when it flips back. Source of truth for HistoryView.
- **Dates as TEXT in ISO 8601** (`YYYY-MM-DD`).
- **No `activity_log` in V1.**

## Runtime paths (when Tauri lands)

- DB: `~/Library/Application Support/pm/pm.db`
- Backups: `~/Documents/pm-backups/` (rolling 30, named `pm-YYYYMMDD-HHMMSS.db`)

## What's intentionally NOT in V1

Defer to V2: inbox / templates / recurring tasks, batch operations, drag-to-reorder, custom saved views, activity log, daily morning push, dashboards, decisions/risks/blockers tracking. Data **import** and time tracking are permanently out of scope (§9.3).

## Notes on the v1 plan

`docs/plans/v1/README.md` describes the original P1–P4 sequence; the current state skipped to the UI. When picking up backend work, the plan's task ordering is still good — just adjust the file paths in tasks 23, 24, and 29+ to merge into the existing `src/` layout instead of creating fresh.
