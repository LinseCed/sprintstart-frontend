import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, Network, Plus, Search } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useProjectContext } from '../features/projects/useProjectContext';
import { CompetencyList } from '../features/graph-authoring/components/CompetencyList';
import { StudioNodePanel } from '../features/graph-authoring/components/StudioNodePanel';
import { NewCompetencyModal } from '../features/graph-authoring/components/NewCompetencyModal';
import { groupByArea } from '../features/graph-authoring/grouping';
import { useGraphEditing } from '../features/graph-authoring/hooks/useGraphEditing';
import { useLiveGraph } from '../features/graph-authoring/hooks/useLiveGraph';
import { useModuleAuthoring } from '../features/graph-authoring/hooks/useModuleAuthoring';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';
import type { ModuleReadiness } from '../features/graph-authoring/hooks/useModuleAuthoring';

const NO_MODULE: ModuleReadiness = { activeModuleId: null, pending: null };

/**
 * The competency studio: the PM and admin surface for the vocabulary itself.
 *
 * A list rather than a diagram — competencies carry no edges, and every row answers the one
 * question there is to ask: is anything written to teach this?
 *
 * A vocabulary generated from a crawl is too long to read top to bottom, so the list groups by
 * `area` and offers a filter. Both are client-side over a vocabulary already in hand: a search
 * that costs a round trip is one people stop using.
 *
 * Competencies are global; modules are written against one project's corpus, so the project
 * selector scopes only the module half. HR can read but not author, matching the backend.
 */
