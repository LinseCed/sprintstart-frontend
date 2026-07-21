import { useState } from 'react';
import { ExternalLink, GitMerge, Loader2, Route } from 'lucide-react';
import { AutonomyBanner } from './AutonomyBanner';
import { SuggestedTasks } from './SuggestedTasks';
import { useGoalSelection } from '../../my-path/hooks/useGoalSelection';
import type { MyRamp } from '../types';

type RampSectionProps = {
    projectId: string;
    ramp: MyRamp | null;
    isLoading: boolean;
    error: string | null;
    onChanged: () => void | Promise<void>;
};

/**
 * The hire's home: the task they are on, with the next ones visible but not demanding.
 *
 * The framing this replaces was a curriculum with a percentage. What is here instead is the work:
 * one current task, a line saying what got you here, and a short list of what you could pick up
 * next — each with the reason it was suggested, and each pickable. **No score is rendered
 * anywhere**, on the ramp or on the suggestions.
 *
 * The suggestion list is collapsed by default when a hire already has a task. "Visible but not
 * demanding" is a layout decision: somebody mid-task should be able to see there is a next thing
 * without being invited to switch.
 */
export function RampSection({ projectId, ramp, isLoading, error, onChanged }: RampSectionProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [claimingId, setClaimingId] = useState<string | null>(null);
    const {
        matches,
        isLoading: matchesLoading,
        error: matchesError,
        loadMatches,
        claim
    } = useGoalSelection(projectId, onChanged);

    const openSuggestions = () => {
        setShowSuggestions(true);
        void loadMatches();
    };

    const pick = (taskId: string) => {
        setClaimingId(taskId);
        void (async () => {
            try {
                const claimed = await claim(taskId);
                if (claimed) setShowSuggestions(false);
            } finally {
                setClaimingId(null);
            }
        })();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center rounded-2xl border border-app-border bg-app-surface p-8">
                <Loader2 className="h-5 w-5 animate-spin text-app-brand" aria-hidden="true" />
            </div>
        );
    }

    if (error || !ramp) {
        return (
            <div className="rounded-2xl border border-app-border bg-app-surface p-4 text-sm text-app-danger-text">
                {error ?? 'Could not load where you are.'}
            </div>
        );
    }

    return (
        <section className="space-y-3">
            <AutonomyBanner autonomy={ramp.autonomy} />

            <div className="rounded-2xl border border-app-border bg-app-surface p-4">
                <div className="flex items-center gap-2">
                    <Route className="h-4 w-4 shrink-0 text-app-text-muted" aria-hidden="true" />
                    <h2 className="text-sm font-semibold text-app-text">What you&apos;re on</h2>
                    {ramp.mergedCount > 0 && (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs text-app-text-muted">
                            <GitMerge className="h-3 w-3" aria-hidden="true" />
                            {ramp.mergedCount} merged
                        </span>
                    )}
                </div>
                <p className="mt-1 text-xs text-app-text-muted">{ramp.unlockedBy}</p>

                {ramp.currentTask ? (
                    <div className="mt-3 rounded-xl border border-app-border bg-app-bg p-3">
                        <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-app-text">{ramp.currentTask.title}</p>
                            {ramp.currentTask.sourceUrl && (
                                <a
                                    href={ramp.currentTask.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-app-brand-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                >
                                    Open <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                </a>
                            )}
                        </div>
                        {ramp.currentTask.summary && (
                            <p className="mt-1 text-xs text-app-text-muted">{ramp.currentTask.summary}</p>
                        )}
                    </div>
                ) : (
                    <p className="mt-3 text-xs text-app-text-muted">
                        Nothing claimed right now. Pick something below whenever you&apos;re ready.
                    </p>
                )}

                {ramp.creditedCompetencyKeys.length > 0 && (
                    <p className="mt-2 text-[11px] text-app-text-subtle">
                        Merged work here counted toward {ramp.creditedCompetencyKeys.join(', ')}.
                    </p>
                )}

                <div className="mt-3">
                    {showSuggestions ? (
                        <>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-app-text-subtle">
                                {ramp.currentTask ? 'Or pick something else' : 'What you could pick up'}
                            </p>
                            <SuggestedTasks
                                matches={matches}
                                isLoading={matchesLoading}
                                error={matchesError}
                                claimingId={claimingId}
                                onPick={pick}
                            />
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={openSuggestions}
                            className="text-xs font-medium text-app-brand-text underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            {ramp.currentTask ? 'See what else is open' : 'See what you could work on'}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
