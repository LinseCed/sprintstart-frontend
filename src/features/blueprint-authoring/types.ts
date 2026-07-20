export type ProposalStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';

/**
 * One competency selected into a proposed baseline.
 *
 * A baseline is a selection over the competency graph -- which competencies
 * everyone in a scope must reach, and how deeply -- not a list of prose steps.
 *
 * `proposalId` is the entity id that approve/reject target; `competencyKey` is
 * the graph key, which is *not* the same value -- targeting the wrong one
 * silently 404s.
 */
export type BlueprintCompetencyProposal = {
    competencyKey: string;
    label: string;
    description: string | null;
    /** The bar that will actually apply: this baseline's override, else the node's own. */
    targetLevel: number;
    /** True when `targetLevel` is this baseline's override rather than the graph's bar. */
    targetLevelOverridden: boolean;
    requirement: string;
    invariant: boolean;
    /** Why the proposer selected it; absent when it gave no reason. */
    rationale: string | null;
    proposalId: string;
    status: ProposalStatus;
};

/** A proposed baseline version for one scope (`global` or `area:<role>`). */
export type BlueprintProposal = {
    scope: string;
    version: string;
    competencies: BlueprintCompetencyProposal[];
};

export type ProposedBlueprints = {
    blueprints: BlueprintProposal[];
};

/** Per-scope result of a generation run; `status` is e.g. `created` / `unchanged` / `skipped`. */
export type BlueprintOutcome = {
    scope: string;
    status: string;
    message: string | null;
};

export type GenerateBlueprintsResult = {
    outcomes: BlueprintOutcome[];
};
