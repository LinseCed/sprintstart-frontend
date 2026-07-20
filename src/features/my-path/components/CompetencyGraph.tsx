import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
    Background,
    Controls,
    MarkerType,
    ReactFlow,
    useReactFlow,
    type Connection,
    type Edge,
    type NodeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CompetencyGraphNode, type CompetencyFlowNode } from './CompetencyGraphNode';
import { chainFor, liveEdgeIds } from '../graphLayout';
import { useForceLayout } from '../hooks/useForceLayout';
import type { UnlockSequence } from '../hooks/useUnlockSequence';
import type { PathNode, PathView } from '../../skill-assessment/types';

type CompetencyGraphProps = {
    path: PathView;
    /** Key of the node whose detail panel is open, if any. */
    selectedKey: string | null;
    /**
     * Key focused from the skills rail -- highlighted and centered without
     * opening the detail panel, so "where is this skill of mine" stays a
     * lightweight lookup.
     */
    focusedKey?: string | null;
    onSelectNode: (node: PathNode | null) => void;
    /** Nodes whose state changed since the previous load; pulsed once. */
    justChangedKeys?: Set<string>;
    /** The unlock payoff currently playing, if a module was just passed. */
    unlock?: UnlockSequence;
    /**
     * Whether nodes expose connection handles, so a PM can drag one onto another
     * to declare a prerequisite. Off for hires -- the graph is theirs to read.
     */
    canConnect?: boolean;
    /** Called with (prerequisite, dependent) when such a drag completes. */
    onConnectNodes?: (fromKey: string, toKey: string) => void;
};

const nodeTypes = { competency: CompetencyGraphNode };

/**
 * Eases the viewport to a node focused from outside the graph (the skills rail),
 * or to the node an unlock sequence is about to celebrate. Lives inside
 * `<ReactFlow>` because `useReactFlow` needs its context; it renders nothing.
 */
function CameraController({
    focusedKey,
    unlockFocusKey,
    animate
}: {
    focusedKey: string | null;
    unlockFocusKey: string | null;
    animate: boolean;
}) {
    const { fitView } = useReactFlow();
    const target = unlockFocusKey ?? focusedKey;

    useEffect(() => {
        if (!target) return;
        void fitView({ nodes: [{ id: target }], maxZoom: 1.2, duration: animate ? 600 : 0 });
    }, [target, fitView, animate]);

    return null;
}

/**
 * The competency graph as an interactive node-link DAG (React Flow + dagre
 * layered layout): prerequisites flow left-to-right into what they unlock.
 *
 * Three things make it read as a tree you climb rather than a printed diagram:
 *
 * - **A relaxation pass over the layout, not instead of it.** Dagre still fixes
 *   the tiers ({@link useForceLayout} pins each node to its column); the pass
 *   only resolves overlap and pulls linked competencies together vertically.
 * - **The prerequisite chain lights up.** Hovering or selecting a node dims
 *   everything outside its full ancestor/dependent chain, so you can see what a
 *   node costs and what it buys. Hover is the pointer affordance; selection is
 *   the keyboard-reachable equivalent of the same thing.
 * - **Live edges carry the charge.** Only mastered → available edges animate, so
 *   the motion means "power is reaching the next thing you can do".
 *
 * All of it is suppressed under `prefers-reduced-motion`, and none of it is the
 * only way through: `AssessmentPathView` renders the same data as a
 * topologically ordered list (see the "List view" toggle on the page).
 */
