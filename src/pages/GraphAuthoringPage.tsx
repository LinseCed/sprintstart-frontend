import { CheckCheck, Loader2, Network, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';
import { CompetencyProposalList } from '../features/graph-authoring/components/CompetencyProposalList';
import { CompetencyEdgeProposalList } from '../features/graph-authoring/components/CompetencyEdgeProposalList';
import { useGraphAuthoring } from '../features/graph-authoring/hooks/useGraphAuthoring';

/**
 * PM-facing surface for the competency graph's proposal-only lifecycle: trigger AI generation
 * over the ingested corpus, then approve or reject each proposed competency/edge individually.
 * The live graph is never touched until a PM explicitly approves a proposal.
 */
export function GraphAuthoringPage() {
    const { profile } = useAuth();
    const canAct = profile?.permissionGroup !== PermissionGroup.HR;
    const {
        competencies,
        edges,
        isLoading,
        isGenerating,
        error,
        generateResult,
        generate,
        approveCompetency,
        rejectCompetency,
        approveEdge,
        rejectEdge,
        approveAll,
    } = useGraphAuthoring();

    const proposalCount = competencies.length + edges.length;

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={Network}
                        title="Graph Authoring"
                        subtitle="Generate AI-proposed competencies and edges from the ingested corpus, then approve or reject each one. The live graph never changes until you approve."
                        actions={
                            <div className="flex flex-wrap items-center gap-2">
                            {canAct && proposalCount > 0 && (
                                <button
                                    type="button"
                                    data-testid="approve-all"
                                    onClick={() => void approveAll()}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-app-border px-5 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                    Approve all {proposalCount}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => void generate()}
                                disabled={isGenerating}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-app-brand px-5 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                {isGenerating ? 'Generating...' : 'Generate proposals'}
                            </button>
                            </div>
                        }
                    />
                </div>
            </header>

            <main className="app-page-frame space-y-5 py-6 lg:py-8">
                {generateResult && (
                    <div className="rounded-2xl border border-app-brand-border bg-app-brand-soft p-4 text-sm text-app-brand-text">
                        Generated {generateResult.competenciesProposed} competenc
                        {generateResult.competenciesProposed === 1 ? 'y' : 'ies'} and{' '}
                        {generateResult.edgesProposed} edge{generateResult.edgesProposed === 1 ? '' : 's'} for review.
                        {generateResult.notes.length > 0 && (
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                {generateResult.notes.map(note => (
                                    <li key={note}>{note}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {error && (
                    <div className="rounded-2xl border border-app-danger-border bg-app-danger-bg p-4 text-sm text-app-danger-text">
                        {error}
                    </div>
                )}

                {/* Worth stating, because "approve each one" looks like the careful
                    option and is actually the one that produces the worse result. */}
                {canAct && proposalCount > 0 && (
                    <p className="text-sm text-app-text-muted">
                        Approving everything at once lands the new nodes and their prerequisite
                        links together, so hires see them already connected. Approved one at a
                        time, a node arrives before its links do and can briefly look like it has
                        no prerequisites.
                    </p>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-16 text-app-text-muted">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <>
                        <section className="rounded-3xl border border-app-border bg-app-bg p-4 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-app-text">Proposed competencies</h2>
                                <p className="text-sm text-app-text-muted">
                                    New nodes proposed for the competency graph.
                                </p>
                            </div>
                            <CompetencyProposalList
                                proposals={competencies}
                                canAct={canAct}
                                onApprove={approveCompetency}
                                onReject={rejectCompetency}
                            />
                        </section>

                        <section className="rounded-3xl border border-app-border bg-app-bg p-4 shadow-sm">
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-app-text">Proposed edges</h2>
                                <p className="text-sm text-app-text-muted">
                                    New prerequisite/related relationships between competencies.
                                </p>
                            </div>
                            <CompetencyEdgeProposalList
                                proposals={edges}
                                canAct={canAct}
                                onApprove={approveEdge}
                                onReject={rejectEdge}
                            />
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
