import { useState } from 'react';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { arrivalService } from '../../../services/arrivalService';
import { BoardCardFrame } from './BoardCardFrame';
import { AskTheBuddy } from './AskTheBuddy';
import type { ArrivalStep } from '../../arrival/types';
import type { ArrivalStepsContent, BoardCard } from '../types';

type ArrivalStepsCardProps = {
    content: ArrivalStepsContent;
    card: Pick<BoardCard, 'id' | 'owner' | 'placedAt'>;
    onDismiss?: (cardId: string) => void;
    dismissing?: boolean;
    onMove?: (cardId: string, direction: 'up' | 'down') => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
};

/**
 * What still has to be true before this hire can work: accounts, access, a machine that builds.
 *
 * ### It shows outstanding work; it does not withhold anything
 *
 * Nothing on this card blocks a hire from claiming a task or reading anything else. Somebody stuck
 * waiting on IT can see exactly what they are waiting on, and get on with whatever else they like
 * meanwhile — being blocked by your employer must not also mean being blocked by the tool.
 *
 * ### No progress bar, and this is not an oversight
 *
 * A step the system observed and a step the hire ticked are different facts. The onboarding model
 * this replaces averaged them into one `progressPercentage` that counted a ticked box exactly like
 * a passed check, and that is what made it meaningless. The subtitle says what is known and leaves
 * the arithmetic to the reader.
 *
 * Confirmation is applied here rather than through the board's write path: settling a step is a
 * fact about the hire, not an edit to the board, and the card owns the optimistic update the same
 * way the diagram card owns its revalidation.
 */
export function ArrivalStepsCard({
    content,
    card,
    onDismiss,
    dismissing,
    onMove,
    canMoveUp,
    canMoveDown,
}: ArrivalStepsCardProps) {
    // Derived, not synced: the card re-reads on every board load, and a confirmation that has
    // landed should not be undone by a stale prop. Same shape the diagram card uses for `redrawn`.
    const [confirmed, setConfirmed] = useState<Record<string, ArrivalStep>>({});
    const [pendingKey, setPendingKey] = useState<string | null>(null);
    const [failedKey, setFailedKey] = useState<string | null>(null);

    const steps = content.steps.map((step) => confirmed[step.key] ?? step);
    const outstanding = steps.filter((step) => !step.settled).length;
    const observed = steps.filter((step) => step.rigor === 'OBSERVED').length;
    const declared = steps.filter((step) => step.rigor === 'DECLARED').length;

    async function confirm(step: ArrivalStep) {
        setPendingKey(step.key);
        setFailedKey(null);
        try {
            const settled = await arrivalService.confirmStep(step.key);
            setConfirmed((current) => ({ ...current, [step.key]: settled }));
        } catch {
            setFailedKey(step.key);
        } finally {
            setPendingKey(null);
        }
    }

    return (
        <BoardCardFrame
            title="Getting you set up"
            card={card}
            onDismiss={onDismiss}
            dismissing={dismissing}
            onMove={onMove}
            canMoveUp={canMoveUp}
            canMoveDown={canMoveDown}
            subtitle={summarise({ observed, declared, outstanding })}
        >
            <ul className="space-y-2">
                {steps.map((step) => (
                    <li
                        key={step.key}
                        className={`rounded-xl border p-3 ${
                            step.settled ? 'border-app-border bg-app-surface-muted/40' : 'border-app-border'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p
                                    className={`text-sm ${
                                        step.settled ? 'text-app-text-muted' : 'text-app-text'
                                    }`}
                                >
                                    {step.title}
                                </p>
                                {step.description && (
                                    <p className="mt-1 text-xs text-app-text-muted">{step.description}</p>
                                )}
                                {step.settled && <SettledNote step={step} />}
                                {failedKey === step.key && (
                                    <p className="mt-1 text-xs text-app-danger-text">
                                        That didn&apos;t save. Try again in a moment.
                                    </p>
                                )}
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                {step.href && !step.settled && (
                                    <a
                                        href={step.href}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-app-text-muted transition hover:text-app-text"
                                        aria-label={`Open the page for "${step.title}"`}
                                    >
                                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                                    </a>
                                )}
                                {step.settled ? (
                                    <Check
                                        className="h-4 w-4 text-app-success-text"
                                        aria-label="Done"
                                    />
                                ) : (
                                    step.settledBy === 'DECLARED' && (
                                        <button
                                            type="button"
                                            onClick={() => void confirm(step)}
                                            disabled={pendingKey === step.key}
                                            className="rounded-lg border border-app-border px-2 py-1 text-xs text-app-text transition hover:bg-app-surface-muted disabled:opacity-60"
                                        >
                                            {pendingKey === step.key ? (
                                                <Loader2
                                                    className="h-3.5 w-3.5 animate-spin"
                                                    aria-label={`Saving "${step.title}"`}
                                                />
                                            ) : (
                                                "I've done this"
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            <AskTheBuddy
                question={
                    outstanding > 0
                        ? "I'm stuck on one of my setup steps — who do I ask?"
                        : "I'm set up now. What should I look at first?"
                }
            />
        </BoardCardFrame>
    );
}

/**
 * How this hire's step was established, said plainly.
 *
 * The hire's own word is attributed to them rather than presented as something the system knows.
 * That difference is the whole reason rigor is stored, and hiding it here would put it back.
 */
function SettledNote({ step }: { step: ArrivalStep }) {
    return (
        <p className="mt-1 text-xs text-app-text-muted">
            {step.rigor === 'OBSERVED' ? 'Confirmed automatically' : 'You marked this done'}
        </p>
    );
}

/**
 * The subtitle: what is known, never one figure standing for all of it.
 *
 * Counts are named by *how* they were established precisely so they cannot be read as a single
 * score. When everything is settled there is nothing left to count, so it says so instead.
 */
function summarise({
    observed,
    declared,
    outstanding,
}: {
    observed: number;
    declared: number;
    outstanding: number;
}): string {
    if (outstanding === 0) {
        return 'Nothing outstanding';
    }

    const settled = [
        observed > 0 ? `${observed} confirmed` : null,
        declared > 0 ? `${declared} you told us about` : null,
    ].filter(Boolean);

    return [`${outstanding} still to do`, ...settled].join(' · ');
}
