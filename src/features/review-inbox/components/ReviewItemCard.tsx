import { Check, X } from 'lucide-react';
import type { ReviewItemView, ReviewKind } from '../types';

const KIND_LABEL: Record<ReviewKind, string> = {
    task: 'Starter task',
};

/**
 * One mined item as a card: what it is, the AI's reasoning, and the two things somebody can say
 * about it. Keeping every kind identical is the point of the inbox — a PM learns one pattern, not
 * one per queue. `busy` disables both actions while one is in flight so a card can't be double-acted.
 *
 * ### The two actions are not opposites, and the labels have to say so
 *
 * They were a ✓/✗ pair when a task had to be approved before anybody could see it. Since D1 that is
 * no longer what either does: the task is already live and claimable, so **"looks good" changes only
 * its ranking**, while **removing it genuinely takes it out of the pool**. Rendering them as twins
 * suggested a decision was owed on every card and that both outcomes were equally consequential —
 * neither is true, and one of them is destructive.
 */
export function ReviewItemCard({
    item,
    canAct,
    busy,
    onApprove,
    onReject,
}: {
    item: ReviewItemView;
    canAct: boolean;
    busy: boolean;
    onApprove: (item: ReviewItemView) => void;
    onReject: (item: ReviewItemView) => void;
}) {
    return (
        <li className="rounded-xl border border-app-border bg-app-bg p-3.5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                            {KIND_LABEL[item.kind]}
                        </span>
                        {item.tag && (
                            <span className="rounded-full border border-app-border px-2 py-0.5 text-xs font-medium text-app-text-muted">
                                {item.tag}
                            </span>
                        )}
                    </div>
                    <h4 className="mt-1 break-words text-sm font-semibold text-app-text">
                        {item.title}
                    </h4>
                    {item.detail && (
                        <p className="mt-1 text-sm text-app-text-muted">{item.detail}</p>
                    )}
                </div>

                {canAct && (
                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            aria-label={`Mark ${item.title} as looked over`}
                            title="Looks good — stop ranking it below the rest"
                            disabled={busy}
                            onClick={() => onApprove(item)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-app-success-border bg-app-success-bg px-3 text-sm font-medium text-app-success-text transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" aria-hidden="true" />
                            Looks good
                        </button>
                        {/* The destructive one, and the only one of the two that changes what a
                            hire can claim. Named for what it does rather than as the mirror image
                            of the other. */}
                        <button
                            type="button"
                            aria-label={`Take ${item.title} out of the pool`}
                            title="Take it out of the pool — hires will not be offered it"
                            disabled={busy}
                            onClick={() => onReject(item)}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-app-border px-3 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-4 w-4" aria-hidden="true" />
                            Take it out
                        </button>
                    </div>
                )}
            </div>
        </li>
    );
}
