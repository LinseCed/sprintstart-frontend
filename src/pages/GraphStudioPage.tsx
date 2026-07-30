import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Loader2, Network, Plus } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useProjectContext } from '../features/projects/useProjectContext';
import { StudioNodePanel } from '../features/graph-authoring/components/StudioNodePanel';
import { NewCompetencyModal } from '../features/graph-authoring/components/NewCompetencyModal';
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
 * It used to be a canvas, because competencies used to be a graph. With prerequisite edges retired
 * there is nothing to draw — a node-link diagram of a list is a picture of nothing — so this is a
 * list, and every row answers the question that survived: is anything written to teach this?
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
                        <div className="app-page-frame pb-8">
                            <ul data-testid="competency-list" className="space-y-2">
                                {graph.competencies.map(competency => {
                                    const readiness = readinessByKey.get(competency.key);
                                    const hasModule = Boolean(readiness?.activeModuleId);
                                    const isSelected = competency.key === selectedKey;
                                    return (
                                        <li key={competency.key}>
                                            <button
                                                type="button"
                                                aria-current={isSelected}
                                                onClick={() => setSelectedKey(competency.key)}
                                                className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus ${
                                                    isSelected
                                                        ? 'border-app-brand-border bg-app-brand-soft'
                                                        : 'border-app-border bg-app-surface hover:bg-app-surface-hover'
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-medium text-app-text">
                                                        {competency.label}
                                                    </span>
                                                    <span className="rounded-full bg-app-surface-hover px-2 py-0.5 text-xs text-app-text-muted">
                                                        {competency.kind.toLowerCase()}
                                                    </span>
                                                    <span className="text-xs text-app-text-subtle">
                                                        L{competency.targetLevel}
                                                    </span>
                                                    {/* The one thing that decides whether a hire
                                                        gets anything out of this competency. */}
                                                    {hasModule && (
                                                        <span className="inline-flex items-center gap-1 text-xs text-app-text-muted">
                                                            <BookOpen
                                                                className="h-3.5 w-3.5"
                                                                aria-hidden="true"
                                                            />
                                                            module
                                                        </span>
                                                    )}
                                                </div>
                                                {competency.description && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-app-text-muted">
                                                        {competency.description}
                                                    </p>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
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
