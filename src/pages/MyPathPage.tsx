import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    FolderKanban,
    List,
    Map as MapIcon,
    Network,
    RefreshCw,
    Sparkles,
    X
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { AssessmentPathView } from '../features/skill-assessment/components/AssessmentPathView';
import { PathProgressBar } from '../features/skill-assessment/components/PathProgressBar';
import { useCompetencyPath } from '../features/skill-assessment/hooks/useCompetencyPath';
import { ProjectSelect } from '../features/projects/components/ProjectSelect';
import { useProjectSelection } from '../features/projects/useProjectSelection';
import { CompetencyGraph } from '../features/my-path/components/CompetencyGraph';
import { NodeDetailPanel } from '../features/my-path/components/NodeDetailPanel';
import { SkillsRail } from '../features/my-path/components/SkillsRail';
import { useMyCompetencies } from '../features/my-path/hooks/useMyCompetencies';
import { onboardingService } from '../services/onboardingService';
import type { PathNode, PathView } from '../features/skill-assessment/types';

/** Navigation state a passing module hands back so the map knows what to celebrate. */
type MyPathLocationState = { unlockedKey?: string } | null;

/**
 * Keys to pulse on arrival from a passed module: the competency just earned,
 * plus every node it directly unlocked that is now reachable.
 *
 * The map is unmounted while a module runs, so the cross-load state diff
 * `useCompetencyPath` computes can't span the round trip -- the earned key comes
 * back in navigation state instead, and the dependents are derived from the
 * freshly loaded path.
 */
function unlockedPulseKeys(path: PathView | null, unlockedKey: string | undefined): Set<string> {
    if (!path || !unlockedKey) return new Set();

    const keys = new Set<string>([unlockedKey]);
    for (const edge of path.edges) {
        if (edge.from !== unlockedKey) continue;
        const dependent = path.nodes.find(node => node.key === edge.to);
        if (dependent && dependent.state !== 'LOCKED') keys.add(dependent.key);
    }
    return keys;
}

/**
 * "My Path" -- the competency graph *is* the interface.
 *
 * A top-level route (not nested under `/onboarding`) showing one project's graph
 * as an interactive node-link map, the user's global skills alongside it, and a
 * detail panel that explains why any node is where it is. Opening a node leaves
 * for the focused module route; passing its check returns here and animates the
 * unlock.
 *
 * Onboarding is per-project (the graph and the ledger are global, but each
 * project is onboarded independently), so a project switcher scopes the map.
 * Selecting a project with no path yet generates one rather than erroring -- the
 * user asked for that project. The global one-time assessment gate is unchanged
 * and lives in `AuthGuard`.
 */
