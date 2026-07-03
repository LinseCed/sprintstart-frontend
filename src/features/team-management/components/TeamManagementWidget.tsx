// ============================================================
// TeamManagementWidget.tsx
// Dashboard widget — shows the 4 most stuck team members
// (longest time on current step) plus unread counts for
// pending feedback and skip requests.
// Clicking "See all" or a member card navigates to the
// Team Management page / member detail page.
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowRight, Loader2, AlertCircle, MessageSquareText, SkipForward } from 'lucide-react';
import { getTeamOverview } from '../../../services/teamManagementService';
import type { TeamOverviewUser } from '../types';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const AT_RISK_AFTER_DAYS = 5;

function getElapsedDays(startedAt: string): number {
    return Math.max(
        0,
        Math.floor((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24))
    );
}

import { UserAvatar } from '../../../components/common/UserAvatar';
// SUB-COMPONENT: badge pill used in the widget header
// ─────────────────────────────────────────────────────────────

type CountBadgeProps = {
    icon: React.ReactNode;
    count: number;
    label: string;
    /** soft = brand-tinted background, muted = neutral */
    variant: 'soft' | 'muted';
};

function CountBadge({ icon, count, label, variant }: CountBadgeProps) {
    const base = 'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium';
    const styles =
        variant === 'soft'
            ? `${base} bg-app-brand-soft text-app-brand-text`
            : `${base} bg-app-surface-muted text-app-text-muted`;

    return (
        <span className={styles} title={label}>
            {icon}
            {count}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENT: single member row inside the widget
// ─────────────────────────────────────────────────────────────

type MemberRowProps = {
    user: TeamOverviewUser;
    onClick: () => void;
};

function MemberRow({ user, onClick }: MemberRowProps) {
    const elapsedDays = user.currentStep?.startedAt
        ? getElapsedDays(user.currentStep.startedAt)
        : 0;
    const progressPercentage = Math.round(user.progressPercentage * 100);
    const isAtRisk = !!user.currentStep && elapsedDays > AT_RISK_AFTER_DAYS;

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left flex items-center gap-3 rounded-xl border border-app-border bg-app-surface hover:border-app-brand-border-strong hover:bg-app-surface-hover transition-colors p-3"
        >
            {/* Avatar */}
            <div className="flex shrink-0 items-center justify-center">
                <UserAvatar profileIcon={user.profileIcon} fallbackName={user.firstname} size={32} />
            </div>

            {/* Name + step */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-app-text">
                    {user.firstname} {user.lastname}
                </p>
                <p className="truncate text-xs text-app-text-muted">
                    {user.currentStep?.title ?? 'No current step'}
                </p>

                {/* Progress bar */}
                <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-app-progress-track">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-app-progress-fill to-app-progress-fill-end transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <span className="text-xs tabular-nums text-app-text-muted">
                        {progressPercentage}%
                    </span>
                </div>
            </div>

            {/* Elapsed days — highlighted when at risk */}
            <span
                className={`shrink-0 text-xs font-medium tabular-nums ${
                    isAtRisk ? 'text-app-warning-text' : 'text-app-text-muted'
                }`}
            >
                {user.currentStep ? `${elapsedDays}d` : '—'}
            </span>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: TeamManagementWidget
// ─────────────────────────────────────────────────────────────

export function TeamManagementWidget() {
    const [users, setUsers] = useState<TeamOverviewUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getTeamOverview();
                setUsers(data);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    // ── LOADING ──────────────────────────────────────────────

    if (loading) {
        return (
            <div className="rounded-2xl border border-app-border bg-app-surface p-6 flex items-center justify-center min-h-48">
                <Loader2 className="w-5 h-5 animate-spin text-app-brand" />
            </div>
        );
    }

    // ── ERROR ────────────────────────────────────────────────

    if (error || users.length === 0) {
        return (
            <div className="rounded-2xl border border-app-border bg-app-surface p-6 flex flex-col items-center justify-center gap-2 min-h-48 text-center">
                <AlertCircle className="w-5 h-5 text-app-text-muted" />
                <p className="text-sm text-app-text-muted">
                    Could not load team data.
                </p>
            </div>
        );
    }

    // ── DERIVED DATA ─────────────────────────────────────────

    // Sort by longest time on current step (most stuck first), take top 4
    const mostStuck = [...users]
        .sort(
            (a, b) => {
                if (!a.currentStep?.startedAt) return 1;
                if (!b.currentStep?.startedAt) return -1;

                return (
                    new Date(a.currentStep.startedAt).getTime() -
                    new Date(b.currentStep.startedAt).getTime()
                );
            }
        )
        .slice(0, 4);

    // Unread counts across ALL users, not just the visible 4
    const pendingFeedbackCount = users.filter((u) => u.hasFeedback).length;
    const pendingSkipCount = users.filter(
        (u) => u.currentStep?.skip?.status === 'PENDING'
    ).length;

    // ── RENDER ───────────────────────────────────────────────

    return (
        <div className="rounded-2xl border border-app-border bg-app-surface p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-app-brand" />
                    <span className="text-sm font-semibold text-app-text">
                        Team progress
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => void navigate('/team-management')}
                    className="flex items-center gap-1 text-xs text-app-text-muted hover:text-app-text transition-colors"
                >
                    See all ({users.length})
                    <ArrowRight className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Unread count badges — only render the badges that have a count */}
            {(pendingFeedbackCount > 0 || pendingSkipCount > 0) && (
                <div className="flex items-center gap-2 mb-4">
                    {pendingFeedbackCount > 0 && (
                        <CountBadge
                            icon={<MessageSquareText className="w-3 h-3" />}
                            count={pendingFeedbackCount}
                            label={`${pendingFeedbackCount} unread feedback`}
                            variant="soft"
                        />
                    )}
                    {pendingSkipCount > 0 && (
                        <CountBadge
                            icon={<SkipForward className="w-3 h-3" />}
                            count={pendingSkipCount}
                            label={`${pendingSkipCount} open skip request${pendingSkipCount > 1 ? 's' : ''}`}
                            variant="muted"
                        />
                    )}
                </div>
            )}

            {/* Member rows */}
            <div className="flex flex-col gap-2">
                {mostStuck.map((user) => (
                    <MemberRow
                        key={user.userId}
                        user={user}
                        onClick={() => void navigate(`/team/${user.userId}`)}
                    />
                ))}
            </div>
        </div>
    );
}
