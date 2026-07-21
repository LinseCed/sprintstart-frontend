import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCheck, Loader2, Network, Sparkles, X } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { ProjectSelect } from '../features/projects/components/ProjectSelect';
import { useProjectSelection } from '../features/projects/useProjectSelection';
import { StudioGraph } from '../features/graph-authoring/components/StudioGraph';
import { StudioNodePanel } from '../features/graph-authoring/components/StudioNodePanel';
import { CompetencyProposalList } from '../features/graph-authoring/components/CompetencyProposalList';
import { CompetencyEdgeProposalList } from '../features/graph-authoring/components/CompetencyEdgeProposalList';
import { useGraphAuthoring } from '../features/graph-authoring/hooks/useGraphAuthoring';
import { useGraphEditing } from '../features/graph-authoring/hooks/useGraphEditing';
import { useLiveGraph } from '../features/graph-authoring/hooks/useLiveGraph';
import { useModuleAuthoring } from '../features/graph-authoring/hooks/useModuleAuthoring';
import { useBaseline } from '../features/graph-authoring/hooks/useBaseline';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';
import type { ModuleReadiness } from '../features/graph-authoring/hooks/useModuleAuthoring';

const NO_MODULE: ModuleReadiness = { activeModuleId: null, pending: null };

/**
 * The competency studio: the PM and admin surface for the graph itself.
 *
 * Deliberately separate from `/my-path`. That page is a hire's onboarding — their ledger, their
 * goal, their project's approved baseline — and authoring used to be bolted onto it, which meant
 * a PM edited the shared graph through their own progress, and saw nothing at all on a project
 * whose baseline selects nothing. Here the graph is the whole graph, and every node is shown by
 * how *finished* it is rather than by anyone's progress against it.
 *
 * Three jobs on one canvas, because they are the same job:
 * - **structure** — add, edit, remove nodes and the prerequisites between them;
 * - **content** — draft, continue and publish each competency's learn-verify module;
 * - **review** — approve or reject what the AI proposed, in the context of the graph it joins.
 *
 * The graph is global; modules are written against one project's corpus, so the project selector
 * scopes only the module half. HR can read and review but not author, matching the backend.
 */
