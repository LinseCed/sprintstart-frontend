import { Check, Clock, MessageCircle, Sparkles, UserRound } from 'lucide-react';
import { openAiBuddy } from '../../buddy/aiBuddyBus';
import { useMyBuddy } from '../hooks/useMyBuddy';
import { firstName, formatDaysAgo, formatHours } from '../format';

type BuddyCardProps = {
    projectId: string;
};

/**
 * The human loop on the hire's surface: who your buddy is, when you last spoke,
 * a genuine way to reach them, and — set apart — how long your pull request has
 * been waiting on a review.
 *
 * Buddy-first (Buddy Enhancement Iteration, F5): the AI buddy leads — it answers
 * instantly from the project's docs and the hire's own state, and escalates to a
 * person (the PM) itself when it can't. The *human* buddy is kept, deliberately, as
 * the last-resort path and the study's control arm — demoted, not deleted. The
 * PR-wait line exists to tell a stuck newcomer, in as many words, that the delay is
 * on the reviewer and not a reflection on their work.
 *
 * Rendered inside `/my-path`, which already scopes to a selected project.
 */
export function BuddyCard({ projectId }: BuddyCardProps) {
    const { buddy, timeline, isLoading, error, isLogging, logContact } = useMyBuddy(projectId);

    if (!projectId) return null;

    const waitHours = timeline?.longestOpenWaitHours ?? null;
    const showWait = waitHours !== null && (timeline?.openPullRequestCount ?? 0) > 0;

    return (
        <div className="rounded-2xl border border-app-border bg-app-surface p-5">
            <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-4 w-4 text-app-brand" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-app-text">Your buddy</h2>
            </div>

            {isLoading ? (
                <div className="h-16 animate-pulse rounded-xl bg-app-surface-muted" />
            ) : error ? (
                <p className="text-sm text-app-danger-text">{error}</p>
            ) : buddy ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-app-text">
                                {buddy.buddyName}
                            </p>
                            {buddy.buddyGithubLogin ? (
                                <a
                                    href={`https://github.com/${buddy.buddyGithubLogin}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-0.5 inline-flex items-center gap-1 text-sm text-app-brand-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                >
                                    @{buddy.buddyGithubLogin} on GitHub
                                </a>
                            ) : (
                                <p className="mt-0.5 text-sm text-app-text-muted">
                                    Reach them on your usual channel
                                </p>
                            )}
                        </div>

                        {buddy.overdue && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-app-warning-bg px-2.5 py-1 text-xs font-medium text-app-warning-text">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                Worth a check-in
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-app-text-muted">
                        {buddy.lastContactAt
                            ? `You last spoke ${formatDaysAgo(buddy.daysSinceContact)}.`
                            : "You haven't logged a conversation yet."}{' '}
                        {buddy.overdue &&
                            `You aim to talk about every ${buddy.cadenceTargetDays} days.`}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Buddy-first: the AI buddy is the first-class action — instant, and it
                            escalates to your PM itself when it can't help. Reaching the human buddy
                            is kept as a genuine last resort (the study's control arm), demoted. */}
                        <button
                            type="button"
                            onClick={() => openAiBuddy()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            Ask your buddy
                        </button>

                        {buddy.buddyGithubLogin ? (
                            <a
                                href={`https://github.com/${buddy.buddyGithubLogin}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-app-border px-3.5 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                Prefer a person? Ask {firstName(buddy.buddyName)}
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={() =>
                                    openAiBuddy({
                                        draft: `Help me write a short message to my onboarding buddy ${firstName(
                                            buddy.buddyName
                                        )} asking for help with `
                                    })
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl border border-app-border px-3.5 py-2 text-sm font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                            >
                                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                                Prefer a person? Ask {firstName(buddy.buddyName)}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => void logContact()}
                            disabled={isLogging}
                            className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium text-app-text-muted transition-colors hover:text-app-text disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            {isLogging ? 'Saving…' : 'We spoke'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-app-text-muted">
                        Your buddy answers from the project&apos;s docs and your own progress, and
                        flags your PM when it can&apos;t. Your PM may also pair you with a person to
                        reach directly.
                    </p>
                    <button
                        type="button"
                        onClick={() => openAiBuddy()}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Ask your buddy
                    </button>
                </div>
            )}

            {showWait && waitHours !== null && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-app-border bg-app-surface-muted p-4">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-app-brand-text" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-medium text-app-text">
                            Your pull request has been waiting {formatHours(waitHours)} for a review.
                        </p>
                        <p className="mt-0.5 text-xs text-app-text-muted">
                            The clock is on the reviewer now — this isn&apos;t a reflection on your
                            work. A nudge to {buddy ? firstName(buddy.buddyName) : 'your buddy'} is
                            fair game.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
