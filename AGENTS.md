# AGENTS.md — SprintStart Frontend

Shared, committed guide for humans and AI agents working in `sprintstart-frontend`.
Keep it current: if a rule here stops matching reality, fix the rule in the same PR.

> **Related docs**
> - [ARCHITECTURE.md](./ARCHITECTURE.md) — system context (frontend / backend / AI service), boundaries, deployment.
> - `GEMINI.md` — condensed context (local/agent-specific).
> - `frontend-documentation-playbook.local.md` — the full documentation rules (summarized in §6).

---

## 1. Stack & overview

React SPA, feature-first architecture, with Keycloak SSO and a Framer Motion animation layer.

- **React 19**, **React Router v7**, **TypeScript**
- **Tailwind CSS v4** (semantic design tokens, see §7)
- **Framer Motion 12** (centralized spring tokens, `<AnimatePresence>` for exits)
- **Vite 8**, **Keycloakify** (custom Keycloak login theme)
- **Vitest** + **Testing Library** for unit tests (see §5)

---

## 2. Setup & commands

Copy `.env.example` → `.env` and point Keycloak at the right IAM instance before running.

| Purpose | Command |
|---|---|
| Install | `npm install` |
| Dev server (`:5173`) | `npm run dev` |
| Production build | `npm run build` (runs `tsc -b` + `vite build`) |
| Lint | `npm run lint` |
| Unit tests | `npm run test` |
| Storybook | `npm run storybook` |
| Keycloak theme dev / build | `npm run dev-keycloak-theme` / `npm run build-keycloak-theme` |
| Full stack via Docker (`:3000`) | `docker compose up --build` |

**Definition of Done (frontend):** `npm run lint` **and** `npm run build` pass, relevant unit tests pass, and new/changed code is documented per §6.

---

## 3. Frontend structure (`src/`)

Feature-first: domain code lives in `features/<name>/`; only genuinely shared code goes in the top-level folders.

- `features/<name>/` — self-contained domains (`components/`, optional `hooks/`, `types.ts`). E.g. `admin`, `chatbot`, `onboarding`, `knowledge-base`, `data-ingestion`, `team-management`, `faq`, `knowledge-gaps`.
- `components/` — shared UI: `common/` (app-level controls), `layout/` (shell, sidebar, drawers), `ui/` (low-level primitives).
- `pages/` — route-level page views (one per user-facing flow).
- `router/` — React Router v7 config + `AuthGuard`.
- `auth/` — access policy (`AppRoute`, `canAccessRoute`, route→permission map).
- `context/` — global providers/hooks (`AuthProvider`, `ThemeProvider`, `useAuth`, `useTheme`).
- `services/` — backend/API communication (one module per domain).
- `config/` — integration config (e.g. `keycloak.ts`).
- `hooks/`, `types/`, `styles/`, `mocks/` — shared utilities, global types, global CSS/tokens, dev mock data.
- `keycloak-theme/` — Keycloakify overrides (much is generated — do **not** hand-edit `kc.gen.tsx`).

**Rule:** new feature work → a `features/<name>/` slice. Promote to `components/`/`context/` only when it's truly shared.

---

## 4. Coding guidelines & standards

Enforced by ESLint (flat config: `typescript-eslint` recommended **+ type-checked**, `react`, `react-hooks`, `jsx-a11y`, `prettier`). Key rules:

- **`eqeqeq`: error** — always `===` / `!==`.
- **`prefer-const`**, **no unused vars** (prefix intentionally-unused with `_`).
- **`@typescript-eslint/no-explicit-any`: warn** — avoid `any`; type it properly.
- **`consistent-type-imports`** — use `import type { … }` for types (project uses `verbatimModuleSyntax`; keep explicit `.ts`/`.tsx` extensions on relative imports).
- **`no-console`: warn** — only `console.warn` / `console.error` allowed; no stray `console.log`.
- Prettier owns formatting — don't fight it; run lint before finishing.

