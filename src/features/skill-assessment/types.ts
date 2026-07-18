export type AssessmentStartResponse = {
    sessionId: string;
    question: string;
};

export type AssessmentAnswerResponse = {
    done: boolean;
    question?: string | null;
};

export type NodeState = 'mastered' | 'available' | 'locked';

export type CompetencyKind =
    | 'SKILL'
    | 'CONCEPT'
    | 'CONTRIBUTION'
    | 'POLICY'
    | 'CONNECTION'
    | 'CULTURE'
    | 'CHECKPOINT';

export type PathNode = {
    key: string;
    label: string;
    kind: CompetencyKind;
    state: NodeState;

    /**
     * 0..4 proficiency level, when the node has been assessed/verified.
     */
    level?: number;

    /**
     * The onboarding step configured to teach/verify this competency, if any.
     * Null when no step has been wired up yet -- such nodes have no learn-verify
     * module to open.
     */
    stepId?: string | null;

    /**
     * The grading type of that same step's verification, echoed here so a node
     * can show an at-a-glance icon (e.g. an artifact-checked milestone) without
     * an extra per-node fetch. Null under the same condition as `stepId`.
     */
    verificationType?: 'KNOWLEDGE' | 'EXACT' | 'ATTEST' | 'ARTIFACT' | null;
};

export type PathEdge = {
    from: string;
    to: string;
};

export type PathView = {
    nodes: PathNode[];
    edges: PathEdge[];

    /**
     * The competency graph version this path was projected against.
     */
    graphVersion: number;
};

export type AssessmentChatMessage = {
    id: string;
    role: 'assistant' | 'user';
    content: string;
};
