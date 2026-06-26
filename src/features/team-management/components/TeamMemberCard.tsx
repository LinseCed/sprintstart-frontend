import { Link } from 'react-router-dom';
import { MessageSquareText, SkipForward } from 'lucide-react';
import type { TeamOverviewUser } from '../types';

type TeamMemberCardProps = {
    user: TeamOverviewUser;
};

const AT_RISK_AFTER_DAYS = 5;

function getElapsedDays(startedAt: string): number {
    const started = new Date(startedAt).getTime();

    return Math.max(
        0,
        Math.floor((Date.now() - started) / (1000 * 60 * 60 * 24))
    );
}

function getInitials(firstname: string, lastname: string): string {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
}

export function TeamMemberCard({ user }: TeamMemberCardProps) {
    const elapsedDays = user.currentStep?.startedAt
        ? getElapsedDays(user.currentStep.startedAt)
        : 0;

    const progressPercentage = Math.round(user.progressPercentage * 100);
    const isAtRisk = !!user.currentStep && elapsedDays > AT_RISK_AFTER_DAYS;

    const hasPendingSkipRequest =
        user.currentStep?.skip?.status === 'PENDING';

    return (
        <Link
            to={`/team/${user.userId}`}
            className="group relative flex flex-col rounded-2xl border border-app-border bg-app-surface p-4 transition-all hover:border-app-brand-border-strong hover:bg-app-surface-hover hover:shadow-md"
        >
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
                {user.hasFeedback && (
                    <span
                        title="Has left feedback on this path"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-app-brand-soft text-app-brand-text"
                    >
                        <MessageSquareText className="h-3 w-3" />
                    </span>
                )}

                {hasPendingSkipRequest && (
                    <span
                        title="Open skip request"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-app-surface-muted text-app-text-muted"
                    >
                        <SkipForward className="h-3 w-3" />
                    </span>
                )}
            </div>

            <div className="flex items-center gap-3 pr-14">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-app-brand-soft text-xs font-semibold text-app-brand-text">
                    {getInitials(user.firstname, user.lastname)}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-app-text">
                        {user.firstname} {user.lastname}
                    </p>
                    <p className="text-sm text-app-text-muted">
                        {user.roles.length > 0
                            ? user.roles.map((role) => role.name).join(', ')
                            : 'No role assigned'}
                    </p>
                </div>
            </div>

            <div className="mt-3">
                <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-medium text-app-text">
                        {user.currentStep?.title ?? 'No current step'}
                    </p>

                    <span
                        className={`shrink-0 text-xs ${
                            isAtRisk
                                ? 'font-medium text-app-warning-text'
                                : 'text-app-text-muted'
                        }`}
                    >
                        {user.currentStep ? `${elapsedDays}d` : '—'}
                    </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-progress-track">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-app-progress-fill to-app-progress-fill-end transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    <span className="text-xs font-medium tabular-nums text-app-text">
                        {progressPercentage}%
                    </span>
                </div>
            </div>
        </Link>
    );
}