export type AssessmentStartResponse = {
    sessionId: string;
    question?: string | null;
    /**
     * Set when the project has nothing configured to assess yet (no live competency
     * module) -- the session finished immediately with no question and nothing placed.
     */
    done?: boolean;
};

export type AssessmentAnswerResponse = {
    done: boolean;
    question?: string | null;
};

/** `GET /me/assessment/status` — whether the caller has ever completed a placement interview. */
export type AssessmentStatusResponse = {
    completed: boolean;
};

/**
 * The two kinds a competency can be.
 *
 * Two, deliberately: a competency is something somebody knows or something they can do. ⚠️ Kinds
 * that nothing creates are an invitation to write code branching on them.
 */
export type CompetencyKind = 'SKILL' | 'CONCEPT';
