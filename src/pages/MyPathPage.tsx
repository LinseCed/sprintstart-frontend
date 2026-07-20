import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
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
import { BuddyCard } from '../features/human-loop/components/BuddyCard';
import { CompetencyGraph } from '../features/my-path/components/CompetencyGraph';
import { NodeDetailPanel } from '../features/my-path/components/NodeDetailPanel';
import { SkillsRail } from '../features/my-path/components/SkillsRail';
import { useMyCompetencies } from '../features/my-path/hooks/useMyCompetencies';
import { GoalBanner } from '../features/my-path/components/GoalBanner';
import { GoalPicker } from '../features/my-path/components/GoalPicker';
import { useGoalSelection } from '../features/my-path/hooks/useGoalSelection';
import { useUnlockSequence } from '../features/my-path/hooks/useUnlockSequence';
import type { PathNode } from '../features/skill-assessment/types';

/** Navigation state a passing module hands back so the map knows what to celebrate. */
type MyPathLocationState = { unlockedKey?: string } | null;

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
 * project is onboarded independently), so a project switcher scopes the map. The
 * path is derived on every read, so a project with nothing on it means its
 * baseline hasn't been approved yet -- there is nothing for a hire to generate.
 * The global one-time assessment gate is unchanged and lives in `AuthGuard`.
 *
 * One audience: the hire. Editing the graph, and authoring the module behind a
 * node, is a different job against a different object -- the whole shared graph
 * rather than one person's projection of it -- and lives in the competency studio
 * (`/graph-studio`). Bolting it on here meant a PM edited the graph through their
 * own onboarding, and saw nothing at all on a project with no approved baseline.
 */
export function MyPathPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const reduceMotion = useReducedMotion() ?? false;
    const unlockedKey = (location.state as MyPathLocationState)?.unlockedKey;

    const {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        isLoading: projectsLoading,
        errorMessage: projectsError
    } = useProjectSelection();

    const { path, isLoading, error, pathUpdated, justChangedKeys, retry } =
        useCompetencyPath(selectedProjectId);
    const {
        competencies,
        isLoading: competenciesLoading,
        error: competenciesError
    } = useMyCompetencies();

    const {
        matches,
        isLoading: matchesLoading,
        isClaiming,
        error: goalError,
        loadMatches,
        claim: claimGoal,
        clear: clearGoal
    } = useGoalSelection(selectedProjectId, retry);

    const [isPickingGoal, setIsPickingGoal] = useState(false);
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
    // On the map the unlock sequence owns the celebration when a module was just
    // passed, so the one-shot pulse stands down; the cross-load diff still covers
    // a state change that happened in place.
    const unlock = useUnlockSequence(unlockedKey, path, !reduceMotion);
    const pulseKeys = unlock.unlockedKey ? undefined : justChangedKeys;
    // The list has no camera and no edges to run a charge along, so there the
    // same unlock stays a pulse on what changed -- otherwise switching to the
    // accessible view would silently cost you the feedback entirely.
    const listPulseKeys = useMemo(
        () =>
            unlock.unlockedKey
                ? new Set([unlock.unlockedKey, ...unlock.dependentKeys])
                : justChangedKeys,
        [unlock.unlockedKey, unlock.dependentKeys, justChangedKeys]
    );

    // A fresh project has none of the previous project's nodes selected.
    const handleSelectProject = (projectId: string) => {
        setSelectedKey(null);
        setFocusedKey(null);
        setSelectedProjectId(projectId);
    };

    const openModule = (moduleId: string) => {
        void navigate(`/my-path/module/${moduleId}`);
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

    // The human loop is day-one context, so it shows whenever a project is
    // selected -- even before a baseline exists and there is nothing on the path.
    const buddySection = selectedProjectId ? (
        <div className="app-page-content mt-4 shrink-0">
            <BuddyCard projectId={selectedProjectId} />
        </div>
    ) : null;

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

    if (error) {
        return (
            <div className="min-h-screen bg-app-bg">
                {header}
                <div className="flex items-center justify-center p-16">
                    <div className="max-w-md text-center">
                        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-app-danger-solid" />
                        <h2 className="mb-2 text-xl font-semibold text-app-text">
                            Something went wrong
                        </h2>
                        <p className="mb-6 text-sm text-app-text-muted">{error}</p>
                        <button
                            onClick={() => void retry()}
                            className="rounded-xl bg-app-brand px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-app-brand-hover"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // An empty path is an answer, not a failure. The path is derived from the
    // project's baseline, so "nothing here" means nobody has approved a baseline
    // for this project yet -- which is a PM's job, not something to retry.
    if (path && path.nodes.length === 0) {
        return (
            <div className="min-h-screen bg-app-bg">
                {header}
                {buddySection}
                <div className="flex items-center justify-center p-16">
                    <div className="max-w-md text-center">
                        <Sparkles className="mx-auto mb-4 h-10 w-10 text-app-brand" />
                        <h2 className="mb-2 text-xl font-semibold text-app-text">
                            Nothing on your path yet
                        </h2>
                        <p className="text-sm text-app-text-muted">
                            This project&apos;s onboarding baseline hasn&apos;t been approved yet, so
                            there are no competencies to aim at. It&apos;ll appear here once it has.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        // The map fills the viewport so the graph canvas has a real height to lay
        // out in; below `lg` the shell adds its 64px top bar, hence the offset.
        <div className="flex h-[calc(100vh-64px)] flex-col overflow-y-auto bg-app-bg lg:h-screen">
            {header}
            {buddySection}

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
                <div className="app-page-content mt-4 shrink-0 space-y-3">
                    {/* The destination first: the premise is that onboarding ends in shipping
                        something, so the page should say what that something is. */}
                    <GoalBanner
                        goal={path.goal}
                        onFocusGoal={handleFocusSkill}
                        onChooseGoal={() => setIsPickingGoal(true)}
                        isBusy={isClaiming}
                    />
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
                                    unlock={unlock}
                                    onSelectNode={(node: PathNode | null) => {
                                        setFocusedKey(null);
                                        setSelectedKey(node?.key ?? null);
                                    }}
                                />
                            ) : (
                                <AssessmentPathView
                                    path={path}
                                    justChangedKeys={listPulseKeys}
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
                                onSelectKey={setSelectedKey}
                                onClose={() => setSelectedKey(null)}
                            />
                        )}
                    </div>
                )
            )}

            {isPickingGoal && (
                <GoalPicker
                    matches={matches}
                    currentGoal={path?.goal}
                    isLoading={matchesLoading}
                    isClaiming={isClaiming}
                    error={goalError}
                    onLoad={loadMatches}
                    onClaim={claimGoal}
                    onClear={clearGoal}
                    onClose={() => setIsPickingGoal(false)}
                />
            )}
        </div>
    );
}
