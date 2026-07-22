/**
 * The first week: get it running → here is your first task → here is who to ask.
 *
 * Task 0 is available from day one — there is no environment-readiness gate.
 * Getting the project running is part of the first task, and the real unblock when
 * it fights you is a person, so the buddy half reuses `features/human-loop` (the
 * same person the whole product points a stuck hire at).
 */

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
 * A hire's Task 0 on one project (`GET /me/task-zero`). Available from day one;
 * every combination is a real state, none an error:
 * - `task` → the auto-assigned first task;
 * - `noneAvailable` with no task → no PM has flagged a Task 0 yet.
 */
export type MyTaskZero = {
    task: TaskZeroTask | null;
    assignedAt: string | null;
    noneAvailable: boolean;
    /** Derived — true once the hire has merged any pull request. Credits nothing in the ledger. */
    loopProven: boolean;
};
