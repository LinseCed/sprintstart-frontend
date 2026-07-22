import type { AppRoute } from '../../auth/accessPolicy';

/** Mirrors the backend `RungState`. No state gates onboarding — this is a nudge, not a lock. */
export type RungState = 'OK' | 'WARN' | 'BLOCKED';

/** One setup stage's state, as returned by `GET /api/v1/onboarding/setup/status`. */
export interface SetupRung {
    /** Stable key: `skill-map`, `baseline`, `starter-tasks` — plus `corpus`, added client-side. */
    key: string;
    state: RungState;
    /** The positive quantity for this rung (approved competencies, ingested artifacts, ...). */
    count: number;
    /** One actionable sentence: what is missing, or what is waiting on the PM. */
    detail: string;
}

/** The backend's three onboarding-owned rungs. The corpus rung is composed onto the top client-side. */
export interface SetupReadiness {
    projectId: string;
    rungs: SetupRung[];
    ready: boolean;
}

/** A rung plus the static display metadata that names the stage and where to open it. */
export interface LadderRung extends SetupRung {
    /** Human title for the stage, e.g. "Skill map approved". */
    title: string;
    /** A stable one-liner describing what this stage is for, independent of its current state. */
    blurb: string;
    /** Where "open this stage" navigates. */
    route: AppRoute;
    /** For rungs backed by a proposal queue: the `?kind=` the review inbox filters by. */
    reviewKind?: string;
}

/** The full four-rung ladder shown on the Setup page, and whether every stage is done. */
export interface SetupLadder {
    rungs: LadderRung[];
    ready: boolean;
}
