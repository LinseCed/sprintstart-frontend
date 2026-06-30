import {
    AlertTriangle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Circle,
    Clock,
    ClipboardList,
    MessageSquareText,
    Pencil,
    Plus,
    SkipForward,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type {
    OnboardingPathEndpoint,
    OnboardingStepEndpoint,
    OnboardingTaskEndpoint,
} from '../features/onboarding/types';
import type {
    ProjectRole,
    TeamOverviewUser,
} from '../features/team-management/types';
import type { KnowledgeGap } from '../features/knowledge-gaps/types';
import { knowledgeGapService } from '../services/knowledgeGapService';
import {
    assignProjectRoleToUser,
    getProjectRoles,
    getTeamMember,
    unassignProjectRoleFromUser,
    getUserSkillLevels,
    acceptOnboardingSkipRequest,
    denyOnboardingSkipRequest,
    getUserOnboardingFeedback,
    markOnboardingFeedbackRead,
    getUserOnboardingPath,
    createOnboardingStepForPhase,
    createOnboardingTaskForStep,
    deleteOnboardingStep,
    deleteOnboardingTask,
    getOnboardingTasksByStep,
    type OnboardingFeedback,
    type UserSkillLevel,
} from '../services/teamManagementService';

type DetailOnboardingStep = OnboardingStepEndpoint & {
    startedAt?: string | null;
    durationMinutes?: number | null;
    skip?: {
        id?: string;
        status?: string;
        reason?: string;
    } | null;
};

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

function formatMinutes(minutes?: number | null): string {
    if (!minutes || minutes <= 0) return 'No estimate';
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}

function getActualMinutes(step: DetailOnboardingStep): number | null {
    if (step.durationMinutes) return step.durationMinutes;

    if (!step.startedAt || !step.completedAt) return null;

    return Math.max(
        1,
        Math.round(
            (new Date(step.completedAt).getTime() -
                new Date(step.startedAt).getTime()) /
                (1000 * 60),
        ),
    );
}

function getStepStatusStyles(status: string) {
    if (status === 'FINISHED') {
        return 'border-app-success-border bg-app-success-bg text-app-success-text';
    }

    if (status === 'SKIPPED') {
        return 'border-app-danger-border bg-app-danger-bg text-app-danger-text';
    }

    if (status === 'IN_PROGRESS') {
        return 'border-app-brand bg-app-brand-soft text-app-brand-text';
    }

    return 'border-app-border bg-app-surface-muted text-app-text-muted';
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
    const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>([]);
    const [feedbackItems, setFeedbackItems] = useState<OnboardingFeedback[]>([]);
    const [onboardingPath, setOnboardingPath] =
        useState<OnboardingPathEndpoint | null>(null);
    const [selectedPhaseId, setSelectedPhaseId] = useState('');
    const [selectedStepId, setSelectedStepId] = useState('');
    const [detailStepId, setDetailStepId] = useState('');
    const [stepToDelete, setStepToDelete] = useState<DetailOnboardingStep | null>(
        null,
    );
    const [taskToDelete, setTaskToDelete] = useState<OnboardingTaskEndpoint | null>(
        null,
    );
    const [stepInsertTarget, setStepInsertTarget] = useState<{
        phaseId: string;
        position: number;
    } | null>(null);
    const [customStepTitle, setCustomStepTitle] = useState('');
    const [customStepDescription, setCustomStepDescription] = useState('');
    const [customStepExpectedOutcome, setCustomStepExpectedOutcome] = useState('');
    const [customStepMinutes, setCustomStepMinutes] = useState('30');
    const [customStepTasks, setCustomStepTasks] = useState<
        Array<{ title: string; description: string }>
    >([{ title: '', description: '' }]);
    const [addingStep, setAddingStep] = useState(false);
    const [taskInsertTarget, setTaskInsertTarget] = useState<{
        stepId: string;
        position: number;
    } | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [addingTask, setAddingTask] = useState(false);
    const [stepActionId, setStepActionId] = useState<string | null>(null);
    const [stepTaskCounts, setStepTaskCounts] = useState<
        Record<string, { done: number; total: number }>
    >({});
    const [stepTasksById, setStepTasksById] = useState<
        Record<string, OnboardingTaskEndpoint[]>
    >({});
    const [onboardingError, setOnboardingError] = useState('');
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [markingFeedbackId, setMarkingFeedbackId] = useState<string | null>(null);
    const [reviewingSkipAction, setReviewingSkipAction] = useState<
        'accept' | 'deny' | null
    >(null);
    const [skipReviewError, setSkipReviewError] = useState('');
    const [feedbackError, setFeedbackError] = useState('');

    useEffect(() => {
        async function loadMember() {
            if (!userId) {
                setLoading(false);
                return;
            }

            setLoadingFeedback(true);

            const [memberData, rolesData, skills, path, knowledgeGapOverview] = await Promise.all([
                getTeamMember(userId),
                getProjectRoles(),
                getUserSkillLevels(userId),
                getUserOnboardingPath(userId),
                knowledgeGapService.fetchKnowledgeGaps(),
            ]);
            const feedback = memberData?.hasFeedback
                ? await getUserOnboardingFeedback(userId)
                : [];

            setUser(memberData);
            setAvailableRoles(rolesData);
            setSkillLevels(skills);
            setKnowledgeGaps(knowledgeGapOverview.gaps);
            setFeedbackItems(feedback);
            setOnboardingPath(path);
            setSelectedPhaseId(path?.phases?.[0]?.id ?? '');
            setSelectedStepId(
                memberData?.currentStep?.id ??
                    path?.phases?.[0]?.steps?.[0]?.id ??
                    '',
            );
            setLoadingFeedback(false);
            setLoading(false);
        }

        void loadMember();
    }, [userId]);

    useEffect(() => {
        async function loadPathTaskCounts() {
            const steps =
                onboardingPath?.phases.flatMap((phase) => phase.steps ?? []) ?? [];

            if (steps.length === 0) {
                setStepTaskCounts({});
                return;
            }

            const taskEntries = await Promise.all(
                steps.map(async (step) => {
                    const tasks = await getOnboardingTasksByStep(step.id);

                    return [
                        step.id,
                        tasks,
                    ] as const;
                }),
            );
            const tasksByStepId = Object.fromEntries(taskEntries);
            const counts = Object.fromEntries(
                taskEntries.map(([stepId, tasks]) => [
                    stepId,
                    {
                        done: tasks.filter((task) => task.finished).length,
                        total: tasks.length,
                    },
                ]),
            );

            setStepTasksById(tasksByStepId);
            setStepTaskCounts(counts);
        }

        void loadPathTaskCounts();
    }, [onboardingPath]);

    async function refreshMember() {
        if (!userId) return;

        const memberData = await getTeamMember(userId);
        setUser(memberData);
    }

    async function refreshFeedback() {
        if (!userId) return;

        setLoadingFeedback(true);
        setFeedbackError('');

        try {
            const feedback = await getUserOnboardingFeedback(userId);
            setFeedbackItems(feedback);
        } catch (error) {
            setFeedbackError(
                error instanceof Error
                    ? error.message
                    : 'Unable to load feedback.',
            );
        } finally {
            setLoadingFeedback(false);
        }
    }

    async function refreshOnboardingPath() {
        if (!userId) return;

        const path = await getUserOnboardingPath(userId);
        setOnboardingPath(path);

        if (path?.phases?.length && !path.phases.some((phase) => phase.id === selectedPhaseId)) {
            setSelectedPhaseId(path.phases[0].id);
        }

        const refreshedSteps = path?.phases.flatMap((phase) => phase.steps ?? []) ?? [];
        if (refreshedSteps.length && !refreshedSteps.some((step) => step.id === selectedStepId)) {
            setSelectedStepId(refreshedSteps[0].id);
        }
    }

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

    async function handleSkipReview(action: 'accept' | 'deny') {
        const skipId = user?.currentStep?.skip?.id;
        if (!skipId) return;

        setReviewingSkipAction(action);
        setSkipReviewError('');

        try {
            if (action === 'accept') {
                await acceptOnboardingSkipRequest(skipId);
            } else {
                await denyOnboardingSkipRequest(skipId);
            }

            await Promise.all([refreshMember(), refreshOnboardingPath()]);
        } catch (error) {
            setSkipReviewError(
                error instanceof Error
                    ? error.message
                    : 'Unable to review skip request.',
            );
        } finally {
            setReviewingSkipAction(null);
        }
    }

    async function handleDeleteStep(step: DetailOnboardingStep) {
        setStepActionId(step.id);
        setOnboardingError('');

        try {
            await deleteOnboardingStep(step.id);
            setStepToDelete(null);
            if (detailStepId === step.id) {
                setDetailStepId('');
            }
            await refreshOnboardingPath();
        } catch (error) {
            setOnboardingError(
                error instanceof Error
                    ? error.message
                    : 'Unable to delete step.',
            );
        } finally {
            setStepActionId(null);
        }
    }

    async function refreshStepTasks(stepId: string) {
        const nextTasks = await getOnboardingTasksByStep(stepId);

        setStepTasksById((current) => ({
            ...current,
            [stepId]: nextTasks,
        }));
        setStepTaskCounts((current) => ({
            ...current,
            [stepId]: {
                done: nextTasks.filter((item) => item.finished).length,
                total: nextTasks.length,
            },
        }));

        return nextTasks;
    }

    async function handleDeleteTask(task: OnboardingTaskEndpoint) {
        setStepActionId(task.stepId);
        setOnboardingError('');

        try {
            await deleteOnboardingTask(task.id);
            setTaskToDelete(null);
            await refreshStepTasks(task.stepId);
            await refreshOnboardingPath();
        } catch (error) {
            setOnboardingError(
                error instanceof Error
                    ? error.message
                    : 'Unable to delete task.',
            );
        } finally {
            setStepActionId(null);
        }
    }

    async function handleCreateTask() {
        if (!taskInsertTarget || !newTaskTitle.trim()) return;

        setAddingTask(true);
        setStepActionId(taskInsertTarget.stepId);
        setOnboardingError('');

        try {
            await createOnboardingTaskForStep(taskInsertTarget.stepId, {
                position: taskInsertTarget.position,
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                finished: false,
            });

            setTaskInsertTarget(null);
            setNewTaskTitle('');
            setNewTaskDescription('');
            await refreshStepTasks(taskInsertTarget.stepId);
            await refreshOnboardingPath();
        } catch (error) {
            setOnboardingError(
                error instanceof Error
                    ? error.message
                    : 'Unable to create task.',
            );
        } finally {
            setAddingTask(false);
            setStepActionId(null);
        }
    }

    async function handleMarkFeedbackRead(feedbackId: string) {
        setMarkingFeedbackId(feedbackId);
        setFeedbackError('');

        try {
            await markOnboardingFeedbackRead(feedbackId);
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

    async function handleCreateCustomStep() {
        const targetPhaseId = stepInsertTarget?.phaseId ?? selectedPhaseId;

        if (!targetPhaseId || !customStepTitle.trim()) return;

        const selectedPhase = onboardingPath?.phases.find(
            (phase) => phase.id === targetPhaseId,
        );

        if (!selectedPhase) return;

        setAddingStep(true);
        setOnboardingError('');

        try {
            const createdStep = await createOnboardingStepForPhase(targetPhaseId, {
                position:
                    stepInsertTarget?.position ?? selectedPhase.steps?.length ?? 0,
                title: customStepTitle.trim(),
                description: customStepDescription.trim(),
                type: 'TASK',
                estimatedMinutes: Number(customStepMinutes) || 30,
                expectedOutcome: customStepExpectedOutcome.trim(),
            });
            const tasksToCreate = customStepTasks
                .map((task) => ({
                    title: task.title.trim(),
                    description: task.description.trim(),
                }))
                .filter((task) => task.title.length > 0);

            await Promise.all(
                tasksToCreate.map((task, index) =>
                    createOnboardingTaskForStep(createdStep.id, {
                        position: index,
                        title: task.title,
                        description: task.description,
                        finished: false,
                    }),
                ),
            );

            setCustomStepTitle('');
            setCustomStepDescription('');
            setCustomStepExpectedOutcome('');
            setCustomStepMinutes('30');
            setCustomStepTasks([{ title: '', description: '' }]);
            setStepInsertTarget(null);
            setSelectedStepId(createdStep.id);
            setDetailStepId(createdStep.id);
            await refreshOnboardingPath();
            if (tasksToCreate.length > 0) {
                await refreshStepTasks(createdStep.id);
            }
        } catch (error) {
            setOnboardingError(
                error instanceof Error
                    ? error.message
                    : 'Unable to create custom onboarding step.',
            );
        } finally {
            setAddingStep(false);
        }
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
    const pendingSkip = user.currentStep?.skip?.status === 'PENDING'
        ? user.currentStep.skip
        : null;
    const unreadFeedback = feedbackItems.filter(
        (item) => item.read !== true && !item.readAt,
    );
    const phases = [...(onboardingPath?.phases ?? [])].sort(
        (a, b) => a.position - b.position,
    );
    const allSteps = phases.flatMap((phase) =>
        [...(phase.steps ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((step) => step as DetailOnboardingStep),
    );
    const finishedSteps = allSteps.filter((step) => step.status === 'FINISHED').length;
    const skippedSteps = allSteps.filter((step) => step.status === 'SKIPPED').length;
    const pathPendingSkips = allSteps.filter(
        (step) => step.skip?.status === 'PENDING' || step.skipReason,
    ).length;
    const estimatedMinutes = allSteps.reduce(
        (sum, step) => sum + (step.estimatedMinutes || 0),
        0,
    );
    const selectedPhase = phases.find((phase) => phase.id === selectedPhaseId) ?? phases[0];
    const selectedPhaseSteps = [...(selectedPhase?.steps ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((step) => step as DetailOnboardingStep);
    const selectedStep =
        allSteps.find((step) => step.id === selectedStepId) ??
        selectedPhaseSteps[0] ??
        null;
    const detailStep = allSteps.find((step) => step.id === detailStepId) ?? null;
    const detailStepTasks = detailStep ? stepTasksById[detailStep.id] ?? [] : [];
    const sortedDetailStepTasks = [...detailStepTasks].sort(
        (a, b) => a.position - b.position,
    );
    const detailStepDoneTasks = detailStepTasks.filter((task) => task.finished).length;
    const detailStepActualMinutes = detailStep ? getActualMinutes(detailStep) : null;

    const detailStepFeedback = detailStep
        ? feedbackItems.filter((feedback) => feedback.stepId === detailStep.id)
        : [];
    const detailStepSkipReason =
        detailStep?.skip?.reason || detailStep?.skipReason || '';
    const skillGaps = skillLevels.filter(
        (skill) => skill.level === 'BEGINNER' || skill.level === 'INTERMEDIATE',
    );
    const severityOrder: Record<string, number> = {
        high: 0,
        medium: 1,
        low: 2,
    };
    const topKnowledgeGaps = [...knowledgeGaps]
        .sort(
            (a, b) =>
                (severityOrder[a.severity] ?? 3) -
                (severityOrder[b.severity] ?? 3),
        )
        .slice(0, 3);
    const nextStep =
        allSteps.find(
            (step) => step.status !== 'FINISHED' && step.status !== 'SKIPPED',
        ) ?? null;

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
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.8fr)]">
                    <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-app-brand" />
                                    <h2 className="text-lg font-semibold text-app-text">
                                        Member onboarding
                                    </h2>
                                </div>

                                <p className="mt-1 text-sm text-app-text-muted">
                                    Preview the member journey and add project-specific steps.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
                                <div className="rounded-2xl border border-app-border bg-app-surface-muted px-3 py-2">
                                    <p className="text-xs text-app-text-muted">Done</p>
                                    <p className="mt-1 text-sm font-semibold text-app-text">
                                        {finishedSteps}/{allSteps.length || 0}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-app-border bg-app-surface-muted px-3 py-2">
                                    <p className="text-xs text-app-text-muted">Estimate</p>
                                    <p className="mt-1 text-sm font-semibold text-app-text">
                                        {formatMinutes(estimatedMinutes)}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-app-border bg-app-surface-muted px-3 py-2">
                                    <p className="text-xs text-app-text-muted">Skipped</p>
                                    <p className="mt-1 text-sm font-semibold text-app-text">
                                        {skippedSteps}
                                    </p>
                                </div>

                                <div className={`rounded-2xl border px-3 py-2 ${
                                    pathPendingSkips > 0
                                        ? 'border-app-warning-border bg-app-warning-bg'
                                        : 'border-app-border bg-app-surface-muted'
                                }`}>
                                    <p className="text-xs text-app-text-muted">Requests</p>
                                    <p className={`mt-1 text-sm font-semibold ${
                                        pathPendingSkips > 0
                                            ? 'text-app-warning-text'
                                            : 'text-app-text'
                                    }`}>
                                        {pathPendingSkips}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {phases.length === 0 ? (
                            <div className="mt-5 rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-6 text-sm text-app-text-muted">
                                No onboarding path details are available for this user yet.
                            </div>
                        ) : (
                            <>
                                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {phases.map((phase) => {
                                        const steps = phase.steps ?? [];
                                        const completed = steps.filter(
                                            (step) =>
                                                step.status === 'FINISHED' ||
                                                step.status === 'SKIPPED',
                                        ).length;
                                        const percentage =
                                            steps.length > 0
                                                ? Math.round((completed / steps.length) * 100)
                                                : 0;
                                        const isSelected = phase.id === selectedPhase?.id;

                                        return (
                                            <button
                                                key={phase.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPhaseId(phase.id);
                                                    setSelectedStepId(steps[0]?.id ?? '');
                                                }}
                                                className={`rounded-2xl border p-4 text-left transition-all ${
                                                    isSelected
                                                        ? 'border-app-brand bg-app-brand-soft'
                                                        : 'border-app-border bg-app-surface-muted hover:border-app-border-strong'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="text-sm font-semibold text-app-text">
                                                        {phase.title}
                                                    </p>
                                                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                                                        percentage === 100
                                                            ? 'bg-app-success-bg text-app-success-text'
                                                            : 'bg-app-surface text-app-text-muted'
                                                    }`}>
                                                        {percentage}%
                                                    </span>
                                                </div>

                                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-app-border-muted">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-app-brand to-app-progress-fill-end"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>

                                                <p className="mt-2 text-xs text-app-text-muted">
                                                    {completed}/{steps.length} steps
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-5">
                                    <div>
                                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-app-text">
                                                    {selectedPhase?.title}
                                                </h3>
                                                {selectedPhase?.description && (
                                                    <p className="mt-1 text-xs text-app-text-muted">
                                                        {selectedPhase.description}
                                                    </p>
                                                )}
                                            </div>

                                        </div>

                                        <div className="space-y-3">
                                            {selectedPhaseSteps.length === 0 ? (
                                                <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-5 text-sm text-app-text-muted">
                                                    <p>This phase has no steps yet.</p>
                                                    {selectedPhase && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setStepInsertTarget({
                                                                    phaseId: selectedPhase.id,
                                                                    position: 0,
                                                                })
                                                            }
                                                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3 py-2 text-xs font-medium text-app-text-inverse hover:bg-app-brand-hover"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                            Add first step
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                selectedPhaseSteps.map((step, index) => {
                                                    const skipReason =
                                                        step.skip?.reason || step.skipReason;
                                                    const isSelected = step.id === selectedStep?.id;
                                                    const isNextStep = step.id === nextStep?.id;
                                                    const actualMinutes = getActualMinutes(step);
                                                    const timingDelta =
                                                        actualMinutes && step.estimatedMinutes
                                                            ? actualMinutes - step.estimatedMinutes
                                                            : null;

                                                    return (
                                                        <div key={step.id} className="group/step-insert space-y-1">
                                                            {index === 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        selectedPhase &&
                                                                        setStepInsertTarget({
                                                                            phaseId: selectedPhase.id,
                                                                            position: 0,
                                                                        })
                                                                    }
                                                                    className="flex h-4 w-full items-center justify-center border-y border-transparent text-app-text-muted transition-all before:h-px before:flex-1 before:bg-app-border-muted after:h-px after:flex-1 after:bg-app-border-muted hover:text-app-brand"
                                                                    aria-label={`Add step before ${step.title}`}
                                                                    title="Add step here"
                                                                >
                                                                    <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/step-insert:opacity-100 group-hover/task-insert:opacity-100" />
                                                                </button>
                                                            )}

                                                            <div
                                                                role="button"
                                                            tabIndex={0}
                                                            onClick={() => {
                                                                setSelectedStepId(step.id);
                                                                setDetailStepId(step.id);
                                                            }}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter' || event.key === ' ') {
                                                                    event.preventDefault();
                                                                    setSelectedStepId(step.id);
                                                                    setDetailStepId(step.id);
                                                                }
                                                            }}
                                                            className={`group w-full rounded-2xl border bg-app-surface p-4 text-left transition-all ${
                                                                isSelected
                                                                    ? 'border-app-brand shadow-sm'
                                                                    : isNextStep
                                                                      ? 'border-app-brand-border bg-app-brand-soft'
                                                                    : 'border-app-border hover:border-app-border-strong'
                                                            } ${
                                                                step.status === 'FINISHED' ||
                                                                step.status === 'SKIPPED'
                                                                    ? 'opacity-70'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <div className="flex gap-4">
                                                                <span className="pt-0.5">
                                                                    {step.status === 'FINISHED' ? (
                                                                        <CheckCircle2 className="h-5 w-5 text-app-success-solid" />
                                                                    ) : step.status === 'SKIPPED' ? (
                                                                        <SkipForward className="h-5 w-5 text-app-danger-solid" />
                                                                    ) : step.status === 'IN_PROGRESS' ? (
                                                                        <Clock className="h-5 w-5 text-app-warning-text" />
                                                                    ) : (
                                                                        <Circle className="h-5 w-5 text-app-text-disabled" />
                                                                    )}
                                                                </span>

                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                        <div className="min-w-0">
                                                                            {isNextStep && (
                                                                                <span className="mb-1 inline-flex items-center rounded-full bg-app-brand px-2 py-0.5 text-[11px] font-medium text-app-text-inverse">
                                                                                    Up next
                                                                                </span>
                                                                            )}
                                                                            <h4 className={`text-sm font-semibold ${
                                                                                step.status === 'FINISHED' ||
                                                                                step.status === 'SKIPPED'
                                                                                    ? 'line-through text-app-text-subtle'
                                                                                    : 'text-app-text'
                                                                            }`}>
                                                                                {step.title}
                                                                            </h4>
                                                                            {/* {step.description && (
                                                                                <p className="mt-1 text-sm text-app-text-muted">
                                                                                    {step.description}
                                                                                </p>
                                                                            )} */}
                                                                        </div>

                                                                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${getStepStatusStyles(step.status)}`}>
                                                                            {step.status.replace('_', ' ')}
                                                                        </span>
                                                                    </div>

                                                                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
                                                                        <span className="rounded-full bg-app-surface-muted px-2 py-0.5">
                                                                            {formatMinutes(step.estimatedMinutes)}
                                                                        </span>
                                                                        <span className="rounded-full bg-app-surface-muted px-2 py-0.5">
                                                                            {stepTaskCounts[step.id]
                                                                                ? `${stepTaskCounts[step.id].done}/${stepTaskCounts[step.id].total} tasks`
                                                                                : 'Tasks ...'}
                                                                        </span>
                                                                        {actualMinutes && (
                                                                            <span className={`rounded-full px-2 py-0.5 ${
                                                                                timingDelta !== null && timingDelta > 0
                                                                                    ? 'bg-app-warning-bg text-app-warning-text'
                                                                                    : 'bg-app-success-bg text-app-success-text'
                                                                            }`}>
                                                                                Actual {formatMinutes(actualMinutes)}
                                                                                {timingDelta === 0
                                                                                    ? ' (on time)'
                                                                                    : timingDelta !== null
                                                                                      ? ` (${timingDelta > 0 ? '+' : '-'}${formatMinutes(Math.abs(timingDelta))})`
                                                                                      : ''}
                                                                            </span>
                                                                        )}
                                                                        {skipReason && (
                                                                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${
                                                                                step.status === 'SKIPPED'
                                                                                    ? 'border-app-danger-border bg-app-danger-bg text-app-danger-text'
                                                                                    : 'border-app-warning-border bg-app-warning-bg text-app-warning-text'
                                                                            }`}>
                                                                                <AlertTriangle className="h-3 w-3" />
                                                                                {step.status === 'SKIPPED'
                                                                                    ? 'Skipped'
                                                                                    : 'Skip requested'}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    selectedPhase &&
                                                                    setStepInsertTarget({
                                                                        phaseId: selectedPhase.id,
                                                                        position: index + 1,
                                                                    })
                                                                }
                                                                className="flex h-4 w-full items-center justify-center border-y border-transparent text-app-text-muted transition-all before:h-px before:flex-1 before:bg-app-border-muted after:h-px after:flex-1 after:bg-app-border-muted hover:text-app-brand"
                                                                aria-label={`Add step after ${step.title}`}
                                                                title="Add step here"
                                                            >
                                                                <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/step-insert:opacity-100 group-hover/task-insert:opacity-100" />
                                                            </button>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </>
                        )}
                    </div>

                    <aside className="space-y-4">
                    <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                        <h4 className="text-lg font-semibold text-app-text">
                            Feedback & Skip Requests
                        </h4>

                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <MessageSquareText className="h-4 w-4 text-app-text-muted" />
                                    <p className="text-sm font-semibold text-app-text">
                                        Open items
                                    </p>
                                </div>

                                {(unreadFeedback.length > 0 || pendingSkip) && (
                                    <span className="rounded-full bg-app-warning-bg px-2.5 py-1 text-xs font-medium text-app-warning-text">
                                        {unreadFeedback.length + (pendingSkip ? 1 : 0)} open
                                    </span>
                                )}
                            </div>

                            {pendingSkip && (
                                <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 gap-3">
                                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-surface text-app-warning-text">
                                                <SkipForward className="h-4 w-4" />
                                            </span>

                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-semibold text-app-text">
                                                        Skip request
                                                    </p>
                                                    <span className="rounded-full bg-app-surface px-2 py-0.5 text-xs font-medium text-app-warning-text">
                                                        Pending
                                                    </span>
                                                </div>

                                                {user.currentStep?.title && (
                                                    <p className="mt-1 text-xs text-app-text-muted">
                                                        {user.currentStep.title}
                                                    </p>
                                                )}

                                                <p className="mt-2 text-sm text-app-text">
                                                    {pendingSkip.reason}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void handleSkipReview('accept')}
                                                disabled={reviewingSkipAction !== null}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-app-success-solid px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-app-success-solid/90 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                                {reviewingSkipAction === 'accept'
                                                    ? 'Accepting...'
                                                    : 'Accept'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => void handleSkipReview('deny')}
                                                disabled={reviewingSkipAction !== null}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-text transition-colors hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                                {reviewingSkipAction === 'deny'
                                                    ? 'Denying...'
                                                    : 'Deny'}
                                            </button>
                                        </div>
                                    </div>

                                    {skipReviewError && (
                                        <p className="mt-3 text-xs text-app-danger-text">
                                            {skipReviewError}
                                        </p>
                                    )}
                                </div>
                            )}

                            {loadingFeedback ? (
                                <p className="rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                    Loading feedback...
                                </p>
                            ) : feedbackItems.length > 0 ? (
                                feedbackItems.map((feedback) => {
                                    const isUnread =
                                        feedback.read !== true && !feedback.readAt;

                                    return (
                                        <div
                                            key={feedback.id}
                                            className={`rounded-2xl border p-4 ${
                                                isUnread
                                                    ? 'border-app-warning-border bg-app-warning-bg'
                                                    : 'border-app-border bg-app-surface-muted'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex min-w-0 gap-3">
                                                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                        isUnread
                                                            ? 'bg-app-surface text-app-warning-text'
                                                            : 'bg-app-surface text-app-text-muted'
                                                    }`}>
                                                        <MessageSquareText className="h-4 w-4" />
                                                    </span>

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-app-text">
                                                                Feedback
                                                            </p>
                                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                isUnread
                                                                    ? 'bg-app-surface text-app-warning-text'
                                                                    : 'bg-app-border-muted text-app-text-muted'
                                                            }`}>
                                                                {isUnread ? 'Unread' : 'Read'}
                                                            </span>
                                                        </div>

                                                        <p className="mt-2 text-sm text-app-text">
                                                            {feedback.message}
                                                        </p>

                                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
                                                            {feedback.stepTitle && (
                                                                <span className="rounded-full bg-app-surface px-2 py-0.5">
                                                                    {feedback.stepTitle}
                                                                </span>
                                                            )}
                                                            {feedback.createdAt && (
                                                                <span>
                                                                    {new Date(feedback.createdAt).toLocaleDateString(
                                                                        'en-US',
                                                                        {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                        },
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isUnread && (
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
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : user.hasFeedback ? (
                                <div className="rounded-2xl border border-app-warning-border bg-app-warning-bg p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-surface text-app-warning-text">
                                            <MessageSquareText className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold text-app-text">
                                                    Feedback
                                                </p>
                                                <span className="rounded-full bg-app-surface px-2 py-0.5 text-xs font-medium text-app-warning-text">
                                                    Unread
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm text-app-text">
                                                {user.firstname} has left feedback on their onboarding path.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : !pendingSkip ? (
                                <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                    No open feedback or skip requests.
                                </p>
                            ) : null}

                            {feedbackError && (
                                <p className="text-xs text-app-danger-text">
                                    {feedbackError}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                        <h2 className="text-lg font-semibold text-app-text">
                            Skill Assessment
                        </h2>

                        {skillLevels.length === 0 ? (
                            <p className="mt-3 text-sm text-app-text-muted">
                                No completed skill assessment.
                            </p>
                        ) : (
                            <div className="mt-4 space-y-4">
                                {Object.entries(
                                    skillLevels.reduce<Record<string, UserSkillLevel[]>>(
                                        (acc, skill) => {
                                            const key = skill.roleName;
                                            if (!acc[key]) acc[key] = [];
                                            acc[key].push(skill);
                                            return acc;
                                        },
                                        {}
                                    )
                                ).map(([roleName, skills]) => (
                                    <div key={roleName}>
                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-app-text-muted">
                                            {roleName}
                                        </p>

                                        <div className="space-y-1">
                                            {skills.map((skill) => {
                                                const levelDots: Record<string, number> = {
                                                    BEGINNER: 1,
                                                    INTERMEDIATE: 2,
                                                    ADVANCED: 3,
                                                    EXPERT: 4,
                                                };
                                                const filled = levelDots[skill.level] ?? 0;

                                                return (
                                                    <div
                                                        key={skill.id}
                                                        className="flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-surface-muted px-3 py-2"
                                                    >
                                                        <span className="text-sm font-medium text-app-text">
                                                            {skill.skillName}
                                                        </span>

                                                        <div className="flex shrink-0 items-center gap-2">
                                                            <div className="flex gap-1">
                                                                {Array.from({ length: 4 }, (_, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className={`h-2 w-2 rounded-full ${i < filled
                                                                                ? 'bg-app-brand'
                                                                                : 'bg-app-border'
                                                                            }`}
                                                                    />
                                                                ))}
                                                            </div>

                                                            <span className="w-24 text-right text-xs text-app-text-muted capitalize">
                                                                {skill.level.toLowerCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="rounded-3xl border border-app-border bg-app-surface p-6">
                        <h2 className="text-lg font-semibold text-app-text">
                            Gaps
                        </h2>

                        <div className="mt-4 space-y-4">
                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-app-text">
                                        Skill gaps
                                    </p>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        skillGaps.length > 0
                                            ? 'bg-app-warning-bg text-app-warning-text'
                                            : 'bg-app-success-bg text-app-success-text'
                                    }`}>
                                        {skillGaps.length}
                                    </span>
                                </div>

                                <div className="mt-2 space-y-2">
                                    {skillGaps.length === 0 ? (
                                        <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                            No low-rated skills found.
                                        </p>
                                    ) : (
                                        skillGaps.slice(0, 3).map((skill) => (
                                            <div
                                                key={skill.id}
                                                className="flex items-center justify-between gap-3 rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-app-text">
                                                        {skill.skillName}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-app-text-muted">
                                                        {skill.roleName}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-app-warning-bg px-2 py-0.5 text-xs font-medium text-app-warning-text capitalize">
                                                    {skill.level.toLowerCase()}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-app-text">
                                        Knowledge gaps
                                    </p>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        topKnowledgeGaps.length > 0
                                            ? 'bg-app-warning-bg text-app-warning-text'
                                            : 'bg-app-success-bg text-app-success-text'
                                    }`}>
                                        {topKnowledgeGaps.length}
                                    </span>
                                </div>

                                <div className="mt-2 space-y-2">
                                    {topKnowledgeGaps.length === 0 ? (
                                        <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                            No knowledge gaps found.
                                        </p>
                                    ) : (
                                        topKnowledgeGaps.map((gap) => (
                                            <button
                                                key={gap.id}
                                                type="button"
                                                onClick={() =>
                                                    void navigate(
                                                        `/insights/knowledge-gaps/${gap.id}`,
                                                    )
                                                }
                                                className="w-full rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3 text-left transition-colors hover:border-app-brand"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="min-w-0 text-sm font-medium text-app-text">
                                                        {gap.component}
                                                    </p>
                                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                                        gap.severity === 'high'
                                                            ? 'bg-app-danger-bg text-app-danger-text'
                                                            : gap.severity === 'medium'
                                                              ? 'bg-app-warning-bg text-app-warning-text'
                                                              : 'bg-app-surface text-app-text-muted'
                                                    }`}>
                                                        {gap.severity}
                                                    </span>
                                                </div>
                                                <p className="mt-1 truncate text-xs text-app-text-muted">
                                                    {gap.missingTypes.join(', ')}
                                                </p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    </aside>
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
            {stepInsertTarget && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-lg rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-app-text">
                                    Add Custom Step
                                </h2>

                                <p className="mt-1 text-sm text-app-text-muted">
                                    Add the project-specific step for the selected slot.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStepInsertTarget(null)}
                                disabled={addingStep}
                                className="rounded-lg p-2 text-app-text-muted hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Close add step modal"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-3">
                            <input
                                value={customStepTitle}
                                onChange={(event) =>
                                    setCustomStepTitle(event.target.value)
                                }
                                placeholder="Meet your colleagues"
                                className="w-full rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                            />

                            <textarea
                                value={customStepDescription}
                                onChange={(event) =>
                                    setCustomStepDescription(event.target.value)
                                }
                                placeholder="Describe what the member should do."
                                rows={3}
                                className="w-full resize-none rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                            />

                            <textarea
                                value={customStepExpectedOutcome}
                                onChange={(event) =>
                                    setCustomStepExpectedOutcome(event.target.value)
                                }
                                placeholder="Describe the expected outcome."
                                rows={2}
                                className="w-full resize-none rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                            />

                            <label className="block">
                                <span className="text-xs font-medium text-app-text-muted">
                                    Estimated minutes
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    value={customStepMinutes}
                                    onChange={(event) =>
                                        setCustomStepMinutes(event.target.value)
                                    }
                                    className="mt-1 w-32 rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                />
                            </label>

                            <div className="rounded-2xl border border-app-border bg-app-surface-muted p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold text-app-text">
                                        Tasks
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCustomStepTasks((current) => [
                                                ...current,
                                                { title: '', description: '' },
                                            ])
                                        }
                                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-app-brand hover:bg-app-brand-soft"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Add task
                                    </button>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {customStepTasks.map((task, index) => (
                                        <div
                                            key={index}
                                            className="grid gap-2 rounded-xl border border-app-border bg-app-bg p-2"
                                        >
                                            <div className="flex gap-2">
                                                <input
                                                    value={task.title}
                                                    onChange={(event) =>
                                                        setCustomStepTasks((current) =>
                                                            current.map((item, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...item,
                                                                          title: event.target.value,
                                                                      }
                                                                    : item,
                                                            ),
                                                        )
                                                    }
                                                    placeholder="Task title"
                                                    className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                                />
                                                {customStepTasks.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setCustomStepTasks((current) =>
                                                                current.filter(
                                                                    (_, itemIndex) => itemIndex !== index,
                                                                ),
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-app-text-muted hover:bg-app-danger-bg hover:text-app-danger-text"
                                                        aria-label="Remove task row"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <input
                                                value={task.description}
                                                onChange={(event) =>
                                                    setCustomStepTasks((current) =>
                                                        current.map((item, itemIndex) =>
                                                            itemIndex === index
                                                                ? {
                                                                      ...item,
                                                                      description: event.target.value,
                                                                  }
                                                                : item,
                                                        ),
                                                    )
                                                }
                                                placeholder="Optional task description"
                                                className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {onboardingError && (
                                <p className="text-xs text-app-danger-text">
                                    {onboardingError}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setStepInsertTarget(null)}
                                disabled={addingStep}
                                className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleCreateCustomStep()}
                                disabled={
                                    addingStep ||
                                    customStepTitle.trim().length === 0
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" />
                                {addingStep ? 'Adding...' : 'Add step'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {detailStep && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
                    <button
                        type="button"
                        aria-label="Close step details"
                        className="hidden flex-1 cursor-default md:block"
                        onClick={() => setDetailStepId('')}
                    />

                    <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-app-border bg-app-surface p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStepStatusStyles(detailStep.status)}`}>
                                    {detailStep.status.replace('_', ' ')}
                                </span>

                                <h2 className="mt-3 text-xl font-semibold text-app-text">
                                    {detailStep.title}
                                </h2>

                                {detailStep.description && (
                                    <p className="mt-2 text-sm text-app-text-muted">
                                        {detailStep.description}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setDetailStepId('')}
                                className="rounded-lg p-2 text-app-text-muted hover:bg-app-surface-hover"
                                aria-label="Close step details"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-xl border border-app-border bg-app-surface-muted px-3 py-2">
                                <p className="text-app-text-muted">Estimate</p>
                                <p className="mt-1 font-semibold text-app-text">
                                    {formatMinutes(detailStep.estimatedMinutes)}
                                </p>
                            </div>

                            <div className="rounded-xl border border-app-border bg-app-surface-muted px-3 py-2">
                                <p className="text-app-text-muted">Actual</p>
                                <p className="mt-1 font-semibold text-app-text">
                                    {detailStepActualMinutes
                                        ? formatMinutes(detailStepActualMinutes)
                                        : 'Open'}
                                </p>
                            </div>

                            {/* <div className={`rounded-xl border px-3 py-2 ${
                                detailStepTimingDelta !== null &&
                                detailStepTimingDelta > 0
                                    ? 'border-app-warning-border bg-app-warning-bg'
                                    : 'border-app-success-border bg-app-success-bg'
                            }`}>
                                <p className="text-app-text-muted">Delta</p>
                                <p className={`mt-1 font-semibold ${
                                    detailStepTimingDelta !== null &&
                                    detailStepTimingDelta > 0
                                        ? 'text-app-warning-text'
                                        : 'text-app-success-text'
                                }`}>
                                    {detailStepTimingDelta === null
                                        ? 'Open'
                                        : detailStepTimingDelta === 0
                                          ? 'On time'
                                          : `${detailStepTimingDelta > 0 ? '+' : '-'}${formatMinutes(
                                                Math.abs(detailStepTimingDelta),
                                            )}`}
                                </p>
                            </div> */}
                        </div>

                        <section className="mt-6">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-app-text">
                                    Tasks
                                </h3>
                                <span className="rounded-full bg-app-surface-muted px-2.5 py-1 text-xs text-app-text-muted">
                                    {detailStepDoneTasks}/{detailStepTasks.length} done
                                </span>
                            </div>

                            <div className="mt-3 space-y-2">
                                {sortedDetailStepTasks.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                        <p>No tasks for this step.</p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setTaskInsertTarget({
                                                    stepId: detailStep.id,
                                                    position: 0,
                                                })
                                            }
                                            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3 py-2 text-xs font-medium text-app-text-inverse hover:bg-app-brand-hover"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add first task
                                        </button>
                                    </div>
                                ) : (
                                    sortedDetailStepTasks.map((task, index) => (
                                        <div key={task.id} className="group/task-insert space-y-1">
                                            {index === 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setTaskInsertTarget({
                                                            stepId: detailStep.id,
                                                            position: 0,
                                                        })
                                                    }
                                                    className="flex h-4 w-full items-center justify-center border-y border-transparent text-app-text-muted transition-all before:h-px before:flex-1 before:bg-app-border-muted after:h-px after:flex-1 after:bg-app-border-muted hover:text-app-brand"
                                                    aria-label={`Add task before ${task.title}`}
                                                    title="Add task here"
                                                >
                                                    <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/step-insert:opacity-100 group-hover/task-insert:opacity-100" />
                                                </button>
                                            )}

                                            {index === 0 &&
                                                taskInsertTarget?.stepId === detailStep.id &&
                                                taskInsertTarget.position === 0 && (
                                                    <div className="rounded-2xl border border-app-brand-border bg-app-brand-soft p-3">
                                                        <input
                                                            value={newTaskTitle}
                                                            onChange={(event) =>
                                                                setNewTaskTitle(event.target.value)
                                                            }
                                                            placeholder="Task title"
                                                            className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                                        />
                                                        <input
                                                            value={newTaskDescription}
                                                            onChange={(event) =>
                                                                setNewTaskDescription(event.target.value)
                                                            }
                                                            placeholder="Optional description"
                                                            className="mt-2 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                                        />
                                                        <div className="mt-3 flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setTaskInsertTarget(null);
                                                                    setNewTaskTitle('');
                                                                    setNewTaskDescription('');
                                                                }}
                                                                disabled={addingTask}
                                                                className="rounded-xl border border-app-border px-3 py-2 text-xs font-medium text-app-text hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleCreateTask()}
                                                                disabled={addingTask || newTaskTitle.trim().length === 0}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3 py-2 text-xs font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                {addingTask ? 'Adding...' : 'Add task'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                            <div className="flex items-start justify-between gap-3 rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3">
                                                <div className="flex min-w-0 gap-3">
                                                    {task.finished ? (
                                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-app-success-solid" />
                                                    ) : (
                                                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-app-text-disabled" />
                                                    )}

                                                    <div className="min-w-0">
                                                        <p className={`text-sm font-medium ${
                                                            task.finished
                                                                ? 'line-through text-app-text-subtle'
                                                                : 'text-app-text'
                                                        }`}>
                                                            {task.title}
                                                        </p>
                                                        {task.description && (
                                                            <p className="mt-1 text-xs text-app-text-muted">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setTaskToDelete(task)}
                                                    disabled={stepActionId !== null}
                                                    className="rounded-lg p-1.5 text-app-text-muted transition-colors hover:bg-app-danger-bg hover:text-app-danger-text disabled:cursor-not-allowed disabled:opacity-50"
                                                    aria-label={`Delete ${task.title}`}
                                                    title="Delete task"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setTaskInsertTarget({
                                                        stepId: detailStep.id,
                                                        position: index + 1,
                                                    })
                                                }
                                                className="flex h-4 w-full items-center justify-center border-y border-transparent text-app-text-muted transition-all before:h-px before:flex-1 before:bg-app-border-muted after:h-px after:flex-1 after:bg-app-border-muted hover:text-app-brand"
                                                aria-label={`Add task after ${task.title}`}
                                                title="Add task here"
                                            >
                                                <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover/step-insert:opacity-100 group-hover/task-insert:opacity-100" />
                                            </button>

                                            {taskInsertTarget?.stepId === detailStep.id &&
                                                taskInsertTarget.position === index + 1 && (
                                                    <div className="rounded-2xl border border-app-brand-border bg-app-brand-soft p-3">
                                                        <input
                                                            value={newTaskTitle}
                                                            onChange={(event) =>
                                                                setNewTaskTitle(event.target.value)
                                                            }
                                                            placeholder="Task title"
                                                            className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                                        />
                                                        <input
                                                            value={newTaskDescription}
                                                            onChange={(event) =>
                                                                setNewTaskDescription(event.target.value)
                                                            }
                                                            placeholder="Optional description"
                                                            className="mt-2 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                                        />
                                                        <div className="mt-3 flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setTaskInsertTarget(null);
                                                                    setNewTaskTitle('');
                                                                    setNewTaskDescription('');
                                                                }}
                                                                disabled={addingTask}
                                                                className="rounded-xl border border-app-border px-3 py-2 text-xs font-medium text-app-text hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleCreateTask()}
                                                                disabled={addingTask || newTaskTitle.trim().length === 0}
                                                                className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3 py-2 text-xs font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" />
                                                                {addingTask ? 'Adding...' : 'Add task'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    ))
                                )}

                                {taskInsertTarget?.stepId === detailStep.id &&
                                    sortedDetailStepTasks.length === 0 && (
                                        <div className="rounded-2xl border border-app-brand-border bg-app-brand-soft p-3">
                                            <input
                                                value={newTaskTitle}
                                                onChange={(event) =>
                                                    setNewTaskTitle(event.target.value)
                                                }
                                                placeholder="Task title"
                                                className="w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                            />
                                            <input
                                                value={newTaskDescription}
                                                onChange={(event) =>
                                                    setNewTaskDescription(event.target.value)
                                                }
                                                placeholder="Optional description"
                                                className="mt-2 w-full rounded-xl border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-brand"
                                            />
                                            <div className="mt-3 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTaskInsertTarget(null);
                                                        setNewTaskTitle('');
                                                        setNewTaskDescription('');
                                                    }}
                                                    disabled={addingTask}
                                                    className="rounded-xl border border-app-border px-3 py-2 text-xs font-medium text-app-text hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void handleCreateTask()}
                                                    disabled={addingTask || newTaskTitle.trim().length === 0}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-3 py-2 text-xs font-medium text-app-text-inverse hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    {addingTask ? 'Adding...' : 'Add task'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </section>

                        <section className="mt-6 space-y-3">
                            <h3 className="text-sm font-semibold text-app-text">
                                Requests & feedback
                            </h3>

                            {detailStepSkipReason && (
                                <div className={`rounded-2xl border px-4 py-3 text-sm ${
                                    detailStep.status === 'SKIPPED'
                                        ? 'border-app-danger-border bg-app-danger-bg text-app-danger-text'
                                        : 'border-app-warning-border bg-app-warning-bg text-app-warning-text'
                                }`}>
                                    {detailStepSkipReason}
                                </div>
                            )}

                            {detailStepFeedback.length > 0 ? (
                                detailStepFeedback.map((feedback) => (
                                    <div
                                        key={feedback.id}
                                        className="rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text"
                                    >
                                        {feedback.message}
                                    </div>
                                ))
                            ) : (
                                !detailStepSkipReason && (
                                    <p className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted px-4 py-3 text-sm text-app-text-muted">
                                        No skip request or feedback for this step.
                                    </p>
                                )
                            )}
                        </section>

                        <div className="mt-6 border-t border-app-border pt-4">
                            <button
                                type="button"
                                onClick={() => setStepToDelete(detailStep)}
                                disabled={stepActionId !== null}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-app-danger-border bg-app-danger-bg px-4 py-2 text-sm font-medium text-app-danger-text transition-colors hover:bg-app-danger-solid hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete step
                            </button>
                        </div>
                    </aside>
                </div>
            )}
            {stepToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-app-text">
                            Delete Step
                        </h2>

                        <p className="mt-2 text-sm text-app-text-muted">
                            Are you sure you want to delete{' '}
                            <span className="font-medium text-app-text">
                                {stepToDelete.title}
                            </span>{' '}
                            from this onboarding path?
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setStepToDelete(null)}
                                disabled={stepActionId === stepToDelete.id}
                                className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleDeleteStep(stepToDelete)}
                                disabled={stepActionId === stepToDelete.id}
                                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {stepActionId === stepToDelete.id
                                    ? 'Deleting...'
                                    : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {taskToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-sm rounded-3xl border border-app-border bg-app-surface p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-app-text">
                            Delete Task
                        </h2>

                        <p className="mt-2 text-sm text-app-text-muted">
                            Are you sure you want to delete{' '}
                            <span className="font-medium text-app-text">
                                {taskToDelete.title}
                            </span>
                            ?
                        </p>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setTaskToDelete(null)}
                                disabled={stepActionId === taskToDelete.stepId}
                                className="rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text hover:bg-app-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={() => void handleDeleteTask(taskToDelete)}
                                disabled={stepActionId === taskToDelete.stepId}
                                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {stepActionId === taskToDelete.stepId
                                    ? 'Deleting...'
                                    : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}