Conventions:
- Code, identifiers and comments in **English**.
- Keep components focused; extract hooks for non-trivial logic/state.
- Services return typed responses and surface backend failures (don't silently swallow — no empty `catch`).
- **Run `npm run lint` before considering any change done.**

---

## 5. Testing

- **Framework:** Vitest + Testing Library (`@testing-library/react`, `user-event`, `jest-dom`) in a `jsdom` environment.
- **Location:** unit tests live under `tests/unit/**`, mirroring `src/` structure (`services/`, `components/`, `pages/`, `context/`, `router/`, `features/`).
- **Run:** `npm run test` (CI-friendly, non-watch).
- **What to cover:** services (backend contracts, error paths), business/permission logic (`AuthGuard`, access policy), hooks, and key page/component behavior — not trivial markup.
- **E2E hooks:** elements targeted by end-to-end tests must declare a `data-testid`.
- When you change a component that has tests, update its tests in the same PR.

---

## 6. Documentation (the *why*, not the obvious *what*)

Follow the documentation playbook. In short — use **TSDoc** blocks on exported symbols:

- **Pages/views:** responsibility, which user flow, key backend/auth/routing/state dependencies.
- **Reusable components:** when purpose/behavior/constraints aren't obvious from the name.
- **Props:** when reused, domain-meaningful, callbacks, or backend/auth-constrained (skip `id`/`children`/`className` unless special).
- **Service functions:** purpose, important params, non-obvious return, failure behavior — document **every** exported service function.
- **Hooks/effects:** when timing or dependencies matter.
- **Business logic:** permission/role rules, conditional flows, data transforms, backend-contract assumptions, and **temporary limitations / known backend gaps**.

Don't document obvious assignments, trivial state updates, plain JSX, or restate names. Keep comments current — update/remove them when behavior changes.

---

## 7. Design system: colors & color-blind accessibility

Colors are **semantic CSS tokens**, exposed as Tailwind `app-*` classes (defined in [src/styles/index.css](./src/styles/index.css)).

- **Never hardcode hex values or raw Tailwind palette colors** (`text-blue-500`, `#2563eb`, …). Use the semantic tokens: `bg-app-bg`, `bg-app-surface`, `text-app-text` / `text-app-text-muted`, `border-app-border`, `bg-app-brand`, and the status roles `success` / `warning` / `danger` / `neutral` (e.g. `bg-app-success-bg text-app-success-text`).
- **Light/Dark:** controlled via the `.dark` class (`@custom-variant dark`), managed by `ThemeProvider`. Every color must work in both themes — use tokens, not fixed colors.
- **Color-blind safety:** never rely on color **alone** to convey meaning. Always pair color with an **icon, text label, or shape** (e.g. status shown as chip text + icon, not just red/green). This is why finished/skipped/locked steps use distinct icons *and* labels.
- **Contrast:** target **WCAG 2.1 AA** contrast for text and interactive elements.
- **Focus:** keep visible focus using the `--app-focus` token (`focus-visible:ring-app-focus`); don't remove focus outlines.

---

## 8. Responsive design

- **Mobile-first**, using Tailwind breakpoints (`sm:`, `md:`, `lg:`). Design for small screens, then layer up.
- The app shell adapts at `lg`: sticky sidebar on desktop, slide-out drawer + top bar on smaller screens (see `components/layout/SideBar.tsx`). Global token adjustments happen at `@media (max-width: 1024px)`.
- Use fluid layouts (fl`ex`/`grid`, `max-w-*`, `min-w-0` to allow truncation) rather than fixed pixel widths.
- **Test at mobile / tablet / desktop** before finishing UI work; check that dialogs, drawers, and tables don't overflow.

---

## 9. Accessibility (WCAG 2.1 AA)

- Icon-only buttons need an `aria-label`.
- Keep semantic HTML and label form fields; respect the `jsx-a11y` lint rules (don't disable them casually).
- Keyboard-navigable interactive elements with visible focus (see §7).

---

## 10. Auth & routing (brief)

- **Keycloak** (`keycloak-js`) for IAM; dev requires a Keycloak user with a role (`USER`/`ADMIN`) and redirect-based login.
- Route access is centralized in `auth/accessPolicy.ts` (`AppRoute` union + `canAccessRoute`) and enforced by `router/AuthGuard.tsx`. **New protected routes must be added to `AppRoute` + the permission map**, or they won't type-check / won't be access-controlled.

---

## 11. Animation (brief)

- Use the **centralized spring transition tokens** (uniform velocity/stiffness) — don't inline ad-hoc spring configs.
- Wrap dynamically added/removed elements (lists, drawers) in `<AnimatePresence>` to avoid clipping on exit.

---

## 12. Git & repo boundaries

- Separate repos: `sprintstart-frontend`, `sprintstart-backend`, `sprintstart-ai`, `sprintstart-k8s`. Don't assume a shared monorepo checkout.
- Feature work branches off `dev`; PRs target `dev`.
- Agent instruction files: `AGENTS.md` (this file) is **shared/committed**; `GEMINI.md`, `CLAUDE.md`, and `*.local.md` are gitignored (per-developer).
