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
