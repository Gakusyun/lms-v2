# AGENTS.md — lms-v2

## Project Status

**Rewrite complete.** v2 is a fully functional Vue 3 + Tailwind CSS v4 rewrite of lms-v1 with all pages migrated.

`lms-v1-old/` is the prior version for reference only. Do not import from it.

## Stack

- **Vue 3** `<script setup>` SFCs with TypeScript
- **Vite 8** — dev server and build
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (NOT PostCSS — no `tailwind.config` file needed, no `@tailwind` directives)
- **pnpm** — package manager (lockfile is `pnpm-lock.yaml`)

## Commands

```bash
pnpm dev          # dev server
pnpm build        # vue-tsc -b && vite build  (typecheck is part of build)
pnpm preview      # preview production build
```

No test runner, linter, or formatter is configured yet.

## Build Order

`vue-tsc -b` runs before `vite build`. Type errors block the build — do not suppress them with `as any` or `@ts-ignore`.

## TypeScript Constraints

`tsconfig.app.json` enables `erasableSyntaxOnly: true`. This means:
- **No `enum`** — use `const` objects or union types instead
- **No `namespace`** — use ES modules
- **No constructor parameter properties** (`constructor(public x: number)`)

Strict unused checks are on: `noUnusedLocals` and `noUnusedParameters`.

## Tailwind v4 Notes

Tailwind v4 uses the `@tailwindcss/vite` plugin directly — there is no `tailwind.config.js`, no `postcss.config.js`, and no `@tailwind base/components/utilities` directives. Configuration is done via CSS `@theme` blocks if needed. Do not scaffold legacy Tailwind config files.

## Path Aliases

No `@` alias is configured (unlike v1). Use relative imports. If an alias is added later, it must go in both `vite.config.ts` and `tsconfig.app.json`.

## API / Backend

v2 proxies `/api` to `http://localhost:8000/api/v1` via Vite dev server. Env vars in `.env` (dev) and `.env.production` (prod → `https://lms.gxj62.cn/api/v1`).

## Architecture

| Layer | Files |
|-------|-------|
| Router + guards | `src/router/index.ts` |
| API modules | `src/api/auth.ts`, `students.ts`, `leaves.ts`, `reviewers.ts`, `statistics.ts`, `notifications.ts`, `common.ts` |
| Pinia stores | `src/stores/auth.ts`, `notification.ts` |
| Types | `src/types/index.ts` |
| Utils | `src/utils/http.ts`, `auth.ts`, `formatters.ts`, `excelExporter.ts` |
| Layout | `src/layouts/AppLayout.vue` (sidebar navigation) |
| Components | `src/components/Modal.vue`, `DataTable.vue`, `PaginationBar.vue`, `StatsCard.vue`, `Toast.vue` |
| Composables | `src/composables/useToast.ts` |

## Views (15 pages)

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/setup` | InitialSetupView | DB config + admin creation (first run) |
| `/login` | LoginView | Password + QR code login |
| `/` | HomePage | Dashboard with role-based feature cards |
| `/students` | StudentsList | Paged student list, import, password change |
| `/teachers` | TeachersList | Paged teacher list, import, password change |
| `/reviewers` | ReviewersList | Paged reviewer list, import, password change |
| `/courses` | CoursesList | Paged course list, import, view students |
| `/courses/:id/students` | CourseStudentsView | Students enrolled in a course |
| `/schools` | SchoolsList | Department list, create, import |
| `/leaves` | LeavesList | Core business: edit/audit/cancel/close-off/guarantee/QR |
| `/audit-logs` | AuditLogsList | Filtered audit log with Excel export |
| `/statistics` | StatisticsView | Chart.js charts: pie, line, bar |
| `/notifications` | NotificationsView | Notification list with read/unread filters |
| `/verify-qr` | VerifyQRView | Camera + manual QR verification (public) |
| `/profile` | ProfileView | User info, name edit, password change, device auth |

## Behavioral Guidelines

### Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so.

### Simplicity First
- No features beyond what was asked. No speculative abstractions.
- If you write 200 lines and it could be 50, rewrite it.

### Surgical Changes
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Every changed line should trace directly to the user's request.

### Goal-Driven Execution
- Define success criteria before implementing.
- For multi-step tasks, state a plan with verification checkpoints.
