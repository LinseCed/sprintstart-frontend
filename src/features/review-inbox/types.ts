/**
 * What a single proposal is.
 *
 * Two more existed — `competency` and `edge`, from the skill-map generator. Competencies are not
 * proposed any more: there is no proposal lifecycle for them, and there are no edges at all.
 */
export type ReviewKind = 'task';

/** What a generator produces — also the key a Setup rung filters the inbox by. */
export type GenerationKind = 'starter-tasks';

/** Which generator's output a review kind belongs to, for grouping and filtering. */
export const GENERATION_OF: Record<ReviewKind, GenerationKind> = {
    task: 'starter-tasks',
};

export const GENERATION_KINDS: GenerationKind[] = ['starter-tasks'];

/** Human labels for a generation group and its generate action. */
export const GENERATION_META: Record<
    GenerationKind,
    { title: string; generateLabel: string; workingLabel: string }
> = {
    'starter-tasks': {
        title: 'Starter tasks',
        generateLabel: 'Find starter tasks',
        workingLabel: 'Mining well-scoped first tasks',
    },
};

/**
 * One proposal, normalized so every kind renders the same card. Actions are not on the view — the
 * hook routes approve/reject by `kind` + `id`, so the view stays a plain, testable value.
 *
 * One kind is left, and the shape is kept rather than collapsed into the starter-task type: the
 * grouping is what a Setup rung deep-links into, and D1 of the skill-map retirement turns this
 * queue into something else again (mined tasks go live unreviewed, ranked lower until somebody
 * looks). Flattening it now would be undone twice.
 */
export interface ReviewItemView {
    /** Unique within its kind; the id approve/reject targets. */
    id: string;
    kind: ReviewKind;
    title: string;
    detail: string | null;
    /** A short badge: the skill count. */
    tag: string | null;
}
