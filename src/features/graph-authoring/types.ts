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
