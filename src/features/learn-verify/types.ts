export type VerificationType = 'KNOWLEDGE' | 'EXACT' | 'ATTEST' | 'ARTIFACT';

/**
 * A module's graded check, as returned by
 * `GET /me/modules/{moduleId}/verification`. Never carries the rubric or
 * canonical answer -- grading happens server-side.
 */
export type VerificationEndpoint = {
    id: string;
    moduleId: string;
    type: VerificationType;
    prompt: string;
    competencyKey: string;
    level: string;
};

/**
 * The graded result of one submitted attempt, as returned by
 * `POST /me/modules/{moduleId}/verification/attempts`.
 *
 * There is no per-user status to report back: the module is shared, so passing
 * writes the competency ledger and the node's state is derived from there.
 */
export type VerificationAttemptResult = {
    attemptId: string;
    moduleId: string;
    passed: boolean;
    score: number;
    feedback: string;

    /** Escalating hint for the next attempt; null once passed. */
    hint: string | null;
    attemptNo: number;
    graphVersion: number;
};
