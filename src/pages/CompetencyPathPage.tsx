import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, FolderKanban, Map, RefreshCw, Sparkles, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { AssessmentPathView } from '../features/skill-assessment/components/AssessmentPathView';
import { PathProgressBar } from '../features/skill-assessment/components/PathProgressBar';
import { useCompetencyPath } from '../features/skill-assessment/hooks/useCompetencyPath';
import { ProjectSelect } from '../features/projects/components/ProjectSelect';
import { useProjectSelection } from '../features/projects/useProjectSelection';
import { LearnVerifyModuleModal } from '../features/learn-verify/components/LearnVerifyModuleModal';
import { onboardingService } from '../services/onboardingService';
import type { PathNode } from '../features/skill-assessment/types';

/**
 * A persistent, revisitable view of the authenticated user's competency path
 * for the selected project -- where they've mastered, what's available next, and
 * what's still locked behind unmet prerequisites.
 *
 * Onboarding is per-project (the competency graph and progress ledger are
 * global, but each project is onboarded independently), so a project switcher
 * drives which path is shown. Entering a project the user has no path for yet
 * (`404`) kicks off AI generation for that project rather than erroring -- no
 * forced interrupt, the user picked the project. The global one-time skill
 * assessment gate is unchanged and lives in `AuthGuard`, not here.
 */
