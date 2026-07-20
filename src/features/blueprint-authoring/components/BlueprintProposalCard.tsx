import { Check, ShieldAlert, X } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import type { BlueprintCompetencyProposal, BlueprintProposal } from '../types';

type BlueprintProposalCardProps = {
    blueprint: BlueprintProposal;
    /** HR can read the queue but not change it. */
    canAct: boolean;
    onApprove: () => void;
    onReject: () => void;
    onApproveCompetency: (proposalId: string) => void;
    onRejectCompetency: (proposalId: string) => void;
};

const LEVEL_NAMES: Record<number, string> = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
    4: 'expert'
};

/** `global` and `area:backend` are storage scopes; PMs shouldn't have to read them as such. */
function scopeLabel(scope: string): string {
    if (scope === 'global') return 'Everyone';
    return scope.startsWith('area:') ? `Area: ${scope.slice('area:'.length)}` : scope;
}

function CompetencyRow({
    competency,
    canAct,
    onApprove,
    onReject
}: {
    competency: BlueprintCompetencyProposal;
    canAct: boolean;
    onApprove: () => void;
    onReject: () => void;
}) {
    const decided = competency.status !== 'PROPOSED';
    const levelName = LEVEL_NAMES[competency.targetLevel] ?? `level ${competency.targetLevel}`;

    return (
        <li className="flex items-start justify-between gap-4 rounded-xl border border-app-border bg-app-bg p-3">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-app-text">{competency.label}</p>
                    {competency.requirement === 'required' && (
                        <Badge variant="brand">Required</Badge>
                    )}
                    {competency.invariant && (
                        <Badge variant="warning" className="gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            Invariant
                        </Badge>
                    )}
                    {decided && (
                        <Badge variant={competency.status === 'APPROVED' ? 'success' : 'neutral'}>
                            {competency.status === 'APPROVED' ? 'Kept' : 'Dropped'}
                        </Badge>
                    )}
                </div>

                {/* The bar is the whole point of an entry: it decides when a hire is done with
                    this node. Say which one applies, and whether this baseline set it. */}
                <p className="mt-1 text-xs text-app-text-subtle">
                    Reach {levelName}
                    {competency.targetLevelOverridden
                        ? ' — set by this baseline'
                        : " — the competency's own bar"}
                </p>

                {competency.rationale && (
                    <p className="mt-1.5 text-xs text-app-text-muted">{competency.rationale}</p>
                )}
            </div>

            {canAct && !decided && (
                <div className="flex shrink-0 gap-1.5">
                    <button
                        type="button"
                        aria-label={`Keep ${competency.label} in the baseline`}
                        onClick={onApprove}
                        className="rounded-lg border border-app-success-border p-1.5 text-app-success-text transition-colors hover:bg-app-success-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-focus"
                    >
                        <Check className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        aria-label={`Drop ${competency.label} from the baseline`}
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
 * One proposed baseline version: the competencies everyone in this scope would
 * have to reach, and how deeply.
 *
 * Approving is the action that makes a baseline **active** — and it is what
 * unblocks path generation, since personalization refuses to run for a user
 * whose scopes have no active baseline. The copy says so, because from the
 * queue alone it looks like an optional review chore.
 */
export function BlueprintProposalCard({
    blueprint,
    canAct,
    onApprove,
    onReject,
    onApproveCompetency,
    onRejectCompetency
}: BlueprintProposalCardProps) {
    const count = blueprint.competencies.length;

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
                        Version {blueprint.version} · {count} competenc
                        {count === 1 ? 'y' : 'ies'}
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
                {blueprint.competencies.map((competency) => (
                    <CompetencyRow
                        key={competency.proposalId}
                        competency={competency}
                        canAct={canAct}
                        onApprove={() => onApproveCompetency(competency.proposalId)}
                        onReject={() => onRejectCompetency(competency.proposalId)}
                    />
                ))}
            </ul>
        </article>
    );
}
