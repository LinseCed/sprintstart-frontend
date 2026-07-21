import { FilePlus2, Loader2, Pencil, Sparkles } from 'lucide-react';
import { AiActivityLog } from '../../ai-activity/AiActivityLog';
import type { AiActivityEntry } from '../../ai-activity/useAiStream';
import type { LiveCompetency } from '../types';
import type { ModuleReadiness } from '../hooks/useModuleAuthoring';

type ModuleAuthoringSectionProps = {
    competency: LiveCompetency;
    /** What already exists for this competency in the selected project. */
    readiness: ModuleReadiness;
    isBusy: boolean;
    error: string | null;
    /** Opens the module editor for an existing module (active, draft, or proposed). */
    onOpenModule: (moduleId: string) => void;
    /** Creates a module for this competency, then the caller opens the editor. */
    onCreate: (mode: 'blank' | 'ai') => void;
    /** True while this competency's module is being AI-drafted, so the live log shows. */
    isStreaming?: boolean;
    /** The live draft log; shown in place of the buttons while streaming. */
    activity?: AiActivityEntry[];
};

/**
 * The PM's entry into module authoring for one competency.
 *
 * The learn-verify machinery was fully built but unreachable: nothing in the product ever created
 * a module, so every node reported "nothing published" and the editor -- which can only edit a
 * module it loads by id -- had no way in. This is that missing door.
 *
 * Three states, because a competency is in exactly one of them:
 * - an ACTIVE module exists -> edit it;
 * - a DRAFT/PROPOSED is in flight -> continue it, rather than minting a duplicate version;
 * - nothing yet -> create one, blank or AI-drafted from the project's corpus.
 *
 * Modules are per project while the competency itself is global, so everything here is scoped to
 * the project selected in the studio.
 */
export function ModuleAuthoringSection({
    competency,
    readiness,
    isBusy,
    error,
    onOpenModule,
    onCreate,
    isStreaming,
    activity
}: ModuleAuthoringSectionProps) {
    const { activeModuleId, pending } = readiness;

    return (
        <section aria-label={`Module for ${competency.label}`} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                Learn-verify module
            </h3>

            {isStreaming && activity !== undefined ? (
                <AiActivityLog phase="streaming" entries={activity} title="Drafting the module" />
            ) : activeModuleId ? (
                <>
                    <p className="text-xs text-app-text-muted">
                        A module is published for this competency.
                    </p>
                    <button
                        type="button"
                        data-testid="author-edit-module"
                        onClick={() => onOpenModule(activeModuleId)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit this module
                    </button>
                </>
            ) : pending ? (
                <>
                    <p className="text-xs text-app-text-muted">
                        {pending.status === 'DRAFT'
                            ? 'A draft is in progress but not published yet.'
                            : 'A draft is proposed and awaiting review.'}
                    </p>
                    <button
                        type="button"
                        data-testid="author-continue-module"
                        onClick={() => onOpenModule(pending.moduleId)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        {pending.status === 'DRAFT' ? 'Continue the draft' : 'Review the proposal'}
                    </button>
                </>
            ) : (
                <>
                    <p className="text-xs text-app-text-muted">
                        Nothing published yet. Draft a module so this node has something to teach and
                        a check to unlock it.
                    </p>
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            data-testid="author-draft-ai"
                            disabled={isBusy}
                            onClick={() => onCreate('ai')}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            Draft with AI
                        </button>
                        <button
                            type="button"
                            data-testid="author-create-blank"
                            disabled={isBusy}
                            onClick={() => onCreate('blank')}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Create blank
                        </button>
                    </div>
                </>
            )}

            {error && (
                <p
                    data-testid="module-authoring-error"
                    className="rounded-lg bg-app-danger-bg p-2.5 text-xs font-medium text-app-danger-text"
                >
                    {error}
                </p>
            )}
        </section>
    );
}
