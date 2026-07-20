import { useState } from 'react';
import { AlertCircle, Check, HeartHandshake, Loader2, Settings2, UserRound } from 'lucide-react';
import { useAuth } from '../../../context/useAuth';
import { PermissionGroup } from '../../../services/types';
import { useAttention } from '../hooks/useAttention';
import { formatDaysAgo } from '../format';
import { BuddyAssignmentModal } from './BuddyAssignmentModal';
import type { AttentionItem } from '../types';

type AttentionWidgetProps = {
    projectId: string;
};

function severityChip(item: AttentionItem) {
    if (item.severity === 'BLOCKED') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-app-warning-bg px-2 py-0.5 text-xs font-medium text-app-warning-text">
                Waiting
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-app-danger-bg px-2 py-0.5 text-xs font-medium text-app-danger-text">
            Drifting
        </span>
    );
}

/**
 * PM/HR/ADMIN dashboard widget: who on a project needs a human today, longest
 * wait first, plus a one-click way to log that a conversation happened.
 *
 * Each item states whose move it is (`ownedByBuddy`): a hire waiting four days on
 * a review cannot fix that themselves, so it is never framed as the hire being
 * behind. Assigning and removing buddies is PM/ADMIN only (HR can see the list
 * and log contacts, but not change pairings), matching the backend's split.
 */
export function AttentionWidget({ projectId }: AttentionWidgetProps) {
    const { profile } = useAuth();
    const canManage =
        profile?.permissionGroup === PermissionGroup.PM ||
        profile?.permissionGroup === PermissionGroup.ADMIN;

    const { attention, isLoading, error, loggingHireId, logContactFor, reload } =
        useAttention(projectId);
    const [isManaging, setIsManaging] = useState(false);

    return (
        <div className="rounded-2xl border border-app-border bg-app-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <HeartHandshake className="h-4 w-4 text-app-brand" aria-hidden="true" />
                    <span className="text-sm font-semibold text-app-text">Who needs a human</span>
                </div>
                {canManage && (
                    <button
                        type="button"
                        onClick={() => setIsManaging(true)}
                        disabled={!projectId}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition-colors hover:text-app-text disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Manage buddies
                    </button>
                )}
            </div>

            {attention && (
                <p className="mb-4 text-xs text-app-text-muted">
                    {attention.withBuddyCount} of {attention.memberCount} paired ·{' '}
                    {attention.recentContactCount} conversation
                    {attention.recentContactCount === 1 ? '' : 's'} logged in the last 30 days
                </p>
            )}

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-app-brand" aria-hidden="true" />
                </div>
            ) : error ? (
                <div className="flex items-center gap-2 py-4 text-sm text-app-danger-text">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    {error}
                </div>
            ) : !attention || attention.items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Check className="h-5 w-5 text-app-success-solid" aria-hidden="true" />
                    <p className="text-sm text-app-text-muted">
                        Nobody is waiting or drifting right now.
                    </p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {attention.items.map(item => (
                        <li
                            key={item.hireId}
                            className="flex items-start justify-between gap-3 rounded-xl border border-app-border bg-app-bg p-3"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <UserRound
                                        className="h-3.5 w-3.5 shrink-0 text-app-text-muted"
                                        aria-hidden="true"
                                    />
                                    <span className="truncate text-sm font-medium text-app-text">
                                        {item.hireName}
                                    </span>
                                    {severityChip(item)}
                                </div>
                                <p className="mt-1 text-xs text-app-text-muted">
                                    {item.reason} · {formatDaysAgo(item.days)}
                                    {item.buddyName ? ` · buddy ${item.buddyName}` : ' · no buddy'}
                                </p>
                            </div>

                            {item.buddyId ? (
                                <button
                                    type="button"
                                    onClick={() => void logContactFor(item.hireId)}
                                    disabled={loggingHireId === item.hireId}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-app-border px-2.5 py-1.5 text-xs font-medium text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                >
                                    {loggingHireId === item.hireId ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                    )}
                                    Log contact
                                </button>
                            ) : (
                                canManage && (
                                    <button
                                        type="button"
                                        onClick={() => setIsManaging(true)}
                                        className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-app-brand-text transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                    >
                                        Assign
                                    </button>
                                )
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {canManage && (
                <BuddyAssignmentModal
                    isOpen={isManaging}
                    projectId={projectId}
                    onClose={() => setIsManaging(false)}
                    onChanged={() => void reload()}
                />
            )}
        </div>
    );
}
