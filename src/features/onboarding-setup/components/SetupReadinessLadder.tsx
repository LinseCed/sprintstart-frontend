import { ArrowRight, CheckCircle2, CircleAlert, Lock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import type { LadderRung, RungState, SetupLadder } from '../types';

type StateStyle = {
    icon: LucideIcon;
    chip: string;
    label: string;
    dot: string;
};

const STATE_STYLES: Record<RungState, StateStyle> = {
    OK: {
        icon: CheckCircle2,
        chip: 'bg-app-success-bg text-app-success-text border border-app-success-border',
        label: 'Ready',
        dot: 'border-app-success-border bg-app-success-bg text-app-success-text',
    },
    WARN: {
        icon: CircleAlert,
        chip: 'bg-app-warning-bg text-app-warning-text border border-app-warning-border',
        label: 'Needs you',
        dot: 'border-app-warning-border bg-app-warning-bg text-app-warning-text',
    },
    BLOCKED: {
        icon: Lock,
        chip: 'bg-app-danger-bg text-app-danger-text border border-app-danger-border',
        label: 'Blocked',
        dot: 'border-app-danger-border bg-app-danger-bg text-app-danger-text',
    },
};

/**
 * The setup pipeline as a top-to-bottom ladder: each stage shows its state, the one thing to do
 * next, and a way into the page that does it. Answers "is this project ready to onboard someone?"
 * in one glance — the question no single setup page could answer before.
 */
export function SetupReadinessLadder({ ladder }: { ladder: SetupLadder }) {
    const needsAttention = ladder.rungs.filter((rung) => rung.state !== 'OK').length;

    return (
        <div className="space-y-5">
            <div
                className={`rounded-2xl border p-4 ${
                    ladder.ready
                        ? 'border-app-success-border bg-app-success-bg'
                        : 'border-app-border bg-app-bg'
                }`}
            >
                {ladder.ready ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-app-success-text">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        This project is ready to onboard someone. Every setup stage is done.
                    </p>
                ) : (
                    <p className="text-sm text-app-text-muted">
                        <span className="font-semibold text-app-text">
                            {needsAttention} stage{needsAttention === 1 ? '' : 's'}
                        </span>{' '}
                        need{needsAttention === 1 ? 's' : ''} attention before this project is ready
                        to onboard someone. Nothing is blocked from starting — this is a checklist,
                        not a gate.
                    </p>
                )}
            </div>

            <ol className="space-y-3">
                {ladder.rungs.map((rung) => (
                    <RungRow key={rung.key} rung={rung} />
                ))}
            </ol>
        </div>
    );
}

function RungRow({ rung }: { rung: LadderRung }) {
    const style = STATE_STYLES[rung.state];
    const StateIcon = style.icon;

    return (
        <li className="rounded-2xl border border-app-border bg-app-bg p-4">
            <div className="flex items-start gap-4">
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.dot}`}
                    aria-hidden="true"
                >
                    <StateIcon className="h-5 w-5" />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-app-text">{rung.title}</h3>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.chip}`}
                        >
                            {style.label}
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-app-text">{rung.detail}</p>
                    <p className="mt-1 text-sm text-app-text-muted">{rung.blurb}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <NavLink
                            to={rung.route}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-app-brand transition-colors hover:text-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            Open this stage
                            <ArrowRight className="h-4 w-4" />
                        </NavLink>
                        {rung.reviewKind && (
                            <NavLink
                                to={`/setup/review?kind=${rung.reviewKind}`}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-app-text-muted transition-colors hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                Review proposals
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
}
