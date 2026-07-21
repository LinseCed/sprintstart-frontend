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

export type BaselineRequirement = 'required' | 'recommended';

/**
 * One entry in a project's baseline: a competency a hire on the project is expected to reach. The
 * direct-authoring counterpart of an approved proposal — same fields, but a PM sets it in one act.
 */
export type BaselineEntry = {
    competencyKey: string;
    /** The resolved bar (the entry's override, else the competency's own). */
    targetLevel: number;
    /** True when `targetLevel` is this baseline's override rather than the competency's own bar. */
    targetLevelOverridden: boolean;
    /** The wire form of the requirement, e.g. `required` or `recommended`. */
    requirement: string;
    invariant: boolean;
};

/** What a PM sends to add or update a baseline entry. Omitted fields take their defaults server-side. */
export type SetBaselineEntryInput = {
    /** The override bar, or null to use the competency's own target level. */
    targetLevel?: number | null;
    requirement?: BaselineRequirement;
    invariant?: boolean;
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

/**
 * What a PM sends to hand-author a new competency, with no AI proposal in the loop.
 *
 * The origination counterpart of `UpdateCompetencyInput`: this one *requires* `key`, because
 * creation is the single moment a node's permanent identity is set — editing can never change it,
 * since the ledger, every edge and every module point at it. The backend slugifies the key into
 * the graph's house style, so the created node's key may differ from what was typed. `targetLevel`
 * omitted takes the intermediate default a proposed node would get.
 */
export type CreateCompetencyInput = {
    key: string;
    label: string;
    description?: string;
    kind: CompetencyKind;
    targetLevel?: number;
    invariant?: boolean;
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
 * The whole live graph, as a PM authors it.
 *
 * Deliberately not a `PathView`. That is one hire's projection: filtered to a project's approved
 * baseline, carrying per-user node state, resolved at that hire's pinned graph version. Nothing
 * here is mastered or locked, because that describes a person rather than the graph.
 */
export type LiveGraph = {
    competencies: LiveCompetency[];
    edges: LiveCompetencyEdge[];
    graphVersion: number;
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