export function GraphStudioPage() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const canAuthor =
        profile?.permissionGroup === PermissionGroup.PM ||
        profile?.permissionGroup === PermissionGroup.ADMIN;

    const { graph, isLoading, error: graphError, reload } = useLiveGraph();

    const { selectedProjectId } = useProjectContext();

    const {
        readinessByKey,
        isBusy: isCreatingModule,
        error: moduleError,
        create: createModule,
        streamingKey: moduleStreamingKey,
        activity: moduleActivity
    } = useModuleAuthoring(selectedProjectId, canAuthor);

    const {
        isSaving,
        error: editError,
        clearError: clearEditError,
        createCompetency,
        updateCompetency,
        deleteCompetency
    } = useGraphEditing(reload);

    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [query, setQuery] = useState('');

    const groups = useMemo(
        () => groupByArea(graph.competencies, query),
        [graph.competencies, query],
    );

    const keysWithModule = useMemo(
        () =>
            new Set(
                [...readinessByKey.entries()]
                    .filter(([, readiness]) => Boolean(readiness.activeModuleId))
                    .map(([key]) => key),
            ),
        [readinessByKey],
    );

    const handleCreateCompetency = async (
        input: Parameters<typeof createCompetency>[0]
    ): Promise<boolean> => {
        const created = await createCompetency(input);
        if (created) {
            // Drop the PM straight onto the competency they just made, so they can open a module
            // for it without hunting for it in the list.
            setSelectedKey(created.key);
            setIsCreateOpen(false);
        }
        return Boolean(created);
    };

    const selectedCompetency = graph.competencies.find(node => node.key === selectedKey) ?? null;

    // The grouping that already exists, offered wherever an area is typed. Derived rather than
    // fetched: the vocabulary is already in hand, and a second read could disagree with it.
    const existingAreas = [
        ...new Set(graph.competencies.map(node => node.area).filter((area): area is string => Boolean(area)))
    ].sort((a, b) => a.localeCompare(b));

    const addButton = (testId: string) =>
        canAuthor && (
            <button
                type="button"
                data-testid={testId}
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-app-border px-5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
            >
                <Plus className="h-4 w-4" />
                Add competency
            </button>
        );

    const header = (
        <header className="border-b border-app-border bg-app-bg">
            <div className="app-page-frame py-6">
                <PageHeader
                    icon={Network}
                    title="Competency Studio"
                    subtitle="The shared competency vocabulary and the module behind each one. Nothing here is anyone's personal progress."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {addButton('add-competency')}
                        </div>
                    }
                />
            </div>
        </header>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col bg-app-bg lg:h-screen">
            {header}

            {/*
              A landmark, not decoration: without one, everything below the header is content axe
              reports as belonging to no region, and a screen-reader user has no way to skip the
              page furniture to reach the vocabulary.
            */}
            <main className="flex min-h-0 flex-1 flex-col">
            {graphError && (
                <div className="app-page-frame mt-4 shrink-0">
                    <div className="flex items-center gap-3 rounded-2xl border border-app-danger-border bg-app-danger-bg p-4">
                        <AlertCircle className="h-4 w-4 shrink-0 text-app-danger-text" />
                        <p className="flex-1 text-sm text-app-danger-text">{graphError}</p>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center p-16">
                    <Loader2 className="h-8 w-8 animate-spin text-app-brand" />
                </div>
            ) : graph.competencies.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-16">
                    <div className="max-w-md text-center">
                        <Network className="mx-auto mb-4 h-10 w-10 text-app-text-disabled" />
                        <h2 className="mb-2 text-xl font-semibold text-app-text">
                            No competencies yet
                        </h2>
                        <p className="text-sm text-app-text-muted">
                            They are drafted from the ingested corpus — connect a repository in Data
                            Ingestion, or add one by hand.
                        </p>
                        <div className="mt-4 flex justify-center">
                            {addButton('add-competency-empty')}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-4 flex min-h-0 flex-1 flex-col lg:flex-row">
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="app-page-frame space-y-4 pb-8">
                            <label className="relative block">
                                <span className="sr-only">Search competencies</span>
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted"
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={event => setQuery(event.target.value)}
                                    placeholder="Search by name, area or key"
                                    className="h-11 w-full rounded-xl border border-app-border bg-app-surface pl-9 pr-3 text-sm text-app-text placeholder:text-app-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                                />
                            </label>

                            {groups.length === 0 ? (
                                // Not the empty-vocabulary state: that one says "connect a
                                // repository", which is the wrong advice when the vocabulary is full
                                // and the query simply matched none of it.
                                <p className="rounded-2xl border border-dashed border-app-border p-6 text-center text-sm text-app-text-muted">
                                    Nothing matches “{query.trim()}”.
                                </p>
                            ) : (
                                <CompetencyList
                                    groups={groups}
                                    keysWithModule={keysWithModule}
                                    selectedKey={selectedKey}
                                    onSelect={setSelectedKey}
                                />
                            )}
                        </div>
                    </div>

                    {selectedCompetency && (
                        <StudioNodePanel
                            competency={selectedCompetency}
                            existingAreas={existingAreas}
                            readiness={readinessByKey.get(selectedCompetency.key) ?? NO_MODULE}
                            canAuthorModules={canAuthor && Boolean(selectedProjectId)}
                            isSaving={isSaving}
                            editError={editError}
                            onClearEditError={clearEditError}
                            onSave={input => updateCompetency(selectedCompetency.key, input)}
                            onDelete={() => deleteCompetency(selectedCompetency.key)}
                            onClose={() => setSelectedKey(null)}
                            moduleReadinessProps={{
                                isBusy: isCreatingModule,
                                error: moduleError,
                                isStreaming: moduleStreamingKey === selectedCompetency.key,
                                activity: moduleActivity,
                                onOpenModule: moduleId =>
                                    void navigate(`/competency-modules/${moduleId}`),
                                onCreate: mode => {
                                    void createModule(
                                        selectedCompetency.key,
                                        selectedCompetency.label,
                                        mode
                                    ).then(module => {
                                        if (module)
                                            void navigate(`/competency-modules/${module.id}`);
                                    });
                                }
                            }}
                        />
                    )}
                </div>
            )}
            </main>

            {isCreateOpen && (
                <NewCompetencyModal
                    existingAreas={existingAreas}
                    isSaving={isSaving}
                    error={editError}
                    onClearError={clearEditError}
                    onCreate={handleCreateCompetency}
                    onClose={() => {
                        clearEditError();
                        setIsCreateOpen(false);
                    }}
                />
            )}
        </div>
    );
}