export function MyPathPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const unlockedKey = (location.state as MyPathLocationState)?.unlockedKey;

    const {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        isLoading: projectsLoading,
        errorMessage: projectsError
    } = useProjectSelection();

    const { path, isLoading, error, notFound, pathUpdated, justChangedKeys, retry } =
        useCompetencyPath(selectedProjectId);
    const {
        competencies,
        isLoading: competenciesLoading,
        error: competenciesError
    } = useMyCompetencies();

    const [noticeDismissed, setNoticeDismissed] = useState(false);
    const [view, setView] = useState<'map' | 'list'>('map');
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [focusedKey, setFocusedKey] = useState<string | null>(null);

    const selectedNode = useMemo(
        () => path?.nodes.find(node => node.key === selectedKey) ?? null,
        [path, selectedKey]
    );
    const graphKeys = useMemo(
        () => new Set((path?.nodes ?? []).map(node => node.key)),
        [path]
    );
    const sourceByKey = useMemo(
        () => new Map(competencies.map(entry => [entry.competencyKey, entry.source])),
        [competencies]
    );
    const pulseKeys = useMemo(() => {
        const fromUnlock = unlockedPulseKeys(path, unlockedKey);
        return fromUnlock.size > 0 ? fromUnlock : justChangedKeys;
    }, [path, unlockedKey, justChangedKeys]);

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
                    onStage: name => setGenerationStage(name),
                    onPath: () => {
                        // The SSE emits the legacy phases path; this view reads the projected
                        // PathView instead, so just re-fetch once generation lands.
                    },
                    onDone: () => {
                        setIsGenerating(false);
                        void retry();
                    },
                    onError: message => {
                        setIsGenerating(false);
                        setGenerationError(message);
                    }
                },
                projectId
            );
        },
        [retry]
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

    // A fresh project selection is eligible for a fresh generation attempt, and
    // its graph has none of the previous project's nodes.
    const handleSelectProject = (projectId: string) => {
        setGeneratedForProject(null);
        setGenerationError(null);
        setSelectedKey(null);
        setFocusedKey(null);
        setSelectedProjectId(projectId);
    };

    const openModule = (moduleId: string) => {
        void navigate(`/my-path/module/${moduleId}`);
    };

    const editModule = (moduleId: string) => {
        void navigate(`/competency-modules/${moduleId}`);
    };

    const handleFocusSkill = (key: string) => {
        setFocusedKey(key);
        setSelectedKey(key);
    };

    const switcher = (
        <div className="flex flex-wrap items-center gap-2">
            <div
                role="group"
                aria-label="Path view"
                className="flex items-center gap-1 rounded-xl border border-app-border bg-app-surface p-1"
            >
                <button
                    type="button"
                    aria-pressed={view === 'map'}
                    onClick={() => setView('map')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus ${
                        view === 'map'
                            ? 'bg-app-brand text-white'
                            : 'text-app-text-muted hover:text-app-text'
                    }`}
                >
                    <Network className="h-3.5 w-3.5" aria-hidden="true" />
                    Map
                </button>
                <button
                    type="button"
                    aria-pressed={view === 'list'}
                    onClick={() => setView('list')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus ${
                        view === 'list'
                            ? 'bg-app-brand text-white'
                            : 'text-app-text-muted hover:text-app-text'
                    }`}
                >
                    <List className="h-3.5 w-3.5" aria-hidden="true" />
                    List view
                </button>
            </div>
            <ProjectSelect
                projects={projects}
                selectedProjectId={selectedProjectId}
                isLoading={projectsLoading}
                errorMessage={projectsError}
                onChange={handleSelectProject}
            />
        </div>
    );

    const header = (
        <div className="shrink-0 border-b border-app-border bg-app-bg/90 backdrop-blur-xl">
            <div className="app-page-content py-4">
                <PageHeader
                    icon={MapIcon}
                    title="Your path"
                    subtitle="Every node is a competency: mastered ones are already yours, available ones are ready to start, locked ones are waiting on a prerequisite."
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
                        You&apos;re not a member of any project yet. Onboarding starts once you join
                        one.
                    </p>
                </div>
            </div>
        );
    }

    // Whether we've already run generation for the currently selected project --
    // distinguishes "about to auto-generate" from "generated but produced no path".
    const alreadyAttempted = generatedForProject === selectedProjectId;

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
        // The map fills the viewport so the graph canvas has a real height to lay
        // out in; below `lg` the shell adds its 64px top bar, hence the offset.
        <div className="flex h-[calc(100vh-64px)] flex-col bg-app-bg lg:h-screen">
            {header}

            {pathUpdated && !noticeDismissed && (
                <div className="app-page-content mt-4 shrink-0">
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
                <div className="app-page-content mt-4 shrink-0">
                    <PathProgressBar path={path} />
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center p-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-brand border-t-transparent" />
                </div>
            ) : (
                path && (
                    <div className="mt-4 flex min-h-0 flex-1 flex-col lg:flex-row">
                        <SkillsRail
                            competencies={competencies}
                            isLoading={competenciesLoading}
                            error={competenciesError}
                            graphKeys={graphKeys}
                            onFocusKey={handleFocusSkill}
                        />

                        <div className="min-h-[24rem] flex-1 overflow-auto">
                            {path.nodes.length === 0 ? (
                                <p className="p-16 text-center text-sm text-app-text-muted">
                                    No competencies in your path yet. Check back once your baseline
                                    is ready.
                                </p>
                            ) : view === 'map' ? (
                                <CompetencyGraph
                                    path={path}
                                    selectedKey={selectedKey}
                                    focusedKey={focusedKey}
                                    justChangedKeys={pulseKeys}
                                    onSelectNode={(node: PathNode | null) => {
                                        setFocusedKey(null);
                                        setSelectedKey(node?.key ?? null);
                                    }}
                                />
                            ) : (
                                <AssessmentPathView
                                    path={path}
                                    justChangedKeys={pulseKeys}
                                    onSelectNode={node => setSelectedKey(node.key)}
                                />
                            )}
                        </div>

                        {selectedNode && (
                            <NodeDetailPanel
                                node={selectedNode}
                                path={path}
                                source={sourceByKey.get(selectedNode.key) ?? null}
                                onStartModule={openModule}
                                onEditModule={editModule}
                                onSelectKey={setSelectedKey}
                                onClose={() => setSelectedKey(null)}
                            />
                        )}
                    </div>
                )
            )}
        </div>
    );
}
