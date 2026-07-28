import { ArrowLeft, MessageSquareText, Pencil, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type {
    ProjectRole,
    TeamOverviewUser,
} from '../features/team-management/types';
import type { KnowledgeGap } from '../features/knowledge-gaps/types';
import { knowledgeGapService } from '../services/knowledgeGapService';
import {
    assignProjectRoleToUser,
    getProjectRoles,
    getProjectRolesForUserOnProject,
    getTeamMember,
    unassignProjectRoleFromUser,
    getUserOnboardingFeedback,
    markOnboardingFeedbackRead,
    type OnboardingFeedback,
} from '../services/teamManagementService';
import { competencyDashboardService } from '../services/competencyDashboardService';
import type { UserCompetencyState } from '../features/competency-dashboard/types';
import { UserAvatar } from '../components/common/UserAvatar';
import { Modal } from '../components/ui/Modal';
import { MemberDetailDialogs } from '../features/team-management/components/detail/MemberDetailDialogs';
import { MemberGapsPanel } from '../features/team-management/components/detail/MemberGapsPanel';

/** The bar a competency gets until a PM authors one; mirrors the backend constant. */
const DEFAULT_TARGET_LEVEL = 2;

/**
 * What a PM sees about one team member.
 *
 * The page leads with the **competency ledger**, because that is what progress
 * means: which competencies this person holds, at what level, on what evidence --
 * durable, and true across every project they work on. Nothing here is per-person
 * content: modules are shared and authored once, at `/competency-modules/:moduleId`.
 */
export function TeamMemberDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();

    const [user, setUser] = useState<TeamOverviewUser | undefined>(undefined);
    const [availableRoles, setAvailableRoles] = useState<ProjectRole[]>([]);
    // Roles are held per project, so editing them needs one chosen. Held as "what the user picked",
    // with the member's first project as the fallback -- derived rather than synced into state by an
    // effect, which React 19's set-state-in-effect rule rejects and which would also fight a pick
    // made before the member finished loading.
    const [pickedProjectId, setPickedProjectId] = useState('');
    const [projectRoles, setProjectRoles] = useState<ProjectRole[]>([]);
    const [projectRolesError, setProjectRolesError] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [loading, setLoading] = useState(true);
    const [rolesModalOpen, setRolesModalOpen] = useState(false);
    const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
    const [roleToRemove, setRoleToRemove] = useState<ProjectRole | null>(null);
    const [competencies, setCompetencies] = useState<UserCompetencyState[]>([]);
    const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
    const [feedbackItems, setFeedbackItems] = useState<OnboardingFeedback[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [markingFeedbackId, setMarkingFeedbackId] = useState<string | null>(null);
    const [feedbackError, setFeedbackError] = useState('');

    useEffect(() => {
        async function loadMember() {
            if (!userId) {
                setLoading(false);
                return;
            }

            setLoadingFeedback(true);

            const [memberData, rolesData, memberCompetencies, knowledgeGapOverview] =
                await Promise.all([
                    getTeamMember(userId),
                    getProjectRoles(),
                    competencyDashboardService.fetchUserCompetencies(userId).catch(() => []),
                    knowledgeGapService.fetchKnowledgeGaps(),
                ]);

            let feedback: OnboardingFeedback[] = [];
            try {
                feedback = await getUserOnboardingFeedback(userId);
            } catch (error) {
                setFeedbackError(
                    error instanceof Error ? error.message : 'Unable to load feedback.',
                );
            }

            setUser(memberData);
            setAvailableRoles(rolesData);
            setCompetencies(memberCompetencies);
            setKnowledgeGaps(knowledgeGapOverview.gaps);
            setFeedbackItems(feedback);
            setLoadingFeedback(false);
            setLoading(false);
        }

        void loadMember();
    }, [userId]);

    async function refreshMember() {
        if (!userId) return;

        setUser(await getTeamMember(userId));
    }

    async function refreshFeedback() {
        if (!userId) return;

        setLoadingFeedback(true);
        setFeedbackError('');

        try {
            setFeedbackItems(await getUserOnboardingFeedback(userId));
        } catch (error) {
            setFeedbackError(
                error instanceof Error ? error.message : 'Unable to load feedback.',
            );
        } finally {
            setLoadingFeedback(false);
        }
    }

    const roleProjectId = pickedProjectId || user?.projects?.[0]?.id || '';

    // What they hold on the chosen project. Re-read per project rather than filtered from the
    // header's union, which cannot say which project a role came from.
    useEffect(() => {
        let active = true;
        void (async () => {
            if (!user || !roleProjectId) {
                if (active) setProjectRoles([]);
                return;
            }
            try {
                const roles = await getProjectRolesForUserOnProject(roleProjectId, user.userId);
                if (active) {
                    setProjectRoles(roles);
                    setProjectRolesError('');
                }
            } catch {
                if (active) {
                    setProjectRoles([]);
                    setProjectRolesError('Roles for this project could not be loaded.');
                }
            }
        })();
        return () => {
            active = false;
        };
    }, [user, roleProjectId]);

    const unassignedRoles = useMemo(() => {
        if (!user) return [];

        return availableRoles.filter(
            (role) => !projectRoles.some((assignedRole) => assignedRole.id === role.id),
        );
    }, [availableRoles, projectRoles, user]);

    // A competency counts as held once the ledger reaches its bar. This endpoint
    // (`GET /dashboard/users/{id}`) does not carry the per-competency
    // `targetLevel` the hire's own ledger does, so the default bar is applied --
    // intermediate, matching `Competency.DEFAULT_TARGET_LEVEL`. A node whose PM
    // raised its bar will therefore read as held here one rung early; carrying
    // the real bar on this payload is the fix, and it is backend work.
    // Level 0 is "asked, saw no competence" and is neither held nor a gap.
    const heldCompetencies = useMemo(
        () => competencies.filter((entry) => entry.level >= DEFAULT_TARGET_LEVEL),
        [competencies],
    );
    const competencyGaps = useMemo(
        () =>
            competencies.filter(
                (entry) => entry.level > 0 && entry.level < DEFAULT_TARGET_LEVEL,
            ),
        [competencies],
    );
    const topKnowledgeGaps = useMemo(() => knowledgeGaps.slice(0, 3), [knowledgeGaps]);

    async function handleAddRole() {
        if (!user || !selectedRoleId || !roleProjectId) return;

        const roleToAdd = availableRoles.find((role) => role.id === selectedRoleId);
        if (!roleToAdd) return;

        setSavingRoleId(selectedRoleId);
        setProjectRolesError('');
        try {
            await assignProjectRoleToUser(roleProjectId, user.userId, selectedRoleId);
            setProjectRoles((current) => [...current, roleToAdd]);
            // The header shows the union across projects, so it grows with this too.
            setUser((current) =>
                current && current.roles.some((role) => role.id === roleToAdd.id)
                    ? current
                    : current && { ...current, roles: [...current.roles, roleToAdd] },
            );
            setSelectedRoleId('');
        } catch {
            setProjectRolesError('That role could not be added. Try again in a moment.');
        } finally {
            setSavingRoleId(null);
        }
    }

    async function handleRemoveRole(roleId: string) {
        if (!user || !roleProjectId) return;

        setSavingRoleId(roleId);
        setProjectRolesError('');
        try {
            await unassignProjectRoleFromUser(roleProjectId, user.userId, roleId);
            setProjectRoles((current) => current.filter((role) => role.id !== roleId));
            // Deliberately does not touch the union: they may still hold this role on another
            // project, and this page cannot know without re-reading. The next load is authoritative.
        } catch {
            setProjectRolesError('That role could not be removed. Try again in a moment.');
        } finally {
            setSavingRoleId(null);
        }
    }

    async function handleMarkFeedbackRead(feedbackId: string) {
        setMarkingFeedbackId(feedbackId);
        setFeedbackError('');

        try {
            await markOnboardingFeedbackRead(feedbackId);
            setFeedbackItems((current) =>
                current.map((feedback) =>
                    feedback.id === feedbackId ? { ...feedback, read: true } : feedback,
                ),
            );
            await Promise.all([refreshFeedback(), refreshMember()]);
        } catch (error) {
            setFeedbackError(
                error instanceof Error
                    ? error.message
                    : 'Unable to mark feedback as read.',
            );
        } finally {
            setMarkingFeedbackId(null);
        }
    }

    function goBack() {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            void navigate(-1);
        } else {
            void navigate('/team-management');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center">
                <p className="text-sm text-app-text-muted">Loading team member...</p>
            </div>
        );
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
                        <p className="text-sm text-app-text">Team member not found.</p>
                    </div>
                </main>
            </div>
        );
    }

    const unreadFeedback = feedbackItems.filter(
        (item) => item.read !== true && !item.readAt,
    );

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
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
                            <div className="flex shrink-0 items-center justify-center">
                                <UserAvatar
                                    profileIcon={user.profileIcon}
                                    fallbackName={`${user.firstname} ${user.lastname}`.trim()}
                                    seed={user.userId}
                                    size={56}
                                />
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

                        {/* Progress is the ledger, not a percentage of a checklist: how many
                            competencies this person actually holds, and how many are still
                            short of their bar. */}
                        <div className="lg:text-right">
                            <p className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                                Competencies held
                            </p>
                            <p className="mt-2 text-sm font-medium text-app-text">
                                {heldCompetencies.length}
                                {competencyGaps.length > 0 && (
                                    <span className="font-normal text-app-text-muted">
                                        {` · ${competencyGaps.length} below target`}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 pt-8">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.8fr)]">
                    <MemberGapsPanel
                        competencies={competencies}
                        competencyGaps={competencyGaps}
                        knowledgeGaps={topKnowledgeGaps}
                        onOpenKnowledgeGap={(gapId) => {
                            void navigate(`/insights/knowledge-gaps/${gapId}`);
                        }}
                    />

                    <aside aria-label="Member feedback" className="space-y-4">
                        <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                            <h2 className="text-lg font-semibold text-app-text">Feedback</h2>

                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <MessageSquareText className="h-4 w-4 text-app-text-muted" />
                                        <p className="text-sm font-semibold text-app-text">
                                            Open items
                                        </p>
                                    </div>

                                    {unreadFeedback.length > 0 && (
                                        <span className="rounded-full bg-app-warning-bg px-2.5 py-1 text-xs font-medium text-app-warning-text">
                                            {unreadFeedback.length} open
                                        </span>
                                    )}
                                </div>

                                {loadingFeedback ? (
                                    <p className="rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                        Loading feedback...
                                    </p>
                                ) : unreadFeedback.length > 0 ? (
                                    unreadFeedback.map((feedback) => (
                                        <div
                                            key={feedback.id}
                                            className="rounded-2xl border border-app-warning-border bg-app-warning-bg p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 gap-3">
                                                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-surface text-app-warning-text">
                                                        <MessageSquareText className="h-4 w-4" />
                                                    </span>

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-app-text">
                                                            Feedback
                                                        </p>

                                                        <p className="mt-2 text-sm text-app-text">
                                                            {feedback.message}
                                                        </p>

                                                        {feedback.createdAt && (
                                                            <p className="mt-2 text-xs text-app-text-muted">
                                                                {new Date(
                                                                    feedback.createdAt,
                                                                ).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleMarkFeedbackRead(feedback.id)
                                                    }
                                                    disabled={markingFeedbackId === feedback.id}
                                                    className="shrink-0 rounded-lg border border-app-warning-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-warning-text transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {markingFeedbackId === feedback.id
                                                        ? 'Marking...'
                                                        : 'Mark read'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                        No open feedback.
                                    </p>
                                )}

                                {feedbackError && (
                                    <p className="text-xs text-app-danger-text">
                                        {feedbackError}
                                    </p>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            <Modal
                isOpen={rolesModalOpen}
                title="Manage Roles"
                description={`What ${user.firstname} does on a project. Roles are held per project, so pick which.`}
                closeLabel="Close roles modal"
                onClose={() => setRolesModalOpen(false)}
            >
                {user.projects.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                        {user.firstname} is not on a project yet. Roles are held on a project, so
                        there is nothing to set until they are added to one.
                    </p>
                ) : (
                    <>
                <div className="mb-4">
                    <label
                        htmlFor="role-project"
                        className="mb-1 block text-xs font-medium text-app-text-muted"
                    >
                        Project
                    </label>
                    <select
                        id="role-project"
                        value={roleProjectId}
                        onChange={(event) => setPickedProjectId(event.target.value)}
                        className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                    >
                        {user.projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                {projectRolesError && (
                    <p className="mb-3 text-xs text-app-danger-text">{projectRolesError}</p>
                )}

                <div className="space-y-2">
                    {projectRoles.length > 0 ? (
                        projectRoles.map((role) => (
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
                            No role on this project yet — they onboard in the default wording.
                        </p>
                    )}
                </div>

                <div className="mt-6 flex gap-2">
                    <select
                        aria-label="Role to add on this project"
                        value={selectedRoleId}
                        onChange={(event) => setSelectedRoleId(event.target.value)}
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
                        disabled={!selectedRoleId || savingRoleId !== null}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Plus className="h-4 w-4" />
                        Add
                    </button>
                </div>

                {unassignedRoles.length === 0 && (
                    <p className="mt-3 text-xs text-app-text-muted">
                        Every role is already assigned on this project.
                    </p>
                )}
                    </>
                )}
            </Modal>

            <MemberDetailDialogs
                firstName={user.firstname}
                roleToRemove={roleToRemove}
                savingRoleId={savingRoleId}
                onCancelRoleRemove={() => setRoleToRemove(null)}
                onConfirmRoleRemove={(role) => {
                    void handleRemoveRole(role.id);
                    setRoleToRemove(null);
                }}
            />
        </div>
    );
}
