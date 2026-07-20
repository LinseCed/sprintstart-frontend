import { FilePlus2, Loader2, Pencil, Sparkles } from 'lucide-react';
import type { PathNode } from '../../skill-assessment/types';
import type { PendingModule } from '../hooks/useModuleAuthoring';

type ModuleAuthoringSectionProps = {
    node: PathNode;
    /** A DRAFT/PROPOSED module already in flight for this competency, if any. */
    pending: PendingModule | null;
    isBusy: boolean;
    error: string | null;
    /** Opens the module editor for an existing module (active, draft, or proposed). */
    onOpenModule: (moduleId: string) => void;
    /** Creates a module for this competency, then the caller opens the editor. */
    onCreate: (mode: 'blank' | 'ai') => void;
};

/**
 * The PM's entry into module authoring for one competency.
 *
 * The learn-verify machinery was fully built but unreachable: nothing in the product ever created
 * a module, so every node reported "nothing published" and the editor -- which can only edit a
 * module it loads by id -- had no way in. This is that missing door.
 *
 * Three states, because a competency is in exactly one of them:
 * - an ACTIVE module exists (the node carries its id) -> edit it;
 * - a DRAFT/PROPOSED is in flight -> continue it, rather than minting a duplicate version;
 * - nothing yet -> create one, blank or AI-drafted from the project's corpus.
 */
export function ModuleAuthoringSection({
    node,
    pending,
    isBusy,
    error,
    onOpenModule,
    onCreate
}: ModuleAuthoringSectionProps) {
    return (
        <section aria-label={`Module for ${node.label}`} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                Learn-verify module
            </h3>

            {node.moduleId ? (
                <>
                    <p className="text-xs text-app-text-muted">A module is published for this competency.</p>
                    <button
                        type="button"
                        data-testid="author-edit-module"
                        onClick={() => onOpenModule(node.moduleId as string)}
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
                        Nothing published yet. Draft a module so this node has something to teach and a
                        check to unlock it.
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
