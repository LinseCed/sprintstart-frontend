import { AlertCircle, ClipboardList, Loader2, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useAuth } from '../context/useAuth';
import { PermissionGroup } from '../services/types';
import { BlueprintProposalCard } from '../features/blueprint-authoring/components/BlueprintProposalCard';
import { useBlueprintAuthoring } from '../features/blueprint-authoring/hooks/useBlueprintAuthoring';

/**
 * PM-facing surface for the baseline blueprint's proposal-only lifecycle: generate proposals from
 * the ingested corpus, review them step by step, then approve the version that becomes the
 * mandatory baseline.
 *
 * This is the gate in front of everything a hire sees. Path generation deliberately refuses to run
 * for a user whose scopes have no ACTIVE blueprint, so until a version is approved here, hires get
 * no path, no steps and therefore no openable nodes on their competency graph. It had no UI at all
 * until now, which made that failure look like a broken graph rather than an unfinished setup.
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
        approveStep,
        rejectStep
    } = useBlueprintAuthoring();

    return (
        <div className="min-h-screen bg-app-bg">
            <header className="border-b border-app-border bg-app-bg">
                <div className="app-page-frame py-6">
                    <PageHeader
                        icon={ClipboardList}
                        title="Onboarding Baseline"
                        subtitle="Generate the mandatory baseline from the ingested corpus, then approve the version hires are onboarded against. Nobody gets an onboarding path until a baseline is active."
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
                            Generating proposes one from what has been ingested &mdash; it changes
                            nothing for hires until you approve it.
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
                            onApproveStep={(proposalId) => void approveStep(proposalId)}
                            onRejectStep={(proposalId) => void rejectStep(proposalId)}
                        />
                    ))
                )}
            </main>
        </div>
    );
}
