# End-to-end journeys

Every user-facing journey of SprintStart, across all three repositories, and the end-to-end
test that covers it (AI_RULES.md R19). A PR in any repository that adds or changes a journey
updates its row here and links it from the PR.

**Status:** J01, J05 and J09 run automatically on every PR (`.github/workflows/e2e.yml`). The others
are still checked by hand, mainly along the final demo script; until a journey has a spec, every PR
that touches it describes the manual check it actually performed.

**How it runs:** Playwright (`e2e/journeys/`, one file per journey id) against a real stack — Keycloak,
backend and PostgreSQL from the images published on `dev`, defined by sprintstart-backend's
`docker-compose.yaml` plus `e2e/compose.e2e.yaml` — and the production build of this repository. The
AI service is replaced by `e2e/ai-stub`, which answers with contract-shaped events
(`contracts/`), so runs are deterministic and need no model. `e2e/seed.ts` creates the accounts
(`e2e.hire`, `e2e.pm`, `e2e.admin`) and an `E2E Project` with the hire as member and the PM as manager.

```bash
BACKEND_DIR=../sprintstart-backend npm run e2e:stack   # start the stack (Docker)
npm run e2e                                            # run the journeys
npm run e2e:stack:down                                 # delete the stack
```

The stack keeps its data between runs, so a journey must not depend on an empty database: use a
unique text per run where it matters (see J05).

| Id  | Journey                                                                   | Role      | Routes                                         | Repos involved        | Automated spec             | Notes                                                                           |
| --- | ------------------------------------------------------------------------- | --------- | ---------------------------------------------- | --------------------- | -------------------------- | ------------------------------------------------------------------------------- |
| J01 | Sign in through Keycloak and land on the role's home page                 | all       | `/`                                            | frontend, backend     | `j01-sign-in.spec.ts`      | Hire, PM, signed-out visitor.                                                   |
| J02 | Add a source document; the ingestion run completes and becomes searchable | PM        | `/data-ingestion`                              | frontend, backend, ai | none                       | "Completed" precedes "searchable"; the spec must wait for the AI sync status.   |
| J03 | Open the generated onboarding path and a step that links into the repo    | hire      | `/onboarding`                                  | frontend, backend, ai | none                       | Needs a working GitHub connection.                                              |
| J04 | See the board with the starter task marked as the first task              | hire      | `/board`, `/starter-work`                      | frontend, backend, ai | none                       |                                                                                 |
| J05 | Ask the buddy a question and open the cited source                        | hire      | `/buddy`, `/chat`                              | frontend, backend, ai | `j05-buddy-answer.spec.ts` | Greeting, answer, kept after reload. Citation not yet: needs a seeded artifact. |
| J06 | Confirm an action the buddy proposes (claim a task, tick a step)          | hire      | `/buddy`                                       | frontend, backend, ai | none                       | The action runs only after confirmation.                                        |
| J07 | Escalate an unanswered question to the PM; the PM answers it              | hire, PM  | `/buddy`, `/insights/knowledge-requests`       | frontend, backend, ai | none                       | Final demo segment 5.                                                           |
| J08 | A second hire receives the PM's answer to the same question               | hire      | `/buddy`                                       | frontend, backend, ai | none                       | Final demo segment 6 ("reuse").                                                 |
| J09 | Talk to the buddy in team mode about a managed project                    | PM        | `/buddy`, `/pm-dashboard`                      | frontend, backend, ai | `j09-team-mode.spec.ts`    | Includes the 403 for a user who does not manage the project.                    |
| J10 | Set up a new hire from a blueprint                                        | PM, HR    | `/hire-setup`, `/blueprints`, `/arrival-steps` | frontend, backend     | none                       |                                                                                 |
| J11 | Create a project with the admin wizard                                    | admin, HR | `/admin`                                       | frontend, backend     | none                       |                                                                                 |
| J12 | Read FAQ, knowledge gaps and onboarding insights                          | PM, HR    | `/insights/*`                                  | frontend, backend, ai | none                       |                                                                                 |
| J13 | Manage team members and roles                                             | PM, HR    | `/team-management`                             | frontend, backend     | none                       |                                                                                 |
| J14 | Edit profile and settings                                                 | all       | `/profile`, `/settings`                        | frontend, backend     | none                       |                                                                                 |

When you automate a journey, replace "none" with the spec file name.
