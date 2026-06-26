import { ArrowLeft, Plus, X, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type {
    ProjectRole,
    TeamOverviewUser,
} from '../../features/team-management/types';
import {
    assignProjectRoleToUser,
    getProjectRoles,
    getTeamMember,
    unassignProjectRoleFromUser,
    getUserSkillLevels,
    type UserSkillLevel,
} from '../../services/teamManagementService';

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
    const [availableRoles, setAvailableRoles] = useState<ProjectRole[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [loading, setLoading] = useState(true);
    const [rolesModalOpen, setRolesModalOpen] = useState(false);
    const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
    const [roleToRemove, setRoleToRemove] = useState<ProjectRole | null>(null);
    const [skillLevels, setSkillLevels] = useState<UserSkillLevel[]>([]);

    useEffect(() => {
        async function loadMember() {
            if (!userId) {
                setLoading(false);
                return;
            }

            const skills = await getUserSkillLevels(userId);
            setSkillLevels(skills);

            const [memberData, rolesData] = await Promise.all([
                getTeamMember(userId),
                getProjectRoles(),
            ]);

            setUser(memberData);
            setAvailableRoles(rolesData);
            setLoading(false);
        }

        void loadMember();
    }, [userId]);

    const unassignedRoles = useMemo(() => {
        if (!user) return [];

        return availableRoles.filter(
            (role) =>
                !user.roles.some((assignedRole) => assignedRole.id === role.id)
        );
    }, [availableRoles, user]);

    async function handleAddRole() {
        if (!user || !selectedRoleId) return;

        const roleToAdd = availableRoles.find(
            (role) => role.id === selectedRoleId
        );

        if (!roleToAdd) return;

        setSavingRoleId(selectedRoleId);

        await assignProjectRoleToUser(user.userId, selectedRoleId);

        setUser({
            ...user,
            roles: [...user.roles, roleToAdd],
        });

        setSelectedRoleId('');
        setSavingRoleId(null);
    }

    async function handleRemoveRole(roleId: string) {
        if (!user) return;

        setSavingRoleId(roleId);

        await unassignProjectRoleFromUser(user.userId, roleId);

        setUser({
            ...user,
            roles: user.roles.filter((role) => role.id !== roleId),
        });

        setSavingRoleId(null);
    }

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
                        Back
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

    const elapsedDays = user.currentStep?.startedAt ? getElapsedDays(user.currentStep.startedAt) : 0;
    const progressPercentage = Math.round(user.progressPercentage * 100);

    return (
        <div className="min-h-screen bg-app-bg">
            <div className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-1.5 text-sm text-app-text-muted hover:text-app-text mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-app-brand-soft text-lg font-semibold text-app-brand-text">
                                {getInitials(user.firstname, user.lastname)}
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold text-app-text">
                                    {user.firstname} {user.lastname}
                                </h1>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {user.roles.length > 0 ? (
                                        user.roles.map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setRolesModalOpen(true)}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs font-medium text-app-text-muted transition-colors hover:border-app-brand hover:text-app-brand"
                                                title="Edit roles"
                                            >
                                                <span>{role.name}</span>
                                                <Pencil className="h-3 w-3" />
                                            </button>
                                        ))
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setRolesModalOpen(true)}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-app-border px-3 py-1 text-xs font-medium text-app-text-muted transition-colors hover:border-app-brand hover:text-app-brand"
                                            title="Choose role"
                                        >
                                            <span>Choose role</span>
                                            <Pencil className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:text-right">
                            <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                                Current Step
                                {user.currentStep?.startedAt && (
                                    <span className="ml-2 font-normal normal-case">
                                        · {elapsedDays}{' '}
                                        {elapsedDays === 1 ? 'day' : 'days'} ago
                                    </span>
                                )}
                            </p>

                            <p className="mt-2 text-sm font-medium text-app-text">
                                {user.currentStep?.title || 'Onboarding Completed'}
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
                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                        <h2 className="text-lg font-semibold text-app-text">
                            Skill Assessment
                        </h2>

                        {skillLevels.length === 0 ? (
                            <p className="mt-3 text-sm text-app-text-muted">
                                No completed skill assessment.
                            </p>
                        ) : (
                            <div className="mt-4 space-y-2">
                                {skillLevels.map((skill) => (
                                    <div
                                        key={skill.id}
                                        className="flex items-center justify-between rounded-xl border border-app-border bg-app-surface-muted px-4 py-3"
                                    >
                                        <div>
                                            <p className="font-medium text-app-text">
                                                {skill.skillName}
                                            </p>

                                            <p className="text-sm text-app-text-muted">
                                                {skill.roleName}
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-app-brand-soft px-3 py-1 text-sm font-medium text-app-brand">
                                            {skill.level}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                        <h2 className="text-lg font-semibold text-app-text">
                            Feedback & Insights
                        </h2>

                        <p className="mt-3 text-sm text-app-text-muted">
                            Feedback, skill gaps and onboarding insights will appear here.
                        </p>
                    </div>
                </div>
            </main>

            {rolesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-app-text">
                                    Manage Roles
                                </h2>

                                <p className="mt-1 text-sm text-app-text-muted">
                                    Add or remove roles for {user.firstname}.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setRolesModalOpen(false)}
                                className="rounded-lg p-2 text-app-text-muted hover:bg-app-surface-hover"
                                aria-label="Close roles modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 space-y-2">
                            {user.roles.length > 0 ? (
                                user.roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3"
                                    >
                                        <span className="text-sm font-medium text-app-text">
                                            {role.name}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => setRoleToRemove(role)}
                                            disabled={savingRoleId === role.id}
                                            className="rounded-lg p-1.5 text-app-text-muted hover:bg-app-surface-hover hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                            aria-label={`Remove ${role.name}`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                    No role assigned yet. Choose a role below.
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex gap-2">
                            <select
                                value={selectedRoleId}
                                onChange={(event) =>
                                    setSelectedRoleId(event.target.value)
                                }
                                className="min-w-0 flex-1 rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                            >
                                <option value="">Choose role</option>

                                {unassignedRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => void handleAddRole()}
                                disabled={
                                    !selectedRoleId || savingRoleId !== null
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </button>
                        </div>

                        {unassignedRoles.length === 0 && (
                            <p className="mt-3 text-xs text-app-text-muted">
                                All available roles are already assigned.
                            </p>
                        )}
                    </div>
                </div>
            )}
            {roleToRemove && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-app-text">
                            Remove Role
                        </h2>

                        <p className="mt-2 text-sm text-app-text-muted">
                            Are you sure you want to remove the role{' '}
                            <span className="font-medium text-app-text">
                                {roleToRemove.name}
                            </span>{' '}
                            from {user.firstname}?
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setRoleToRemove(null)}
                                className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface-hover"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    void handleRemoveRole(roleToRemove.id);
                                    setRoleToRemove(null);
                                }}
                                disabled={savingRoleId === roleToRemove.id}
                                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}