export function GraphStudioPage() {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const canAuthor =
        profile?.permissionGroup === PermissionGroup.PM ||
        profile?.permissionGroup === PermissionGroup.ADMIN;

    const { graph, isLoading, error: graphError, reload } = useLiveGraph();
    const {
        competencies: proposedCompetencies,
        edges: proposedEdges,
        isGenerating,
        error: proposalError,
        generateResult,
        generate,
        approveCompetency,
        rejectCompetency,
        approveEdge,
        rejectEdge,
        approveAll
    } = useGraphAuthoring();

    const {
        projects,
        selectedProjectId,
        setSelectedProjectId,
        isLoading: projectsLoading,
        errorMessage: projectsError
    } = useProjectSelection({ isAdmin: profile?.permissionGroup === PermissionGroup.ADMIN });

    const {
        readinessByKey,
        isBusy: isCreatingModule,
        error: moduleError,
        create: createModule
    } = useModuleAuthoring(selectedProjectId, canAuthor);

    const canAuthorBaseline = canAuthor && Boolean(selectedProjectId);
    const {
        entryFor: baselineEntryFor,
        setExpected: setBaselineExpected,
        remove: removeBaseline,
        isBusy: isSavingBaseline,
        error: baselineError
    } = useBaseline(selectedProjectId, canAuthorBaseline);

    const {
        isSaving,
        error: editError,
        clearError: clearEditError,
        updateCompetency,
        deleteCompetency,
        addPrerequisite,
        removePrerequisite
    } = useGraphEditing(reload);

    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);

    const proposals = useMemo(
        () => ({ competencies: proposedCompetencies, edges: proposedEdges }),
        [proposedCompetencies, proposedEdges]
    );
    const proposalCount = proposedCompetencies.length + proposedEdges.length;

    const selectedCompetency = graph.competencies.find(node => node.key === selectedKey) ?? null;
    const selectedProposal =
        proposedCompetencies.find(proposal => proposal.key === selectedKey) ?? null;

    // A proposal has no live row, so it is shown with the defaults it would be created with.
    const panelCompetency =
        selectedCompetency ??
        (selectedProposal
            ? {
                  key: selectedProposal.key,
                  label: selectedProposal.label,
                  description: selectedProposal.description,
                  kind: selectedProposal.kind,
                  targetLevel: 0,
                  invariant: false,
                  repoRef: selectedProposal.repoRef
              }
            : null);

    const handleApproveAndReload = async (action: () => Promise<void> | void) => {
        await action();
        await reload();
    };

    const header = (
        <header className="border-b border-app-border bg-app-bg">
            <div className="app-page-frame py-6">
                <PageHeader
                    icon={Network}
                    title="Competency Studio"
                    subtitle="The shared competency graph: its structure, the module behind each node, and what the AI has proposed. Nothing here is anyone's personal path."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <ProjectSelect
                                projects={projects}
                                selectedProjectId={selectedProjectId}
                                isLoading={projectsLoading}
                                errorMessage={projectsError}
                                onChange={setSelectedProjectId}
                            />
                            <button
                                type="button"
                                data-testid="open-review"
                                onClick={() => setIsReviewOpen(true)}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-app-border px-5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                            >
                                <Sparkles className="h-4 w-4" />
                                Review proposals
                                {proposalCount > 0 && (
                                    <span
                                        data-testid="proposal-count"
                                        className="rounded-full bg-app-brand px-2 py-0.5 text-xs font-semibold text-white"
                                    >
                                        {proposalCount}
                                    </span>
                                )}
                            </button>
                            {canAuthor && (
                                <button
                                    type="button"
                                    data-testid="generate-proposals"
                                    onClick={() => void generate()}
                                    disabled={isGenerating}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-app-brand px-5 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-4 w-4" />
                                    )}
                                    {isGenerating ? 'Generating…' : 'Generate with AI'}
                                </button>
                            )}
                        </div>
                    }
                />
            </div>
        </header>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] flex-col bg-app-bg lg:h-screen">
            {header}

            {(graphError ?? proposalError) && (
                <div className="app-page-frame mt-4 shrink-0">
                    <div className="flex items-center gap-3 rounded-2xl border border-app-danger-border bg-app-danger-bg p-4">
                        <AlertCircle className="h-4 w-4 shrink-0 text-app-danger-text" />
                        <p className="flex-1 text-sm text-app-danger-text">
                            {graphError ?? proposalError}
                        </p>
                    </div>
                </div>
            )}

            {generateResult && (
                <div className="app-page-frame mt-4 shrink-0">
                    <div className="rounded-2xl border border-app-brand-border bg-app-brand-soft p-4 text-sm text-app-brand-text">
                        Generated {generateResult.competenciesProposed} competenc
                        {generateResult.competenciesProposed === 1 ? 'y' : 'ies'} and{' '}
                        {generateResult.edgesProposed} edge
                        {generateResult.edgesProposed === 1 ? '' : 's'} for review.
                        {generateResult.notes.length > 0 && (
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                {generateResult.notes.map(note => (
                                    <li key={note}>{note}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center p-16">
                    <Loader2 className="h-8 w-8 animate-spin text-app-brand" />
                </div>
            ) : graph.competencies.length === 0 && proposalCount === 0 ? (
                <div className="flex flex-1 items-center justify-center p-16">
                    <div className="max-w-md text-center">
                        <Network className="mx-auto mb-4 h-10 w-10 text-app-text-disabled" />
                        <h2 className="mb-2 text-xl font-semibold text-app-text">
                            The graph is empty
                        </h2>
                        <p className="text-sm text-app-text-muted">
                            Generate proposals from the ingested corpus to get a first set of
                            competencies, then approve the ones that belong.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="mt-4 flex min-h-0 flex-1 flex-col lg:flex-row">
                    <div className="min-h-[24rem] flex-1">
                        <StudioGraph
                            graph={graph}
                            readinessByKey={readinessByKey}
                            proposals={proposals}
                            selectedKey={selectedKey}
                            onSelectKey={setSelectedKey}
                            onConnectNodes={(fromKey, toKey) => {
                                void addPrerequisite(fromKey, toKey);
                            }}
                        />
                    </div>

                    {panelCompetency && (
                        <StudioNodePanel
                            competency={panelCompetency}
                            graph={graph}
                            proposal={selectedCompetency ? null : selectedProposal}
                            readiness={readinessByKey.get(panelCompetency.key) ?? NO_MODULE}
                            canAuthorModules={canAuthor && Boolean(selectedProjectId)}
                            isSaving={isSaving}
                            editError={editError}
                            onClearEditError={clearEditError}
                            onSave={input => updateCompetency(panelCompetency.key, input)}
                            onDelete={() => deleteCompetency(panelCompetency.key)}
                            onAddPrerequisite={addPrerequisite}
                            onRemovePrerequisite={removePrerequisite}
                            onSelectKey={setSelectedKey}
                            onClose={() => setSelectedKey(null)}
                            moduleReadinessProps={{
                                isBusy: isCreatingModule,
                                error: moduleError,
                                onOpenModule: moduleId =>
                                    void navigate(`/competency-modules/${moduleId}`),
                                onCreate: mode => {
                                    void createModule(
                                        panelCompetency.key,
                                        panelCompetency.label,
                                        mode
                                    ).then(module => {
                                        if (module)
                                            void navigate(`/competency-modules/${module.id}`);
                                    });
                                }
                            }}
                            baselineProps={
                                canAuthorBaseline && selectedCompetency
                                    ? {
                                          entry: baselineEntryFor(panelCompetency.key),
                                          isBusy: isSavingBaseline,
                                          error: baselineError,
                                          onSetExpected: input =>
                                              void setBaselineExpected(
                                                  panelCompetency.key,
                                                  input
                                              ),
                                          onRemove: () =>
                                              void removeBaseline(panelCompetency.key)
                                      }
                                    : null
                            }
                            onApproveProposal={id => {
                                void handleApproveAndReload(() => approveCompetency(id));
                                setSelectedKey(null);
                            }}
                            onRejectProposal={id => {
                                void rejectCompetency(id);
                                setSelectedKey(null);
                            }}
                        />
                    )}
                </div>
            )}

            {isReviewOpen && (
                <div
                    role="dialog"
                    aria-label="Proposal review"
                    data-testid="proposal-review"
                    className="fixed inset-0 z-50 flex justify-end bg-app-overlay"
                >
                    <div className="flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-app-bg p-6">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-app-text">
                                    Proposals awaiting review
                                </h2>
                                {/* Worth stating, because "approve each one" looks like the careful
                                    option and is actually the one with the worse result. */}
                                <p className="mt-1 text-sm text-app-text-muted">
                                    Approving everything at once lands the new nodes and their
                                    prerequisite links together, so hires see them already
                                    connected. Approved one at a time, a node arrives before its
                                    links do and can briefly look like it has no prerequisites.
                                </p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close proposal review"
                                onClick={() => setIsReviewOpen(false)}
                                className="rounded-lg p-1 text-app-text-muted transition-colors hover:bg-app-surface-hover hover:text-app-text"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {canAuthor && proposalCount > 0 && (
                            <button
                                type="button"
                                data-testid="approve-all"
                                onClick={() => void handleApproveAndReload(approveAll)}
                                className="mb-4 inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-app-border px-5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Approve all {proposalCount}
                            </button>
                        )}

                        <section className="mb-5">
                            <h3 className="mb-2 text-sm font-semibold text-app-text">
                                Proposed competencies
                            </h3>
                            <CompetencyProposalList
                                proposals={proposedCompetencies}
                                canAct={canAuthor}
                                onApprove={id => handleApproveAndReload(() => approveCompetency(id))}
                                onReject={rejectCompetency}
                            />
                        </section>

                        <section>
                            <h3 className="mb-2 text-sm font-semibold text-app-text">
                                Proposed relationships
                            </h3>
                            <CompetencyEdgeProposalList
                                proposals={proposedEdges}
                                canAct={canAuthor}
                                onApprove={id => handleApproveAndReload(() => approveEdge(id))}
                                onReject={rejectEdge}
                            />
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
