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
 * Five more existed (`CONTRIBUTION`, `POLICY`, `CONNECTION`, `CULTURE`, `CHECKPOINT`); all were
 * either created by nothing or existed to serve the retired graph.
 */
export type CompetencyKind = 'SKILL' | 'CONCEPT';
