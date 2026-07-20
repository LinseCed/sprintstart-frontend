import type { CompetencyKind } from '../skill-assessment/types';

export type CompetencySource = 'ASSESSED' | 'VERIFIED' | 'DECLARED';

export type CompetencySourceCounts = {
    assessed: number;
    verified: number;
    declared: number;
};

/**
 * Team-wide ledger signal for one live competency, as returned by
 * `GET /api/v1/onboarding/dashboard/competencies`.
 */
export type CompetencyAggregate = {
    competencyKey: string;
    label: string;
    kind: CompetencyKind;
    usersEngaged: number;
    /** Level (1..4) to count of engaged users at that level. */
    levelCounts: Record<number, number>;
    sourceCounts: CompetencySourceCounts;
};

export type UserCompetencyState = {
    competencyKey: string;
    label: string;
    level: number;
    source: CompetencySource;
    updatedAt: string;
};

/**
 * One user's full competency ledger, as returned by
 * `GET /api/v1/onboarding/dashboard/users`.
 */
export type UserCompetencySummary = {
    userId: string;
    firstname: string;
    lastname: string;
    profileIcon: string | null;
    /** Echoed because the endpoint already filters by `roleIds` -- a client that can narrow by
     *  role should be able to say which role somebody holds. */
    roles: { id: string; name: string }[];
    projects: { id: string; name: string }[];
    competencies: UserCompetencyState[];
};

/**
 * Spring Data's raw `Page<T>` JSON shape -- this endpoint returns `Page<T>`
 * directly rather than a custom envelope (unlike `data-ingestion`'s
 * `{items, page}` wrapper), so this mirrors Spring's actual serialization.
 */
export type PagedResponse<T> = {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
};
