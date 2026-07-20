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
