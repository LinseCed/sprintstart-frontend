import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FolderKanban, GraduationCap, Loader2, Rocket, UserRound } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ProjectSelect } from '../features/projects/components/ProjectSelect';
import { useProjectSelection } from '../features/projects/useProjectSelection';
import { EnvironmentStep } from '../features/first-week/components/EnvironmentStep';
import { TaskZeroStep } from '../features/first-week/components/TaskZeroStep';
import { useFirstWeek } from '../features/first-week/hooks/useFirstWeek';
import { OrientationPanel } from '../features/orientation/components/OrientationPanel';
import { useOrientation } from '../features/orientation/hooks/useOrientation';
import { RampSection } from '../features/ramp/components/RampSection';
import { useRamp } from '../features/ramp/hooks/useRamp';
import { BuddyCard } from '../features/human-loop/components/BuddyCard';
import { firstWeekService } from '../services/firstWeekService';

/**
 * The first week — what a new hire sees on day one, replacing "here is your
 * generated path".
 *
 * Three steps in the order that matters: **can you run it** (environment
 * readiness, settled by evidence, not self-declaration), **here is your first
 * task** (Task 0, once ready, with the PR loop spelled out), and **here is who to
 * ask** (the human buddy, reused from the human-loop slice). A hire who cannot get
 * the environment working reaches a person from step 1 in one action.
 *
 * Nothing here is gated behind the skill assessment — it is offered as an
 * optional, non-blocking step, never a wall. Onboarding is per-project, so a
 * switcher scopes the surface.
 */
export function FirstWeekPage() {
    const {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        isLoading: projectsLoading,
        errorMessage: projectsError
    } = useProjectSelection();

    const { environment, taskZero, isLoading, error, refresh } = useFirstWeek(selectedProjectId);
    // Loaded independently of the first week itself: orientation is help, never a
    // gate, so a slow assembly must not hold up the two reads the page depends on.
    const {
        orientation,
        isLoading: orientationLoading,
        error: orientationError,
        reload: reloadOrientation
    } = useOrientation(selectedProjectId);
    const {
        ramp,
        isLoading: rampLoading,
        error: rampError,
        reload: reloadRamp
    } = useRamp(selectedProjectId);
    // Past the mechanics: the ramp leads, and the setup steps become history rather than the page.
    const pastFirstWeek = ramp !== null && ramp.stage !== 'TASK_ZERO';

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isHandingBack, setIsHandingBack] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refresh();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleHandBack = async () => {
        if (!selectedProjectId) return;
        setIsHandingBack(true);
        try {
            await firstWeekService.unassignTaskZero(selectedProjectId);
            await refresh();
        } finally {
            setIsHandingBack(false);
        }
    };

    const header = (
        <header className="border-b border-app-border bg-app-bg">
            <div className="app-page-frame py-6">
                <PageHeader
                    icon={Rocket}
                    title="Your first week"
                    subtitle="Get it running, ship one small thing, and meet the person you can ask. That's the whole first week."
                    actions={
                        <ProjectSelect
                            projects={projects}
                            selectedProjectId={selectedProjectId}
                            isLoading={projectsLoading}
                            errorMessage={projectsError}
                            onChange={setSelectedProjectId}
                        />
                    }
                />
            </div>
        </header>
    );

    if (!projectsLoading && !projectsError && projects.length === 0) {
        return (
            <div className="min-h-screen bg-app-bg">
                {header}
                <div className="app-page-frame flex flex-col items-center gap-3 py-16 text-center text-app-text-muted">
                    <FolderKanban className="h-10 w-10 text-app-text-disabled" aria-hidden="true" />
                    <p className="text-sm">
                        You&apos;re not on a project yet. Your first week starts once you join one.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg">
            {header}

            <main className="app-page-frame space-y-4 py-6 lg:py-8">
                {/* The assessment is optional and never blocks the first week. */}
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-app-border bg-app-surface-muted px-4 py-3">
                    <GraduationCap className="h-4 w-4 shrink-0 text-app-text-muted" aria-hidden="true" />
                    <p className="flex-1 text-xs text-app-text-muted">
                        Optional: a short skill check helps tailor your competency path. You can take it
                        anytime — it won&apos;t hold up your first week.
                    </p>
                    <Link
                        to="/onboarding/assessment"
                        className="text-xs font-medium text-app-brand-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        Take the skill check
                    </Link>
                </div>

                {error ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-app-border bg-app-surface p-6 text-sm text-app-danger-text">
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                        {error}
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="h-6 w-6 animate-spin text-app-brand" aria-hidden="true" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/*
                         * Once somebody has merged something, the ramp *is* their home and the
                         * first-week steps are history — so it moves above them rather than being
                         * a section further down the page. Before that it sits underneath, because
                         * a hire who cannot run the project yet does not need a task list.
                         */}
                        {pastFirstWeek && (
                            <RampSection
                                projectId={selectedProjectId}
                                ramp={ramp}
                                isLoading={rampLoading}
                                error={rampError}
                                onChanged={() => void reloadRamp()}
                            />
                        )}
                        <EnvironmentStep
                            environment={environment}
                            onRefresh={() => void handleRefresh()}
                            isRefreshing={isRefreshing}
                        />
                        <TaskZeroStep
                            taskZero={taskZero}
                            environmentReady={environment?.ready ?? false}
                            onHandBack={() => void handleHandBack()}
                            isHandingBack={isHandingBack}
                            orientation={
                                <OrientationPanel
                                    orientation={orientation}
                                    isLoading={orientationLoading}
                                    error={orientationError}
                                    onRetry={() => void reloadOrientation()}
                                />
                            }
                        />
                        <div>
                            <div className="mb-3 flex items-center gap-2.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-app-brand-soft text-xs font-semibold text-app-brand-text">
                                    3
                                </span>
                                <h2 className="flex items-center gap-1.5 text-base font-semibold text-app-text">
                                    <UserRound className="h-4 w-4 text-app-text-muted" aria-hidden="true" />
                                    Who to ask
                                </h2>
                            </div>
                            {selectedProjectId && <BuddyCard projectId={selectedProjectId} />}
                        </div>
                        {!pastFirstWeek && selectedProjectId && (
                            <RampSection
                                projectId={selectedProjectId}
                                ramp={ramp}
                                isLoading={rampLoading}
                                error={rampError}
                                onChanged={() => void reloadRamp()}
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
