import { CheckCircle2, CircleDot, Lock } from 'lucide-react';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import type { NodeState } from '../types';

type NodeStatusChipProps = {
    state: NodeState;
    className?: string;
};

const STATE_STYLES: Record<NodeState, { icon: typeof CheckCircle2; variant: BadgeVariant; label: string }> = {
    mastered: { icon: CheckCircle2, variant: 'success', label: 'Mastered' },
    available: { icon: CircleDot, variant: 'brand', label: 'Available' },
    locked: { icon: Lock, variant: 'neutral', label: 'Locked' }
};

/**
 * Icon + label chip for a path node's mastery state. Meaning never relies on
 * color alone -- the icon and label always accompany the variant color, per
 * the app's color-blind-friendly convention (see AGENTS.md #7 / StatusChip).
 */
export function NodeStatusChip({ state, className = '' }: NodeStatusChipProps) {
    const { icon: Icon, variant, label } = STATE_STYLES[state];

    return (
        <Badge variant={variant} className={`gap-1.5 ${className}`.trim()}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </Badge>
    );
}
