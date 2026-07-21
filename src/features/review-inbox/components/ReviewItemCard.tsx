import { Check, X } from 'lucide-react';
import type { ReviewItemView, ReviewKind } from '../types';

const KIND_LABEL: Record<ReviewKind, string> = {
    competency: 'Competency',
    edge: 'Prerequisite',
    baseline: 'Baseline',
    task: 'Starter task',
};

/**
 * One proposal, whatever its kind, as the same card: what it is, the AI's reasoning, and the two
 * decisions. Keeping every kind identical is the point of the inbox — a PM learns one pattern, not
 * three. `busy` disables both actions while a decision is in flight so a card can't be double-acted.
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
                            aria-label={`Approve ${item.title}`}
                            disabled={busy}
                            onClick={() => onApprove(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-success-border bg-app-success-bg text-app-success-text transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            aria-label={`Reject ${item.title}`}
                            disabled={busy}
                            onClick={() => onReject(item)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-border text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </li>
    );
}
