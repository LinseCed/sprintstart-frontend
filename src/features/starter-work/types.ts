/**
 * Whether a task is in the claimable pool.
 *
 * `PROPOSED` is gone: a mined task is live the moment it is mined, and `reviewed` says whether
 * anybody has looked at it. `REJECTED` is terminal *and sticky* — mining never brings back a task
 * somebody turned down.
 */
export type ProposalStatus = 'LIVE' | 'REJECTED';

/**
 * An AI-mined starter task (a GitHub issue) a hire can be pointed at.
 *
 * It is claimable on arrival — review is not a gate any more. What review buys is rank: fit-ranking
 * demotes an unreviewed task, capped below the smallest positive signal, so one that fits a hire
 * perfectly still beats a reviewed one that does not.
 */
export type StarterWorkTask = {
    id: string;
    sourceId: string;
    title: string;
    summary: string | null;
    /** The AI's scope-safety judgement: why this is a reasonable first task. */
    rationale: string | null;
    sourceUrl: string | null;
    /** Competencies the AI judged this task exercises; one of the signals fit-ranking reads. */
    competencyKeys: string[];
    status: ProposalStatus;
    /** Whether a person has looked at this task. Unreviewed is claimable, just ranked lower. */
    reviewed: boolean;
    /** Which track this work is for, or null when it suits any role. */
    onboardingTrackKey: string | null;
};

/** The live tasks nobody has vouched for yet. */
export type ProposedStarterWork = {
    tasks: StarterWorkTask[];
};

/**
 * What a PM sends to hand-author a starter task, with no AI mining.
 *
 * The origination counterpart to approving a mined proposal. A hand-authored task is born
 * `APPROVED` and claimable at once, so it never appears in the review queue. `sourceUrl` is an
 * optional link to the issue or PR it tracks; `competencyKeys` say what the work exercises, and a
 * key that isn't a live competency is skipped, not rejected.
 */
export type CreateStarterWorkTaskInput = {
    title: string;
    summary?: string;
    sourceUrl?: string;
    competencyKeys?: string[];
    /**
     * Which track this work is for. Omitted means it suits any role — the honest default, and how
     * every task behaved before tracks existed.
     */
    onboardingTrackKey?: string;
};

export type GenerateStarterWorkResult = {
    status: string;
    tasksProposed: number;
    notes: string[];
};

/** What kind of work a task is, read off the issue's own labels. `OTHER` means unknown. */
export type TaskType = 'BUG' | 'FEATURE' | 'DOCS' | 'TEST' | 'CHORE' | 'OTHER';

/**
 * One approved task ranked for a hire.
 *
 * `reasons` is the important field. Ranking is a *suggestion*, and a suggestion nobody can
 * interrogate is an instruction — so the backend sends one clause per contributing signal,
 * strongest first, with any "you may wait for a review here" note last. An empty list means
 * nothing matched, which is worth saying plainly rather than dressing up.
 */
export type RankedStarterWorkTask = {
    task: StarterWorkTask;
    score: number;
    /** The hire's competencies that overlap this task's requirements. */
    matchedCompetencyKeys: string[];
    taskType: TaskType;
    reasons: string[];
};

/**
 * The starter task a hire has committed to on a project.
 *
 * It named a `CONTRIBUTION` competency and how many of its prerequisites were still outstanding.
 * Both went with the graph: a goal points at the task, and there is no ordering left to be short
 * of. Claiming happens in conversation with the buddy, so nothing in this app reads one yet.
 */
export type Goal = {
    proposalId: string;
    title: string;
    summary: string | null;
    sourceUrl: string | null;
};
