export type ProposalStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';

/**
 * One proposed step of a baseline blueprint.
 *
 * `proposalId` is the entity id that approve/reject target; `id` is the semantic
 * step id from generation, which is *not* the same value -- targeting the wrong
 * one silently 404s.
 */
export type BlueprintStepProposal = {
    id: string | null;
    title: string;
    description: string | null;
    requirement: string;
    invariant: boolean;
    proposalId: string;
    status: ProposalStatus;
};

/** A proposed blueprint version for one scope (`global` or `area:<role>`). */
export type BlueprintProposal = {
    scope: string;
    version: string;
    steps: BlueprintStepProposal[];
};

export type ProposedBlueprints = {
    blueprints: BlueprintProposal[];
};

/** Per-scope result of a generation run; `status` is e.g. `generated` / `unchanged` / `failed`. */
export type BlueprintOutcome = {
    scope: string;
    status: string;
    message: string | null;
};

export type GenerateBlueprintsResult = {
    outcomes: BlueprintOutcome[];
};
