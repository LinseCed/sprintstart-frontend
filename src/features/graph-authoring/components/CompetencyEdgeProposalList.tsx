import { ArrowRight, Waypoints } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { ProposalRow } from './ProposalRow';
import type { CompetencyEdgeProposal } from '../types';

type CompetencyEdgeProposalListProps = {
    proposals: CompetencyEdgeProposal[];
    canAct: boolean;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string, reason?: string) => Promise<void>;
};

export function CompetencyEdgeProposalList({ proposals, canAct, onApprove, onReject }: CompetencyEdgeProposalListProps) {
    if (proposals.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface p-8">
                <div className="flex flex-col items-center gap-3 text-center">
                    <Waypoints className="h-8 w-8 text-app-text-disabled" />
                    <p className="text-sm text-app-text-muted">No proposed edges waiting on review.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
            {proposals.map(proposal => (
                <ProposalRow
                    key={proposal.id}
                    title={
                        <span className="inline-flex items-center gap-1.5">
                            {proposal.fromKey}
                            <ArrowRight className="h-3.5 w-3.5 text-app-text-disabled" />
                            {proposal.toKey}
                        </span>
                    }
                    subtitle={proposal.rationale}
                    canAct={canAct}
                    meta={<Badge variant={proposal.kind === 'PREREQUISITE' ? 'brand' : 'neutral'}>{proposal.kind}</Badge>}
                    onApprove={() => onApprove(proposal.id)}
                    onReject={reason => onReject(proposal.id, reason)}
                />
            ))}
        </div>
    );
}
