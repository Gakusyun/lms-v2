# AGENTS.md — lms-v2

## Project Status

Early-stage greenfield rewrite. `src/` contains only the Vite scaffold (HelloWorld). The real application architecture is being built out.

`lms-v1-old/` is the prior version for reference — it has vue-router, axios, echarts, and 17 view pages for an LMS (schools, courses, students, teachers, leaves, audits, etc.). Do not import from it; use it only as a reference for business logic and data models.

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

v1 proxied `/api` to `http://localhost:8000`. v2 has no proxy configured yet. When adding API integration, configure the Vite proxy in `vite.config.ts` and use `VITE_`-prefixed env variables for backend URLs.

## What v1 Had (migration reference)

| Feature | v1 Location |
|---------|------------|
| Router | `lms-v1-old/src/router/index.ts` |
| API client (axios) | `lms-v1-old/src/api/index.ts` |
| Composables | `lms-v1-old/src/composables/useApiData.ts`, `usePagedData.ts`, `useNavigation.ts` |
| Views (17 pages) | `lms-v1-old/src/views/` |
| Global styles | `lms-v1-old/src/styles/global.css` |
| Prod env | `lms-v1-old/.env.production` → `VITE_API_BASE_URL=https://lms.gxj62.cn/api/v1` |

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
