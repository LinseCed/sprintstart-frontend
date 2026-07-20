/**
 * Task-scoped orientation: what this project already says about doing the task
 * a hire has, assembled rather than authored.
 *
 * Mirrors the backend's `GET /me/orientation` contract (backend#73, ai#31).
 * Deliberately unlike a competency module: no version, no approval, no author —
 * a packet is disposable and regenerates when the corpus moves.
 */

/**
 * The step of the path to a pull request a section belongs to. Segmentation is
 * by *process*, not by topic, which is what lets a hire on day three open
 * "check locally" without re-reading setup.
 */
export type OrientationStep =
    | 'SET_UP'
    | 'FIND_THE_CODE'
    | 'MAKE_THE_CHANGE'
    | 'CHECK_LOCALLY'
    | 'OPEN_THE_PR';

/** Where one claim came from, and where the hire can open it. */
export type OrientationCitation = {
    filename: string;
    chunkId: string;
    sourceUrl: string | null;
};

export type OrientationSection = {
    step: OrientationStep;
    title: string;
    body: string;
    /**
     * Never empty in practice — the AI service drops ungrounded sections before
     * they are returned. Rendered visibly rather than as a tooltip: provenance
     * is the trust mechanism, so hiding it defeats the point.
     */
    citations: OrientationCitation[];
};

/** A piece of existing material the packet drew on. */
export type OrientationSource = {
    filename: string;
    sourceUrl: string | null;
    artifactType: string | null;
};

export type OrientationPacket = {
    taskId: string;
    taskTitle: string;
    summary: string | null;
    sections: OrientationSection[];
    sources: OrientationSource[];
    assembledAt: string;
};

/**
 * Orientation for the hire's current task. Every combination is a real state,
 * none an error:
 * - no `taskId` → no current task, so nothing to orient for;
 * - `taskId` + `packet` → the assembled orientation;
 * - `taskId`, no `packet` → the corpus could not ground one, and `reason` says
 *   why. **Never render a placeholder here** — an invented packet on a task the
 *   hire is judged on is the failure this contract exists to prevent.
 */
export type MyOrientation = {
    taskId: string | null;
    taskTitle: string | null;
    taskUrl: string | null;
    packet: OrientationPacket | null;
    reason: string | null;
};
