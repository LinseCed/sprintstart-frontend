import { Check, ShieldAlert, X } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BlueprintProposal, BlueprintStepProposal } from '../types';

type BlueprintProposalCardProps = {
    blueprint: BlueprintProposal;
    /** HR can read the queue but not change it. */
    canAct: boolean;
    onApprove: () => void;
    onReject: () => void;
    onApproveStep: (proposalId: string) => void;
    onRejectStep: (proposalId: string) => void;
};

/** `global` and `area:backend` are storage scopes; PMs shouldn't have to read them as such. */
function scopeLabel(scope: string): string {
    if (scope === 'global') return 'Everyone';
    return scope.startsWith('area:') ? `Area: ${scope.slice('area:'.length)}` : scope;
}

function StepRow({
    step,
    canAct,
    onApprove,
    onReject
}: {
    step: BlueprintStepProposal;
    canAct: boolean;
    onApprove: () => void;
    onReject: () => void;
}) {
    const decided = step.status !== 'PROPOSED';

    return (
        <li className="flex items-start justify-between gap-4 rounded-xl border border-app-border bg-app-bg p-3">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-app-text">{step.title}</p>
                    {step.requirement === 'required' && <Badge variant="brand">Required</Badge>}
                    {step.invariant && (
                        <Badge variant="warning" className="gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            Invariant
                        </Badge>
                    )}
                    {decided && (
                        <Badge variant={step.status === 'APPROVED' ? 'success' : 'neutral'}>
                            {step.status === 'APPROVED' ? 'Kept' : 'Dropped'}
                        </Badge>
                    )}
                </div>
                {step.description && (
                    <p className="mt-1 text-xs text-app-text-muted">{step.description}</p>
                )}
            </div>

            {canAct && !decided && (
                <div className="flex shrink-0 gap-1.5">
                    <button
                        type="button"
                        aria-label={`Keep step ${step.title}`}
                        onClick={onApprove}
                        className="rounded-lg border border-app-success-border p-1.5 text-app-success-text transition-colors hover:bg-app-success-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <Check className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label={`Drop step ${step.title}`}
                        onClick={onReject}
                        className="rounded-lg border border-app-border p-1.5 text-app-text-muted transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </li>
    );
}

/**
 * One proposed blueprint version, with its steps.
 *
 * Approving is the action that makes a baseline **active** — and it is what
 * unblocks path generation, since personalization refuses to run for a user
 * whose scopes have no active blueprint. The copy says so, because from the
 * queue alone it looks like an optional review chore.
 */
export function BlueprintProposalCard({
    blueprint,
    canAct,
    onApprove,
    onReject,
    onApproveStep,
    onRejectStep
}: BlueprintProposalCardProps) {
    return (
        <article
            data-testid={`blueprint-${blueprint.scope}`}
            className="rounded-2xl border border-app-border bg-app-surface p-5"
        >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-app-text">
                        {scopeLabel(blueprint.scope)}
                    </h3>
                    <p className="text-xs text-app-text-subtle">
                        Version {blueprint.version} · {blueprint.steps.length} step
                        {blueprint.steps.length === 1 ? '' : 's'}
                    </p>
                </div>

                {canAct && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onApprove}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-app-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-app-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            <Check className="h-4 w-4" />
                            Approve &amp; activate
                        </button>
                        <button
                            type="button"
                            onClick={onReject}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-app-border px-4 py-2 text-sm font-medium text-app-text transition-colors hover:bg-app-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                        >
                            <X className="h-4 w-4" />
                            Reject
                        </button>
                    </div>
                )}
            </div>

            <ul className="space-y-2">
                {blueprint.steps.map((step) => (
                    <StepRow
                        key={step.proposalId}
                        step={step}
                        canAct={canAct}
                        onApprove={() => onApproveStep(step.proposalId)}
                        onReject={() => onRejectStep(step.proposalId)}
                    />
                ))}
            </ul>
        </article>
    );
}
