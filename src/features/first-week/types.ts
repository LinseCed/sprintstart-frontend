/**
 * The first week: can you run it → here is your first task → here is who to ask.
 *
 * Mirrors the backend's environment-readiness (#71) and Task 0 (#72) contracts.
 * The buddy half reuses `features/human-loop` (the same person the whole product
 * points a stuck hire at).
 */

/** What settled environment readiness. `PULL_REQUEST` is derived, never self-declared. */
export type EnvironmentEvidence = 'BUILD_TEST_RUN' | 'GREEN_CI' | 'PULL_REQUEST';

/** A hire's environment readiness on one project (`GET /me/environment`). */
export type MyEnvironment = {
    ready: boolean;
    /** When readiness was achieved; null while not ready. */
    readyAt: string | null;
    evidence: EnvironmentEvidence | null;
    evidenceDetail: string | null;
    /** True when readiness was inferred from ingested work rather than actively reported. */
    derived: boolean;
};

/** One approved starter-work task, as the hire sees their assigned Task 0. */
export type TaskZeroTask = {
    id: string;
    sourceId: string;
    title: string;
    summary: string | null;
    rationale: string | null;
    sourceUrl: string | null;
    competencyKeys: string[];
    status: string;
    taskZeroEligible: boolean;
};

/**
 * A hire's Task 0 on one project (`GET /me/task-zero`). Every combination is a
 * real state, none an error:
 * - not `ready` → the environment isn't up yet, so there is no first task;
 * - `ready` + `task` → the auto-assigned first task;
 * - `ready` + `noneAvailable` → the environment is up but no PM has flagged one yet.
 */
export type MyTaskZero = {
    ready: boolean;
    task: TaskZeroTask | null;
    assignedAt: string | null;
    noneAvailable: boolean;
    /** Derived — true once the hire has merged any pull request. Credits nothing in the ledger. */
    loopProven: boolean;
};
