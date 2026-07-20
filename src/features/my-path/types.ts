import type { CompetencySource } from '../competency-dashboard/types';
import type { CompetencyKind } from '../skill-assessment/types';

/**
 * One row of the authenticated user's own durable competency ledger, as returned
 * by `GET /api/v1/onboarding/me/competencies`.
 *
 * The ledger is global -- a competency proven on one project transfers to every
 * other one -- so this payload is deliberately *not* project-scoped. The skills
 * rail splits it against the selected project's graph to show what's on this
 * project versus what was proven elsewhere.
 */
export type MyCompetency = {
    competencyKey: string;
    label: string;
    kind: CompetencyKind;
    /** 0..4 proficiency level; 0 means "known but unplaced". */
    level: number;
    source: CompetencySource;
    updatedAt: string;
};

/** The kind of a page within a learn-verify module (a step rendered as a stepper). */
export type StepPageKind = 'LESSON' | 'TASK' | 'VERIFY';

/**
 * One page of a learn-verify module, in render order.
 *
 * `LESSON` carries its own markdown body in `content`; `TASK` and `VERIFY` are
 * markers whose detail the client already holds (the step's `tasks`, and the
 * step's verification fetched from the verification endpoints), so their
 * `content` is null.
 */
export type StepPage = {
    kind: StepPageKind;
    title: string;
    content: string | null;
};
