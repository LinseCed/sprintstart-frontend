import { Link } from 'react-router-dom';
import { MessageSquareText } from 'lucide-react';
import type { TeamOverviewUser } from '../types';

type TeamMemberCardProps = {
    user: TeamOverviewUser;
    /**
     * Renders a denser variant (smaller avatar/text/paddings, role hidden)
     * for tight spaces like the PM Dashboard widget grid, while the default
     * size is used on the full Team Management page.
     */
    compact?: boolean;
};

/**
 * The bar a competency counts as held at.
 *
 * `GET /dashboard/users` carries no per-competency `targetLevel` (only the hire's own
 * `/me/competencies` does), so the default is applied -- intermediate, matching
 * `Competency.DEFAULT_TARGET_LEVEL`. A node whose PM raised its bar therefore reads as held one
 * rung early here. Same known imprecision as the member detail page; fixing it is backend work.
 */
const DEFAULT_TARGET_LEVEL = 2;

import { UserAvatar } from '../../../components/common/UserAvatar';
export function TeamMemberCard({ user, compact = false }: TeamMemberCardProps) {
    // What somebody can do, not how far through a checklist they are. Level 0 is "asked, saw no
    // competence" -- neither held nor in progress.
    const held = user.competencies.filter(entry => entry.level >= DEFAULT_TARGET_LEVEL);
    const inProgress = user.competencies.filter(
        entry => entry.level > 0 && entry.level < DEFAULT_TARGET_LEVEL
    );
    const verified = held.filter(entry => entry.source === 'VERIFIED');

    return (
        <Link
            to={`/team/${user.userId}`}
            className={`group relative flex flex-col rounded-2xl border border-app-border bg-app-surface transition-all hover:border-app-brand-border-strong hover:bg-app-surface-hover hover:shadow-md ${
                compact ? 'p-2' : 'p-4'
            }`}
        >
            <div
                className={`absolute flex items-center gap-1 ${
                    compact ? 'right-2 top-2' : 'right-3 top-3 gap-1.5'
                }`}
            >
                {user.hasFeedback && (
                    <span
                        title="Unread onboarding feedback"
                        className={`flex items-center justify-center rounded-full border border-app-warning-border bg-app-warning-bg text-app-warning-text shadow-sm ${
                            compact ? 'h-5 w-5' : 'h-6 w-6'
                        }`}
                    >
                        <MessageSquareText className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
                    </span>
                )}

            </div>

            <div className={`flex items-center gap-2 ${compact ? 'pr-7' : 'pr-14 gap-3'}`}>
                <div className="flex shrink-0 items-center justify-center">
                    <UserAvatar profileIcon={user.profileIcon} fallbackName={`${user.firstname} ${user.lastname}`.trim()} seed={user.userId} size={compact ? 26 : 40} />
                </div>

                <div className="min-w-0">
                    <p
                        className={`truncate font-semibold text-app-text ${
                            compact ? 'text-xs' : 'text-sm'
                        }`}
                    >
                        {user.firstname} {user.lastname}
                    </p>
                    {!compact && (
                        <p className="text-sm text-app-text-muted">
                            {user.roles.length > 0
                                ? user.roles.map((role) => role.name).join(', ')
                                : 'No role assigned'}
                        </p>
                    )}
                </div>
            </div>

            <div className={compact ? 'mt-2' : 'mt-3'}>
                <div className="flex items-baseline gap-1.5">
                    <span
                        className={`font-semibold tabular-nums text-app-text ${
                            compact ? 'text-sm' : 'text-base'
                        }`}
                    >
                        {held.length}
                    </span>
                    <span className={`text-app-text-muted ${compact ? 'text-[10px]' : 'text-xs'}`}>
                        {held.length === 1 ? 'competency held' : 'competencies held'}
                    </span>
                </div>

                {!compact && (
                    <p className="mt-1 text-xs text-app-text-muted">
                        {/* Verified is a materially stronger claim than assessed, so it is worth
                            distinguishing rather than folding into one count. */}
                        {verified.length} verified by a passed check
                        {inProgress.length > 0 && ` · ${inProgress.length} below target`}
                    </p>
                )}

                {user.competencies.length === 0 && (
                    <p className={`mt-1 text-app-text-subtle ${compact ? 'text-[10px]' : 'text-xs'}`}>
                        No assessment yet
                    </p>
                )}
            </div>
        </Link>
    );
}
