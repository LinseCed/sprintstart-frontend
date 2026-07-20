import type { StarterWorkTask } from '../starter-work/types';

/**
 * The ramp of real tasks, and the end of onboarding.
 *
 * Mirrors the backend's `GET /me/ramp` (backend#75). There is deliberately **no completion
 * percentage** in this contract, and none should be derived from it on the client: the ramp is
 * real work, and a percentage of real work is a number nobody can act on.
 */
export type RampStage = 'TASK_ZERO' | 'TASK_ONE' | 'TASK_TWO_PLUS' | 'AUTONOMOUS';

/**
 * Whether a hire has been shown to work here unsupervised.
 *
 * `blockers` is the honest half: "not autonomous yet" without a reason is a grade, with one it is
 * a next step. Empty once `reached` is true.
 */
export type Autonomy = {
    reached: boolean;
    /** When it happened — the qualifying merge, not when the system noticed. */
    reachedAt: string | null;
    provenByArtifactId: string | null;
    blockers: string[];
};

export type MyRamp = {
    stage: RampStage;
    currentTask: StarterWorkTask | null;
    /** One line saying what moved the hire here. Never a score. */
    unlockedBy: string;
    /** Pull requests merged on this project. The ramp's only real counter. */
    mergedCount: number;
    /** Competencies credited by merged work — not by chat placement. */
    creditedCompetencyKeys: string[];
    autonomy: Autonomy;
};
