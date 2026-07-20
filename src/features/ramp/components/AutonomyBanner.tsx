import { CircleDot, PartyPopper } from 'lucide-react';
import type { Autonomy } from '../types';

type AutonomyBannerProps = {
    autonomy: Autonomy;
};

function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? null
        : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * The end of onboarding, announced rather than inferred.
 *
 * It says **what it means**, in the same words the system used to decide it: a change shipped with
 * no help and no rework. A badge saying "Autonomous" with no definition would be a grade somebody
 * received rather than a thing they did — and the whole reason this replaced a completion
 * percentage is that a percentage cannot be pointed at.
 *
 * Before it happens the banner shows what is missing, not a score. "Not autonomous yet" without a
 * reason is a verdict; with one it is a next step.
 */
export function AutonomyBanner({ autonomy }: AutonomyBannerProps) {
    if (autonomy.reached) {
        const on = formatDate(autonomy.reachedAt);
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-app-success-border bg-app-success-bg/40 p-4">
                <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-app-success-solid" aria-hidden="true" />
                <div>
                    <p className="text-sm font-semibold text-app-text">
                        You&apos;re off the ramp{on ? ` — ${on}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-app-text-muted">
                        You shipped a change here with no help and no rework. That&apos;s the whole
                        definition — not a score, and nothing left to complete. Onboarding is done;
                        the buddy and the docs stay where they are if you want them.
                    </p>
                </div>
            </div>
        );
    }

    if (autonomy.blockers.length === 0) return null;

    return (
        <div className="rounded-2xl border border-app-border bg-app-surface-muted p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                Still on the ramp
            </p>
            <p className="mt-1 text-xs text-app-text-muted">
                Onboarding ends when you ship a change with no help and no rework. Right now:
            </p>
            <ul className="mt-2 space-y-1">
                {autonomy.blockers.map((blocker) => (
                    <li key={blocker} className="flex items-start gap-2 text-xs text-app-text-muted">
                        <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-app-text-disabled" aria-hidden="true" />
                        {blocker}
                    </li>
                ))}
            </ul>
            <p className="mt-2 text-[11px] text-app-text-subtle">
                Neither of those is a mark against you — needing a review is how the work gets
                better, and it is expected for a while.
            </p>
        </div>
    );
}
