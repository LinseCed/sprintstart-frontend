import { ExternalLink, Flag, Loader2, Target } from 'lucide-react';
import type { PathGoal } from '../../starter-work/types';

type GoalBannerProps = {
    goal: PathGoal | null | undefined;
    /** Opens the goal's node in the detail panel. */
    onFocusGoal: (key: string) => void;
    /** Opens the picker so the hire can choose (or change) their goal. */
    onChooseGoal: () => void;
    isBusy?: boolean;
};

/**
 * The destination, stated at the top of the path.
 *
 * The premise of the whole product is that onboarding terminates in shipping something, and until
 * now the only expression of that was a flag icon on one node. This says where the hire is going
 * and how far off it is.
 *
 * Progress is counted toward *the goal* -- its own unmet prerequisites, straight from the payload
 * -- not "n of m nodes across the graph". A mandatory node the team requires of everyone is real
 * work, but it is not what stands between this hire and shipping this contribution.
 *
 * No goal is a first-class state with a next action, not an empty space.
 */
export function GoalBanner({ goal, onFocusGoal, onChooseGoal, isBusy = false }: GoalBannerProps) {
    if (!goal) {
        return (
            <div
                data-testid="goal-banner-empty"
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-app-border bg-app-surface-muted p-4"
            >
                <Target className="h-5 w-5 shrink-0 text-app-text-muted" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-app-text">
                        You haven&apos;t picked what you&apos;re working toward yet
                    </p>
                    <p className="text-xs text-app-text-muted">
                        Your path shows what the team expects of everyone. Choose a first
                        contribution and it&apos;ll also show the route to shipping it.
                    </p>
                </div>
                <button
                    type="button"
                    data-testid="choose-goal"
                    disabled={isBusy}
                    onClick={onChooseGoal}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    Pick a first contribution
                </button>
            </div>
        );
    }

    return (
        <div
            data-testid="goal-banner"
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-app-brand-border bg-app-brand-soft p-4"
        >
            <Flag className="h-5 w-5 shrink-0 text-app-brand-text" aria-hidden="true" />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-app-brand-text">
                    Working toward
                </p>
                <button
                    type="button"
                    data-testid="focus-goal"
                    onClick={() => onFocusGoal(goal.competencyKey)}
                    className="max-w-full truncate text-sm font-semibold text-app-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    {goal.label}
                </button>
                <p className="text-xs text-app-text-muted">
                    {goal.isReachable
                        ? 'Everything it needs is cleared — this is ready to start.'
                        : `${goal.remainingCount} ${
                              goal.remainingCount === 1 ? 'step' : 'steps'
                          } to go before you can start it.`}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {goal.sourceUrl && (
                    <a
                        href={goal.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-app-brand-text hover:underline"
                    >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        The task
                    </a>
                )}
                <button
                    type="button"
                    data-testid="change-goal"
                    disabled={isBusy}
                    onClick={onChooseGoal}
                    className="rounded-xl border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-text transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                    Change
                </button>
            </div>
        </div>
    );
}
