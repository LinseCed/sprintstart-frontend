/**
 * The human loop: the person a hire can ask, and — for whoever runs a project —
 * who has been left waiting. Mirrors the backend's buddy + onboarding-metrics
 * contracts (`sprintstart-backend` onboarding module, slice 1).
 *
 * The AI buddy is a separate thing (`features/buddy`): a 2am corpus answerer and
 * a drafting aid, deliberately subordinate to a real person here.
 */

/** The person a hire can ask, as the hire sees it (`GET /me/buddy`). */
export type MyBuddy = {
    buddyId: string;
    buddyName: string;
    /**
     * The buddy's GitHub handle, when they have declared one — the one concrete
     * reach handle the product knows. Null → point the hire at their usual channel.
     */
    buddyGithubLogin: string | null;
    projectId: string;
    assignedAt: string;
    cadenceTargetDays: number;
    lastContactAt: string | null;
    /** Days since the last contact, or since assignment when there has never been one. */
    daysSinceContact: number;
    /** True once that gap has passed the target — a nudge to the pair, not a reprimand. */
    overdue: boolean;
};

/** Body for logging a conversation (`POST /me/buddy/contacts`). */
export type LogBuddyContactRequest = {
    /** Only set when a buddy/PM logs on a hire's behalf; a hire logging their own omits it. */
    hireId?: string;
    /** Record a past conversation; never a future one. Defaults to now. */
    occurredAt?: string;
    /** For the pair. Nothing reads it. */
    note?: string;
};

/**
 * A hire's own onboarding timeline (`GET /metrics/me`) — the self-serve slice of
 * the PM metrics. Only the fields the hire surface actually renders are typed here.
 */
export type MyTimeline = {
    userId: string;
    displayName: string;
    githubLogin: string | null;
    firstPullRequestOpenedAt: string | null;
    firstResponseAt: string | null;
    firstPullRequestMergedAt: string | null;
    mergedPullRequestCount: number;
    openPullRequestCount: number;
    /**
     * How long their longest open pull request has been waiting on anyone, in
     * hours — the number that tells a stuck newcomer the delay is not their fault.
     * Null when nothing is waiting.
     */
    longestOpenWaitHours: number | null;
    stalled: boolean;
    stalledReason: string | null;
};

/** One hire + their buddy, as whoever runs the project sees it (`GET /projects/{id}/buddies`). */
export type BuddyAssignment = {
    hireId: string;
    hireName: string;
    buddyId: string;
    buddyName: string;
    assignedAt: string;
    cadenceTargetDays: number;
    lastContactAt: string | null;
    contactCount: number;
};

/** Body for assigning a buddy (`POST /projects/{id}/buddies`). */
export type AssignBuddyRequest = {
    hireId: string;
    buddyId: string;
    /** How often the pair is expected to speak. Omitted → backend default. */
    cadenceTargetDays?: number;
};

/**
 * Why one person needs a human today, and who should act.
 *
 * `ownedByBuddy` separates "somebody owes this hire a reply" from "this hire is
 * drifting" — those go to different people, and reporting both as *the hire is
 * behind* points attention at the one person who cannot fix it.
 */
export type AttentionItem = {
    hireId: string;
    hireName: string;
    reason: string;
    severity: AttentionSeverity;
    ownedByBuddy: boolean;
    buddyId: string | null;
    buddyName: string | null;
    /** How long this has been true, in days — what makes it urgent or not. */
    days: number;
};

export type AttentionSeverity = 'BLOCKED' | 'DRIFTING';

/** A project's human loop in one read (`GET /projects/{id}/attention`). */
export type ProjectAttention = {
    projectId: string;
    memberCount: number;
    withBuddyCount: number;
    /** Contacts logged across the project in the last 30 days — is the loop running? */
    recentContactCount: number;
    items: AttentionItem[];
};
