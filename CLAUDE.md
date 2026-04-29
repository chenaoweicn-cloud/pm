# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

**P3 (Query layer) complete; backend not yet started.** The Things-style UI is fully wired to TanStack Query hooks and `src/lib/api.ts`. So:

- ✅ Vite + React 18 + TS frontend under `src/`, runs with `pnpm dev`, types pass with `pnpm build`.
- ✅ The full Things 风格 design (4 views + ⌘K search) is implemented.
- ✅ TanStack Query v5 installed; all views use Query hooks. `src/lib/mockData.ts` is deleted.
- ✅ `src/lib/api.ts` — 42 Tauri IPC wrappers ready; `src/lib/types.ts` aligned with spec §6.1.
- ✅ `src/lib/queryClient.ts` — `QueryClient` configured (staleTime 5 s, no window-focus refetch).
- ❌ No `src-tauri/`, no Rust, no SQLite. `api.ts` calls `invoke` but there is no Tauri process — the app currently renders empty/loading states (no data) until the backend lands.
- ❌ Tailwind / shadcn / React Router are not installed — inline styles via tokens, AppShell-based routing.

When the backend lands, `src/lib/api.ts` is the only file that needs updating — it already has all 42 command wrappers with correct types. Views and hooks are backend-ready.

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
│   ├── api.ts                     # 42 Tauri invoke wrappers — sole file that calls invoke
│   ├── queryClient.ts             # shared QueryClient instance
│   └── date.ts                    # todayIso(), formatDate, relDate, thisWeekRange, thisMonthRange
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
- **Components consume typed data from `lib/types.ts`.** Never widen to `any`.
- **`AppShell` owns view + projectId state and the ⌘K listener.** Features don't manage their own routing.
- **Use `todayIso()` (function) for date comparisons, not the `TODAY` export.** `todayIso()` calls `new Date()` on every invocation so it stays correct across midnight. `TODAY` was removed from all components.
- **No CSS frameworks installed.** Inline `style` props with token objects are the convention. Do not introduce Tailwind unless the user asks — it would force a rewrite of every component.

## Tech stack

**Active:** Vite 5 · React 18 · TypeScript 5 (strict) · pnpm 10 (via corepack).

**Also installed:** TanStack Query v5 · Vitest.

**Planned (not yet installed):** Tauri 2 · Rust · `rusqlite` · React Router · date-fns · `tauri-plugin-notification` · `tauri-plugin-dialog`.

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
