import { useEffect } from 'react';
import { Check, ExternalLink, Loader2, Target, X } from 'lucide-react';
import type { PathGoal, RankedStarterWorkTask } from '../../starter-work/types';

type GoalPickerProps = {
    matches: RankedStarterWorkTask[];
    currentGoal: PathGoal | null | undefined;
    isLoading: boolean;
    isClaiming: boolean;
    error: string | null;
    onLoad: () => void | Promise<void>;
    onClaim: (taskId: string) => Promise<boolean>;
    onClear: () => Promise<boolean>;
    onClose: () => void;
};

/**
 * The hire choosing what they will work toward, from tasks ranked against their own ledger.
 *
 * `matchedCompetencyKeys` is shown per task because the ranking is otherwise an opaque number:
 * "builds on what you already have: kotlin, testing" is a reason a person can act on; a score
 * of 0.82 is not.
 *
 * Nothing here is a commitment a hire cannot undo -- the goal is an input to the path projection,
 * not a record of anything earned, so changing it re-aims the path and costs nobody any progress.
 * The copy says so, because "pick your first contribution" sounds weightier than it is.
 */
export function GoalPicker({
    matches,
    currentGoal,
    isLoading,
    isClaiming,
    error,
    onLoad,
    onClaim,
    onClear,
    onClose
}: GoalPickerProps) {
    // Deferred off the effect body: setState during an effect cascades a render.
    useEffect(() => {
        void Promise.resolve().then(() => onLoad());
        // Loading once on open is the intent; onLoad's identity is stable from the hook.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose what to work toward"
            data-testid="goal-picker"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
            <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-3xl border border-app-border bg-app-bg shadow-xl">
                <header className="flex items-start justify-between gap-3 border-b border-app-border p-5">
                    <div>
                        <h2 className="flex items-center gap-2 text-base font-semibold text-app-text">
                            <Target className="h-4 w-4 text-app-brand-text" aria-hidden="true" />
                            Pick your first contribution
                        </h2>
                        <p className="mt-1 text-xs text-app-text-muted">
                            Ranked against what you already know. You can change this whenever you
                            like — it re-aims your path and takes nothing away.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="rounded-lg p-1 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </header>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
                    {error && (
                        <p className="rounded-lg bg-app-danger-bg p-3 text-xs font-medium text-app-danger-text">
                            {error}
                        </p>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-app-text-muted">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm text-app-text-muted">
                                No starter tasks have been approved for you to pick from yet. Your
                                team lead approves these — in the meantime your path still shows
                                what&apos;s expected of everyone.
                            </p>
                        </div>
                    ) : (
                        matches.map(({ task, matchedCompetencyKeys }) => {
                            const isCurrent = currentGoal?.sourceProposalId === task.id;
                            return (
                                <article
                                    key={task.id}
                                    className={`rounded-2xl border p-4 ${
                                        isCurrent
                                            ? 'border-app-brand-border bg-app-brand-soft'
                                            : 'border-app-border bg-app-surface'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <h3 className="min-w-0 flex-1 text-sm font-semibold text-app-text">
                                            {task.title}
                                        </h3>
                                        {task.sourceUrl && (
                                            <a
                                                href={task.sourceUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-app-brand-text hover:underline"
                                            >
                                                <ExternalLink
                                                    className="h-3.5 w-3.5"
                                                    aria-hidden="true"
                                                />
                                                Read it
                                            </a>
                                        )}
                                    </div>

                                    {task.summary && (
                                        <p className="mt-1 text-sm text-app-text-muted">
                                            {task.summary}
                                        </p>
                                    )}

                                    {/* A reason, not a score. */}
                                    {matchedCompetencyKeys.length > 0 && (
                                        <p className="mt-2 text-xs text-app-text-muted">
                                            Builds on what you already have:{' '}
                                            <span className="text-app-text">
                                                {matchedCompetencyKeys.join(', ')}
                                            </span>
                                        </p>
                                    )}

                                    <div className="mt-3">
                                        {isCurrent ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-app-brand-text">
                                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                                This is what you&apos;re working toward
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                data-testid={`claim-goal-${task.id}`}
                                                disabled={isClaiming}
                                                onClick={() => {
                                                    void onClaim(task.id).then(claimed => {
                                                        if (claimed) onClose();
                                                    });
                                                }}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {isClaiming && (
                                                    <Loader2
                                                        className="h-3.5 w-3.5 animate-spin"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                                Work toward this
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })
                    )}
                </div>

                {currentGoal && (
                    <footer className="border-t border-app-border p-4">
                        <button
                            type="button"
                            data-testid="clear-goal"
                            disabled={isClaiming}
                            onClick={() => {
                                void onClear().then(cleared => {
                                    if (cleared) onClose();
                                });
                            }}
                            className="text-xs font-medium text-app-text-muted transition-colors hover:text-app-text disabled:opacity-60"
                        >
                            Stop working toward {currentGoal.label}
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
}
