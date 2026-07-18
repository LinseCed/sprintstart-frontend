import type { StepStatus } from '../onboarding/types';

export type VerificationType = 'KNOWLEDGE' | 'EXACT' | 'ATTEST';

/**
 * A step's verification config, as returned by
 * `GET /me/steps/{stepId}/verification`. Never carries the rubric or
 * canonical answer -- grading happens server-side.
 */
export type VerificationEndpoint = {
    id: string;
    stepId: string;
    type: VerificationType;
    prompt: string;
    competencyKey: string;
    level: string;
};

/**
 * The graded result of one submitted attempt, as returned by
 * `POST /me/steps/{stepId}/verification/attempts`.
 */
export type VerificationAttemptResult = {
    attemptId: string;
    stepId: string;
    passed: boolean;
    score: number;
    feedback: string;

    /** Escalating hint for the next attempt; null once passed. */
    hint: string | null;
    attemptNo: number;
    graphVersion: number;
    stepStatus: StepStatus;
};
