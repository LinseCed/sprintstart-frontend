import type { VerificationType } from '../learn-verify/types';

/**
 * The kind of one page within a competency module.
 *
 * Mirrors the backend's `ModulePageKind`. Kept as a union of known kinds plus a
 * widening `string`, deliberately: the backend can add a kind before this client
 * knows about it, and a page of an unrecognized kind must still render *something*
 * rather than silently disappearing from a module a hire is being graded on.
 */
export const KNOWN_MODULE_PAGE_KINDS = [
    'CONTEXT',
    'LESSON',
    'WALKTHROUGH',
    'TASK',
    'RESOURCE',
    'CHECK',
    'VERIFY'
] as const;

export type KnownModulePageKind = (typeof KNOWN_MODULE_PAGE_KINDS)[number];
export type ModulePageKind = KnownModulePageKind | (string & {});

export function isKnownPageKind(kind: string): kind is KnownModulePageKind {
    return (KNOWN_MODULE_PAGE_KINDS as readonly string[]).includes(kind);
}

export type ModuleStatus = 'DRAFT' | 'PROPOSED' | 'ACTIVE' | 'ARCHIVED';

/** Who wrote a piece of module content. Re-synthesis replaces `AI`, never `PM`. */
export type ContentProvenance = 'AI' | 'PM';

export type ModulePage = {
    id: string;
    kind: ModulePageKind;
    title: string;
    body: string | null;
    position: number;
    provenance: ContentProvenance;
    updatedAt: string;
};

/**
 * The shared module one competency teaches, as returned by
 * `GET /me/modules/{id}` and the authoring endpoints.
 *
 * Shared is the point: one module per (competency, project), read by every hire
 * who needs that competency. There is no per-user copy, so a PM's edit lands for
 * everyone on that node.
 */
export type CompetencyModule = {
    id: string;
    competencyKey: string;
    competencyLabel: string;
    projectId: string;
    version: number;
    status: ModuleStatus;
    origin: ContentProvenance;
    title: string;
    summary: string | null;
    pages: ModulePage[];
    /** The grading type of the module's check, when one is configured. */
    verificationType: VerificationType | null;
    updatedAt: string;
};

export type CompetencyModules = {
    modules: CompetencyModule[];
};
