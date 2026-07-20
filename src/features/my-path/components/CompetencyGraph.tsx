import { useCallback, useEffect, useMemo } from 'react';
import {
    Background,
    Controls,
    MarkerType,
    ReactFlow,
    useReactFlow,
    type Edge,
    type NodeMouseHandler
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CompetencyGraphNode, type CompetencyFlowNode } from './CompetencyGraphNode';
import { layoutPath } from '../graphLayout';
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
};

const nodeTypes = { competency: CompetencyGraphNode };

/**
 * Pans the viewport to a node focused from outside the graph (the skills rail).
 * Lives inside `<ReactFlow>` because `useReactFlow` needs its context; it renders
 * nothing.
 */
function FocusOnNode({ focusedKey }: { focusedKey: string | null }) {
    const { fitView } = useReactFlow();

    useEffect(() => {
        if (!focusedKey) return;
        void fitView({ nodes: [{ id: focusedKey }], maxZoom: 1.2, duration: 400 });
    }, [focusedKey, fitView]);

    return null;
}

/**
 * The competency graph as an interactive node-link DAG (React Flow + dagre
 * layered layout): prerequisites flow left-to-right into what they unlock.
 *
 * Selecting a node dims every edge not incident to it, so a dense graph can be
 * read one node at a time. The layout is recomputed only when the graph's shape
 * changes -- selection is styling, and re-laying out on every click would make
 * nodes jump.
 *
 * This is a visual affordance, not the only way through: `AssessmentPathView`
 * renders the same data as a topologically ordered list for screen readers and
 * anyone who prefers it (see the "List view" toggle on the page).
 */
export function CompetencyGraph({
    path,
    selectedKey,
    focusedKey = null,
    onSelectNode,
    justChangedKeys
}: CompetencyGraphProps) {
    // Positions depend only on the graph's shape; the node/edge arrays below
    // rebuild on selection, but the layout itself must stay stable.
    const positions = useMemo(() => layoutPath(path), [path]);

    const neighbourKeys = useMemo(() => {
        if (!selectedKey) return null;
        const neighbours = new Set<string>([selectedKey]);
        for (const edge of path.edges) {
            if (edge.from === selectedKey) neighbours.add(edge.to);
            if (edge.to === selectedKey) neighbours.add(edge.from);
        }
        return neighbours;
    }, [path.edges, selectedKey]);

    const nodes = useMemo<CompetencyFlowNode[]>(
        () =>
            path.nodes.map(node => ({
                id: node.key,
                type: 'competency' as const,
                position: positions.get(node.key) ?? { x: 0, y: 0 },
                data: {
                    node,
                    selected: node.key === selectedKey,
                    dimmed: neighbourKeys !== null && !neighbourKeys.has(node.key),
                    justChanged: justChangedKeys?.has(node.key) ?? false,
                    highlighted: node.key === focusedKey
                },
                // Node-level interaction is handled by React Flow's own click/keyboard
                // handling on the wrapper, so the card itself stays non-interactive.
                ariaLabel: `${node.label}, ${node.kind.toLowerCase()}, ${node.state.toLowerCase()}`
            })),
        [path.nodes, positions, selectedKey, neighbourKeys, justChangedKeys, focusedKey]
    );

    const edges = useMemo<Edge[]>(
        () =>
            path.edges.map(edge => {
                const incident =
                    selectedKey === null || edge.from === selectedKey || edge.to === selectedKey;
                return {
                    id: `${edge.from}->${edge.to}`,
                    source: edge.from,
                    target: edge.to,
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { opacity: incident ? 1 : 0.15 },
                    animated: false
                };
            }),
        [path.edges, selectedKey]
    );

    const handleNodeClick = useCallback<NodeMouseHandler<CompetencyFlowNode>>(
        (_event, node) => onSelectNode(node.data.node),
        [onSelectNode]
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
                onPaneClick={() => onSelectNode(null)}
                nodesDraggable={false}
                nodesConnectable={false}
                edgesFocusable={false}
                fitView
                proOptions={{ hideAttribution: false }}
            >
                <Background />
                <Controls showInteractive={false} />
                <FocusOnNode focusedKey={focusedKey} />
            </ReactFlow>
        </div>
    );
}
