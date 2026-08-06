import type { AppRoute } from '../../auth/accessPolicy';

/**
 * Whether a stage is in the state a ready project has. Mirrors the backend `RungState`.
 *
 * ⚠️ **Two states, and no `BLOCKED`.** Nothing on the setup surface gates anything, so a state
 * that renders as a padlock has nothing true to say. Keep it out of the enum rather than unused —
 * a value lying around is an invitation to write the gate.
 */
export type RungState = 'OK' | 'WARN';

/** One setup stage's state, as returned by `GET /api/v1/onboarding/setup/status`. */
export interface SetupRung {
    /** Stable key: `skill-map`, `starter-tasks`, `tracks` — plus `corpus`, added client-side. */
    key: string;
    state: RungState;
    /** The positive quantity for this rung (competencies, ingested artifacts, ...). */
    count: number;
    /** One sentence: what is there, or what could not be built and why. */
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
    /** Where the rung's link goes. */
    route: AppRoute;
    /**
     * What that link says — named per rung rather than a shared "Open this stage".
     *
     * The shared wording framed every rung as a step in a pipeline somebody advances. Nothing here
     * is a step any more, so each rung names the thing it is *about* instead.
     */
    openLabel: string;
    /** For rungs whose mined output has a review surface: the `?kind=` that inbox filters by. */
    reviewKind?: string;
}

/** The full four-rung ladder shown on the Setup page, and whether every stage is done. */
export interface SetupLadder {
    rungs: LadderRung[];
    ready: boolean;
}

/**
 * What kind of evidence a track's work can produce. Mirrors the backend enum.
 *
 * `ATTESTATION` is weaker than `PULL_REQUEST` and honestly labelled so: nothing observed it, a
 * named colleague vouched for it. It exists because most roles produce nothing any connected
 * system can see.
 */
export type ContributionEvidenceKind = 'PULL_REQUEST' | 'TRACKED_ISSUE' | 'ATTESTATION';

/**
 * One onboarding track: what onboarding means for a kind of role.
 *
 * An empty `evidenceKinds` is a real answer rather than missing data — nothing that role does can
 * be observed by anything connected today, so their progress cannot be measured yet.
 */
export interface OnboardingTrack {
    key: string;
    label: string;
    contributionNoun: string;
    contributionNounPlural: string;
    contributionVerbPast: string;
    evidenceKinds: ContributionEvidenceKind[];
}

/** A project role as the roles endpoint returns it, carrying the track it points at. */
export interface ProjectRoleWithTrack {
    id: string;
    name: string;
    description: string;
    onboardingTrackKey: string | null;
}
