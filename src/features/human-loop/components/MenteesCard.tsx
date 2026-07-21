import { AlertCircle, Check, Clock, MessageCircle, Users } from 'lucide-react';
import { useMentees } from '../hooks/useMentees';
import { firstName, formatDaysAgo } from '../format';
import type { Mentee } from '../types';

/**
 * The buddy's own side of the human loop: the hires counting on *them*, worst
 * first, with whatever is currently their move to make.
 *
 * This is the piece the slice was missing. The overdue-contact and waiting-on-a-
 * review signals already reached the hire (who can't act on their own move) and
 * the project lead (who has to relay it) — but never the buddy, the one person
 * who closes the loop in real life. This card puts that list in front of them.
 *
 * Renders nothing when the user mentors nobody, which is most people — so it can
 * sit on a shared surface (the dashboard) without cluttering it for everyone else.
 */
export function MenteesCard() {
    const { mentees, isLoading, error, loggingHireId, logContact } = useMentees();

    // The empty state is silence, not a card: a person who mentors nobody should
    // not see an onboarding widget aimed at buddies.
    if (!isLoading && !error && mentees.length === 0) return null;

    return (
        <div className="w-full max-w-4xl rounded-2xl border border-app-border bg-app-surface p-5 text-left">
            <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-app-brand" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-app-text">Counting on you</h2>
            </div>

            {isLoading ? (
                <div className="h-16 animate-pulse rounded-xl bg-app-surface-muted" />
            ) : error ? (
                <p className="text-sm text-app-danger-text">{error}</p>
            ) : (
                <ul className="space-y-3">
                    {mentees.map((mentee) => (
                        <MenteeRow
                            key={`${mentee.projectId}:${mentee.hireId}`}
                            mentee={mentee}
                            isLogging={loggingHireId === mentee.hireId}
                            onLog={() => void logContact(mentee)}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
}

function MenteeRow({
    mentee,
    isLogging,
    onLog
}: {
    mentee: Mentee;
    isLogging: boolean;
    onLog: () => void;
}) {
    const needsYou = mentee.alerts.length > 0;

    return (
        <li
            className={`rounded-xl border p-4 ${
                needsYou ? 'border-app-warning-border bg-app-warning-bg/40' : 'border-app-border bg-app-surface-muted'
            }`}
        >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-app-text">{mentee.hireName}</p>
                    {mentee.hireGithubLogin ? (
                        <a
                            href={`https://github.com/${mentee.hireGithubLogin}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-app-brand-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            <MessageCircle className="h-3 w-3" aria-hidden="true" />
                            Reach @{mentee.hireGithubLogin}
                        </a>
                    ) : (
                        <p className="mt-0.5 text-xs text-app-text-muted">Reach them on your usual channel</p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onLog}
                    disabled={isLogging}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition-colors hover:text-app-text disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {isLogging ? 'Saving…' : 'We spoke'}
                </button>
            </div>

            {needsYou ? (
                <ul className="mt-3 space-y-1.5">
                    {mentee.alerts.map((alert, i) => (
                        <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-app-text"
                        >
                            {alert.severity === 'BLOCKED' ? (
                                <AlertCircle
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-app-danger-text"
                                    aria-hidden="true"
                                />
                            ) : (
                                <Clock
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-app-warning-text"
                                    aria-hidden="true"
                                />
                            )}
                            <span>{alert.reason}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-2 text-xs text-app-text-muted">
                    On track — last spoke {formatDaysAgo(mentee.daysSinceContact)}. A check-in with{' '}
                    {firstName(mentee.hireName)} is never wasted.
                </p>
            )}
        </li>
    );
}