export function CompetencyGraph({
    path,
    selectedKey,
    focusedKey = null,
    onSelectNode,
    justChangedKeys,
    unlock,
    canConnect = false,
    onConnectNodes
}: CompetencyGraphProps) {
    const reduceMotion = useReducedMotion() ?? false;
    const animate = !reduceMotion;

    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    const { positions } = useForceLayout(path, animate);

    // Hover is transient and pointer-only, so selection has to light the same
    // chain -- otherwise this reading of the graph is unavailable by keyboard.
    const chainKey = hoveredKey ?? selectedKey;
    const chainKeys = useMemo(
        () => (chainKey ? chainFor(path, chainKey) : null),
        [path, chainKey]
    );

    const liveEdges = useMemo(() => liveEdgeIds(path), [path]);

    const unlockStage = unlock?.stage ?? 'idle';
    const unlockedKey = unlock?.unlockedKey ?? null;
    const unlockDependents = unlock?.dependentKeys;

    const nodes = useMemo<CompetencyFlowNode[]>(
        () =>
            path.nodes.map(node => {
                const unlockRole =
                    unlockStage === 'flip' && node.key === unlockedKey
                        ? ('flip' as const)
                        : unlockStage === 'pop' && unlockDependents?.has(node.key)
                          ? ('pop' as const)
                          : null;
                return {
                    id: node.key,
                    type: 'competency' as const,
                    position: positions.get(node.key) ?? { x: 0, y: 0 },
                    data: {
                        node,
                        selected: node.key === selectedKey,
                        dimmed: chainKeys !== null && !chainKeys.has(node.key),
                        justChanged: justChangedKeys?.has(node.key) ?? false,
                        highlighted: node.key === focusedKey,
                        unlockRole,
                        animate
                    },
                    // Node-level interaction is handled by React Flow's own click/keyboard
                    // handling on the wrapper, so the card itself stays non-interactive.
                    ariaLabel: `${node.label}, ${node.kind.toLowerCase()}, ${node.state.toLowerCase()}`
                };
            }),
        [
            path.nodes,
            positions,
            selectedKey,
            chainKeys,
            justChangedKeys,
            focusedKey,
            unlockStage,
            unlockedKey,
            unlockDependents,
            animate
        ]
    );

    const edges = useMemo<Edge[]>(
        () =>
            path.edges.map(edge => {
                const id = `${edge.from}->${edge.to}`;
                const inChain =
                    chainKeys === null || (chainKeys.has(edge.from) && chainKeys.has(edge.to));
                // During `travel` the charge runs outward from the node just
                // earned, so those edges animate whatever their steady state is.
                const carryingUnlock = unlockStage === 'travel' && edge.from === unlockedKey;
                return {
                    id,
                    source: edge.from,
                    target: edge.to,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: {
                        opacity: inChain ? 1 : 0.12,
                        strokeWidth: carryingUnlock ? 3 : inChain && chainKeys !== null ? 2 : 1
                    },
                    animated: animate && (carryingUnlock || liveEdges.has(id))
                };
            }),
        [path.edges, chainKeys, liveEdges, unlockStage, unlockedKey, animate]
    );

    const handleNodeClick = useCallback<NodeMouseHandler<CompetencyFlowNode>>(
        (_event, node) => onSelectNode(node.data.node),
        [onSelectNode]
    );

    const handleNodeEnter = useCallback<NodeMouseHandler<CompetencyFlowNode>>(
        (_event, node) => setHoveredKey(node.id),
        []
    );

    const handleNodeLeave = useCallback(() => setHoveredKey(null), []);

    // Dragging one node onto another is the map's natural way to say "this comes
    // first". It is an addition to the panel's select-based editor, never the only
    // way -- a drag is not a gesture everyone can make, and the list view has no
    // canvas to make it on.
    const handleConnect = useCallback(
        (connection: Connection) => {
            if (!connection.source || !connection.target) return;
            onConnectNodes?.(connection.source, connection.target);
        },
        [onConnectNodes]
    );

    return (
        <div
            className="h-full w-full"
            data-testid="competency-graph"
            role="application"
            aria-label="Competency graph"
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={handleNodeClick}
                onNodeMouseEnter={handleNodeEnter}
                onNodeMouseLeave={handleNodeLeave}
                onPaneClick={() => onSelectNode(null)}
                onConnect={handleConnect}
                // Positions are derived from the layout on every render, so a
                // dragged node would be pulled back under the pointer on the next
                // one. Reading the graph is panning and zooming, not rearranging.
                nodesDraggable={false}
                nodesConnectable={canConnect}
                edgesFocusable={false}
                fitView
                proOptions={{ hideAttribution: false }}
            >
                <Background />
                <Controls showInteractive={false} />
                <CameraController
                    focusedKey={focusedKey}
                    unlockFocusKey={unlockStage === 'focus' ? unlockedKey : null}
                    animate={animate}
                />
            </ReactFlow>
        </div>
    );
}
