export type CompetencyKind =
    | 'SKILL'
    | 'CONCEPT'
    | 'CONTRIBUTION'
    | 'POLICY'
    | 'CONNECTION'
    | 'CULTURE'
    | 'CHECKPOINT';

export type EdgeKind = 'PREREQUISITE' | 'RELATED';

export type ProposalStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED';

export type CompetencyProposal = {
    id: string;
    key: string;
    label: string;
    description: string | null;
    kind: CompetencyKind;
    repoRef: string | null;
    status: ProposalStatus;
};

export type CompetencyEdgeProposal = {
    id: string;
    fromKey: string;
    toKey: string;
    kind: EdgeKind;
    rationale: string | null;
    status: ProposalStatus;
};

export type ProposedGraph = {
    competencies: CompetencyProposal[];
    edges: CompetencyEdgeProposal[];
};

export type GenerateGraphResult = {
    status: string;
    competenciesProposed: number;
    edgesProposed: number;
    notes: string[];
};

/**
 * A live competency as the authoring endpoints return it.
 *
 * Distinct from `CompetencyProposal`: that is something waiting for a decision, this is a node
 * already in the graph. It carries `description`, `targetLevel` and `invariant`, which the
 * projected path deliberately omits (a hire's map doesn't need them).
 *
 * `key` is shown but never sent back. It is the identity the ledger, every edge and every module
 * point at, so renaming it would orphan everything anyone has earned -- the label is what's
 * editable.
 */
export type LiveCompetency = {
    key: string;
    label: string;
    description: string | null;
    kind: CompetencyKind;
    /** The level a hire must reach for this node to count as held (1..4). */
    targetLevel: number;
    /** Compliance-flagged: changes touching this node reach hires immediately. */
    invariant: boolean;
    repoRef: string | null;
};

/** The fields a PM can change on a live competency. Omitted fields are left alone. */
export type UpdateCompetencyInput = {
    label?: string;
    description?: string;
    kind?: CompetencyKind;
    targetLevel?: number;
    invariant?: boolean;
};

export type LiveCompetencyEdge = {
    fromKey: string;
    toKey: string;
    kind: EdgeKind;
};

/**
 * The outcome of removing a node. `edgesRemoved` is surfaced because removing one node detaches
 * every edge touching it, which is more of the graph's structure than a PM may expect.
 */
export type DeleteCompetencyResult = {
    key: string;
    edgesRemoved: number;
    graphVersion: number;
};

export type ApproveGraphBatchResult = {
    competenciesApproved: number;
    edgesApproved: number;
    graphVersion: number;
};
