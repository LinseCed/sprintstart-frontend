/**
 * The board: a hire's persistent working surface on one project.
 *
 * The buddy conversation opens fresh every visit — the prior window is folded into the mentor's
 * private memory and never replayed — so anything durable it shows you has nowhere to live. Chat is
 * the conversation; the board is the whiteboard beside it.
 *
 * The card catalog is closed on purpose. The mentor curating this board is a language model, and a
 * kind it could invent the contents of is a kind it would. A card is a request to show a *known*
 * read, never prose the model wrote about the hire's state.
 */

/** Every card kind the board understands. Closed set — see the module comment. */
export type BoardCardKind =
    | 'PATH_TO_FIRST_CONTRIBUTION'
    | 'OPEN_PULL_REQUESTS'
    | 'CURRENT_TASK'
    | 'SUGGESTED_TASKS';

/**
 * Who a card belongs to, which is what decides who may change it.
 *
 * `AI` means placed *for* the hire rather than by them: dismissible, never edited, because its
 * content is a live read. `HIRE` cards are theirs, and the mentor never removes one.
 */
export type BoardCardOwner = 'AI' | 'HIRE';

/**
 * How this hire's accepted work is named, from their track.
 *
 * Sent by the backend rather than hardcoded here because the board renders sentences around live
 * numbers, and "2 changes merged" and "2 ceremonies facilitated" are the same sentence with
 * different nouns in it. Structured fields only — a track fills fixed slots, it does not write copy.
 */
export type BoardVocabulary = {
    /** The track's own name, e.g. "Engineering". */
    trackLabel: string;
    /** One unit of accepted work, bare: "change", "ceremony". */
    contributionNoun: string;
    contributionNounPlural: string;
    /** The hire's own act, past tense: "merged", "facilitated". */
    contributionVerbPast: string;
};

/** The moments a path card reports, in the order they normally happen. */
export type BoardMomentKey =
    | 'JOINED'
    | 'TASK_CLAIMED'
    | 'WORK_SUBMITTED'
    | 'FIRST_RESPONSE'
    | 'WORK_ACCEPTED';

/** One moment, and whether it has happened. `null` is "not yet", and renders as a dash, never a zero. */
export type BoardMoment = {
    key: BoardMomentKey;
    reachedAt: string | null;
};

/**
 * The path from joining to a first accepted piece of work.
 *
 * Composed from contributions rather than pull requests, so it says something true whatever
 * produces this hire's work.
 */
export type PathToFirstContributionContent = {
    kind: 'PATH_TO_FIRST_CONTRIBUTION';
    moments: BoardMoment[];
    acceptedCount: number;
    /** When onboarding ended, dated. Null while it is still going. */
    autonomyReachedAt: string | null;
    /** Why the hire currently reads as stalled, in plain words; null when they do not. */
    stalledReason: string | null;
};

/** One open pull request. `waitingHours` is null once somebody has responded — the clock stopped. */
export type BoardPullRequest = {
    artifactId: string;
    number: number | null;
    title: string | null;
    url: string | null;
    waitingHours: number | null;
};

/**
 * The hire's still-open pull requests, longest-waiting first.
 *
 * Only ever present on a board whose track admits pull requests: an empty one in front of somebody
 * who will never have one is worse than no card at all.
 */
export type OpenPullRequestsContent = {
    kind: 'OPEN_PULL_REQUESTS';
    pullRequests: BoardPullRequest[];
    /**
     * The hire has declared no GitHub login, so nothing can be attributed to them.
     *
     * Distinct from an empty list: "you have nothing open" and "I cannot tell what you have open"
     * are different states, and only one of them is the hire's to fix.
     */
    attributionMissing: boolean;
};

/**
 * The task the hire is on, or the fact that they are on none.
 *
 * Present-but-empty rather than absent when there is no task: a card that vanishes when a goal is
 * cleared reads as the board losing something.
 */
export type CurrentTaskContent = {
    kind: 'CURRENT_TASK';
    taskId: string | null;
    title: string | null;
    summary: string | null;
    url: string | null;
    /** True when the hire claimed this as their goal, false when it is the Task 0 they were handed. */
    chosen: boolean;
};

/** One suggested task, with the plain reasons it was suggested. Never a score. */
export type BoardSuggestedTask = {
    taskId: string;
    title: string;
    url: string | null;
    reasons: string[];
};

/** Good next tasks, ranked by fit — reasons only, because a number is not something to act on. */
export type SuggestedTasksContent = {
    kind: 'SUGGESTED_TASKS';
    tasks: BoardSuggestedTask[];
};

/** The rendered content of one card, discriminated by `kind`. */
export type BoardCardContent =
    | PathToFirstContributionContent
    | OpenPullRequestsContent
    | CurrentTaskContent
    | SuggestedTasksContent;

export type BoardCard = {
    id: string;
    kind: BoardCardKind;
    owner: BoardCardOwner;
    position: number;
    /**
     * When the buddy put this card here; null when the board keeps it as part of the baseline.
     *
     * Drives the attribution line, and only this decides it. "Your buddy added this" about a card
     * nobody chose is attribution the hire cannot check, and attribution they cannot check is
     * attribution they cannot trust.
     */
    placedAt: string | null;
    content: BoardCardContent;
};

export type Board = {
    boardId: string;
    projectId: string;
    vocabulary: BoardVocabulary;
    /** Active cards only, in board order — a dismissed card is gone from the hire's point of view. */
    cards: BoardCard[];
};
