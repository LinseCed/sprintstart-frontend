/** What a single proposal is. Competencies and edges both come from the skill-map generator. */
export type ReviewKind = 'competency' | 'edge' | 'baseline' | 'task';

/** What a generator produces — also the key a Setup rung filters the inbox by. */
export type GenerationKind = 'skill-map' | 'baseline' | 'starter-tasks';

/** Which generator's output a review kind belongs to, for grouping and filtering. */
export const GENERATION_OF: Record<ReviewKind, GenerationKind> = {
    competency: 'skill-map',
    edge: 'skill-map',
    baseline: 'baseline',
    task: 'starter-tasks',
};

export const GENERATION_KINDS: GenerationKind[] = ['skill-map', 'baseline', 'starter-tasks'];

/** Human labels for a generation group and its generate action. */
export const GENERATION_META: Record<
    GenerationKind,
    { title: string; generateLabel: string; workingLabel: string }
> = {
    'skill-map': {
        title: 'Skill map',
        generateLabel: 'Generate skill map',
        workingLabel: 'Reading the corpus and drafting competencies',
    },
    baseline: {
        title: 'Baseline',
        generateLabel: 'Generate baseline',
        workingLabel: 'Choosing the competencies a hire should reach',
    },
    'starter-tasks': {
        title: 'Starter tasks',
        generateLabel: 'Find starter tasks',
        workingLabel: 'Mining well-scoped first tasks',
    },
};

/**
 * One proposal, normalized so every kind renders the same card. Actions are not on the view — the
 * hook routes approve/reject by `kind` + `id`, so the view stays a plain, testable value.
 */
export interface ReviewItemView {
    /** Unique within its kind; the id approve/reject target (a `proposalId` for baseline entries). */
    id: string;
    kind: ReviewKind;
    title: string;
    detail: string | null;
    /** A short badge: the competency kind, edge kind, target level, or skill count. */
    tag: string | null;
}
