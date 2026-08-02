/**
 * Arrival steps: the things that have to be true before a hire can work.
 *
 * Accounts, access grants, a machine that builds. Onboarding assumed a hire already had all of it —
 * the GitHub username is a free-text field with no step behind it that gets you an account — so
 * somebody who could not clone the repository still got pointed at a task they could not start.
 *
 * **Nothing here gates anything.** An outstanding step changes what a hire is shown, never what
 * they may do. Being blocked by your employer must not also mean being blocked by the tool.
 */

/**
 * How a step was established, or how it is meant to be.
 *
 * Shared with the contribution stream deliberately, and the rule travels with it: **rigor is never
 * blended in a readout.** A step the system observed and a step somebody ticked are different
 * facts, and averaging them into one completion figure is exactly the defect that made the old
 * onboarding's progress number meaningless.
 *
 * `ATTESTED` exists in the backend enum as a slot for a named colleague confirming; nothing writes
 * it for arrival steps yet.
 */
export type Rigor = 'OBSERVED' | 'ATTESTED' | 'DECLARED';

/** One arrival step, and whether this hire has settled it. */
export type ArrivalStep = {
    /** Stable key the step is known by. State is stored against this, so it never changes. */
    key: string;
    /** Null for a company-wide step; set when a project added it. */
    projectId: string | null;
    title: string;
    description: string | null;
    /** Where to go to actually do it, when there is such a place. */
    href: string | null;
    position: number;
    /** How this step is settled: `OBSERVED` by the system, or `DECLARED` by the hire. */
    settledBy: Rigor;
    settled: boolean;
    settledAt: string | null;
    /** How it was actually established for this hire; null while unsettled. */
    rigor: Rigor | null;
};

/**
 * The caller's steps, counted by how each was established.
 *
 * ⚠️ **There is no total and no percentage, deliberately.** See [Rigor]. A readout says
 * *"5 confirmed · 2 you told us · 2 outstanding"*, never one number standing for "how done are you".
 */
export type MyArrival = {
    steps: ArrivalStep[];
    /** Settled because the system observed it. Always 0 until derivation lands in A1. */
    observedCount: number;
    /** Settled because the hire said so. */
    declaredCount: number;
    /** Not settled yet — a normal day-one state, not an error. */
    outstandingCount: number;
};

/** Creating a step. Omitting `projectId` means company-wide, which is the usual case. */
export type CreateArrivalStepRequest = {
    key: string;
    projectId?: string | null;
    title: string;
    description?: string | null;
    href?: string | null;
    position?: number;
    settledBy?: Rigor;
};

/**
 * Updating a step. Omitted fields are left alone.
 *
 * No `key`: a hire's state points at it, so renaming one would orphan every record of having done
 * the step while leaving the row looking healthy.
 */
export type UpdateArrivalStepRequest = {
    title?: string;
    description?: string | null;
    href?: string | null;
    position?: number;
    settledBy?: Rigor;
};
