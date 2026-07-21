export type ProposalStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';

/**
 * An AI-mined starter task (a GitHub issue) a PM can approve as a contribution goal.
 *
 * Approving one is the only way a `CONTRIBUTION` node ever enters the graph: it mints the node
 * plus prerequisite edges from each of `competencyKeys`, which is what makes it something a hire
 * can work toward.
 */
export type StarterWorkTask = {
    id: string;
    sourceId: string;
    title: string;
    summary: string | null;
    /** The AI's scope-safety judgement: why this is a reasonable first task. */
    rationale: string | null;
    sourceUrl: string | null;
    /** Competencies the AI judged this task exercises; each becomes a prerequisite edge. */
    competencyKeys: string[];
    status: ProposalStatus;
};

export type ProposedStarterWork = {
    tasks: StarterWorkTask[];
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
 * The contribution a hire's path aims at, as named by `GET /me/path`.
 *
 * Read from the payload, never inferred by scanning nodes for `kind === 'CONTRIBUTION'`: more
 * than one contribution node can sit on a path (a project's baseline may select some), and only
 * this one is theirs.
 */
export type PathGoal = {
    competencyKey: string;
    label: string;
    summary: string | null;
    sourceUrl: string | null;
    sourceProposalId: string | null;
    /** Prerequisites of this goal the hire has not met yet. */
    remainingCount: number;
    /** Whether every prerequisite is cleared, so the contribution itself can be started. */
    isReachable: boolean;
};
