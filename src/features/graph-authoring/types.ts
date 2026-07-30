/**
 * The two kinds a competency can be.
 *
 * Five more existed. `CONTRIBUTION` was minted by approving a starter task, so a task became a
 * node prerequisites could lead to — with no graph, it was a competency nobody could be assessed
 * on, and a goal points at the task itself now. `POLICY` was created once by a dev seeder;
 * `CONNECTION`, `CULTURE` and `CHECKPOINT` by nothing, anywhere, which made the vocabulary look
 * more complete than it was.
 */
export type CompetencyKind = 'SKILL' | 'CONCEPT';

/**
 * A live competency as the authoring endpoints return it.
 *
 * `key` is shown but never sent back. It is the identity the ledger and every module point at, so
 * renaming it would orphan everything anyone has earned — the label is what's editable.
 */
export type LiveCompetency = {
    key: string;
    label: string;
    description: string | null;
    kind: CompetencyKind;
    /**
     * What this competency is about, for grouping — "Authentication", "Ingestion".
     *
     * This is what replaced the graph: `RELATED` edges were already describing a grouping ("same
     * area of the system") and storing it as a DAG that every consumer filtered out. `null` is a
     * real state, "not grouped yet" — nothing populates it automatically until generation runs on
     * ingestion, so a hand-authored vocabulary is mostly ungrouped today.
     */
    area: string | null;
    /** The level a hire must reach for this to count as held (1..4). */
    targetLevel: number;
    /** Compliance-flagged: this one is not casually removed. */
    invariant: boolean;
};

/**
 * What a PM sends to hand-author a new competency.
 *
 * The origination counterpart of `UpdateCompetencyInput`: this one *requires* `key`, because
 * creation is the single moment a competency's permanent identity is set — editing can never
 * change it, since the ledger and every module point at it. The backend slugifies the key into the
 * house style, so the created competency's key may differ from what was typed. `targetLevel`
 * omitted takes the intermediate default.
 */
export type CreateCompetencyInput = {
    key: string;
    label: string;
    description?: string;
    kind: CompetencyKind;
    /**
     * What it is about, for grouping. Free text: a fixed list of areas cannot fit an unknown
     * codebase. One that differs from an existing area only in case or spacing is stored as the
     * existing one, so the grouping cannot fragment into synonyms of itself.
     */
    area?: string;
    targetLevel?: number;
    invariant?: boolean;
};

/** The fields a PM can change on a live competency. Omitted fields are left alone. */
export type UpdateCompetencyInput = {
    label?: string;
    description?: string;
    kind?: CompetencyKind;
    /** Blank clears the grouping, the way a blank description clears one. */
    area?: string;
    targetLevel?: number;
    invariant?: boolean;
};

/**
 * The whole live vocabulary, as a PM authors it.
 *
 * A flat list, and nothing more: prerequisite edges, the versions they were resolved at and the
 * per-hire projection over them were all retired together. Nothing here is mastered or met,
 * because that describes a person rather than the vocabulary.
 */
export type LiveGraph = {
    competencies: LiveCompetency[];
};

/** The outcome of removing a competency. */
export type DeleteCompetencyResult = {
    key: string;
};