export function CompetencyPathPage() {
    const {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        isLoading: projectsLoading,
        errorMessage: projectsError,
    } = useProjectSelection();

    const { path, isLoading, error, notFound, pathUpdated, justChangedKeys, retry } =
        useCompetencyPath(selectedProjectId);

    const [noticeDismissed, setNoticeDismissed] = useState(false);
    const [selectedNode, setSelectedNode] = useState<PathNode | null>(null);

    // Path generation (only reached when a project has no path yet).
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStage, setGenerationStage] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);
    // The project we've already auto-generated for, so a generation that fails to
    // produce a path doesn't loop the 404 -> generate -> 404 cycle forever.
    const [generatedForProject, setGeneratedForProject] = useState<string | null>(null);

    const generatePath = useCallback(
        async (projectId: string) => {
            setIsGenerating(true);
            setGenerationStage(null);
            setGenerationError(null);
            setGeneratedForProject(projectId);
            await onboardingService.personalizePath(
                {
                    onStage: (name) => setGenerationStage(name),
                    onPath: () => {
                        // The SSE emits the legacy phases path; the graph view reads the
                        // projected PathView instead, so just re-fetch once generation lands.
                    },
                    onDone: () => {
                        setIsGenerating(false);
                        void retry();
                    },
                    onError: (message) => {
                        setIsGenerating(false);
                        setGenerationError(message);
                    },
                },
                projectId,
            );
        },
        [retry],
    );

    // Auto-start generation the first time we learn a selected project has no path.
    // Deferred to a macrotask so it reads as the async side-effect it is, rather
    // than a synchronous setState cascade during the effect.
    useEffect(() => {
        if (
            !notFound ||
            !selectedProjectId ||
            isGenerating ||
            generatedForProject === selectedProjectId
        ) {
            return;
        }
        const timer = setTimeout(() => void generatePath(selectedProjectId), 0);
        return () => clearTimeout(timer);
    }, [notFound, selectedProjectId, isGenerating, generatedForProject, generatePath]);

    // A fresh project selection is eligible for a fresh generation attempt.
    const handleSelectProject = (projectId: string) => {
        setGeneratedForProject(null);
        setGenerationError(null);
        setSelectedProjectId(projectId);
    };

    const closeModule = ({ submittedAttempt }: { submittedAttempt: boolean; passed: boolean }) => {
        setSelectedNode(null);
        if (submittedAttempt) {
            void retry();
        }
    };

    const switcher = (
        <ProjectSelect
            projects={projects}
            selectedProjectId={selectedProjectId}
            isLoading={projectsLoading}
            errorMessage={projectsError}
            onChange={handleSelectProject}
        />
    );

    const header = (
        <div className="border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
            <div className="app-page-content py-4">
                <PageHeader
                    icon={Map}
                    title="Your competency path"
                    subtitle="Nodes you've mastered are already yours; available nodes are ready to start; locked nodes are waiting on a prerequisite."
                    actions={switcher}
                />
            </div>
        </div>
    );

    // No project to scope the path to: nothing to show until one is picked/exists.
    if (!projectsLoading && !projectsError && projects.length === 0) {
        return (
            <div className="min-h-screen bg-app-bg">
                {header}
                <div className="flex flex-col items-center justify-center gap-3 p-16 text-center text-app-text-muted">
                    <FolderKanban className="h-10 w-10 text-app-text-disabled" />
                    <p className="text-sm">
                        You&apos;re not a member of any project yet. Onboarding starts once you
                        join one.
                    </p>
                </div>
            </div>
        );
    }

    // Whether we've already run generation for the currently selected project --
    // distinguishes "about to auto-generate" from "generated but produced no path".
    const alreadyAttempted = generatedForProject === selectedProjectId;

    // Generating this project's path (or about to auto-start it on first 404).
    if (isGenerating || (notFound && !alreadyAttempted)) {
        return (
            <div className="min-h-screen bg-app-bg">
                {header}
                <div className="flex items-center justify-center p-16">
                    <div className="max-w-md text-center">
                        <Sparkles className="mx-auto mb-4 h-10 w-10 animate-pulse text-app-brand" />
                        <h2 className="mb-2 text-xl font-semibold text-app-text">
                            Building your path for this project...
                        </h2>
                        <p className="text-sm text-app-text-muted">
                            {generationStage ?? 'Starting up'}
                        </p>
                        <div className="mx-auto mt-4 h-6 w-6 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />
                    </div>
                </div>
            </div>
        );
    }

    // A load failure, a generation error, or a generation that ran but produced
    // no path (e.g. nothing ingested yet to build a baseline from).
    if (error || generationError || (notFound && alreadyAttempted)) {
        const message =
            error ??
            generationError ??
            "We couldn't build a path for this project yet -- there may be nothing ingested to base it on.";
        return (
            <div className="min-h-screen bg-app-bg">
                {header}
                <div className="flex items-center justify-center p-16">
                    <div className="max-w-md text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-app-danger-solid" />
                        <h2 className="mb-2 text-xl font-semibold text-app-text">
                            Something went wrong
                        </h2>
                        <p className="mb-6 text-sm text-app-text-muted">{message}</p>
                        <button
                            onClick={() => {
                                if (selectedProjectId && (generationError || notFound)) {
                                    setGeneratedForProject(null);
                                    void generatePath(selectedProjectId);
                                } else {
                                    void retry();
                                }
                            }}
                            className="rounded-xl bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg">
            {header}

            {pathUpdated && !noticeDismissed && (
                <div className="app-page-content mt-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-app-border bg-app-surface-muted p-4">
                        <RefreshCw className="h-4 w-4 shrink-0 text-app-brand-text" />
                        <p className="flex-1 text-sm text-app-text">
                            Your path was updated since you last checked it.
                        </p>
                        <button
                            aria-label="Dismiss notice"
                            onClick={() => setNoticeDismissed(true)}
                            className="text-app-text-muted transition-colors hover:text-app-text"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {!isLoading && path && (
                <div className="app-page-content mt-6">
                    <PathProgressBar path={path} />
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center p-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />
                </div>
            ) : (
                path && (
                    <AssessmentPathView path={path} justChangedKeys={justChangedKeys} onSelectNode={setSelectedNode} />
                )
            )}

            {selectedNode && path && (
                <LearnVerifyModuleModal node={selectedNode} path={path} onClose={closeModule} />
            )}
        </div>
    );
}
