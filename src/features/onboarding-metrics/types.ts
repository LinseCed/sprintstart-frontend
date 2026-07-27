/**
 * The numbers the whole onboarding redesign is judged on, as the backend derives
 * them (`sprintstart-backend` onboarding-metrics, slice 0). Every timestamp and
 * gap is nullable: "hasn't happened yet" is the normal state of a hire mid-ramp
 * and is a different thing from zero.
 *
 * Deliberately no completion percentages or module counts — those are the metrics
 * the redesign rejects.
 */

/** One hire's onboarding as a sequence of moments and the gaps between them. */
export type HireTimeline = {
    userId: string;
    displayName: string;
    /** Null when no GitHub login is declared, so none of their work can be attributed. */
    githubLogin: string | null;
    /** Null for assignments made before joining was recorded — "clock unknown", not "joined now". */
    joinedAt: string | null;
    firstTaskClaimedAt: string | null;
    firstPullRequestOpenedAt: string | null;
    firstResponseAt: string | null;
    firstPullRequestMergedAt: string | null;
    /** Joined → first merged pull request, in hours. The north star, per hire. */
    hoursToFirstMergedPullRequest: number | null;
    /** Opened → first response on their first pull request, in hours. */
    hoursToFirstResponse: number | null;
    mergedPullRequestCount: number;
    openPullRequestCount: number;
    /** Their longest pull request currently waiting on anyone, in hours. */
    longestOpenWaitHours: number | null;
    stalled: boolean;
    /** What the stall is attributed to, in plain words; null when not stalled. */
    stalledReason: string | null;
    /**
     * How this hire's work is named, from their track.
     *
     * The field names above still say "pull request" because that is the wire contract, but the
     * numbers behind them are composed from contributions of any kind. This is what lets the card
     * say the right word over them — "2 ceremonies facilitated" and "2 changes merged" are the same
     * number about two different jobs.
     */
    vocabulary: HireVocabulary;
};

/** The words for one hire's work. Fixed slots in a sentence the app owns; never prose. */
export type HireVocabulary = {
    /** The track's own name, e.g. "Engineering". */
    trackLabel: string;
    /** One unit of accepted work, bare: "change", "ceremony". */
    contributionNoun: string;
    contributionNounPlural: string;
    /** The hire's own act, past tense: "merged", "facilitated". */
    contributionVerbPast: string;
};

/** A project's onboarding health: medians throughout, plus every hire's timeline. */
export type ProjectOnboardingMetrics = {
    projectId: string;
    memberCount: number;
    /** Members with no declared GitHub login — their timelines are necessarily incomplete. */
    unattributableMemberCount: number;
    hiresWithMergedPullRequest: number;
    medianHoursToFirstMergedPullRequest: number | null;
    medianHoursToFirstResponse: number | null;
    /** The slow tail of review latency, where the barrier actually bites. */
    p90HoursToFirstResponse: number | null;
    stalledCount: number;
    waitingOnResponseCount: number;
    hires: HireTimeline[];
};

/**
 * Why one particular hire needs a human today (`GET /metrics/projects/{id}/attention`).
 *
 * The reason states whose move it is: a pull request kept waiting is somebody else's move,
 * not the hire's; a stall is the hire's. Reporting both as *the hire is behind* points the
 * attention at the one person who cannot fix it.
 */
export type AttentionItem = {
    hireId: string;
    hireName: string;
    reason: string;
    severity: AttentionSeverity;
    /** How long this has been true, in days — the thing that makes it urgent or not. */
    days: number;
};

export type AttentionSeverity = 'BLOCKED' | 'DRIFTING';

/** Who on the project is waiting or stalling, worst first. */
export type ProjectAttention = {
    projectId: string;
    memberCount: number;
    items: AttentionItem[];
};
