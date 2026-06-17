# SprintStart Frontend: Agent Instructions

This directory contains the React 18 / TypeScript frontend for the SprintStart platform.

---

## 1. Local Architectural Patterns

### Feature-First Architecture
The codebase is organized by feature rather than layer. Each major feature (e.g., `chatbot`, `knowledge-base`) is encapsulated in `src/features/<feature-name>`.
- **`components/`**: Feature-specific UI components.
- **`types.ts`**: Feature-specific interfaces and enums.
- **`hooks/`**: Feature-specific logic.

### State Management
- **Local State**: Use `useState` and `useReducer` within components/features.
- **Auth State**: Managed via `AuthContext` in `src/context/AuthContext.tsx`.
- **API Cache**: Simple `sessionStorage` or local variable caching is used in services to minimize redundant fetches.

---

## 2. Coding Standards (Frontend-Specific)

### Type Safety
- **Strict Mode**: Enforce strict TypeScript settings.
- **No `any`**: Use explicit interfaces or `unknown` with type guards.
- **Module Syntax**: Use `verbatimModuleSyntax`. Never use `.ts` or `.tsx` extensions in imports.

### UI & Styling
- **Tailwind CSS v4**: Use utility classes for styling. Avoid custom CSS unless absolutely necessary.
- **Framer Motion**: Use for all transitions and animations to ensure a "polished" feel.
- **Lucide React**: Primary icon library.

---

## 3. Testing Mandates

### Unit Testing (Vitest)
- Test all hooks (`src/hooks`) and complex logic in features.
- Mock external services and contexts (like `useAuth`) to maintain isolation.

### E2E & A11y (Playwright)
- **Flows**: Verify critical user paths (Role Selection -> Dashboard -> Knowledge Base).
- **Accessibility**: Every page must pass a WCAG AA audit. Use `@axe-core/playwright`.
- **Mock Bypass**: Use the `test-user-id` and `chat-`/`mock-doc-` prefix logic to bypass backend dependencies during CI.

---

## 4. Current Implementation Notes (CRITICAL)

### Knowledge Base "Foolproof" Status
- The backend currently lacks a document status field.
- **Mandate**: All documents fetched or uploaded must be immediately set to `DocumentStatus.COMPLETED` in the frontend state.
- **No Polling**: Do NOT implement polling for document status until the backend provides a callback/status field.

### Chat UUIDs
- The backend requires valid UUIDs for `chatId`.
- **Mandate**: When fetching messages or streaming for IDs prefixed with `chat-` (mock IDs), bypass the backend call and return empty/mock data to prevent 400 errors.

---

## 5. Useful Commands
- `npm run dev`: Start development server.
- `npm run build`: Type-check and build for production.
- `npm run lint`: Run ESLint.
- `npm run tests`: Run all test suites (Unit, E2E, A11y).
