import { Sparkles } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { ProposalRow } from './ProposalRow';
import type { CompetencyProposal } from '../types';

type CompetencyProposalListProps = {
    proposals: CompetencyProposal[];
    canAct: boolean;
    onApprove: (id: string) => Promise<void>;
    onReject: (id: string, reason?: string) => Promise<void>;
};

export function CompetencyProposalList({ proposals, canAct, onApprove, onReject }: CompetencyProposalListProps) {
    if (proposals.length === 0) {
        return (
            <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface p-8">
                <div className="flex flex-col items-center gap-3 text-center">
                    <Sparkles className="h-8 w-8 text-app-text-disabled" />
                    <p className="text-sm text-app-text-muted">No proposed competencies waiting on review.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface">
            {proposals.map(proposal => (
                <ProposalRow
                    key={proposal.id}
                    title={proposal.label}
                    subtitle={proposal.description}
                    canAct={canAct}
                    meta={
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="brand">{proposal.kind}</Badge>
                            <span className="text-xs text-app-text-muted">{proposal.key}</span>
                            {proposal.repoRef && (
                                <span className="text-xs text-app-text-disabled">{proposal.repoRef}</span>
                            )}
                        </div>
                    }
                    onApprove={() => onApprove(proposal.id)}
                    onReject={reason => onReject(proposal.id, reason)}
                />
            ))}
        </div>
    );
}
