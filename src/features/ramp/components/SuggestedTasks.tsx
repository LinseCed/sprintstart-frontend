import { ExternalLink, Loader2, Sparkles } from 'lucide-react';
import type { RankedStarterWorkTask } from '../../starter-work/types';

type SuggestedTasksProps = {
    matches: RankedStarterWorkTask[];
    isLoading: boolean;
    error: string | null;
    claimingId: string | null;
    onPick: (taskId: string) => void;
};

/**
 * What a hire could do next — visible, but not demanding.
 *
 * Two rules the layout has to hold. **The score is never shown**: a number is not a reason, and
 * showing one invites a hire to treat the top row as an instruction. What is shown instead is the
 * backend's `reasons`, which are the actual signals that produced the order.
 *
 * And **a different one can always be picked**. Every row has the same affordance, so the list
 * reads as a menu rather than as a queue with one correct answer at the top.
 */
export function SuggestedTasks({ matches, isLoading, error, claimingId, onPick }: SuggestedTasksProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-xs text-app-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Looking at what fits…
            </div>
        );
    }

    if (error) {
        return <p className="text-xs text-app-danger-text">{error}</p>;
    }

    if (matches.length === 0) {
        return (
            <p className="text-xs text-app-text-muted">
                Nothing in the pool right now. Your PM adds tasks here — it isn&apos;t something
                you&apos;re missing.
            </p>
        );
    }

    return (
        <ul className="space-y-2">
            {matches.map((match) => (
                <li
                    key={match.task.id}
                    className="rounded-xl border border-app-border bg-app-bg p-3"
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-app-text">{match.task.title}</p>
                            {match.reasons.length > 0 ? (
                                <p className="mt-0.5 text-xs text-app-text-muted">
                                    Suggested because it {match.reasons[0]}
                                </p>
                            ) : (
                                // No invented reason. "It's available" is the honest line.
                                <p className="mt-0.5 text-xs text-app-text-subtle">
                                    Nothing in particular matched — it&apos;s simply open.
                                </p>
                            )}
                            {match.reasons.slice(1).map((reason) => (
                                <p key={reason} className="text-[11px] text-app-text-subtle">
                                    {reason.startsWith('note:') ? reason : `…and it ${reason}`}
                                </p>
                            ))}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {match.task.sourceUrl && (
                                <a
                                    href={match.task.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-app-text-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                >
                                    Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => onPick(match.task.id)}
                                disabled={claimingId !== null}
                                className="inline-flex items-center gap-1 rounded-lg border border-app-border px-2.5 py-1 text-xs font-medium text-app-text transition-colors hover:bg-app-surface-muted disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                {claimingId === match.task.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                                )}
                                Work on this
                            </button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
