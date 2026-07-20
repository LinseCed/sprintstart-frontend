import { AlertCircle, ClipboardList, Loader2, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';
import { BlueprintProposalCard } from '../features/blueprint-authoring/components/BlueprintProposalCard';
import { useBlueprintAuthoring } from '../features/blueprint-authoring/hooks/useBlueprintAuthoring';

/**
 * PM-facing surface for the baseline's proposal-only lifecycle: generate proposals from the
 * ingested corpus, review them competency by competency, then approve the version that becomes the
 * mandatory baseline.
 *
 * A baseline is a selection over the competency graph -- which competencies everyone in a scope
 * must reach, and how deeply. This is the gate in front of everything a hire sees: path generation
 * refuses to run for a user whose scopes have no ACTIVE baseline, and a path aims only at what is
 * selected here, so until a version is approved hires get no path at all.
 */
export function BlueprintAuthoringPage() {
    const { profile } = useAuth();
    const canAct = profile?.permissionGroup !== PermissionGroup.HR;
    const {
        blueprints,
        isLoading,
        isGenerating,
        error,
        outcomes,
        generate,
        approve,
        reject,
        approveCompetency,
        rejectCompetency
    } = useBlueprintAuthoring();

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={ClipboardList}
                        title="Onboarding Baseline"
                        subtitle="Choose which competencies everyone here must reach, and how deeply. Generating proposes a selection from the ingested corpus; a hire's path aims at what you approve, and nobody gets a path until a baseline is active."
                        actions={
                            canAct && (
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
                                    {isGenerating ? 'Generating...' : 'Generate baseline'}
                                </button>
                            )
                        }
                    />
                </div>
            </header>

            <main className="app-page-frame space-y-5 py-6 lg:py-8">
                {outcomes && outcomes.length > 0 && (
                    <div className="rounded-2xl border border-app-brand-border bg-app-brand-soft p-4 text-sm text-app-brand-text">
                        <ul className="space-y-1">
                            {outcomes.map((outcome) => (
                                <li key={outcome.scope}>
                                    <span className="font-medium">{outcome.scope}</span>:{' '}
                                    {outcome.status}
                                    {outcome.message ? ` — ${outcome.message}` : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {error && (
                    <p
                        role="alert"
                        className="flex items-start gap-2 rounded-2xl border border-app-danger-border bg-app-surface p-4 text-sm text-app-danger-solid"
                    >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {error}
                    </p>
                )}

                {isLoading ? (
                    <p className="flex items-center gap-2 p-8 text-sm text-app-text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Loading proposals...
                    </p>
                ) : blueprints.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-app-border bg-app-surface-muted p-8 text-center">
                        <h3 className="text-lg font-semibold text-app-text">
                            No baseline waiting for review
                        </h3>
                        <p className="mx-auto mt-2 max-w-lg text-sm text-app-text-muted">
                            Either a baseline is already active, or none has been generated yet.
                            Generating proposes a competency selection from what has been ingested
                            &mdash; it changes nothing for hires until you approve it.
                        </p>
                    </div>
                ) : (
                    blueprints.map((blueprint) => (
                        <BlueprintProposalCard
                            key={`${blueprint.scope}-${blueprint.version}`}
                            blueprint={blueprint}
                            canAct={canAct}
                            onApprove={() => void approve(blueprint.scope, blueprint.version)}
                            onReject={() => void reject(blueprint.scope, blueprint.version)}
                            onApproveCompetency={(proposalId) =>
                                void approveCompetency(proposalId)
                            }
                            onRejectCompetency={(proposalId) =>
                                void rejectCompetency(proposalId)
                            }
                        />
                    ))
                )}
            </main>
        </div>
    );
}
