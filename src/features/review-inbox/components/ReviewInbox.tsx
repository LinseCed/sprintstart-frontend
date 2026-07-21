import { useState } from 'react';
import { CheckCheck } from 'lucide-react';
import { GenerateControl } from './GenerateControl';
import { ReviewItemCard } from './ReviewItemCard';
import {
    GENERATION_KINDS,
    GENERATION_META,
    GENERATION_OF,
    type GenerationKind,
    type ReviewItemView,
} from '../types';
import type { UseReviewInbox } from '../hooks/useReviewInbox';

/**
 * The whole proposal queue, grouped by generator. One generate control and one review pattern per
 * group; the skill map also gets "Approve all", which lands its nodes and edges as one version so a
 * hire never sees a node before its prerequisites. `filterKind` narrows it to a single group when a
 * Setup rung deep-links in.
 */
export function ReviewInbox({
    inbox,
    canAct,
    filterKind,
}: {
    inbox: UseReviewInbox;
    canAct: boolean;
    filterKind?: GenerationKind;
}) {
    const kinds = filterKind ? [filterKind] : GENERATION_KINDS;
    return (
        <div className="space-y-6">
            {kinds.map((kind) => (
                <ReviewGroup key={kind} kind={kind} inbox={inbox} canAct={canAct} />
            ))}
        </div>
    );
}

function ReviewGroup({
    kind,
    inbox,
    canAct,
}: {
    kind: GenerationKind;
    inbox: UseReviewInbox;
    canAct: boolean;
}) {
    const [actingId, setActingId] = useState<string | null>(null);
    const items = inbox.items.filter((item) => GENERATION_OF[item.kind] === kind);
    const working = inbox.working.has(kind);
    const notes = inbox.notes[kind];
    const meta = GENERATION_META[kind];

    const act = async (item: ReviewItemView, run: (item: ReviewItemView) => Promise<void>) => {
        setActingId(item.id);
        try {
            await run(item);
        } finally {
            setActingId(null);
        }
    };

    return (
        <section className="rounded-2xl border border-app-border bg-app-bg p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2 text-base font-semibold text-app-text">
                    {meta.title}
                    <span className="rounded-full bg-app-surface-hover px-2 py-0.5 text-xs font-medium text-app-text-muted">
                        {items.length}
                    </span>
                </h3>
                {canAct && (
                    <div className="flex items-center gap-2">
                        {kind === 'skill-map' && items.length > 0 && (
                            <button
                                type="button"
                                onClick={() => void inbox.approveSkillMap()}
                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-app-border px-3.5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Approve all {items.length}
                            </button>
                        )}
                        <GenerateControl
                            kind={kind}
                            working={working}
                            onGenerate={(target) => void inbox.generate(target)}
                        />
                    </div>
                )}
            </div>

            {kind === 'skill-map' && items.length > 0 && (
                <p className="mt-2 text-xs text-app-text-muted">
                    Approving everything at once lands new nodes and their prerequisites together, so
                    hires see them already connected.
                </p>
            )}

            {notes && notes.length > 0 && (
                <ul className="mt-3 space-y-1 rounded-lg bg-app-brand-soft p-3 text-sm text-app-brand-text">
                    {notes.map((note) => (
                        <li key={note}>{note}</li>
                    ))}
                </ul>
            )}

            {items.length === 0 ? (
                <p className="mt-3 text-sm text-app-text-muted">
                    {working
                        ? 'Working… proposals will appear here as they are drafted.'
                        : 'Nothing waiting. Generate to propose some from the corpus.'}
                </p>
            ) : (
                <ul className="mt-3 space-y-2">
                    {items.map((item) => (
                        <ReviewItemCard
                            key={`${item.kind}-${item.id}`}
                            item={item}
                            canAct={canAct}
                            busy={actingId === item.id}
                            onApprove={(target) => void act(target, inbox.approve)}
                            onReject={(target) => void act(target, inbox.reject)}
                        />
                    ))}
                </ul>
            )}
        </section>
    );
}
