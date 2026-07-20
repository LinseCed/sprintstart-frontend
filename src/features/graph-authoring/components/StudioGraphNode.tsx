import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import {
    BookOpenCheck,
    CircleDashed,
    ClipboardCheck,
    FileClock,
    Flag,
    Heart,
    Lightbulb,
    Lock,
    Shield,
    Sparkles,
    Users,
    Wrench
} from 'lucide-react';
import { NODE_HEIGHT, NODE_WIDTH } from '../../competency-graph/layout';
import type { CompetencyKind, LiveCompetency } from '../types';

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
 * What a PM acts on: whether this node has anything to teach yet.
 *
 * Deliberately *not* the hire's mastered/available/locked. Those describe a person's progress
 * against the graph; on the shared graph they would mean nothing (whose progress?). Authoring
 * readiness is the property the graph itself has.
 */
export type AuthoringState = 'PUBLISHED' | 'PENDING' | 'EMPTY' | 'PROPOSED';

const STATE_STYLES: Record<
    AuthoringState,
    { icon: typeof BookOpenCheck; label: string; className: string }
> = {
    PUBLISHED: {
        icon: BookOpenCheck,
        label: 'Module published',
        className: 'border-app-success-border bg-app-success-bg text-app-success-text'
    },
    PENDING: {
        icon: FileClock,
        label: 'Draft in progress',
        className: 'border-app-warning-border bg-app-warning-bg text-app-warning-text'
    },
    EMPTY: {
        // The state that matters most: a node with no module is one a hire can reach and then
        // find nothing behind, so it reads as unfinished rather than as normal.
        icon: CircleDashed,
        label: 'No module yet',
        className: 'border-app-border bg-app-surface-muted text-app-text-subtle'
    },
    PROPOSED: {
        icon: Sparkles,
        label: 'Proposed',
        className: 'border-dashed border-app-brand-border-strong bg-app-brand-soft text-app-brand-text'
    }
};

export type StudioNodeData = {
    competency: LiveCompetency;
    authoringState: AuthoringState;
    selected: boolean;
    /** Faded because another node's chain is lit and this one isn't in it. */
    dimmed: boolean;
    /** True for a node that is only a proposal — not in the live graph yet. */
    isProposal: boolean;
};

export type StudioFlowNode = Node<StudioNodeData, 'studioCompetency'>;

/**
 * One competency as the PM studio draws it: authoring readiness drives the frame, kind drives the
 * icon, and the target level is shown because it is the setting most often wrong and least
 * visible anywhere else.
 *
 * Readiness is carried by an icon and a text label as well as colour, so it survives any
 * colour-vision deficiency (AGENTS.md §7).
 */
function StudioGraphNodeComponent({ data }: NodeProps<StudioFlowNode>) {
    const { competency, authoringState, selected, dimmed, isProposal } = data;
    const state = STATE_STYLES[authoringState];
    const StateIcon = state.icon;
    const KindIcon = KIND_ICONS[competency.kind];

    return (
        <div
            data-testid={`studio-node-${competency.key}`}
            data-authoring-state={authoringState}
            style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
            className={[
                'flex flex-col justify-center gap-1 rounded-xl border px-3 py-2 transition-all duration-200',
                state.className,
                competency.kind === 'CONTRIBUTION' ? 'border-2' : '',
                selected ? 'ring-2 ring-app-focus' : '',
                dimmed ? 'opacity-30' : 'opacity-100'
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <Handle type="target" position={Position.Left} className="!bg-app-border-strong" />

            <div className="flex items-center gap-1.5">
                <KindIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <p className="truncate text-sm font-medium text-app-text" title={competency.label}>
                    {competency.label}
                </p>
                {competency.invariant && (
                    <>
                        <Lock className="h-3.5 w-3.5 shrink-0 text-app-text-subtle" aria-hidden="true" />
                        <span className="sr-only">Invariant: changes reach hires immediately</span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
                <StateIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{state.label}</span>
                {!isProposal && (
                    <span className="shrink-0 text-app-text-subtle">· target L{competency.targetLevel}</span>
                )}
            </div>

            <Handle type="source" position={Position.Right} className="!bg-app-border-strong" />
        </div>
    );
}

export const StudioGraphNode = memo(StudioGraphNodeComponent);
