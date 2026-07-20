import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import {
    CheckCircle2,
    CircleDot,
    ClipboardCheck,
    Flag,
    GitPullRequest,
    Heart,
    Lightbulb,
    Lock,
    Shield,
    Users,
    Wrench
} from 'lucide-react';
import { NODE_HEIGHT, NODE_WIDTH } from '../graphLayout';
import type { CompetencyKind, NodeState, PathNode } from '../../skill-assessment/types';

const KIND_ICONS: Record<CompetencyKind, typeof Wrench> = {
    SKILL: Wrench,
    CONCEPT: Lightbulb,
    CONTRIBUTION: Flag,
    POLICY: Shield,
    CONNECTION: Users,
    CULTURE: Heart,
    CHECKPOINT: ClipboardCheck
};

/**
 * State styling. Color is never the only signal -- each state also carries its
 * own icon and a visible text label (AGENTS.md §7), so the graph stays readable
 * with any color-vision deficiency.
 */
const STATE_STYLES: Record<NodeState, { icon: typeof CheckCircle2; label: string; className: string }> = {
    MASTERED: {
        icon: CheckCircle2,
        label: 'Mastered',
        className: 'border-app-success-border bg-app-success-bg text-app-success-text'
    },
    AVAILABLE: {
        icon: CircleDot,
        label: 'Available',
        className: 'border-app-brand-border-strong bg-app-surface text-app-brand-text'
    },
    LOCKED: {
        icon: Lock,
        label: 'Locked',
        className: 'border-app-border bg-app-surface-muted text-app-text-subtle'
    }
};

export type CompetencyNodeData = {
    node: PathNode;
    /** Whether this node is the one whose detail panel is open. */
    selected: boolean;
    /** Faded because another node is selected and this one isn't adjacent to it. */
    dimmed: boolean;
    /** Flipped state since the last path load -- pulses once on return from a module. */
    justChanged: boolean;
    /** Focus ring driven by the skills rail, not by graph selection. */
    highlighted: boolean;
};

export type CompetencyFlowNode = Node<CompetencyNodeData, 'competency'>;

/**
 * One competency rendered as a React Flow node: state (mastered / available /
 * locked) drives the frame, kind drives the icon, and a `CONTRIBUTION` node --
 * the shipped contribution a path terminates in -- is emphasized as the
 * destination rather than styled like any other node.
 *
 * Interaction lives on the wrapping React Flow node (which is already focusable
 * and keyboard-selectable), so this renders a plain box; making it a `<button>`
 * too would nest two interactive elements.
 */
function CompetencyGraphNodeComponent({ data }: NodeProps<CompetencyFlowNode>) {
    const { node, selected, dimmed, justChanged, highlighted } = data;
    const state = STATE_STYLES[node.state];
    const StateIcon = state.icon;
    const KindIcon = KIND_ICONS[node.kind];
    const isGoal = node.kind === 'CONTRIBUTION';

    return (
        <div
            data-testid={`graph-node-${node.key}`}
            style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
            className={[
                'flex flex-col justify-center gap-1 rounded-xl border px-3 py-2 transition-all duration-200',
                state.className,
                isGoal ? 'border-2 shadow-lg' : '',
                selected || highlighted ? 'ring-2 ring-app-focus' : '',
                justChanged ? 'animate-pulse' : '',
                dimmed ? 'opacity-40' : 'opacity-100'
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <Handle type="target" position={Position.Left} className="!bg-app-border-strong" />

            <div className="flex items-center gap-1.5">
                <KindIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <p className="truncate text-sm font-medium text-app-text" title={node.label}>
                    {node.label}
                </p>
                {node.verificationType === 'ARTIFACT' && (
                    <GitPullRequest className="h-3.5 w-3.5 shrink-0 text-app-text-subtle" aria-hidden="true" />
                )}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
                <StateIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{state.label}</span>
                <span className="text-app-text-subtle">
                    · {isGoal ? 'Goal · contribution' : node.kind.toLowerCase()}
                </span>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-app-border-strong" />
        </div>
    );
}

export const CompetencyGraphNode = memo(CompetencyGraphNodeComponent);
