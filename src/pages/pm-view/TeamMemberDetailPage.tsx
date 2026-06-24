import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { TeamOverviewUser } from '../../features/team-management/types';
import { getTeamMember } from '../../services/teamManagementService';

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

export function TeamMemberDetailPage() {
    const { userId } = useParams<{ userId: string }>();

    const navigate = useNavigate();

    const [user, setUser] = useState<TeamOverviewUser | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadMember() {
            if (!userId) {
                setLoading(false);
                return;
            }

            const data = await getTeamMember(userId);

            setUser(data);
            setLoading(false);
        }

        void loadMember();
    }, [userId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center">
                <p className="text-sm text-app-text-muted">
                    Loading team member...
                </p>
            </div>
        );
    }

    function goBack() {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            void navigate(-1);
        } else {
            void navigate('/team-management');
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-app-bg">
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-1.5 text-sm text-app-text-muted hover:text-app-text"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to team
                    </button>

                    <div className="mt-6 rounded-3xl border border-app-border bg-app-surface p-8">
                        <p className="text-sm text-app-text">
                            Team member not found.
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    const elapsedDays = getElapsedDays(user.currentStep.startedAt);
    const progressPercentage = Math.round(
        user.progressPercentage * 100
    );

    return (
        <div className="min-h-screen bg-app-bg">
            <div className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-1.5 text-sm text-app-text-muted hover:text-app-text mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to team
                    </button>

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-brand-soft text-lg font-semibold text-app-brand-text">
                                {getInitials(
                                    user.firstname,
                                    user.lastname
                                )}
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-app-text">
                                    {user.firstname} {user.lastname}
                                </h1>
                                <p className="text-sm text-app-text-muted">
                                    {user.roles.length > 0
                                        ? user.roles.map((role) => role.name).join(', ')
                                        : 'No role assigned'}
                                </p>
                            </div>
                        </div>

                        <div className="lg:text-right">
                            <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                                Current Step
                                <span className="ml-2 font-normal normal-case">
                                    · {elapsedDays}{' '}
                                    {elapsedDays === 1
                                        ? 'day'
                                        : 'days'}{' '}
                                    ago
                                </span>
                            </p>

                            <p className="mt-2 text-sm font-medium text-app-text">
                                {user.currentStep.title}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-app-border-muted">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-app-brand to-app-progress-fill-end transition-all duration-500"
                                style={{
                                    width: `${progressPercentage}%`,
                                }}
                            />
                        </div>

                        <span className="text-sm font-medium tabular-nums text-app-text">
                            {progressPercentage}%
                        </span>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 pt-8">
                <div className="rounded-3xl border border-app-border bg-app-surface p-6 sm:p-8">
                    <p className="text-sm text-app-text-muted">
                        Feedback, skill gaps and onboarding insights will
                        appear here.
                    </p>
                </div>
            </main>
        </div>
    );
}